'use client';
import React, { useState, useEffect } from "react";
import api from '@/lib/api';

type ProductDetails = {
    image?: string;
    price?: number;
    sku?: string;
    stock?: number;
    description?: string;
};

type Category = {
    id: string;
    name: string;
    children: Category[];
    image?: string;            // keep (legacy – now image also inside productDetails)
    productDetails?: ProductDetails;
};

// Re-usable light modal shell
const Modal: React.FC<{ onClose: () => void; children: React.ReactNode; title?: string }> = ({ onClose, children, title }) => (
    <div
        style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
        }}
        onClick={onClose}
    >
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                background: "#fff",
                padding: "20px 24px",
                borderRadius: 10,
                width: "min(520px, 92vw)",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 8px 32px -4px rgba(0,0,0,0.35)",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{title || "Modal"}</h2>
                <button
                    onClick={onClose}
                    style={{
                        background: "transparent",
                        border: "none",
                        fontSize: 20,
                        cursor: "pointer",
                        lineHeight: 1,
                        padding: 4
                    }}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
            {children}
        </div>
    </div>
);

// Image preview modal (unchanged)
const ImageModal: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => (
    <div
        style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            cursor: "zoom-out",
        }}
        onClick={onClose}
    >
        <img
            src={src}
            alt="category"
            style={{
                maxWidth: "80vw",
                maxHeight: "80vh",
                borderRadius: 8,
                boxShadow: "0 2px 16px #0008",
                cursor: "default",
            }}
            onClick={(e) => e.stopPropagation()}
        />
        <button
            onClick={onClose}
            style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "#fff",
                border: "none",
                padding: "6px 10px",
                borderRadius: 4,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 18,
                lineHeight: 1,
            }}
            aria-label="Close image"
        >
            ×
        </button>
    </div>
);

