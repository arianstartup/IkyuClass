"use client";

import React, { useEffect, useState, Suspense } from 'react'; // Added Suspense
import ProductCard from '@/components/store/ProductCard';
import Link from 'next/link';

// Define ProductType based on backend model
export interface ProductType {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string[];
  brand: string;
  images: string[];
  stockQuantity: number;
  sku: string;
  tags?: string[];
  ratings?: { average: number; count: number };
  isFeatured?: boolean;
  isActive?: boolean;
  // any other fields from your backend model
}

const StoreHomePage = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error(`خطا در دریافت لیست محصولات: ${response.statusText}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری محصولات فروشگاه...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">خطا: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          محصولات فروشگاه
        </h1>
        <Link href="/store/cart" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out">
          مشاهده سبد خرید
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-300">در حال حاضر محصولی برای نمایش وجود ندارد.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            // Wrap ProductCard with Suspense if it uses useSearchParams or other hooks that trigger suspense
            // For now, assuming ProductCard itself doesn't trigger suspense directly.
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

// Wrap the default export with Suspense if any child component needs it for hooks like useSearchParams
// This is more relevant if the page itself or direct children use such hooks.
// For now, direct export is fine.
export default StoreHomePage;
