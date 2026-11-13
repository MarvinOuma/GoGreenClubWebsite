import { useState } from 'react';

export function EditorialPhoto({ src, alt = '', className, imageClassName, fallback = null, eager = false }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (!src || failedSrc === src) return fallback;
  return (
    <div className={className}>
      <img src={src} alt={alt} className={imageClassName} loading={eager ? 'eager' : 'lazy'}
        decoding="async" onError={() => setFailedSrc(src)} />
    </div>
  );
}
