"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ProductType } from '@/app/store/page'; // Re-use ProductType
import { useCart } from '@/contexts/CartContext'; // Uncommented and used

interface ProductDetailsProps {
  product: ProductType;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder-product.png');
  const { addToCart, items } = useCart();

  const itemInCart = items.find(item => item.id === product.id);
  const currentQuantityInCart = itemInCart ? itemInCart.quantityInCart : 0;
  // Max quantity user can add is stock minus what's already in cart for this item
  const maxQuantityToAdd = product.stockQuantity - currentQuantityInCart;


  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 1; // Handle NaN case
    if (value > 0 && value <= maxQuantityToAdd) {
      setQuantity(value);
    } else if (value <= 0) {
      setQuantity(1);
    } else if (value > maxQuantityToAdd) {
      setQuantity(maxQuantityToAdd > 0 ? maxQuantityToAdd : 1); // Prevent adding more than available stock
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, maxQuantityToAdd > 0 ? maxQuantityToAdd : 1));
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1));
  };

  const handleAddToCart = () => {
    if (quantity <= 0) return; // Should not happen if validation is correct
    addToCart(product, quantity);
    // alert(`${quantity} عدد از محصول ${product.name} به سبد خرید اضافه شد!`);
    setQuantity(1); // Reset quantity input after adding to cart
  };

  const canAddToCart = product.stockQuantity > currentQuantityInCart;
  const effectiveStockForDisplay = product.stockQuantity - currentQuantityInCart;


  const displayPrice = product.price ? `${product.price.toLocaleString('fa-IR')} تومان` : 'نامشخص';

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative w-full h-80 md:h-96 rounded-lg overflow-hidden border dark:border-gray-700">
            <Image
              src={selectedImage}
              alt={`نمایش محصول ${product.name}`}
              layout="fill"
              objectFit="contain" // Use "contain" to see the whole image
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2">
              {product.images.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`relative w-20 h-20 rounded-md overflow-hidden border-2 transition-colors
                              ${selectedImage === imgUrl ? 'border-indigo-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <Image
                    src={imgUrl}
                    alt={`تصویر کوچک ${index + 1} از ${product.name}`}
                    layout="fill"
                    objectFit="cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Actions */}
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {product.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              برند: {product.brand} | دسته بندی: {Array.isArray(product.category) ? product.category.join('، ') : product.category} | SKU: {product.sku}
            </p>
            <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
              {displayPrice}
            </p>

            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">توضیحات محصول:</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {product.description}
                </p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-1">برچسب‌ها:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <p className={`text-sm mb-2 ${canAddToCart && product.stockQuantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {product.stockQuantity === 0 ? 'ناموجود' : (canAddToCart ? `موجودی قابل افزودن: ${effectiveStockForDisplay.toLocaleString('fa-IR')} عدد` : 'حداکثر موجودی این کالا در سبد شماست')}
            </p>

            {canAddToCart && product.stockQuantity > 0 && (
              <div className="flex items-center space-x-4 space-x-reverse mb-6">
                <label htmlFor="quantity" className="font-medium text-gray-700 dark:text-gray-200">تعداد:</label>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                  <button onClick={decrementQuantity} className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md transition-colors">-</button>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min="1"
                    max={maxQuantityToAdd > 0 ? maxQuantityToAdd : 1} // Ensure max is at least 1 if item can be added
                    className="w-16 text-center border-x border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button onClick={incrementQuantity} className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md transition-colors">+</button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart || product.stockQuantity === 0 || quantity <=0 }
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stockQuantity === 0 ? 'ناموجود' : (canAddToCart ? 'افزودن به سبد خرید' : 'موجودی کافی نیست یا در سبد شماست')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
