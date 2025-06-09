"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BundleForm from '@/components/admin/forms/BundleForm';
import { adminApiFetch } from '@/utils/adminApi';
import { BundleType } from '@/components/store/BundleCard'; // Re-use type

const EditBundlePage = () => {
  const params = useParams();
  const router = useRouter();
  const bundleId = params?.bundleId as string | undefined;

  const [bundleData, setBundleData] = useState<Partial<BundleType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bundleId) {
      const fetchBundle = async () => {
        setLoading(true);
        setError(null);
        try {
          // Backend GET /api/product-bundles/:bundleId returns bundle with populated items (including productDetails)
          // The BundleForm expects items to have {productId, quantity, productName, originalPricePerItem}
          // We need to ensure the fetched data aligns with this structure for the form's defaultValues.
          const data: BundleType = await adminApiFetch(`/api/product-bundles/${bundleId}`);

          // Transform items if necessary to match BundleForm's expected item structure
          const formItems = data.items?.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            productName: item.productName || item.productDetails?.name,
            originalPricePerItem: item.originalPricePerItem !== undefined ? item.originalPricePerItem : item.productDetails?.price,
          }));

          setBundleData({ ...data, items: formItems });

        } catch (err: any) {
          console.error("Failed to fetch bundle for editing:", err);
          setError(err.message || "خطا در بارگذاری اطلاعات پک.");
        } finally {
          setLoading(false);
        }
      };
      fetchBundle();
    } else {
      setError("شناسه پک نامعتبر است.");
      setLoading(false);
    }
  }, [bundleId]);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری اطلاعات پک برای ویرایش...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
        <p className="font-bold">خطا</p>
        <p>{error}</p>
        <button onClick={() => router.push('/admin/products')} className="mt-2 bg-red-600 text-white py-1 px-3 rounded">
            بازگشت به لیست محصولات و پک‌ها
        </button>
      </div>
    );
  }

  if (!bundleData && !loading) {
     return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
        <p className="font-bold">یافت نشد</p>
        <p>پکی با این شناسه یافت نشد. ممکن است حذف شده باشد.</p>
         <button onClick={() => router.push('/admin/products')} className="mt-2 bg-yellow-600 text-white py-1 px-3 rounded">
            بازگشت به لیست محصولات و پک‌ها
        </button>
      </div>
    );
  }

  return (
    <div>
      <Suspense fallback={<div className="text-center py-10">در حال بارگذاری فرم ویرایش پک...</div>}>
        <BundleForm bundleId={bundleId} initialData={bundleData || {}} />
      </Suspense>
    </div>
  );
};

export default EditBundlePage;
