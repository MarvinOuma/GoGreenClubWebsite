import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import { DashboardLayout } from '../layout/DashboardLayout';

export const BlogCMS = () => {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    authorName: '',
    tags: '',
    isPublished: false
  });
  const [imageFile, setImageFile] = useState(null);

  const adminLinks = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/events', label: 'Event Manager' },
    { path: '/admin/users', label: 'User Management' },
    { path: '/admin/reports', label: 'Approval Queue' },
    { path: '/admin/blog', label: 'Blog CMS' },
  ];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const snapshot = await getDocs(collection(db, 'posts'));
    setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let coverImageUrl = '';

    if (imageFile) {
      const imageRef = ref(storage, `blog/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      coverImageUrl = await getDownloadURL(imageRef);
    }

    await addDoc(collection(db, 'posts'), {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()),
      coverImageUrl,
      createdAt: new Date()
    });

    setFormData({ title: '', content: '', authorName: '', tags: '', isPublished: false });
    setImageFile(null);
    setShowForm(false);
    fetchPosts();
  };

  const togglePublish = async (postId, currentStatus) => {
    await updateDoc(doc(db, 'posts', postId), { isPublished: !currentStatus });
    fetchPosts();
  };

  const deletePost = async (postId) => {
    if (confirm('Delete this post?')) {
      await deleteDoc(doc(db, 'posts', postId));
      fetchPosts();
    }
  };

  return (
    <DashboardLayout links={adminLinks} title="Blog CMS">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-green">Blog Posts</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm md:text-base">
            {showForm ? 'Cancel' : '+ Post'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required />
              <textarea placeholder="Content" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full px-4 py-3 border rounded-xl h-40" required />
              <input type="text" placeholder="Author Name" value={formData.authorName} onChange={(e) => setFormData({...formData, authorName: e.target.value})} className="w-full px-4 py-3 border rounded-xl" required />
              <input type="text" placeholder="Tags (comma separated)" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full px-4 py-3 border rounded-xl" />
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({...formData, isPublished: e.target.checked})} className="w-5 h-5" />
                <span>Publish immediately</span>
              </label>
              <button type="submit" className="w-full btn-primary">Create Post</button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-green">{post.title}</h3>
                  <p className="text-gray-600 text-sm">By {post.authorName}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.tags?.map(tag => (
                      <span key={tag} className="bg-green-100 text-brand-green px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => togglePublish(post.id, post.isPublished)} className={`px-4 py-2 rounded-xl min-h-[44px] ${post.isPublished ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    {post.isPublished ? 'Published' : 'Draft'}
                  </button>
                  <button onClick={() => deletePost(post.id)} className="px-4 py-2 bg-red-500 text-white rounded-xl min-h-[44px]">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
