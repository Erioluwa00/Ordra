import React, { useState } from 'react';
import { Search, Plus, PackageOpen, Tag, Edit2, Trash2 } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import ProductModal from '../../components/ProductModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import './Products.css';

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Dynamically extract categories from the live products list
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const CATEGORIES = ["All", ...uniqueCategories];

  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === "All" || p.category === activeCategory;
    const nameStr = p.name || "";
    const matchesSearch = nameStr.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amt);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (newProd) => {
    if (newProd._id) {
      const { _id, ...updates } = newProd;
      updateProduct(_id, updates);
    } else {
      addProduct(newProd);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete._id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="prod-container">
      {/* ── Page Header ── */}
      <div className="prod-header">
        <div>
          <h1 className="prod-title">Product Catalog</h1>
          <p className="prod-subtitle">Manage your items, prices, and categories</p>
        </div>
        <div className="prod-actions">
          <button className="prod-btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* ── Top Controls (Search) ── */}
      <div className="prod-toolbar">
        <div className="prod-search-wrapper">
          <Search size={18} className="prod-search-icon" />
          <input
            type="text"
            className="prod-search-input"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Categories ── */}
      <div className="prod-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`prod-cat-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Empty State ── */}
      {filteredProducts.length === 0 && (
        <div className="prod-empty">
          <PackageOpen size={48} className="prod-empty-icon" />
          <h3 className="prod-empty-title">No products found</h3>
          <p className="prod-empty-sub">Try adjusting your category or search term.</p>
        </div>
      )}

      {/* ── Products List ── */}
      {filteredProducts.length > 0 && (
        <div className="prod-list">
          {filteredProducts.map(p => (
            <div key={p._id} className="prod-card">
              <div className="prod-card-main">
                <div className="prod-icon">
                  <PackageOpen size={20} />
                </div>
                <div className="prod-info">
                  <span className="prod-name">{p.name}</span>
                  <div className="prod-meta">
                    <span className="prod-category">
                      <Tag size={12} /> {p.category}
                    </span>
                    <span className="prod-stock-count">
                      {p.quantity < 0 ? `${Math.abs(p.quantity)} Owed` : `${p.quantity || 0} in stock`}
                    </span>
                    {(p.quantity <= 0 || !p.inStock) && <span className="prod-out-of-stock">{p.quantity < 0 ? 'Backordered' : 'Out of stock'}</span>}
                    {p.inStock && p.quantity > 0 && p.quantity < 5 && <span className="prod-low-stock">Low stock</span>}
                  </div>
                </div>
              </div>
              <div className="prod-price-area">
                <div className="prod-price">{formatCurrency(p.price)}</div>
                <div className="prod-actions-row">
                  <button className="prod-action-btn edit" onClick={() => handleOpenEditModal(p)} title="Edit product">
                    <Edit2 size={16} />
                  </button>
                  <button className="prod-action-btn delete" onClick={() => handleDeleteClick(p)} title="Delete product">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Product Modal ── */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        categories={uniqueCategories}
        initialData={editingProduct}
      />

      {/* ── Confirm Delete Modal ── */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={productToDelete?.name}
      />
    </div>
  );
}

