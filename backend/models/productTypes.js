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
};
