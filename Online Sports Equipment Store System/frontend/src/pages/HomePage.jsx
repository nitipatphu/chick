import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MoveRight, Zap } from 'lucide-react';
import { productService } from '../services/productService';
import ProductCard from '../components/common/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAll();
        setProducts(data.slice(0, 4));
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-16">

      <section className="relative min-h-[80vh] flex items-center border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-right opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-sports-dark via-sports-dark/80 to-transparent"></div>
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-sports-red/10 border border-sports-red/30 text-sports-red px-4 py-2 rounded-full text-xs font-bold tracking-wider mb-6">
              <Zap size={14} /> COLLECTION 2026
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-[1.1] mb-4">
              ปลอดภัย ที่จัดจำกัด<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sports-red to-orange-400">ในตัวคุณ</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-lg mb-8 leading-relaxed">
              ก้าวไปอีกขั้นกับอุปกรณ์กีฬาระดับโปรที่ออกแบบมาเพื่อชัยชนะ สัมผัสความเร็ว พลัง และความทนทานแบบไร้ขีดจำกัด
            </p>
            <div className="flex items-center gap-6">
              <Link to="/products" className="btn-primary">
                ช้อปเลย <MoveRight size={20} />
              </Link>
              <div className="glass px-6 py-3 rounded-xl border-l-4 border-sports-red">
                <span className="text-4xl font-black text-sports-red">20%</span>
                <span className="text-gray-400 text-sm ml-2">เบาขึ้น ทรงพลังยิ่งกว่า</span>
              </div>
            </div>
          </div>
        </div>
      </section>

   
      <section className="py-20">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-black uppercase">
              สินค้าแนะนำ<br />
              <span className="text-sports-red">ระดับโปร</span>
            </h2>
            <Link to="/products" className="flex items-center gap-2 text-gray-400 hover:text-sports-red transition border-b-2 border-transparent hover:border-sports-red pb-1">
              ดูทั้งหมด →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>


      <section className="container pb-20">
        <div className="relative bg-sports-navy rounded-2xl p-12 md:p-16 overflow-hidden border border-white/5">
          <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-sports-red/5 pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-1/2 h-full bg-[url('https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=2128&auto=format&fit=crop')] bg-cover bg-center opacity-40" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)' }}></div>
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl md:text-5xl font-black uppercase leading-[1.1] mb-4">
              พร้อมทะยานไป<br />กับเราหรือยัง?
            </h2>
            <p className="text-gray-400 text-lg mb-8">รับส่วนลด 20% ทันทีเมื่อสมัครสมาชิกวันนี้ สำหรับทุกไอเท็มในร้าน</p>
            <Link to="/register" className="btn-outline">สมัครสมาชิกเลย</Link>
          </div>
        </div>
      </section>
    </div>
  );
}