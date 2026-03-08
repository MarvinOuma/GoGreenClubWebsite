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
    <div className="min-h-screen bg-gray-50">
      {/* ABOUT SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🌱</div>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-green mb-8">About the Go Green Club</h2>
          <p className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed">
            The Go Green Club is a vibrant community of students, scientists, innovators, and changemakers committed to advancing sustainability through science, technology, engineering, arts, and mathematics (STEAM).
          </p>
          <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
            We believe real transformation happens when environmental consciousness meets innovation — turning ideas into impactful and scalable solutions for people and the planet.
          </p>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-brand-green mb-16">Vision & Mission</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg border border-green-100 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="text-5xl mb-4">🔭</div>
              <h3 className="text-2xl font-bold text-brand-green mb-4">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                To nurture a generation of STEAM-driven environmental leaders who leverage innovation to build resilient and sustainable communities.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg border border-green-100 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-brand-green mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                To integrate STEAM education and green innovation to develop sustainable solutions, empower communities, and promote a circular economy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE OBJECTIVES */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-brand-green mb-16">Core Objectives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.map((obj, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:scale-105 hover:border-brand-green transition-all duration-300">
                <div className="text-5xl mb-4">{obj.icon}</div>
                <h3 className="text-lg font-bold text-brand-green mb-3">{obj.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{obj.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
