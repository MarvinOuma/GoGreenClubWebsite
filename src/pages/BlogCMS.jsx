import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { discardUpload, imageAccept, uploadImage } from '../firebase/images';
import { db } from '../firebase/firebaseConfig';
import { DashboardLayout } from '../layout/DashboardLayout';

const toJsDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const formatDate = (value) => {
  const date = toJsDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

const parseTags = (value) =>
  (value ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 25);

const StatusBadge = ({ published }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
      published ? 'bg-green-100 text-brand-green' : 'bg-gray-100 text-gray-700'
    }`}
  >
    {published ? 'Published' : 'Draft'}
  </span>
);

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onClose?.(), 2800);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const tone =
    toast.type === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : toast.type === 'error'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-gray-200 bg-white text-gray-900';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="font-semibold">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs font-bold opacity-70 hover:opacity-100"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const initialForm = {
  title: '',
  content: '',
  authorName: '',
  tagsText: '',
  isPublished: false,
};

export const BlogCMS = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error fetching posts:', e);
      setToast({ type: 'error', message: 'Failed to load posts. Please refresh and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let uploaded;
    try {
      setSaving(true);
      setToast(null);

      let coverImageUrl;
      if (imageFile) {
        uploaded = await uploadImage('blog', imageFile);
        coverImageUrl = uploaded.url;
      }

      const payload = {
        title: formData.title.trim(),
        content: formData.content,
        authorName: formData.authorName.trim(),
        tags: parseTags(formData.tagsText),
        isPublished: !!formData.isPublished,
        updatedAt: new Date(),
        ...(uploaded ? { coverImageUrl, coverImagePath: uploaded.path } : {}),
      };

      if (editingId) {
        await updateDoc(doc(db, 'posts', editingId), payload);
        setToast({ type: 'success', message: 'Post updated successfully.' });
      } else {
        await addDoc(collection(db, 'posts'), { ...payload, createdAt: new Date() });
        setToast({ type: 'success', message: 'Post created successfully.' });
      }

      uploaded = undefined;
      setFormData(initialForm);
      setEditingId('');
      setImageFile(null);
      setImagePreviewUrl('');
      setShowForm(false);
      await fetchPosts();
    } catch (e) {
      await discardUpload(uploaded);
      console.error('Error saving post:', e);
      setToast({ type: 'error', message: e.message || 'Failed to save post. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (postId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'posts', postId), { isPublished: !currentStatus, updatedAt: new Date() });
      setToast({ type: 'success', message: !currentStatus ? 'Post published.' : 'Post set to draft.' });
      fetchPosts();
    } catch (e) {
      console.error('Error updating publish status:', e);
      setToast({ type: 'error', message: 'Failed to update status. Please try again.' });
    }
  };

  const startCreate = () => {
    setFormData(initialForm);
    setEditingId('');
    setImageFile(null);
    setImagePreviewUrl('');
    setShowForm(true);
  };

  const startEdit = (post) => {
    setFormData({
      title: post?.title ?? '',
      content: post?.content ?? '',
      authorName: post?.authorName ?? '',
      tagsText: (post?.tags ?? []).join(', '),
      isPublished: !!post?.isPublished,
    });
    setEditingId(post?.id ?? '');
    setImageFile(null);
    setImagePreviewUrl('');
    setShowForm(true);
  };

  const confirmDelete = (post) => setDeleteTarget(post);

  const deletePost = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteDoc(doc(db, 'posts', deleteTarget.id));
      setToast({ type: 'success', message: 'Post deleted successfully.' });
      setDeleteTarget(null);
      fetchPosts();
    } catch (e) {
      console.error('Error deleting post:', e);
      setToast({ type: 'error', message: 'Failed to delete post. Please try again.' });
    }
  };

  const existingCoverUrl = useMemo(() => {
    if (!editingId) return '';
    const p = posts.find((x) => x.id === editingId);
    return p?.coverImageUrl ?? '';
  }, [editingId, posts]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  return (
    <DashboardLayout title="Blog CMS">
      <div className="max-w-4xl mx-auto space-y-6">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-green">Blog Posts</h1>
          <div className="flex items-center gap-2">
            {showForm ? (
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId('');
                  setFormData(initialForm);
                  setImageFile(null);
                  setImagePreviewUrl('');
                }}
                className="btn-secondary text-sm md:text-base"
              >
                Cancel
              </button>
            ) : null}
            <button onClick={startCreate} className="btn-primary text-sm md:text-base">
              + New Post
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    {editingId ? 'Edit Post' : 'Create Post'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {editingId ? 'Update content, tags, image, and publish status.' : 'Write a new post and publish when ready.'}
                  </p>
                </div>
                <StatusBadge published={!!formData.isPublished} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="blogcms-title" className="block text-sm font-semibold text-gray-900">Title</label>
                  <input id="blogcms-title"
                    type="text"
                    placeholder="Post title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-2 w-full form-control"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="blogcms-author" className="block text-sm font-semibold text-gray-900">Author</label>
                  <input id="blogcms-author"
                    type="text"
                    placeholder="Author name"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="mt-2 w-full form-control"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="blogcms-tags" className="block text-sm font-semibold text-gray-900">Tags</label>
                  <input id="blogcms-tags"
                    type="text"
                    placeholder="e.g. Climate, Recycling, Events"
                    value={formData.tagsText}
                    onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })}
                    className="mt-2 w-full form-control"
                  />
                  <p className="mt-1 text-xs text-gray-500">Comma separated. Example: Trees, Cleanups, Innovation</p>
                </div>
              </div>

              <div>
                <label htmlFor="blogcms-content" className="block text-sm font-semibold text-gray-900">Content</label>
                <textarea id="blogcms-content"
                  placeholder="Write your post..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="mt-2 w-full form-control"
                  rows={10}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="blogcms-cover-image" className="block text-sm font-semibold text-gray-900">Cover image</label>
                  <input id="blogcms-cover-image"
                    type="file"
                    accept={imageAccept}
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional. Recommended: landscape image.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Preview</label>
                  <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    {imagePreviewUrl || existingCoverUrl ? (
                      <img
                        src={imagePreviewUrl || existingCoverUrl}
                        alt="Cover preview"
                        className="h-36 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-36 items-center justify-center text-xs font-semibold text-gray-500">
                        No image selected
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="h-5 w-5"
                />
                <span className="text-sm font-semibold text-gray-900">Published</span>
                <span className="text-sm text-gray-500">Toggle to show/hide on the public blog.</span>
              </label>

              <button type="submit" disabled={saving} className="w-full btn-primary">
                {saving ? (editingId ? 'Updating...' : 'Creating...') : editingId ? 'Update Post' : 'Create Post'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <p className="text-4xl">🌱</p>
              <p className="mt-4 text-lg font-bold text-gray-900">No posts yet</p>
              <p className="mt-2 text-sm text-gray-600">Create your first blog post to get started.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className="h-16 w-24 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-100">
                      {post?.coverImageUrl ? (
                        <img
                          src={post.coverImageUrl}
                          alt={post?.title ?? 'Cover'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-500">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold text-gray-900">{post.title}</h3>
                        <StatusBadge published={!!post.isPublished} />
                      </div>
                      <p className="mt-1 text-gray-600 text-sm">
                        By <span className="font-semibold text-gray-800">{post.authorName}</span>
                        {post?.createdAt ? <span className="text-gray-400"> · {formatDate(post.createdAt)}</span> : null}
                      </p>
                      {(post?.tags ?? []).length ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="bg-green-50 text-brand-green px-3 py-1 rounded-full text-xs font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => startEdit(post)}
                      className="px-4 py-2 rounded-xl min-h-[44px] bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 font-semibold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => togglePublish(post.id, post.isPublished)}
                      className={`px-4 py-2 rounded-xl min-h-[44px] font-semibold text-sm ${
                        post.isPublished ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {post.isPublished ? 'Set Draft' : 'Publish'}
                    </button>
                    <button
                      onClick={() => confirmDelete(post)}
                      className="px-4 py-2 rounded-xl min-h-[44px] bg-red-600 text-white hover:bg-red-700 font-semibold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this post?"
        description={`This will permanently delete “${deleteTarget?.title ?? 'Untitled post'}”. This action cannot be undone.`}
        confirmLabel="Delete post"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deletePost}
      />
    </DashboardLayout>
  );
};
