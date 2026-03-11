export const About = () => {
  const objectives = [
    { icon: '🌱', title: 'Environmental Literacy & STEAM Awareness', desc: 'Educating communities on sustainability through science and innovation' },
    { icon: '🛠️', title: 'Green Skills Development', desc: 'Building practical skills for sustainable solutions and green careers' },
    { icon: '🎨', title: 'Innovation & Eco-Art', desc: 'Combining creativity with technology to drive environmental change' },
    { icon: '🤝', title: 'Community Outreach', desc: 'Engaging local communities in environmental action and awareness' },
    { icon: '👥', title: 'Mentorship & Leadership', desc: 'Developing the next generation of environmental leaders' },
    { icon: '🌍', title: 'Climate Action & SDGs', desc: 'Aligning our work with UN Sustainable Development Goals' }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-200/45 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-green-200/35 blur-3xl" />
          <div className="absolute left-10 top-16 rotate-[-10deg] text-6xl opacity-20">🌿</div>
          <div className="absolute right-10 top-24 rotate-[10deg] text-6xl opacity-20">🌱</div>
        </div>
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              About
            </p>
            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              About the Go Green Club
            </h1>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-gray-700 sm:text-base">
              The Go Green Club is a vibrant community of students, scientists, innovators, and changemakers committed to advancing sustainability through science, technology, engineering, arts, and mathematics (STEAM).
            </p>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-gray-700 sm:text-base">
              We believe real transformation happens when environmental consciousness meets innovation — turning ideas into impactful and scalable solutions for people and the planet.
            </p>
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Vision & Mission</h2>
            <p className="mt-3 text-sm text-gray-600 sm:text-base">
              Clear purpose, practical action, community outcomes.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                  <span className="text-2xl" aria-hidden="true">🔭</span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-gray-900">Our Vision</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-700">
                To nurture a generation of STEAM-driven environmental leaders who leverage innovation to build resilient and sustainable communities.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                  <span className="text-2xl" aria-hidden="true">🎯</span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-gray-900">Our Mission</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-700">
                To integrate STEAM education and green innovation to develop sustainable solutions, empower communities, and promote a circular economy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE OBJECTIVES */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Core Objectives</h2>
            <p className="mt-3 text-sm text-gray-600 sm:text-base">
              What we focus on, and how we create real-world impact.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {objectives.map((obj, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                    <span className="text-2xl" aria-hidden="true">{obj.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold tracking-tight text-gray-900">{obj.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{obj.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
