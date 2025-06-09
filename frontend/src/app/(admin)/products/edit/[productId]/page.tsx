"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/forms/ProductForm';
import { adminApiFetch } from '@/utils/adminApi';
import { ProductType } from '@/app/store/page'; // Ensure this type is comprehensive

const EditProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params?.productId as string | undefined;

  const [productData, setProductData] = useState<Partial<ProductType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await adminApiFetch(`/api/products/${productId}`);
          // The backend GET /api/products/:productId returns the product directly, not nested under 'product'
          setProductData(data);
        } catch (err: any) {
          console.error("Failed to fetch product for editing:", err);
          setError(err.message || "خطا در بارگذاری اطلاعات محصول.");
          // Optionally redirect if product not found, or let ProductForm handle null initialData gracefully
          // if (err.status === 404) router.push('/admin/products');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    } else {
      // Should not happen if route is matched correctly, but good practice
      setError("شناسه محصول نامعتبر است.");
      setLoading(false);
      // router.push('/admin/products');
    }
  }, [productId, router]);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری اطلاعات محصول برای ویرایش...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
        <p className="font-bold">خطا</p>
        <p>{error}</p>
        <button onClick={() => router.push('/admin/products')} className="mt-2 bg-red-600 text-white py-1 px-3 rounded">
            بازگشت به لیست محصولات
        </button>
      </div>
    );
  }

  if (!productData && !loading) { // Product not found after trying to load
     return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
        <p className="font-bold">یافت نشد</p>
        <p>محصولی با این شناسه یافت نشد. ممکن است حذف شده باشد.</p>
         <button onClick={() => router.push('/admin/products')} className="mt-2 bg-yellow-600 text-white py-1 px-3 rounded">
            بازگشت به لیست محصولات
        </button>
      </div>
    );
  }


  return (
    <div>
      <Suspense fallback={<div className="text-center py-10">در حال بارگذاری فرم ویرایش محصول...</div>}>
        {/* Pass productId and initialData. ProductForm will only use initialData if provided. */}
        <ProductForm productId={productId} initialData={productData || {}} />
      </Suspense>
    </div>
  );
};

export default EditProductPage;
