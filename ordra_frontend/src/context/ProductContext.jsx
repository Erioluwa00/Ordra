import React, { createContext, useContext } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const ProductContext = createContext();

export function ProductProvider({ children }) {
  // Live Query
  const products = useQuery(api.products.getProducts) || [];

  // Mutations
  const createProductMutation = useMutation(api.products.createProduct);
  const updateProductMutation = useMutation(api.products.updateProduct);
  const deleteProductMutation = useMutation(api.products.deleteProduct);

  const addProduct = async (product) => {
    return await createProductMutation({
      name: product.name,
      description: product.description || "",
      price: Number(product.price),
      quantity: Number(product.quantity || 0),
      category: product.category || "General",
      sku: product.sku || "",
      inStock: product.inStock ?? true,
    });
  };

  const updateProduct = async (id, updates) => {
    return await updateProductMutation({
      id,
      ...updates
    });
  };

  const deleteProduct = async (id) => {
    return await deleteProductMutation({ id });
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within ProductProvider');
  return context;
}
