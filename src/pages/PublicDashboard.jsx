import { useState, useEffect } from 'react';
import '../index.css';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const PublicDashboard = () => {
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [impact, setImpact] = useState({ waste: 0, trees: 0, members: 0, eventsHosted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(allEvents);

        const postsQuery = query(collection(db, 'posts'), where('isPublished', '==', true));
        const postsSnapshot = await getDocs(postsQuery);
        setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const approvedQuery = query(collection(db, 'impactReports'), where('status', '==', 'approved'));
        const approvedSnapshot = await getDocs(approvedQuery);
        
        let totalWaste = 0;
        let totalTrees = 0;
        approvedSnapshot.docs.forEach(doc => {
          const data = doc.data();
          totalWaste += parseInt(data.wasteAmount) || 0;
          totalTrees += parseInt(data.treesPlanted) || 0;
        });

        setImpact({ 
          waste: totalWaste, 
          trees: totalTrees, 
          members: usersSnapshot.size,
          eventsHosted: allEvents.filter(e => e.status === 'completed').length
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const engagementCards = [
    { title: 'Become a Member', desc: 'Join our community of changemakers and contribute to sustainable solutions', cta: 'Join Now', link: '/signup' },
    { title: 'Volunteer With Us', desc: 'Participate in events, workshops, and community projects', cta: 'Get Involved', link: '/events' },
    { title: 'Partner With Us', desc: 'Collaborate with us to amplify environmental impact', cta: 'Contact Us', link: '/signup' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-brand-green via-green-600 to-green-700 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl">🌿</div>
          <div className="absolute top-40 right-20 text-7xl">🌱</div>
          <div className="absolute bottom-20 left-1/4 text-8xl">🌍</div>
          <div className="absolute bottom-10 right-10 text-6xl">♻️</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 text-center text-white relative z-10">
          <div className="flex justify-center mb-6 animate-bounce">
            <img src="/logo.png" alt="GoGreen Club" className="h-24 w-24 md:h-32 md:w-32 drop-shadow-2xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">GoGreen Club</h1>
          <p className="text-2xl md:text-3xl mb-6 font-semibold animate-fade-in-delay">Green Steps, Big Impact!</p>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-95 leading-relaxed">
            A community of students, scientists, innovators, and changemakers advancing sustainability through STEAM (Science, Technology, Engineering, Arts, and Mathematics).
          </p>
          <p className="text-base md:text-lg mb-10 italic opacity-90 font-light">
            "Advancing Green Principles, Empowering Skills, Building Sustainable Communities! #GreenStepsBigImpact"
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up">
            <a href="/signup" className="bg-white text-brand-green px-8 py-4 rounded-xl font-bold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
              Join Now →
            </a>
            <a href="/events" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 hover:scale-105 transition-all duration-300">
              Explore Events
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🌱</div>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-green mb-8">About the Go Green Club</h2>
          <p className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed">
            The Go Green Club is a vibrant community of students, scientists, innovators, and changemakers committed to advancing sustainability through STEAM.
          </p>
          <a href="/about" className="btn-primary inline-block hover:scale-105 transition-transform duration-300">Learn More →</a>
        </div>
      </section> */}

      {/* OUR IMPACT */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-6xl text-center mb-6">📊</div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-brand-green mb-16">Our Impact</h2>
          {loading ? (
            <p className="text-center">Loading impact data...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300">
                <div className="text-3xl mb-2">♻️</div>
                <p className="text-4xl md:text-5xl font-bold text-brand-green mb-2">{impact.waste}kg</p>
                <p className="text-gray-700 font-semibold">Waste Collected</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300">
                <div className="text-3xl mb-2">🌳</div>
                <p className="text-4xl md:text-5xl font-bold text-brand-green mb-2">{impact.trees}</p>
                <p className="text-gray-700 font-semibold">Trees Planted</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-4xl md:text-5xl font-bold text-brand-green mb-2">{impact.members}</p>
                <p className="text-gray-700 font-semibold">Active Members</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-4xl md:text-5xl font-bold text-brand-green mb-2">{impact.eventsHosted}</p>
                <p className="text-gray-700 font-semibold">Events Hosted</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-6xl text-center mb-6">📅</div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-brand-green mb-16">Upcoming Events</h2>
          {events.filter(e => e.isPublic !== false && e.status !== 'cancelled' && new Date(e.date) >= new Date()).length === 0 ? (
            <p className="text-center text-gray-500">No events scheduled yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events
                .filter(e => e.isPublic !== false && e.status !== 'cancelled' && new Date(e.date) >= new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 3)
                .map(event => (
                  <div key={event.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    {event.imageUrl && (
                      <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-5">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-semibold rounded-full">
                        {event.category?.toUpperCase() || 'EVENT'}
                      </span>
                      <h3 className="text-xl font-bold text-brand-green mt-3 mb-2">{event.title}</h3>
                      <div className="space-y-1 text-sm text-gray-500 mb-4">
                        <p>📅 {event.date}</p>
                        <p>📍 {event.location}</p>
                      </div>
                      <a href="/events" className="block w-full text-center btn-primary text-sm hover:scale-105 transition-transform duration-300">
                        Register Now →
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          )}
          <div className="text-center mt-12">
            <a href="/events" className="btn-primary inline-block hover:scale-105 transition-transform duration-300">View All Events →</a>
          </div>
        </div>
      </section>

      {/* LATEST NEWS */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-6xl text-center mb-6">📰</div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-brand-green mb-16">Latest News</h2>
          {posts.length === 0 ? (
            <p className="text-center text-gray-500">No posts yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice(0, 3).map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  {post.coverImageUrl && (
                    <img src={post.coverImageUrl} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="bg-gradient-to-r from-green-100 to-green-200 text-brand-green px-3 py-1 rounded-full text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-brand-green mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">By {post.authorName}</p>
                    <a href="/blog" className="text-brand-green font-semibold text-sm hover:underline inline-flex items-center gap-1">Read More →</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* GET INVOLVED */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-6xl text-center mb-6">🤝</div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-brand-green mb-16">Get Involved</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {engagementCards.map((card, idx) => (
              <div key={idx} className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <h3 className="text-2xl font-bold text-brand-green mb-4">{card.title}</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">{card.desc}</p>
                <a href={card.link} className="btn-primary inline-block hover:scale-105 transition-transform duration-300">{card.cta} →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="relative py-24 bg-gradient-to-r from-brand-green via-green-600 to-green-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-9xl">🌍</div>
          <div className="absolute bottom-10 left-10 text-8xl">🌿</div>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center text-white relative z-10">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Join the Go Green Club</h2>
          <p className="text-xl md:text-2xl mb-10 font-light">Help build a sustainable future for our planet</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/signup" className="bg-white text-brand-green px-8 py-4 rounded-xl font-bold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-2xl">
              Join Now →
            </a>
            <a href="/events" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 hover:scale-105 transition-all duration-300">
              Explore Events
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
