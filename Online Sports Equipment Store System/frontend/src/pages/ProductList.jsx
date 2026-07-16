import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import ProductCard from '../components/common/ProductCard';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      await fetchProducts();
      return;
    }
    try {
      setLoading(true);
      const data = await productService.search(search);
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container">
        <h1 className="text-3xl md:text-4xl font-black mb-8">สินค้าทั้งหมด <span className="text-sports-red">({products.length})</span></h1>

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="oflex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition-all"
          />
          <button onClick={handleSearch} className="btn-primary">ค้นหา</button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">ไม่พบสินค้าที่ตรงกับคำค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}