'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Section { heading?: string; text?: string; image?: string; }
interface HomepageData {
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  heroImages: string[];
  sections: Section[];
  footerText?: string;
}

const emptyData: HomepageData = { heroImages: [], sections: [] };

const HomeCustomizationPage: React.FC = () => {
  const [data, setData] = useState<HomepageData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/homepage');
        setData({ ...emptyData, ...res.data });
      } catch (e:any) {
        setError(e?.message || 'Failed to load homepage');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const updateField = (k: keyof HomepageData, v: any) => setData(d => ({ ...d, [k]: v }));

  const addHeroImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        updateField('heroImages', [...data.heroImages, e.target.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeHeroImage = (idx: number) => {
    updateField('heroImages', data.heroImages.filter((_, i) => i !== idx));
  };

  const addSection = () => updateField('sections', [...data.sections, { heading: '', text: '', image: '' }]);
  const updateSection = (i: number, patch: Partial<Section>) => {
    const next = data.sections.slice();
    next[i] = { ...next[i], ...patch };
    updateField('sections', next);
  };
  const removeSection = (i: number) => updateField('sections', data.sections.filter((_, idx) => idx !== i));

  const pickSectionImage = (i: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { if (e.target?.result) updateSection(i, { image: e.target.result as string }); };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    try {
      setSaving(true); setError(null);
      await api.put('/homepage', data);
    } catch (e:any) {
      setError(e?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Customize Homepage</h1>
      {loading && <div className="mb-4 text-sm">Loading...</div>}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      <div className="grid gap-8">
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Logo URL or Base64</span>
            <input value={data.logoUrl||''} onChange={e=>updateField('logoUrl', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://..." />
          </label>
          <div className="flex items-center gap-4">
            <input type="file" accept="image/*" onChange={e=>{
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = ev => { if (ev.target?.result) updateField('logoUrl', ev.target.result as string); };
              reader.readAsDataURL(f);
            }} className="text-sm" />
            {data.logoUrl && (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.logoUrl} alt="logo preview" className="h-12 w-auto object-contain border rounded bg-white" />
                <button onClick={()=>updateField('logoUrl','')} className="text-xs px-2 py-1 border rounded">Remove</button>
              </div>
            )}
          </div>
          <label className="block">
            <span className="text-sm font-medium">Title</span>
            <input value={data.title||''} onChange={e=>updateField('title', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Big headline" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Subtitle</span>
            <input value={data.subtitle||''} onChange={e=>updateField('subtitle', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Supporting tagline" />
          </label>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2 flex items-center justify-between">Hero Images <button onClick={()=>addHeroImage((document.getElementById('addHeroFile') as HTMLInputElement).files?.[0]||null)} className="text-xs px-2 py-1 border rounded">Add Selected</button></h2>
          <input id="addHeroFile" type="file" accept="image/*" className="mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.heroImages.map((src,i)=>(
              <div key={i} className="relative group border rounded overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="hero" className="w-full h-40 object-cover" />
                <button onClick={()=>removeHeroImage(i)} className="absolute top-2 right-2 bg-white/80 text-xs px-2 py-1 rounded shadow">Remove</button>
              </div>
            ))}
            {data.heroImages.length === 0 && <div className="text-xs text-gray-500">No hero images yet.</div>}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Content Sections</h2>
          <div className="space-y-6">
            {data.sections.map((s,i)=>(
              <div key={i} className="border rounded p-4 space-y-3 bg-white shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Section {i+1}</span>
                  <button onClick={()=>removeSection(i)} className="text-xs px-2 py-1 border rounded">Delete</button>
                </div>
                <input value={s.heading||''} onChange={e=>updateSection(i,{heading:e.target.value})} placeholder="Heading" className="w-full border rounded px-3 py-2 text-sm" />
                <textarea value={s.text||''} onChange={e=>updateSection(i,{text:e.target.value})} placeholder="Text" rows={3} className="w-full border rounded px-3 py-2 text-sm" />
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={e=>pickSectionImage(i, e.target.files?.[0]||null)} className="text-xs" />
                  {s.image && (
                    <div className="w-20 h-16 rounded overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} alt="section" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {s.image && <button onClick={()=>updateSection(i,{image:''})} className="text-xs px-2 py-1 border rounded">Remove Image</button>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={addSection} className="mt-4 text-sm px-3 py-2 border rounded">Add Section</button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Footer Text</span>
            <input value={data.footerText||''} onChange={e=>updateField('footerText', e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="© 2025 My Brand" />
          </label>
        </div>

        <div className="flex gap-4 items-center">
          <button onClick={save} disabled={saving} className={`px-4 py-2 rounded text-sm font-medium ${saving? 'bg-gray-400':'bg-blue-600 hover:bg-blue-500'} text-white`}>{saving? 'Saving...':'Save Homepage'}</button>
          <button onClick={()=>window.location.reload()} className="px-4 py-2 rounded text-sm font-medium border">Discard Changes</button>
        </div>
      </div>
    </div>
  );
};

export default HomeCustomizationPage;
