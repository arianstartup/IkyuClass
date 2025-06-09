"use client";

import React, { Suspense } from 'react';
import ProductForm from '@/components/admin/forms/ProductForm';

const AddNewProductPage = () => {
  return (
    <div>
      {/* Suspense can be useful if ProductForm itself fetches data or uses Suspense-triggering hooks, though less common for a "new" form. */}
      <Suspense fallback={<div className="text-center py-10">در حال بارگذاری فرم محصول...</div>}>
        <ProductForm />
      </Suspense>
    </div>
  );
};

export default AddNewProductPage;
