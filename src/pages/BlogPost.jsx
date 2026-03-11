import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

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
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const Skeleton = () => (
  <div className="mx-auto max-w-4xl px-4 py-10">
    <div className="h-8 w-44 animate-pulse rounded bg-gray-100" />
    <div className="mt-6 h-64 w-full animate-pulse rounded-3xl bg-gray-100" />
    <div className="mt-6 space-y-3">
      <div className="h-8 w-3/4 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
    </div>
  </div>
);

export const BlogPost = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [post, setPost] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        if (!id) {
          setPost(null);
          setError('Post not found.');
          return;
        }
        const snap = await getDoc(doc(db, 'posts', id));
        if (!snap.exists()) {
          setPost(null);
          setError('Post not found.');
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        if (!data?.isPublished) {
          setPost(null);
          setError('Post not found.');
          return;
        }
        setPost(data);
      } catch (e) {
        console.error('Error loading blog post:', e);
        setError('Unable to load this post right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const createdLabel = useMemo(() => formatDate(post?.createdAt), [post?.createdAt]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Link to="/blog" className="text-sm font-semibold text-brand-green hover:underline">
            ← Back to Blog
          </Link>
          <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="text-4xl">🌿</p>
            <p className="mt-4 text-lg font-bold text-gray-900">{error}</p>
            <p className="mt-2 text-sm text-gray-600">Try returning to the blog and selecting another post.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/blog" className="text-sm font-semibold text-brand-green hover:underline">
          ← Back to Blog
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {post?.coverImageUrl ? (
            <div className="relative h-72 w-full overflow-hidden bg-gray-100 sm:h-96">
              <img
                src={post.coverImageUrl}
                alt={post?.title ?? 'Blog cover'}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <div className="p-6 sm:p-10">
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {post?.title ?? 'Untitled post'}
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{post?.authorName ?? 'Unknown author'}</span>
              {createdLabel ? <span className="text-gray-400"> · {createdLabel}</span> : null}
            </p>

            {(post?.tags ?? []).length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(post.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-brand-green"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {post?.content ?? ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
