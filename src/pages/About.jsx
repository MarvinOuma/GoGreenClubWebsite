import { FiBookOpen, FiTool, FiPenTool, FiHeart, FiUsers, FiGlobe } from 'react-icons/fi';
export const About = () => {
  const objectives = [
    { icon: FiBookOpen, title: 'Environmental Literacy & STEAM Awareness', desc: 'Educating communities on sustainability through science and innovation' },
    { icon: FiTool, title: 'Green Skills Development', desc: 'Building practical skills for sustainable solutions and green careers' },
    { icon: FiPenTool, title: 'Innovation & Eco-Art', desc: 'Combining creativity with technology to drive environmental change' },
    { icon: FiHeart, title: 'Community Outreach', desc: 'Engaging local communities in environmental action and awareness' },
    { icon: FiUsers, title: 'Mentorship & Leadership', desc: 'Developing the next generation of environmental leaders' },
    { icon: FiGlobe, title: 'Climate Action & SDGs', desc: 'Aligning our work with UN Sustainable Development Goals' }
  ];

  return (
    <main className="min-h-screen bg-ivory">
      <section className="border-b border-line bg-white">
        <div className="site-container grid items-end gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <h1 className="site-heading">About<br className="hidden sm:block" /> GoGreen Club</h1>
          <div className="border-l-2 border-leaf pl-5 text-base leading-relaxed text-muted sm:text-lg">
            <p>We’re students, scientists, innovators, and changemakers advancing sustainability through science, technology, engineering, arts, and mathematics (STEAM).</p>
            <p className="mt-4">We turn ideas into practical solutions for people and the planet.</p>
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="py-14 sm:py-16">
        <div className="site-container">
          <div className="max-w-2xl">
            <h2 className="site-section-heading">Vision & Mission</h2>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <article className="dashboard-hero">
              <h3 className="text-2xl font-semibold">Our vision</h3>
              <p className="mt-4 max-w-lg leading-relaxed">
                To nurture a generation of STEAM-driven environmental leaders who leverage innovation to build resilient and sustainable communities.
              </p>
            </article>
            <article className="panel p-6 sm:p-8">
              <h3 className="text-2xl font-semibold text-forest">Our mission</h3>
              <p className="mt-4 max-w-lg leading-relaxed text-muted">
                To integrate STEAM education and green innovation to develop sustainable solutions, empower communities, and promote a circular economy.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CORE OBJECTIVES */}
      <section className="py-14 sm:py-16">
        <div className="site-container">
          <div className="max-w-2xl">
            <h2 className="site-section-heading">Core Objectives</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {objectives.map((obj) => (
              <div
                key={obj.title}
                className="panel p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                    <obj.icon className="text-xl text-leaf" aria-hidden="true" />
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
