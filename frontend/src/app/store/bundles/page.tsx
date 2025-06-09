"use client";

import React, { useEffect, useState, Suspense } from 'react';
import BundleCard, { BundleType } from '@/components/store/BundleCard'; // Import BundleType
import Link from 'next/link';

const BundlesListPage = () => {
  const [bundles, setBundles] = useState<BundleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBundles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/product-bundles');
        if (!response.ok) {
          throw new Error(`خطا در دریافت لیست پک‌ها: ${response.statusText}`);
        }
        const data = await response.json();
        setBundles(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBundles();
  }, []);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری پک‌های تخفیف‌دار...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">خطا: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          پک‌های ویژه و تخفیف‌دار
        </h1>
        <div className="space-x-3 space-x-reverse">
            <Link href="/store" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                مشاهده همه محصولات
            </Link>
            <Link href="/store/cart" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out">
                سبد خرید
            </Link>
        </div>
      </div>

      {bundles.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-300">در حال حاضر هیچ پکی برای نمایش وجود ندارد.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map(bundle => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BundlesListPage;
