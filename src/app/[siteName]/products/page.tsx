'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price?: number;
  sku?: string;
  image?: string;
  stock?: number;
  description?: string;
  path?: string[];
  updatedAt?: string;
}
interface TreeCategory { id: string; name: string; children: TreeCategory[]; }

export default function PublicProductsPage() {
  const params = useParams<{ siteName: string }>();
  const siteName = params?.siteName as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state (mirrors private page)
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState<'name' | 'priceAsc' | 'priceDesc' | 'recent'>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  useEffect(() => {
    if (!siteName) return;
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000';
    setLoading(true);
    fetch(`${base}/public/${siteName}/products`)
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
      .then(d => setProducts(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [siteName]);

  // Build category tree from product paths
  const categoriesTree: TreeCategory[] = useMemo(() => {
    const root: Record<string, any> = {};
    products.forEach(p => {
      if (!Array.isArray(p.path)) return;
      let level = root;
      p.path.forEach((segment, idx) => {
        if (!level[segment]) level[segment] = { __children: {}, __id: segment + '_' + idx };
        level = level[segment].__children;
      });
    });
    const build = (node: Record<string, any>): TreeCategory[] => Object.keys(node).map(k => ({ id: node[k].__id, name: k, children: build(node[k].__children) }));
    return build(root);
  }, [products]);

  const currentLevelCategories: TreeCategory[] = useMemo(() => {
    if (selectedPath.length === 0) return categoriesTree;
    let nodes = categoriesTree;
    for (const name of selectedPath) {
      const found = nodes.find(n => n.name === name);
      if (!found) return [];
      nodes = found.children;
    }
    return nodes;
  }, [selectedPath, categoriesTree]);

  const atLeafLevel = useMemo(() => currentLevelCategories.length === 0 && selectedPath.length > 0, [currentLevelCategories, selectedPath]);

  const productsFilteredByPath = useMemo(() => {
    if (selectedPath.length === 0) return products;
    return products.filter(p => Array.isArray(p.path) && selectedPath.every((name, idx) => p.path![idx] === name));
  }, [products, selectedPath]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (Array.isArray(p.path) && p.path.length) set.add(p.path[0]); });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let data = productsFilteredByPath.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(p => p.name?.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (Array.isArray(p.path) ? p.path.join(' > ').toLowerCase().includes(q) : false));
    }
data = categoryFilter ? data.filter(p => Array.isArray(p.path) && p.path[0] === categoryFilter) : data;
    switch (sort) {
      case 'name': data.sort((a,b)=>(a.name||'').localeCompare(b.name||'')); break;
      case 'priceAsc': data.sort((a,b)=>(a.price||0)-(b.price||0)); break;
      case 'priceDesc': data.sort((a,b)=>(b.price||0)-(a.price||0)); break;
      case 'recent': data.sort((a,b)=> new Date(b.updatedAt||0).getTime() - new Date(a.updatedAt||0).getTime()); break;
    }
    return data;
  }, [query, categoryFilter, sort, productsFilteredByPath]);

  const resetPath = () => setSelectedPath([]);
  const goBackOne = () => setSelectedPath(p => p.slice(0, -1));

  if (!siteName) return <div className="min-h-screen flex items-center justify-center text-white">Missing site name</div>;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex items-end flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Search</label>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name / SKU / category" className="px-3 py-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring focus:ring-blue-500/30 min-w-[260px]" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Category</label>
            <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="px-3 py-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring focus:ring-blue-500/30">
              <option value="">All</option>
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Sort</label>
            <select value={sort} onChange={e=>setSort(e.target.value as any)} className="px-3 py-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring focus:ring-blue-500/30">
              <option value="recent">Recently Updated</option>
              <option value="name">Name (A-Z)</option>
              <option value="priceAsc">Price (Low → High)</option>
              <option value="priceDesc">Price (High → Low)</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">View</label>
            <div className="flex gap-2">
              <button onClick={()=>setView('grid')} className={`px-3 py-2 rounded border text-sm ${view==='grid'? 'bg-blue-600 text-white border-blue-600':'bg-white border-gray-300'}`}>Grid</button>
              <button onClick={()=>setView('list')} className={`px-3 py-2 rounded border text-sm ${view==='list'? 'bg-blue-600 text-white border-blue-600':'bg-white border-gray-300'}`}>List</button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Products for {siteName}</h1>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium">Browse:</span>
        {selectedPath.length === 0 && <span className="text-sm text-gray-600">Root</span>}
        {selectedPath.map((name, idx) => (
          <button key={name+idx} onClick={() => setSelectedPath(selectedPath.slice(0, idx+1))} className="text-sm px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700">{name}</button>
        ))}
        {selectedPath.length > 0 && <button onClick={goBackOne} className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50">Back</button>}
        {selectedPath.length > 0 && <button onClick={resetPath} className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50">Reset</button>}
      </div>

      {!loading && !error && !atLeafLevel && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-2">{selectedPath.length === 0 ? 'Top Categories' : 'Subcategories'}</h2>
          {currentLevelCategories.length === 0 && selectedPath.length > 0 && (
            <div className="text-xs text-gray-500 mb-4">No further subcategories. Showing products below.</div>
          )}
          {currentLevelCategories.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {currentLevelCategories.map(cat => (
                <li key={cat.id}>
                  <button onClick={() => setSelectedPath(p => [...p, cat.name])} className="w-full text-left p-4 rounded border bg-white hover:shadow-sm transition">
                    <div className="font-medium text-sm mb-1">{cat.name}</div>
                    <div className="text-[11px] text-gray-500">{cat.children.length} subcategories</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading && <div className="text-center py-16">Loading products...</div>}
      {error && !loading && <div className="text-center py-16 text-red-600">{error}</div>}

      {!loading && !error && filtered.length === 0 && atLeafLevel && (
        <div className="text-center py-20 border border-dashed rounded-lg bg-gray-50">
          <p className="text-lg font-medium mb-2">No products for this selection</p>
          <p className="text-sm text-gray-600 mb-4">Try another category level.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && view === 'grid' && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(p => (
            <li key={p.id} className="group rounded-lg border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <span className="text-gray-400 text-sm">No Image</span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium text-sm line-clamp-2 leading-snug">{p.name}</h2>
                  <span className="text-xs rounded px-2 py-0.5 bg-gray-100 text-gray-600">{p.path?.[0] || '—'}</span>
                </div>
                <div className="text-sm font-semibold">{p.price != null ? Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(p.price) : '—'}</div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{p.stock != null ? `${p.stock} in stock` : 'No stock'}</span>
                  <span>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && filtered.length > 0 && view === 'list' && (
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Product</th>
                <th className="text-left px-4 py-2 font-medium">Category</th>
                <th className="text-right px-4 py-2 font-medium">Price</th>
                <th className="text-right px-4 py-2 font-medium">Stock</th>
                <th className="text-right px-4 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t last:border-b">
                  <td className="px-4 py-2 max-w-[260px]">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-[10px]">NO IMG</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium leading-tight line-clamp-2">{p.name}</span>
                        <span className="text-[11px] text-gray-500">SKU: {p.sku || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">{Array.isArray(p.path) ? p.path.join(' › ') : '—'}</td>
                  <td className="px-4 py-2 text-right font-medium">{p.price != null ? Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(p.price) : '—'}</td>
                  <td className={`px-4 py-2 text-right ${p.stock != null && p.stock < 10 ? 'text-red-600 font-semibold' : ''}`}>{p.stock != null ? p.stock : '—'}</td>
                  <td className="px-4 py-2 text-right text-xs text-gray-500">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
