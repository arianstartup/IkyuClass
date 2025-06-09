"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApiFetch } from '@/utils/adminApi';
import { ProductType } from '@/app/store/page'; // Assuming ProductType is defined here and matches backend
import { BundleType } from '@/components/store/BundleCard'; // Assuming BundleType is defined here

const AdminProductsListPage = () => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [bundles, setBundles] = useState<BundleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const productsData = await adminApiFetch('/api/products');
      const bundlesData = await adminApiFetch('/api/product-bundles');
      setProducts(productsData || []);
      setBundles(bundlesData || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm(`آیا از حذف محصول با شناسه ${productId} اطمینان دارید؟ این عمل غیرقابل بازگشت است.`)) {
      try {
        await adminApiFetch(`/api/products/${productId}`, { method: 'DELETE' });
        // alert('محصول با موفقیت حذف شد.');
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      } catch (err: any) {
        setError(`خطا در حذف محصول: ${err.message}`);
        alert(`خطا در حذف محصول: ${err.message}`);
      }
    }
  };

  const handleDeleteBundle = async (bundleId: string) => {
    if (window.confirm(`آیا از حذف پک با شناسه ${bundleId} اطمینان دارید؟ این عمل غیرقابل بازگشت است.`)) {
      try {
        await adminApiFetch(`/api/product-bundles/${bundleId}`, { method: 'DELETE' });
        // alert('پک با موفقیت حذف شد.');
        setBundles(prevBundles => prevBundles.filter(b => b.id !== bundleId));
      } catch (err: any) {
        setError(`خطا در حذف پک: ${err.message}`);
        alert(`خطا در حذف پک: ${err.message}`);
      }
    }
  };


  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری لیست محصولات و پک‌ها...</div>;
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
        <p className="font-bold">خطا</p>
        <p>{error}</p>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">مدیریت محصولات و پک‌ها</h1>
        <div className="space-x-3 space-x-reverse">
          <Link href="/admin/products/new" className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors">
            افزودن محصول جدید
          </Link>
          <Link href="/admin/bundles/new" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors">
            افزودن پک جدید
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">محصولات تکی</h2>
        {products.length === 0 && !loading && <p className="text-gray-500 dark:text-gray-400">محصولی یافت نشد.</p>}
        {products.length > 0 && (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">نام محصول</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">قیمت (تومان)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">موجودی</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">وضعیت</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">عملیات</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map(product => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.price.toLocaleString('fa-IR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.stockQuantity.toLocaleString('fa-IR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {product.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3 space-x-reverse">
                      <Link href={`/admin/products/edit/${product.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">ویرایش</Link>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bundles Table */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">پک‌های تخفیف‌دار</h2>
        {bundles.length === 0 && !loading && <p className="text-gray-500 dark:text-gray-400">پکی یافت نشد.</p>}
        {bundles.length > 0 && (
           <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">نام پک</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">قیمت پک (تومان)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تعداد آیتم‌ها</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">وضعیت</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">عملیات</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {bundles.map(bundle => (
                  <tr key={bundle.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{bundle.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{bundle.sku || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{bundle.bundlePrice.toLocaleString('fa-IR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{bundle.items.length.toLocaleString('fa-IR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bundle.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {bundle.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3 space-x-reverse">
                      <Link href={`/admin/bundles/edit/${bundle.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">ویرایش</Link>
                      <button onClick={() => handleDeleteBundle(bundle.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminProductsListPage;
