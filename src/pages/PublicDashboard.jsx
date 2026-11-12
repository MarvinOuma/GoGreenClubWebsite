import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaRecycle,
  FaTree,
  FaTwitter,
  FaUsers,
} from 'react-icons/fa';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
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

const Section = ({ title, subtitle, children }) => (
  <section className="py-14 sm:py-16">
    <div className="mx-auto max-w-6xl px-4">
      <div className="mx-auto max-w-2xl text-center">
        {title ? <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h2> : null}
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
    className={`inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${className}`}
  >
    {children}
  </Link>
);

const OutlineButton = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`inline-flex items-center justify-center rounded-xl border-2 border-emerald-600 bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${className}`}
  >
    {children}
  </Link>
);

const StatCard = ({ icon: Icon, iconBg, label, value }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
        <Icon className="text-xl text-emerald-700" aria-hidden="true" />
      </div>
    </div>
  </div>
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
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
          <span className="text-xs font-bold text-emerald-700">GoGreen Club</span>
        </div>
      )}
    </div>
    <div className="space-y-3 p-5">
      <h3 className="text-pretty text-lg font-extrabold tracking-tight text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">
        Author: <span className="font-semibold text-gray-800">{author}</span>
      </p>
      <Pill>{hashtag}</Pill>
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
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 sm:w-auto"
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

  const stats = useMemo(
    () => [
      { icon: FaRecycle, iconBg: 'bg-emerald-50 ring-1 ring-emerald-100', label: '♻️ Waste Collected', value: '44kg' },
      { icon: FaTree, iconBg: 'bg-green-50 ring-1 ring-green-100', label: '🌳 Trees Planted', value: '5' },
      { icon: FaUsers, iconBg: 'bg-teal-50 ring-1 ring-teal-100', label: '👥 Active Members', value: '4' },
      { icon: FaCalendarAlt, iconBg: 'bg-lime-50 ring-1 ring-lime-100', label: '📅 Events Hosted', value: '0' },
    ],
    []
  );

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
        const snap = await getDocs(query(collection(db, 'events'), where('isPublic', '==', true)));
        const now = new Date();
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const upcoming = items
          .filter((e) => {
            const d = toJsDate(e?.date);
            return d && d >= now && e?.status !== 'cancelled';
          })
          .sort((a, b) => (toJsDate(a?.date)?.getTime?.() ?? 0) - (toJsDate(b?.date)?.getTime?.() ?? 0))
          .slice(0, 3);
        setUpcomingEvents(upcoming);
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
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-green-200/40 blur-3xl" />
          <div className="absolute left-8 top-10 rotate-[-10deg] text-6xl opacity-25">🌿</div>
          <div className="absolute right-10 top-24 rotate-[10deg] text-5xl opacity-25">🌱</div>
          <div className="absolute bottom-20 left-10 rotate-[8deg] text-6xl opacity-20">🌍</div>
          <div className="absolute bottom-12 right-12 rotate-[-8deg] text-5xl opacity-20">♻️</div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Pill>Green Steps, Big Impact!</Pill>
            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              GoGreen Club
            </h1>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-gray-700 sm:text-base">
              A community of students, scientists, innovators, and changemakers advancing sustainability through STEAM.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryButton to="/signup">Join Now →</PrimaryButton>
              <OutlineButton to="/events">Explore Events</OutlineButton>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <Section title="Impact Stats" subtitle="Small steps add up when we move together.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} iconBg={s.iconBg} label={s.label} value={s.value} />
          ))}
        </div>
      </Section>

      {/* Upcoming Events */}
      <Section title="Upcoming Events">
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
                <p className="mt-3 text-sm text-gray-600">📅 {toJsDate(e?.date) ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(toJsDate(e?.date)) : e?.date ?? ''}</p>
                <p className="mt-1 text-sm text-gray-600">📍 {e?.location ?? 'TBA'}</p>
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
            <p className="mt-2 text-sm text-gray-600">Admins can add partner logos in the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {partners.map((p) => (
              <a
                key={p.id}
                href={p?.websiteUrl || '#'}
                target={p?.websiteUrl ? '_blank' : undefined}
                rel={p?.websiteUrl ? 'noreferrer' : undefined}
                className="group flex h-20 items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                aria-label={p?.name ? `Partner: ${p.name}` : 'Partner'}
              >
                {p?.logoUrl ? (
                  <img
                    src={p.logoUrl}
                    alt={p?.name ?? 'Partner logo'}
                    className="max-h-12 w-auto max-w-full object-contain opacity-90 transition group-hover:opacity-100"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs font-extrabold tracking-tight text-gray-700">{p?.name ?? 'Partner'}</span>
                )}
              </a>
            ))}
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
                author={post?.authorName ?? 'Marvin Daniel'}
                hashtag="#MksU"
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
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl" aria-hidden="true">
              🌱
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Bank transfer</p>
              <h3 className="text-xl font-extrabold text-gray-900">KCB Bank</h3>
            </div>
          </div>
          <dl className="mt-6 grid gap-4 rounded-2xl bg-gray-50 p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account name</dt>
              <dd className="mt-1 font-bold text-gray-900">Veronica Samson Eunice JA</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account number</dt>
              <dd className="mt-1 font-bold tracking-wide text-gray-900">1346825661</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Thank you for helping grow a greener community. Please use “GoGreen Club donation” as your transfer reference.
          </p>
        </div>
      </Section>

      {/* Get Involved */}
      <Section title="Get Involved">
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
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-emerald-100"
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
          <p className="text-sm font-semibold text-gray-600">GoGreen Club © 2025</p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="GoGreen Club on Twitter"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-700 ring-1 ring-gray-200 transition hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
            >
              <FaTwitter />
            </a>
            <a
              href="#"
              aria-label="GoGreen Club on Instagram"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-700 ring-1 ring-gray-200 transition hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
            >
              <FaInstagram />
            </a>
            <a
              href="#"
              aria-label="GoGreen Club on Facebook"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-700 ring-1 ring-gray-200 transition hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
            >
              <FaFacebookF />
            </a>
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
