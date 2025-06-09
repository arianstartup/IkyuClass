"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BundleType, ProductInBundle } from '@/components/store/BundleCard'; // Re-use BundleType
import { useCart } from '@/contexts/CartContext';

interface BundleDetailsProps {
  bundle: BundleType;
}

const BundleDetails: React.FC<BundleDetailsProps> = ({ bundle }) => {
  const [selectedImage, setSelectedImage] = useState(bundle.images && bundle.images.length > 0 ? bundle.images[0] : '/images/placeholder-product.png');
  const { addToCart, items: cartItems } = useCart();

  const handleAddToCart = () => {
     addToCart({
      id: bundle.id,
      name: bundle.name,
      price: bundle.bundlePrice,
      images: bundle.images,
      stockQuantity: 1, // Simplified stock for bundle itself
      isBundle: true,
      bundleItems: bundle.items,
      description: bundle.description,
      category: bundle.tags || [],
      brand: 'پکیج ویژه',
      sku: bundle.sku || `BUNDLE-${bundle.id}`,
    }, 1); // Add one bundle unit
    // alert(`${bundle.name} به سبد خرید اضافه شد!`);
  };

  const itemInCart = cartItems.find(item => item.id === bundle.id && item.isBundle);
  const canAddToCart = !itemInCart; // Simple check: allow adding only if not already in cart.

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Gallery for Bundle */}
        <div className="space-y-4">
          <div className="relative w-full h-80 md:h-96 rounded-lg overflow-hidden border dark:border-gray-700">
            <Image
              src={selectedImage}
              alt={`نمایش پک ${bundle.name}`}
              layout="fill"
              objectFit="contain"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
            />
          </div>
          {bundle.images && bundle.images.length > 1 && (
            <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2">
              {bundle.images.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`relative w-20 h-20 rounded-md overflow-hidden border-2 transition-colors
                              ${selectedImage === imgUrl ? 'border-indigo-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <Image
                    src={imgUrl}
                    alt={`تصویر کوچک ${index + 1} از ${bundle.name}`}
                    layout="fill"
                    objectFit="cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bundle Info & Actions */}
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {bundle.name}
          </h1>
          {bundle.sku && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">SKU: {bundle.sku}</p>}

          <div className="mb-4">
            <span className="text-lg line-through text-gray-500 dark:text-gray-400 mr-2">
              {bundle.totalOriginalPrice.toLocaleString('fa-IR')} تومان
            </span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {bundle.bundlePrice.toLocaleString('fa-IR')} تومان
            </span>
            <span className="ml-2 bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100 text-xs font-semibold px-2.5 py-0.5 rounded">
              تخفیف: {bundle.discountAmount.toLocaleString('fa-IR')} تومان
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">توضیحات پک:</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {bundle.description}
            </p>
          </div>

          {bundle.tags && bundle.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-1">برچسب‌ها:</h3>
              <div className="flex flex-wrap gap-2">
                {bundle.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto">
             {/* Simplified stock check: if bundle is shown, assume it's addable once.
                 A real stock check would involve checking stock of all individual items. */}
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canAddToCart ? 'افزودن پک به سبد خرید' : 'این پک در سبد شماست'}
            </button>
          </div>
        </div>
      </div>

      {/* Items in Bundle */}
      <div className="mt-10 pt-6 border-t dark:border-gray-700">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">محصولات داخل این پک:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundle.items.map((item) => (
            <Link key={item.productId} href={`/store/products/${item.productId}`} className="block border dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-3 space-x-reverse">
                {item.productDetails?.images && item.productDetails.images.length > 0 && (
                     <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                        <Image src={item.productDetails.images[0]} alt={item.productName} layout="fill" objectFit="cover" onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}/>
                    </div>
                )}
                <div>
                    <h4 className="font-semibold text-md text-indigo-700 dark:text-indigo-400">{item.productName} (x{item.quantity.toLocaleString('fa-IR')})</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">قیمت اصلی واحد: {item.originalPricePerItem.toLocaleString('fa-IR')} تومان</p>
                </div>
              </div>
               {/* Display more product details if available and needed */}
               {item.productDetails && (
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">{item.productDetails.description}</p>
               )}
               {!item.productDetails && item.errorMessage && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2">{item.errorMessage}</p>
               )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BundleDetails;
