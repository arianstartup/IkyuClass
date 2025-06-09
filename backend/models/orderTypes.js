// Structure for a Research Order
function createResearchOrder(userId, educationLevel, subject, description, deadline, price = null, additionalDetails = {}) {
  // Validate required fields
  if (!userId || !educationLevel || !subject || !description || !deadline) {
    throw new Error("Missing required fields for research order: userId, educationLevel, subject, description, deadline.");
  }

  return {
    userId, // ID of the user who placed the order
    educationLevel, // e.g., "دبیرستان", "کارشناسی", "کارشناسی ارشد"
    subject, // e.g., "فیزیک کوانتوم", "ادبیات معاصر"
    description, // Detailed description from the user
    deadline, // ISO string or Firestore Timestamp
    status: 'pending_payment', // Initial status
    price, // Can be null initially, determined later
    fileUploads: [], // Array to store paths or URLs of uploaded files by user
    assignedTeacherId: null, // ID of the teacher assigned to this order
    deliverables: [], // Array to store paths or URLs of delivered files by teacher
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...additionalDetails,
  };
}

module.exports = {
  createResearchOrder,
  createBooking,
  createStoreOrder,
};

// Structure for a Booking
function createBooking(teacherId, studentId, bookingStartTime, bookingEndTime, bookingType, price, additionalDetails = {}) {
  // Validate required fields
  if (!teacherId || !studentId || !bookingStartTime || !bookingEndTime || !bookingType || price === undefined || price === null) {
    throw new Error("Missing required fields for booking: teacherId, studentId, bookingStartTime, bookingEndTime, bookingType, price.");
  }

  if (new Date(bookingStartTime) >= new Date(bookingEndTime)) {
    throw new Error("Booking start time must be before booking end time.");
  }

  return {
    teacherId,
    studentId,
    bookingStartTime, // ISO string or Firestore Timestamp
    bookingEndTime,   // ISO string or Firestore Timestamp
    bookingType,      // 'online' or 'in-person'
    status: 'pending_payment', // Initial status: 'pending_payment', 'confirmed', 'cancelled', 'completed'
    price,            // Cost of the session
    paymentId: null,  // To link to a payment transaction later
    meetingLink: null, // For online sessions, can be added later
    cancellationReason: null, // If cancelled
    notes: null, // Any notes from student or teacher
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...additionalDetails,
  };
}


// Structure for a Store Order
function createStoreOrder(userId, items, shippingAddress, totalAmount, additionalDetails = {}) {
  // Basic validation
  if (!userId || !Array.isArray(items) || items.length === 0 || !shippingAddress || totalAmount === undefined || totalAmount < 0) {
    throw new Error("Missing or invalid required fields for store order: userId, items, shippingAddress, totalAmount.");
  }

  for (const item of items) {
    if (!item.productId || !item.productName || item.quantity === undefined || item.quantity <= 0 || item.priceAtPurchase === undefined || item.priceAtPurchase < 0) {
      throw new Error("Invalid item structure in store order. Each item must have productId, productName, quantity, and priceAtPurchase.");
    }
  }

  if (typeof shippingAddress !== 'object' || shippingAddress === null || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
     throw new Error("Invalid shippingAddress structure. It must be an object with addressLine1, city, postalCode, country.");
  }


  return {
    userId, // ID of the user placing the order
    orderNumber: `SO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate a unique order number
    items, // Array of objects: { productId, productName, sku, quantity, priceAtPurchase, image (optional) }
    shippingAddress: { // Example structure
      fullName: shippingAddress.fullName || '',
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state || '', // استان/ایالت
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      phoneNumber: shippingAddress.phoneNumber || '',
    },
    billingAddress: shippingAddress, // Can be different, for simplicity using same as shipping for now
    totalAmount, // Number, total cost of items + shipping (if any) - shipping can be calculated later
    shippingCost: 0, // Can be calculated based on address or items
    discountAmount: 0, // Any discounts applied
    finalAmount: totalAmount, // totalAmount + shippingCost - discountAmount
    status: 'pending_payment', // 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    paymentDetails: { // To be populated after payment
      paymentMethod: null, // e.g., 'Zarinpal', 'CreditCard' (if direct)
      transactionId: null, // From payment gateway
      paymentDate: null,
      paymentStatus: null, // e.g., 'completed', 'failed'
    },
    shippingDetails: {
        carrier: null, // e.g., 'پست پیشتاز', 'تیپاکس'
        trackingNumber: null,
        shippedDate: null,
        estimatedDeliveryDate: null,
    },
    notesToSeller: additionalDetails.notesToSeller || '', // Customer notes
    internalNotes: '', // Admin notes
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...additionalDetails,
  };
}