// Product details modal
const ProductDetailsModal: React.FC<{
    initial?: ProductDetails;
    categoryName: string;
    onSave: (details: ProductDetails) => void;
    onClose: () => void;
}> = ({ initial, categoryName, onSave, onClose }) => {
    const [sku, setSku] = useState(initial?.sku || "");
    const [price, setPrice] = useState<string>(initial?.price != null ? String(initial.price) : "");
    const [stock, setStock] = useState<string>(initial?.stock != null ? String(initial.stock) : "");
    const [description, setDescription] = useState(initial?.description || "");
    const [image, setImage] = useState<string | undefined>(initial?.image);
    const [fileError, setFileError] = useState("");

    const handleFile = (f: File | null) => {
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            setFileError("File must be an image");
            return;
        }
        setFileError("");
        const reader = new FileReader();
        reader.onload = e => {
            if (e.target?.result) setImage(e.target.result as string);
        };
        reader.readAsDataURL(f);
    };

    const save = () => {
        onSave({
            sku: sku.trim() || undefined,
            price: price ? Number(price) : undefined,
            stock: stock ? Number(stock) : undefined,
            description: description.trim() || undefined,
            image
        });
        onClose();
    };

    return (
        <Modal onClose={onClose} title={`Details: ${categoryName}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span>SKU</span>
                    <input value={sku} onChange={e => setSku(e.target.value)} />
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                    <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <span>Price (USD)</span>
                        <input
                            value={price}
                            onChange={e => {
                                const v = e.target.value;
                                if (/^\d*(\.\d{0,2})?$/.test(v)) setPrice(v);
                            }}
                            placeholder="0.00"
                        />
                    </label>
                    <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        <span>Stock</span>
                        <input
                            value={stock}
                            onChange={e => {
                                const v = e.target.value;
                                if (/^\d*$/.test(v)) setStock(v);
                            }}
                            placeholder="0"
                        />
                    </label>
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span>Description</span>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        style={{ resize: "vertical" }}
                    />
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span>Image</span>
                    {image && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img
                                src={image}
                                alt="preview"
                                style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }}
                            />
                            <button
                                type="button"
                                onClick={() => setImage(undefined)}
                                style={{ padding: "4px 8px", cursor: "pointer" }}
                            >
                                Remove
                            </button>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFile(e.target.files?.[0] || null)}
                    />
                    {fileError && <small style={{ color: "crimson" }}>{fileError}</small>}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                    <button onClick={onClose} style={{ background: "#eee", padding: "8px 14px", borderRadius: 6, border: "1px solid #ccc" }}>
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        style={{
                            background: "#2563eb",
                            color: "#fff",
                            padding: "8px 16px",
                            borderRadius: 6,
                            border: "1px solid #1d4ed8",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const CategoryNode: React.FC<{
    category: Category;
    onAddSubcategory: (parentId: string, name: string) => void;
    onSaveDetails: (categoryId: string, details: ProductDetails) => void;
    onShowImage: (src: string) => void;
    onOpenDetailsModal: (category: Category) => void;
    onDeleteCategory: (id: string) => void; // added
}> = ({ category, onAddSubcategory, onSaveDetails, onShowImage, onOpenDetailsModal, onDeleteCategory }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");

    const handleAddSubcategory = () => {
        if (newName.trim()) {
            onAddSubcategory(category.id, newName.trim());
            setNewName("");
            setShowAdd(false);
        }
    };

    const isLeaf = category.children.length === 0;

    return (
        <div style={{ marginLeft: 24, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <strong>{category.name}</strong>
                <button onClick={() => setShowAdd(v => !v)} style={{ padding: "2px 8px" }}>
                    {showAdd ? "–" : "＋"}
                </button>
                {/* Delete button */}
                <button
                  onClick={() => {
                    if (confirm(`Delete category "${category.name}" and all its subcategories?`)) {
                      onDeleteCategory(category.id);
                    }
                  }}
                  style={{ padding: '2px 8px', background: '#dc2626', color: '#fff', border: '1px solid #b91c1c', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}
                >
                  Delete
                </button>

                {category.productDetails?.image && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <img
                            src={category.productDetails.image}
                            alt="category"
                            style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 6, cursor: "pointer" }}
                            onClick={() => onShowImage(category.productDetails!.image!)}
                        />
                    </div>
                )}

                {isLeaf && (
                    <button
                        onClick={() => onOpenDetailsModal(category)}
                        style={{
                            padding: "4px 10px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "1px solid #1d4ed8",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12
                        }}
                    >
                        {category.productDetails ? "Edit Details" : "Add Details"}
                    </button>
                )}
            </div>

            {showAdd && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <input
                        type="text"
                        placeholder="Subcategory name"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        style={{ padding: "4px 8px" }}
                    />
                    <button onClick={handleAddSubcategory} style={{ padding: "4px 10px" }}>
                        Add
                    </button>
                    {isLeaf && (
                        <button
                            onClick={() => onOpenDetailsModal(category)}
                            style={{ padding: "4px 10px" }}
                        >
                            Add Details Instead
                        </button>
                    )}
                </div>
            )}

            {category.children.map(child => (
                <CategoryNode
                    key={child.id}
                    category={child}
                    onAddSubcategory={onAddSubcategory}
                    onSaveDetails={onSaveDetails}
                    onShowImage={onShowImage}
                    onOpenDetailsModal={onOpenDetailsModal}
                    onDeleteCategory={onDeleteCategory}
                />
            ))}

            {category.productDetails && (
                <div style={{ marginTop: 6, marginLeft: 4, fontSize: 12, background: "#f8fafc", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", maxWidth: 420 }}>
                    <strong style={{ fontSize: 12 }}>Details:</strong>{" "}
                    {category.productDetails.sku && <span>SKU: {category.productDetails.sku} · </span>}
                    {category.productDetails.price != null && <span>Price: ${category.productDetails.price.toFixed(2)} · </span>}
                    {category.productDetails.stock != null && <span>Stock: {category.productDetails.stock} · </span>}
                    {category.productDetails.description && <span title={category.productDetails.description}>Desc: {category.productDetails.description.slice(0, 40)}{category.productDetails.description.length > 40 ? "…" : ""}</span>}
                </div>
            )}
        </div>
    );
};

const ProductsPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [modalSrc, setModalSrc] = useState<string | null>(null);
    const [detailsModalCategory, setDetailsModalCategory] = useState<Category | null>(null);
    const [newRootName, setNewRootName] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Transform backend tree nodes into local Category shape with productDetails
    const normalize = (node: any): Category => {
        const children = Array.isArray(node.children) ? node.children.map(normalize) : [];
        const productDetails: ProductDetails | undefined = (node.sku || node.price != null || node.stock != null || node.description || node.image) ? {
            sku: node.sku,
            price: node.price,
            stock: node.stock,
            description: node.description,
            image: node.image,
        } : undefined;
        return {
            id: node._id || node.id,
            name: node.name,
            children,
            image: node.image,
            productDetails,
        };
    };

    const loadTree = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/categories/tree');
            const roots = Array.isArray(res.data) ? res.data.map(normalize) : [];
            setCategories(roots);
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTree(); }, []);

    const addRootCategory = async (name: string) => {
        if (!name.trim()) return;
        try {
            setSaving(true);
            const res = await api.post('/categories', { name: name.trim() });
            await loadTree();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to create root category');
        } finally { setSaving(false); }
    };

    const addSubcategory = async (parentId: string, name: string) => {
        if (!name.trim()) return;
        try {
            setSaving(true);
            await api.post('/categories', { name: name.trim(), parentId });
            await loadTree();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to create subcategory');
        } finally { setSaving(false); }
    };

    const saveDetails = async (categoryId: string, details: ProductDetails) => {
        try {
            setSaving(true);
            await api.patch(`/categories/${categoryId}/details`, {
                sku: details.sku,
                price: details.price,
                stock: details.stock,
                description: details.description,
                image: details.image,
            });
            await loadTree();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to save details');
        } finally { setSaving(false); }
    };

    const deleteCategory = async (id: string) => {
        try {
            setSaving(true);
            setError(null);
            await api.delete(`/categories/${id}`);
            await loadTree();
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to delete category');
        } finally { setSaving(false); }
    };

    return (
        <div style={{ padding: 32, maxWidth: 780, margin: "0 auto" }}>
            <h1 style={{ marginTop: 0 }}>Build Your Product Categories</h1>
            <p style={{ marginTop: 0, color: "#555" }}>
                Add nested categories. For leaf categories add product details (image, SKU, price, stock). Data persists via backend.
            </p>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Root category name (e.g. Electronics)"
                    value={newRootName}
                    onChange={e => setNewRootName(e.target.value)}
                    style={{ padding: "6px 10px" }}
                />
                <button
                    onClick={() => { if (newRootName.trim()) { addRootCategory(newRootName); setNewRootName(''); } }}
                    style={{
                        padding: "6px 14px",
                        background: saving ? '#94a3b8' : "#2563eb",
                        color: "#fff",
                        border: "1px solid #1d4ed8",
                        borderRadius: 6,
                        cursor: saving ? 'not-allowed' : "pointer"
                    }}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Add Root Category'}
                </button>
                <button onClick={loadTree} style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: 6, background: '#f1f5f9' }}>Refresh</button>
            </div>
            {loading && <div style={{ padding: '8px 0', color: '#555' }}>Loading tree...</div>}
            {error && <div style={{ padding: '8px 0', color: 'crimson' }}>{error}</div>}
            {/* Tree */}
            <div>
                {!loading && categories.length === 0 && !error && (
                    <div style={{ color: "#666", fontSize: 14, padding: "12px 0" }}>
                        No categories yet. Add your first root category.
                    </div>
                )}
                {categories.map(cat => (
                    <CategoryNode
                        key={cat.id}
                        category={cat}
                        onAddSubcategory={addSubcategory}
                        onSaveDetails={(id, d) => saveDetails(id, d)}
                        onShowImage={src => setModalSrc(src)}
                        onOpenDetailsModal={c => setDetailsModalCategory(c)}
                        onDeleteCategory={deleteCategory} // new prop
                    />
                ))}
            </div>
            {modalSrc && <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />}
            {detailsModalCategory && (
                <ProductDetailsModal
                    categoryName={detailsModalCategory.name}
                    initial={detailsModalCategory.productDetails}
                    onSave={details => saveDetails(detailsModalCategory.id, details)}
                    onClose={() => setDetailsModalCategory(null)}
                />
            )}
        </div>
    );
};

export default ProductsPage;