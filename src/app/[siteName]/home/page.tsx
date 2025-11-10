'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface HomepageData {
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  heroImages?: string[];
  sections?: { heading?: string; text?: string; image?: string }[];
  footerText?: string;
}

export default function PublicHome() {
  const params = useParams<{ siteName: string }>();
  const siteName = params?.siteName as string;
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteName) return;
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000';
    fetch(`${base}/public/${siteName}/homepage`)
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [siteName]);

  if (!siteName) return <div className="min-h-screen flex items-center justify-center text-white">Missing site name</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-white">Site not found</div>;

  const heroImages = data.heroImages || [];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="px-6 py-4 flex items-center gap-4 sticky top-0 z-30 backdrop-blur bg-black/40 border-b border-white/10">
        {data.logoUrl && (
          <img src={data.logoUrl} alt="logo" className="h-12 w-auto object-contain" />
        )}
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">{data.title || siteName}</h1>
          {data.subtitle && <p className="text-sm text-gray-300 leading-snug">{data.subtitle}</p>}
        </div>
      </header>

      {heroImages.length > 0 && (
        <section className="relative w-full flex-1 min-h-[50vh]">
          <div className="absolute inset-0">
            {heroImages.slice(0,1).map((src,i)=>(
              <div key={i} className="absolute inset-0">
                <img src={src} alt={`hero-${i}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
              </div>
            ))}
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 py-24">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">{data.title || siteName}</h2>
            {data.subtitle && <p className="mt-4 max-w-xl text-lg md:text-xl text-gray-200">{data.subtitle}</p>}
            {heroImages.length > 1 && (
              <div className="mt-10 grid grid-cols-3 md:grid-cols-5 gap-2 max-w-2xl">
                {heroImages.slice(1).map((src,i)=>(
                  <div key={i} className="aspect-square overflow-hidden rounded bg-white/10">
                    <img src={src} alt="thumb" className="w-full h-full object-cover hover:scale-110 transition" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <main className="relative z-20 w-full">
        {data.sections?.map((s,i)=>(
          <section key={i} className="relative min-h-[60vh] flex items-center justify-center text-center px-6 py-24">
            {s.image && (
              <div className="absolute inset-0">
                <img src={s.image} alt={s.heading||'section'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
              </div>
            )}
            <div className="relative z-10 max-w-3xl mx-auto">
              {s.heading && <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight drop-shadow">{s.heading}</h2>}
              {s.text && <p className="text-base md:text-lg leading-relaxed text-gray-200 whitespace-pre-line drop-shadow">{s.text}</p>}
            </div>
          </section>
        ))}
        {(!data.sections || data.sections.length === 0) && (
          <div className="px-6 py-24 text-center text-sm text-gray-400">No content sections yet.</div>
        )}
      </main>

      {data.footerText && (
        <footer className="relative z-30 px-6 py-10 text-center text-xs text-gray-400 bg-black/80 border-t border-white/10">
          {data.footerText}
        </footer>
      )}
    </div>
  );
}
