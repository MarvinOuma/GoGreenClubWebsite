import { useMemo, useState } from 'react';
import {
  FaBars,
  FaCalendarAlt,
  FaFacebookF,
  FaInstagram,
  FaRecycle,
  FaTimes,
  FaTree,
  FaTwitter,
  FaUsers,
} from 'react-icons/fa';

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
    {children}
  </span>
);

const PrimaryButton = ({ href, children, className = '' }) => (
  <a
    href={href}
    className={`inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${className}`}
  >
    {children}
  </a>
);

const OutlineButton = ({ href, children, className = '' }) => (
  <a
    href={href}
    className={`inline-flex items-center justify-center rounded-xl border-2 border-emerald-600 bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 ${className}`}
  >
    {children}
  </a>
);

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
        <Icon className="text-xl text-emerald-700" aria-hidden="true" />
      </div>
    </div>
  </div>
);

const BlogCard = ({ image, title, author, hashtag }) => (
  <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative h-40 overflow-hidden bg-gray-100">
      <img
        src={image}
        alt=""
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </div>
    <div className="space-y-3 p-5">
      <h3 className="text-pretty text-lg font-extrabold tracking-tight text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">
        Author: <span className="font-semibold text-gray-800">{author}</span>
      </p>
      <Pill>{hashtag}</Pill>
      <div className="pt-2">
        <a href="/blog" className="text-sm font-bold text-emerald-700 hover:underline">
          Read More →
        </a>
      </div>
    </div>
  </article>
);

const InvolvedCard = ({ icon, title, description, cta, href }) => (
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
          <PrimaryButton href={href} className="w-full sm:w-auto">
            {cta}
          </PrimaryButton>
        </div>
      </div>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <section className="py-14 sm:py-16">
    <div className="mx-auto max-w-6xl px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
      </div>
      <div className="mt-10">{children}</div>
    </div>
  </section>
);

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = useMemo(
    () => [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Events', href: '/events' },
      { label: 'Blog', href: '/blog' },
      { label: 'Login', href: '/login' },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { icon: FaRecycle, label: '♻️ Waste Collected', value: '44kg' },
      { icon: FaTree, label: '🌳 Trees Planted', value: '5' },
      { icon: FaUsers, label: '👥 Active Members', value: '4' },
      { icon: FaCalendarAlt, label: '📅 Events Hosted', value: '0' },
    ],
    []
  );

  const news = useMemo(
    () => [
      { title: 'First Blog', author: 'Marvin Daniel', hashtag: '#MksU', image: 'https://picsum.photos/200/150?random=1' },
      { title: 'International women’s day', author: 'Marvin Daniel', hashtag: '#MksU', image: 'https://picsum.photos/200/150?random=2' },
      { title: 'Tree Planting', author: 'Marvin Daniel', hashtag: '#MksU', image: 'https://picsum.photos/200/150?random=3' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <span className="text-lg font-black" aria-hidden="true">
                G
              </span>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-emerald-700">GoGreen Club</span>
          </a>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-semibold text-gray-700 hover:text-emerald-700">
                {item.label}
              </a>
            ))}
            <PrimaryButton href="/signup" className="py-2">
              Join Now
            </PrimaryButton>
          </nav>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl p-2 text-gray-700 hover:bg-emerald-50 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <div className="mx-auto max-w-6xl px-4 py-4">
              <div className="flex flex-col gap-2">
                {nav.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {item.label}
                  </a>
                ))}
                <PrimaryButton href="/signup" className="mt-2 w-full">
                  Join Now
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : null}
      </header>

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
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">GoGreen Club</h1>
            <p className="mt-3 text-lg font-bold text-emerald-700 sm:text-xl">Green Steps, Big Impact!</p>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-gray-700 sm:text-base">
              A community of students, scientists, innovators, and changemakers advancing sustainability through STEAM.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryButton href="/signup">Join Now →</PrimaryButton>
              <OutlineButton href="/events">Explore Events</OutlineButton>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <Section title="Impact Stats">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>
      </Section>

      {/* Upcoming Events */}
      <Section title="Upcoming Events">
        <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-900">No events scheduled yet</p>
          <div className="mt-6">
            <PrimaryButton href="/events">View All Events →</PrimaryButton>
          </div>
        </div>
      </Section>

      {/* Latest News */}
      <Section title="Latest News">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((p) => (
            <BlogCard key={p.title} image={p.image} title={p.title} author={p.author} hashtag={p.hashtag} />
          ))}
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
            href="/signup"
          />
          <InvolvedCard
            icon="🤝"
            title="Volunteer With Us"
            description="Participate in events, workshops, and community projects"
            cta="Get Involved →"
            href="/events"
          />
          <InvolvedCard
            icon="🌍"
            title="Partner With Us"
            description="Collaborate with us to amplify environmental impact"
            cta="Contact Us →"
            href="/signup"
          />
        </div>
      </Section>

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
            <p className="mt-4 text-pretty text-sm opacity-95 sm:text-base">Help build a sustainable future for our planet</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                Join Now
              </a>
              <a
                href="/events"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-white/10 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/15 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                Explore Events
              </a>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

