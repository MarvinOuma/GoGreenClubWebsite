import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const toJsDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate(); // Firestore Timestamp
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

const getExcerpt = (content, maxLen = 150) => {
  const text = (content ?? '').toString().replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
};

const BlogHeader = () => (
  <div className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-green-200/40 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
    </div>
    <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-xs font-semibold text-brand-green">
          GoGreen Club
          <span className="h-1 w-1 rounded-full bg-brand-green/70" />
          Blog
        </p>
        <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          GoGreen Club Blog
        </h1>
        <p className="mt-4 text-pretty text-sm text-gray-600 sm:text-base">
          Stories, events, and sustainability initiatives from Machakos University.
        </p>
      </div>
    </div>
  </div>
);

const BlogFilters = ({ search, onSearch, tags, activeTag, onTag }) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div className="relative w-full sm:max-w-md">
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search posts by title..."
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        ⌕
      </span>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onTag('')}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          !activeTag ? 'bg-brand-green text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onTag(tag)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            activeTag === tag
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-green-50 text-brand-green hover:bg-green-100'
          }`}
          title={`Filter by ${tag}`}
        >
          {tag}
        </button>
      ))}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="h-44 w-full animate-pulse bg-gray-100" />
    <div className="space-y-3 p-5">
      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
      <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
      <div className="flex gap-2 pt-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  </div>
);

const TagPills = ({ tags, activeTag, onTagClick }) => (
  <div className="flex flex-wrap gap-2">
    {(tags ?? []).map((tag) => (
      <button
        key={tag}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTagClick?.(tag);
        }}
        className={`relative z-10 rounded-full px-3 py-1 text-xs font-semibold transition ${
          activeTag === tag ? 'bg-green-600 text-white' : 'bg-green-50 text-brand-green hover:bg-green-100'
        }`}
      >
        {tag}
      </button>
    ))}

  </div>
);

const BlogCard = ({ post, activeTag, onTagClick }) => {
  const imageUrl = post?.coverImageUrl;
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={post?.title ?? 'Blog cover'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
            GoGreen Club
          </div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div className="space-y-1">
          <h3 className="text-pretty text-lg font-extrabold tracking-tight text-gray-900 group-hover:text-brand-green">
            <Link to={`/blog/${post.id}`} className="card-action">{post.title}</Link>
          </h3>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{post?.authorName ?? 'Unknown author'}</span>
            {post?.createdAt ? <span className="text-gray-400"> · {formatDate(post.createdAt)}</span> : null}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-gray-600">{getExcerpt(post?.content, 150)}</p>

        <TagPills tags={post?.tags} activeTag={activeTag} onTagClick={onTagClick} />
      </div>
    </article>
  );
};

const FeaturedPost = ({ post, activeTag, onTagClick }) => {
  if (!post) return null;
  return (
    <div className="overflow-hidden rounded-3xl border border-green-100 bg-gradient-to-br from-white to-green-50 shadow-sm">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative h-56 overflow-hidden bg-gray-100 md:h-full">
          {post?.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post?.title ?? 'Featured post'}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
              Featured
            </div>
          )}
          <div className="absolute left-4 top-4 rounded-full bg-brand-green px-3 py-1 text-xs font-bold text-white shadow-sm">
            Featured
          </div>
        </div>
        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold text-brand-green">Latest story</p>
          <h2 className="mt-2 text-balance text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            {post?.title ?? 'Untitled post'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{post?.authorName ?? 'Unknown author'}</span>
            {post?.createdAt ? <span className="text-gray-400"> · {formatDate(post.createdAt)}</span> : null}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-gray-700">{getExcerpt(post?.content, 220)}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {(post?.tags ?? []).slice(0, 4).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeTag === tag
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-green-100 text-brand-green hover:bg-green-200'
                }`}
              >
                {tag}
              </button>
            ))}
            <Link to={`/blog/${post.id}`}
                      className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              Read More
              <span aria-hidden className="text-white/80">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setError('');
        const baseRef = collection(db, 'posts');

        // Prefer server-side sorting; fall back if a composite index is required.
        let snapshot;
        try {
          const q = query(baseRef, where('isPublished', '==', true), orderBy('createdAt', 'desc'));
          snapshot = await getDocs(q);
        } catch (e) {
          console.warn('Query with orderBy failed; falling back to client-side sort.', e);
          const q = query(baseRef, where('isPublished', '==', true));
          snapshot = await getDocs(q);
        }

        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => {
          const ad = toJsDate(a?.createdAt)?.getTime?.() ?? 0;
          const bd = toJsDate(b?.createdAt)?.getTime?.() ?? 0;
          return bd - ad;
        });
        setPosts(items);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Unable to load blog posts right now. Please try again soon.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    // Reset pagination when filters change.
    setVisibleCount(6);
  }, [search, activeTag]);

  const allTags = useMemo(() => {
    const set = new Set();
    for (const post of posts) {
      for (const tag of post?.tags ?? []) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesTitle = !q || (post?.title ?? '').toLowerCase().includes(q);
      const matchesTag = !activeTag || (post?.tags ?? []).includes(activeTag);
      return matchesTitle && matchesTag;
    });
  }, [posts, search, activeTag]);

  const featuredPost = filteredPosts[0] ?? null;
  const remainingPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;
  const cardsToShow = featuredPost ? Math.max(0, visibleCount - 1) : visibleCount;
  const visiblePosts = remainingPosts.slice(0, cardsToShow);

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="space-y-6">
          <BlogFilters
            search={search}
            onSearch={setSearch}
            tags={allTags}
            activeTag={activeTag}
            onTag={setActiveTag}
          />

          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <p className="mt-2 text-lg font-bold text-gray-900">🌱 No blog posts yet. Check back soon!</p>
              <p className="mt-2 text-sm text-gray-600">We’re preparing new updates, events, and sustainability stories.</p>
            </div>
          ) : (
            <>
              <FeaturedPost
                post={featuredPost}
                activeTag={activeTag}
                onTagClick={setActiveTag}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visiblePosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    activeTag={activeTag}
                    onTagClick={setActiveTag}
                  />
                ))}
              </div>

              {(featuredPost ? 1 : 0) + visiblePosts.length < filteredPosts.length ? (
                <div className="flex justify-center pt-6">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 6)}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 hover:shadow-md"
                  >
                    Load more
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
