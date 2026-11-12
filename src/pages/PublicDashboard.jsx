import { webUrl } from '../lib/webUrl';
import { StatCard } from '../components/ui/StatCard';
import { FiArrowDownRight, FiArrowUpRight, FiCalendar, FiMapPin, FiFeather } from 'react-icons/fi';
import { formatEventDate } from '../../functions/lib/eventTime.mjs';
import { nextPublicEvents } from '../firebase/eventQueries';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaLinkedinIn,
  FaRecycle,
  FaTree,
  FaUsers,
} from 'react-icons/fa';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db, functions } from '../firebase/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '../components/ui/ToastProvider';

const toJsDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map((n) => parseInt(n, 10));
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const Section = ({ title, subtitle, children, className = '' }) => (
  <section className={`border-b border-line py-12 sm:py-20 ${className}`}>
    <div className="site-container">
      <div className="max-w-2xl">
        {title ? <h2 className="site-section-heading">{title}</h2> : null}
        {subtitle ? <p className="mt-3 text-sm text-gray-600 sm:text-base">{subtitle}</p> : null}
      </div>
      <div className="mt-10">{children}</div>
    </div>
  </section>
);

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
    {children}
  </span>
);

const PrimaryButton = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`btn-primary text-sm ${className}`}
  >
    {children}
  </Link>
);

const BlogCard = ({ imageUrl, title, author, hashtag, to }) => (
  <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative h-40 overflow-hidden bg-gray-100">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title ? `${title} cover` : 'Blog cover'}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="editorial-cover h-full" aria-hidden="true">
          <FiFeather size={32} />
        </div>
      )}
    </div>
    <div className="space-y-3 p-5">
      <h3 className="text-pretty text-lg font-extrabold tracking-tight text-gray-900">{title}</h3>
      {author && <p className="text-sm text-muted">{author}</p>}
      {hashtag && <Pill>{hashtag}</Pill>}
      <div className="pt-2">
        <Link to={to} className="text-sm font-bold text-emerald-700 hover:underline">
          Read More →
        </Link>
      </div>
    </div>
  </article>
);

