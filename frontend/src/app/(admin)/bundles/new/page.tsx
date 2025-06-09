"use client";

import React, { Suspense } from 'react';
import BundleForm from '@/components/admin/forms/BundleForm';

const AddNewBundlePage = () => {
  return (
    <div>
      <Suspense fallback={<div className="text-center py-10">در حال بارگذاری فرم پک محصول...</div>}>
        <BundleForm />
      </Suspense>
    </div>
  );
};

export default AddNewBundlePage;
