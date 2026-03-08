import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'posts'), where('isPublished', '==', true));
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-brand-green mb-8">Blog & News</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.length > 0 ? posts.map(post => (
            <div key={post.id} className="card">
              {post.coverImageUrl && (
                <img src={post.coverImageUrl} alt={post.title} className="w-full h-48 object-cover rounded-lg mb-4" />
              )}
              <h3 className="text-2xl font-bold text-brand-green mb-2">{post.title}</h3>
              <p className="text-sm text-gray-600 mb-4">By {post.authorName}</p>
              <p className="text-gray-700 mb-4">{post.content?.substring(0, 150)}...</p>
              <div className="flex flex-wrap gap-2">
                {post.tags?.map(tag => (
                  <span key={tag} className="bg-green-100 text-brand-green px-3 py-1 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )) : (
            <p className="text-gray-500 col-span-2">No posts yet. Check back soon!</p>
          )}
        </div>
      </div>
    </div>
  );
};
