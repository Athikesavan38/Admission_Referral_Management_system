import { useState } from 'react';

/**
 * LazyImage — uses native browser lazy loading with a blur-up reveal effect.
 * Falls back to a placeholder skeleton while loading.
 */
export default function LazyImage({ src, alt, className = '', width, height, placeholder }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  if (error || !src) {
    return (
      <div className={`bg-gray-100 dark:bg-white/5 flex items-center justify-center rounded-lg ${className}`}
        style={{ width, height }}>
        <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Skeleton shown while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-white/5 dark:via-white/10 dark:to-white/5 animate-shimmer bg-[length:200%_100%]" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'}`}
      />
    </div>
  );
}
