"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Using Next.js Image component
import { ProductType } from '@/app/store/page'; // Import ProductType
import { useCart } from '@/contexts/CartContext'; // Uncommented and used

interface ProductCardProps {
  product: ProductType;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, items } = useCart();

  const handleAddToCart = () => {
    addToCart(product, 1); // Add one item
    // alert(`${product.name} به سبد خرید اضافه شد!`); // Optional: replace with toast notification
  };

  const itemInCart = items.find(item => item.id === product.id);
  const currentQuantityInCart = itemInCart ? itemInCart.quantityInCart : 0;
  const canAddToCart = product.stockQuantity > currentQuantityInCart;


  const displayPrice = product.price ? `${product.price.toLocaleString('fa-IR')} تومان` : 'نامشخص';
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder-product.png'; // Fallback image

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden flex flex-col justify-between transform transition-all hover:scale-105 duration-300 ease-in-out">
      <Link href={`/store/products/${product.id}`} className="block">
        <div className="relative w-full h-48 sm:h-56">
          <Image
            src={firstImage}
            alt={product.name}
            layout="fill"
            objectFit="cover" // or "contain" based on preference
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }} // Fallback for broken images
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white h-14 overflow-hidden">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 h-10 overflow-hidden">
            {product.brand} - {Array.isArray(product.category) ? product.category.join(', ') : product.category}
          </p>
        </div>
      </Link>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">
          {displayPrice}
        </p>
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart || product.stockQuantity === 0}
          className="w-full bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.stockQuantity === 0 ? 'ناموجود' : (canAddToCart ? 'افزودن به سبد خرید' : 'حداکثر موجودی در سبد')}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
