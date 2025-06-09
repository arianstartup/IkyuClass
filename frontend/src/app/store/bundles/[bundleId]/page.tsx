"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import BundleDetails from '@/components/store/BundleDetails'; // To be created
import Link from 'next/link';
import { BundleType } from '@/components/store/BundleCard'; // Re-use BundleType definition

const BundleDetailPage = () => {
  const params = useParams();
  const bundleId = params?.bundleId as string | undefined;

  const [bundle, setBundle] = useState<BundleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bundleId) {
      const fetchBundleDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/product-bundles/${bundleId}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('پک مورد نظر یافت نشد.');
            }
            throw new Error(`خطا در دریافت اطلاعات پک: ${response.statusText}`);
          }
          const data = await response.json();
          setBundle(data);
        } catch (err: any) {
          setError(err.message);
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchBundleDetails();
    } else {
      setLoading(false);
      setError("شناسه پک نامعتبر است.");
    }
  }, [bundleId]);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری اطلاعات پک تخفیف‌دار...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">خطا: {error}</div>;
  }

  if (!bundle) {
    return <div className="text-center py-10">پکی برای نمایش یافت نشد.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/store/bundles" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
          &larr; بازگشت به لیست پک‌ها
        </Link>
      </div>
      <Suspense fallback={<div className="text-center py-10">در حال آماده سازی جزئیات پک...</div>}>
        <BundleDetails bundle={bundle} />
      </Suspense>
    </div>
  );
};

export default BundleDetailPage;
