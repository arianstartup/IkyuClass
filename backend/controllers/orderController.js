const { db } = require('../config/firebaseConfig');
const { createResearchOrder } = require('../models/orderTypes');

const submitResearchOrder = async (req, res) => {
  try {
    // For now, userId is taken from req.body.
    // In a real app, this would come from an authenticated req.user object.
    const { userId, educationLevel, subject, description, deadline, price } = req.body;

    // Basic validation (model function also validates, but good to have here too)
    if (!userId || !educationLevel || !subject || !description || !deadline) {
      return res.status(400).json({ message: 'Missing required fields: userId, educationLevel, subject, description, deadline are required.' });
    }

    // Create a new research order object
    const newOrderData = createResearchOrder(
      userId,
      educationLevel,
      subject,
      description,
      deadline,
      price // price can be null
      // additionalDetails can be passed if needed
    );

    // Add a new document with an auto-generated ID to the 'researchOrders' collection
    const orderRef = await db.collection('researchOrders').add(newOrderData);

    // Update the order data with the generated ID as orderId (optional, if needed within the doc)
    // await orderRef.update({ orderId: orderRef.id });
    // Or simply return the ID from orderRef.id

    console.log('Research order submitted successfully:', orderRef.id);
    res.status(201).json({
      message: 'Research order submitted successfully!',
      orderId: orderRef.id,
      data: { ...newOrderData, id: orderRef.id } // Return the data including the new ID
    });

  } catch (error) {
    console.error('Error submitting research order:', error);
    // If the error is from our model's validation
    if (error.message.startsWith("Missing required fields")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error submitting research order.', error: error.message });
  }
};

module.exports = {
  submitResearchOrder,
};
