// Structure for a Product
function createProduct(name, description, price, category, brand, images, stockQuantity, sku, tags = [], additionalDetails = {}) {
  // Basic validation
  if (!name || !description || price === undefined || price < 0 || !category || !sku) {
    throw new Error("Missing or invalid required fields for product: name, description, price, category, sku.");
  }
  if (stockQuantity === undefined || stockQuantity < 0) {
    throw new Error("Stock quantity must be a non-negative number.");
  }
  if (!Array.isArray(images)) {
    images = []; // Default to empty array if not provided or invalid
  }
  if (!Array.isArray(tags)) {
    tags = [];
  }
   if (!Array.isArray(category) && typeof category === 'string') {
    category = [category]; // Convert single category string to array
  } else if (!Array.isArray(category)) {
    category = [];
  }


  return {
    name, // String
    description, // String (can be long, perhaps HTML or Markdown)
    price, // Number (e.g., in Toman or Rial)
    category, // Array of strings (e.g., ["لوازم الکترونیکی", "موبایل"])
    brand: brand || 'متفرقه', // String (e.g., "سامسونگ")
    images, // Array of image URLs
    stockQuantity, // Number
    sku, // String, Stock Keeping Unit - unique identifier
    tags, // Array of strings for searchability (e.g., ["جدید", "پرفروش"])
    ratings: { // Example of how ratings could be structured
      average: 0,
      count: 0,
    },
    isFeatured: false, // Boolean, to mark product as featured
    isActive: true, // Boolean, to easily enable/disable product visibility
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...additionalDetails, // e.g., dimensions, weight, color options, specifications
  };
}

module.exports = {
  createProduct,
  createProductBundle,
};

// Structure for a Product Bundle
function createProductBundle(name, description, items, bundlePrice, sku = null, images = [], isActive = true, additionalDetails = {}) {
  // Basic validation
  if (!name || !description || !Array.isArray(items) || items.length === 0 || bundlePrice === undefined || bundlePrice < 0) {
    throw new Error("Missing or invalid required fields for product bundle: name, description, items, bundlePrice.");
  }

  let calculatedTotalOriginalPrice = 0;
  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0 || item.originalPricePerItem === undefined || item.originalPricePerItem < 0) {
      throw new Error("Invalid item structure in bundle. Each item must have productId, quantity > 0, and originalPricePerItem >= 0.");
    }
    calculatedTotalOriginalPrice += item.originalPricePerItem * item.quantity;
  }

  if (bundlePrice > calculatedTotalOriginalPrice) {
    // Allow bundle price to be same as original, but not higher unless specific reason (e.g. includes extra service)
    console.warn(`Bundle price (${bundlePrice}) for bundle "${name}" is higher than calculated total original price (${calculatedTotalOriginalPrice}). This might be intentional.`);
  }


  return {
    name, // String, Name of the bundle
    description, // String, Description of the bundle
    sku: sku || `BUNDLE-${name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`, // Optional SKU for the bundle itself
    images, // Array of image URLs for the bundle (can be a composite image or lead product's image)
    items, // Array of objects: { productId: string, productName: string (for display), quantity: number, originalPricePerItem: number, sku: string (of product) }
    totalOriginalPrice: calculatedTotalOriginalPrice, // Sum of (item.originalPricePerItem * item.quantity) for all items
    bundlePrice, // The discounted price for the whole bundle
    discountAmount: calculatedTotalOriginalPrice - bundlePrice, // Calculated discount
    isActive, // Boolean, to easily enable/disable bundle visibility
    tags: [], // Optional tags for the bundle
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...additionalDetails, // e.g., validFrom, validUntil, specialOfferNotes
  };
}
