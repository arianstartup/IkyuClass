"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext'; // Will be used later

// Define BundleType based on backend model
// This should be defined in a shared types file or imported from a relevant page component
export interface ProductInBundle {
  productId: string;
  productName: string;
  quantity: number;
  originalPricePerItem: number;
  sku: string;
  productDetails?: any; // Populated in bundle details view
}

export interface BundleType {
  id: string;
  name: string;
  description: string;
  sku?: string;
  images: string[];
  items: ProductInBundle[];
  totalOriginalPrice: number;
  bundlePrice: number;
  discountAmount: number;
  isActive?: boolean;
  tags?: string[];
  // any other fields from your backend model
}


interface BundleCardProps {
  bundle: BundleType;
}

const BundleCard: React.FC<BundleCardProps> = ({ bundle }) => {
  const { addToCart, items: cartItems } = useCart(); // Assuming useCart is set up

  const handleAddToCart = () => {
    // For bundles, we add the bundle itself as a single item
    // The CartContext will need to be updated to handle bundle items
    addToCart({
      id: bundle.id, // Use bundle ID
      name: bundle.name,
      price: bundle.bundlePrice, // Use bundle price
      images: bundle.images,
      stockQuantity: 1, // Placeholder, actual stock check for bundles is complex
                        // Simplest: assume if bundle is listed, it's available.
                        // Or, backend should provide an effective stock for the bundle.
      isBundle: true, // Flag to identify as a bundle
      bundleItems: bundle.items, // Store original items for reference if needed
      // other necessary ProductType fields (can be null/default if not applicable to bundle as a whole)
      description: bundle.description,
      category: bundle.tags || [], // Or a specific category for bundles
      brand: 'پکیج ویژه', // Or derive from items
      sku: bundle.sku || `BUNDLE-${bundle.id}`,
    }, 1); // Add one bundle
    // alert(`${bundle.name} به سبد خرید اضافه شد!`);
  };

  const firstImage = bundle.images && bundle.images.length > 0 ? bundle.images[0] : '/images/placeholder-product.png';

  // Check if bundle (as a whole) is already in cart.
  // This simple check assumes a bundle is added as one item.
  const itemInCart = cartItems.find(item => item.id === bundle.id && item.isBundle);
  const canAddToCart = !itemInCart; // Can only add one instance of the bundle for now. Max quantity for bundles can be handled later.

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden flex flex-col justify-between transform transition-all hover:scale-105 duration-300 ease-in-out">
      <Link href={`/store/bundles/${bundle.id}`} className="block">
        <div className="relative w-full h-48 sm:h-56">
          <Image
            src={firstImage}
            alt={bundle.name}
            layout="fill"
            objectFit="cover"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white h-14 overflow-hidden">
            {bundle.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 h-10 overflow-hidden">
            {bundle.items.length} محصول با ارزش <span className="line-through">{bundle.totalOriginalPrice.toLocaleString('fa-IR')}</span> تومان
          </p>
        </div>
      </Link>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
          فقط با {bundle.bundlePrice.toLocaleString('fa-IR')} تومان!
        </p>
        <p className="text-xs text-red-500 dark:text-red-400 mb-3">
          تخفیف: {bundle.discountAmount.toLocaleString('fa-IR')} تومان
        </p>
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart} // Simple check: disable if bundle already in cart.
                                  // More complex stock check for bundles needed for real scenario.
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canAddToCart ? 'افزودن پک به سبد خرید' : 'این پک در سبد شماست'}
        </button>
      </div>
    </div>
  );
};

export default BundleCard;