const InvolvedCard = ({ icon, title, description, cta, to, onClick }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-extrabold tracking-tight text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
        <div className="mt-5">
          {typeof onClick === 'function' ? (
            <button
              type="button"
              onClick={onClick}
              className="inline-flex w-full items-center justify-center rounded-xl bg-leaf px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:w-auto"
            >
              {cta}
            </button>
          ) : (
            <PrimaryButton to={to} className="w-full sm:w-auto">
              {cta}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const PublicDashboard = () => {
  const toast = useToast();
  const [latestPosts, setLatestPosts] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnerForm, setPartnerForm] = useState({ name: '', email: '', organization: '', message: '' });
  const [partnerSending, setPartnerSending] = useState(false);
  const partnerRef = useRef(null);

  const [overview, setOverview] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'publicStats', 'overview'))
      .then(snapshot => setOverview(snapshot.data() ?? null))
      .catch(error => console.error('Unable to load public stats:', error))
      .finally(() => setStatsLoading(false));
  }, []);

  const number = value => Number.isFinite(value) ? new Intl.NumberFormat('en-KE', {
    maximumFractionDigits: 2,
  }).format(value) : '—';

  const stats = overview ? [
    { icon: FaRecycle, label: 'Waste collected', value: overview.wasteKg == null ? '—' : `${number(overview.wasteKg)} kg` },
    { icon: FaTree, label: 'Trees planted', value: number(overview.treesPlanted) },
    { icon: FaUsers, label: 'Active members', value: number(overview.activeMembers) },
    { icon: FaCalendarAlt, label: 'Events hosted', value: number(overview.eventsHosted) },
  ] : [];

  useEffect(() => {
    const run = async () => {
      try {
        setNewsLoading(true);
        const postsRef = collection(db, 'posts');
        let snap;
        try {
          snap = await getDocs(
            query(postsRef, where('isPublished', '==', true), orderBy('createdAt', 'desc'), limit(3))
          );
        } catch (e) {
          // Fallback if an index is missing; still render uploaded images from fetched docs.
          snap = await getDocs(query(postsRef, where('isPublished', '==', true)));
        }
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => {
          const ad = toJsDate(a?.createdAt)?.getTime?.() ?? 0;
          const bd = toJsDate(b?.createdAt)?.getTime?.() ?? 0;
          return bd - ad;
        });
        setLatestPosts(items.slice(0, 3));
      } catch (e) {
        console.error('Error loading latest posts:', e);
        setLatestPosts([]);
      } finally {
        setNewsLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setEventsLoading(true);
        setUpcomingEvents(await nextPublicEvents(3));
      } catch (e) {
        console.error('Error loading upcoming events:', e);
        setUpcomingEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setPartnersLoading(true);
        let snap;
        try {
          snap = await getDocs(query(collection(db, 'partners'), where('isActive', '==', true), orderBy('order', 'asc')));
        } catch (e) {
          // Fallback if an index/orderBy fails.
          snap = await getDocs(query(collection(db, 'partners'), where('isActive', '==', true)));
        }
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (Number(a?.order ?? 0) || 0) - (Number(b?.order ?? 0) || 0));
        setPartners(items);
      } catch (e) {
        console.error('Error loading partners:', e);
        setPartners([]);
      } finally {
        setPartnersLoading(false);
      }
    };
    run();
  }, []);

  const scrollToPartner = () => {
    const node = partnerRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitPartnerMessage = async (e) => {
    e.preventDefault();
    const name = partnerForm.name.trim();
    const email = partnerForm.email.trim();
    const organization = partnerForm.organization.trim();
    const message = partnerForm.message.trim();
    if (!name || !email || !message) {
      toast.error('Missing details', 'Please add your name, email, and message.');
      return;
    }
    setPartnerSending(true);
    try {
      await httpsCallable(functions, 'submitPartnerInquiry')({
        name, email, organization, message,
        website: new FormData(e.currentTarget).get('website') || '',
      });
      setPartnerForm({ name: '', email: '', organization: '', message: '' });
      toast.success('Sent', 'Your message has been sent to the GoGreen Club admins.');
    } catch (err) {
      console.error('Error sending partner message:', err);
      toast.error('Send failed', err?.message ?? 'Please try again.');
    } finally {
      setPartnerSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-ivory">
      <section className="bg-forest text-white">
        <div className="site-container grid items-center gap-8 py-10 sm:py-16 md:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-20">
          <div>
            <h1 className="text-[clamp(3rem,7.2vw,7rem)] font-semibold leading-[0.96] tracking-[-0.075em]">
              Green steps.<br /><span className="text-lime-accent">Big impact.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-emerald-100 sm:text-lg">
              We’re a community of students, scientists, innovators, and changemakers advancing sustainability through STEAM.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex min-h-11 items-center gap-3 rounded-lg bg-lime-accent px-5 py-3 text-sm font-bold text-ink hover:bg-white">
                Join GoGreen Club <FiArrowUpRight aria-hidden="true" />
              </Link>
              <Link to="/events" className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-emerald-200/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                Explore events <FiArrowDownRight aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="home-art relative grid place-items-center overflow-hidden rounded-2xl border border-white/20">
            <div className="grid size-36 place-items-center rounded-full bg-ivory shadow-xl sm:size-44 lg:size-56">
              <img src="/logo.png" alt="" width="500" height="500" className="size-[78%] object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <Section title="Our impact" subtitle="Waste and planting totals reflect verified activity reports.">
        {!stats.length && <p role="status" className="text-sm text-gray-600">{statsLoading ? 'Loading impact figures…' : 'Verified figures will appear when they are available.'}</p>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>
      </Section>

      {/* Upcoming Events */}
      <Section title="Upcoming events" className="bg-white">
        {eventsLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                <div className="mt-4 h-3 w-28 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-5 h-10 w-32 animate-pulse rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-900">No events scheduled yet</p>
            <p className="mt-2 text-sm text-gray-600">
              Check back soon for cleanups, workshops, and community activities.
            </p>
            <div className="mt-6">
              <PrimaryButton to="/events">View All Events →</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {upcomingEvents.map((e) => (
              <article
                key={e.id}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-pretty text-lg font-extrabold tracking-tight text-gray-900">{e?.title ?? 'Event'}</h3>
                  <Pill>{(e?.category ?? 'event').toString()}</Pill>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted"><FiCalendar aria-hidden="true" />{formatEventDate(e.date)}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted"><FiMapPin aria-hidden="true" />{e.location}</p>
                <div className="mt-5">
                  <PrimaryButton to={`/events?event=${e.id}`} className="w-full sm:w-auto">
                    View Details →
                  </PrimaryButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* Partners */}
      <Section
        title="Partners"
        subtitle="Organizations helping us scale sustainability initiatives across campus and community."
      >
        {partnersLoading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="h-full w-full animate-pulse rounded-2xl bg-gray-100" />
              </div>
            ))}
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-900">No partners added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {partners.map(partner => {
              const url = webUrl(partner.websiteUrl);
              const className = 'panel flex min-h-20 items-center justify-center p-4';
              const logo = partner.logoUrl
                ? <img src={partner.logoUrl} alt={partner.name} className="max-h-12 w-auto max-w-full object-contain" loading="lazy" />
                : <span className="text-sm font-semibold">{partner.name}</span>;
              return url ? (
                <a key={partner.id} href={url} target="_blank" rel="noreferrer" className={className}>{logo}</a>
              ) : <div key={partner.id} className={className}>{logo}</div>;
            })}
          </div>
        )}
      </Section>

      {/* Latest News */}
      <Section title="Latest News">
        {newsLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="h-40 w-full animate-pulse bg-gray-100" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : latestPosts.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-900">No blog posts yet</p>
            <p className="mt-2 text-sm text-gray-600">Check back soon for updates from GoGreen Club.</p>
            <div className="mt-6">
              <PrimaryButton to="/blog">View Blog →</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <BlogCard
                key={post.id}
                imageUrl={post?.coverImageUrl}
                title={post?.title ?? 'Untitled'}
                author={post?.authorName}
                hashtag={post?.tags?.[0] ? '#' + post.tags[0] : undefined}
                to={`/blog/${post.id}`}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Get Involved */}
      <Section
        title="Support GoGreen Club"
        subtitle="Your contribution helps us run cleanups, workshops, and community environmental projects."
      >
        <button type="button" onClick={scrollToPartner} className="btn-secondary">
          Ask about supporting the club
        </button>
      </Section>

      {/* Get Involved */}
      <Section title="Get involved" className="bg-white">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <InvolvedCard
            icon="🌱"
            title="Become a Member"
            description="Join our community of changemakers and contribute to sustainable solutions"
            cta="Join Now →"
            to="/signup"
          />
          <InvolvedCard
            icon="🤝"
            title="Volunteer With Us"
            description="Participate in events, workshops, and community projects"
            cta="Get Involved →"
            to="/events"
          />
          <InvolvedCard
            icon="🌍"
            title="Partner With Us"
            description="Collaborate with us to amplify environmental impact"
            cta="Contact Us →"
            onClick={scrollToPartner}
          />
        </div>
      </Section>

      {/* Partner Messaging */}
      <section ref={partnerRef} className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Partner With Us</h2>
            <p className="mt-3 text-sm text-gray-600 sm:text-base">
              Send a message to the GoGreen Club admins. We will reply to the email you provide.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <form onSubmit={submitPartnerMessage} className="space-y-4 p-6 sm:p-8">
              <div hidden aria-hidden="true">
                <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Name</span>
                  <input
                    value={partnerForm.name}
                    onChange={(e) => setPartnerForm((s) => ({ ...s, name: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Email</span>
                  <input
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm((s) => ({ ...s, email: e.target.value }))}
                    type="email"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Organization (optional)</span>
                <input
                  value={partnerForm.organization}
                  onChange={(e) => setPartnerForm((s) => ({ ...s, organization: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  placeholder="REREC"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Message</span>
                <textarea
                  value={partnerForm.message}
                  onChange={(e) => setPartnerForm((s) => ({ ...s, message: e.target.value }))}
                  className="mt-2 min-h-[120px] w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Tell us how you would like to partner..."
                  required
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  By sending, you agree we can contact you about your inquiry.
                </p>
                <button
                  type="submit"
                  disabled={partnerSending}
                  className="inline-flex items-center justify-center rounded-xl bg-leaf px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {partnerSending ? 'Sending…' : 'Send Message →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <div className="absolute left-10 top-10 text-7xl">🌍</div>
          <div className="absolute right-10 top-24 text-7xl">🌿</div>
          <div className="absolute bottom-10 left-1/3 text-7xl">🚀</div>
        </div>
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">Join the Go Green Club</h2>
            <p className="mt-4 text-pretty text-sm opacity-95 sm:text-base">
              Help build a sustainable future for our planet
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                Join Now
              </Link>
              <Link
                to="/events"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-white/10 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/15 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                Explore Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row">
          <p className="text-sm font-semibold text-gray-600">GoGreen Club © {new Date().getFullYear()}</p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/go-green-club/"
              target="_blank"
              rel="noreferrer"
              aria-label="GoGreen Club on LinkedIn"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-700 ring-1 ring-gray-200 transition hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};
