"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import ProductDetails from '@/components/store/ProductDetails';
import Link from 'next/link';
import { ProductType } from '@/app/store/page'; // Re-use ProductType

const ProductDetailPage = () => {
  const params = useParams();
  const productId = params?.productId as string | undefined;

  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      const fetchProductDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/products/${productId}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('محصول مورد نظر یافت نشد.');
            }
            throw new Error(`خطا در دریافت اطلاعات محصول: ${response.statusText}`);
          }
          const data = await response.json();
          setProduct(data);
        } catch (err: any) {
          setError(err.message);
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchProductDetails();
    } else {
      setLoading(false);
      setError("شناسه محصول نامعتبر است.");
    }
  }, [productId]);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری اطلاعات محصول...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">خطا: {error}</div>;
  }

  if (!product) {
    return <div className="text-center py-10">محصولی برای نمایش یافت نشد.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/store" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
          &larr; بازگشت به لیست محصولات
        </Link>
      </div>
      <ProductDetails product={product} />
    </div>
  );
};

// It's good practice to wrap dynamic pages that use hooks like useParams in Suspense
// if they are server-rendered initially or have parts that might suspend.
// However, for a simple client-rendered data fetching like this, direct export is usually fine.
// For Next.js App Router, if this page itself needs to be a Server Component fetching data,
// the structure would be different (async component, not using useEffect/useState for initial fetch).
// But since it's "use client", this approach is standard for client-side fetching.

export default ProductDetailPage;
