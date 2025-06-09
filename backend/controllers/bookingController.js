const { db } = require('../config/firebaseConfig');
const { createBooking } = require('../models/orderTypes'); // Assuming createBooking is in orderTypes.js
const admin = require('firebase-admin'); // Required for Firestore Timestamp and FieldValue

const createNewBooking = async (req, res) => {
  try {
    const { teacherId, studentId, bookingStartTime, bookingEndTime, bookingType, price } = req.body;

    // Basic validation (model also validates)
    if (!teacherId || !studentId || !bookingStartTime || !bookingEndTime || !bookingType || price === undefined) {
      return res.status(400).json({ message: 'Missing required fields for booking.' });
    }

    // Convert JS ISO strings to Firestore Timestamps for querying
    const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(bookingStartTime));
    const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(bookingEndTime));

    if (startTimestamp.toDate() >= endTimestamp.toDate()) {
        return res.status(400).json({ message: "Booking start time must be before end time." });
    }

    // 1. Check Teacher's Availability
    const teacherRef = db.collection('teachers').doc(teacherId);
    const teacherDoc = await teacherRef.get();

    if (!teacherDoc.exists) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }
    const teacherData = teacherDoc.data();
    const teacherAvailability = teacherData.availability || [];

    // This is a simplified availability check. A more robust solution would:
    // - Convert bookingStartTime to dayOfWeek and time.
    // - Check if the requested slot falls within any of the teacher's available slots.
    // - For recurring availability, this logic can become complex.
    // - For this example, we assume the frontend only allows booking valid listed slots.
    // - A truly robust check would involve parsing dayOfWeek, startTime, endTime from teacherAvailability
    //   and comparing it against the specific date and time of bookingStartTime.
    // This is a placeholder for that complex logic.
    // For now, we'll assume if a slot was shown in FE, it was derived from teacher's availability.
    // A simple check: does teacher have *any* availability? (Not a real check)
    // if (teacherAvailability.length === 0) {
        // This check is too basic, actual slot matching is needed.
        // return res.status(400).json({ message: "Teacher has not set their availability." });
    // }

    // --- Enhanced Availability Check ---
    const requestedDayOfWeek = startTimestamp.toDate().toLocaleDateString('fa-IR-u-nu-latn', { weekday: 'long' }); // e.g., 'شنبه'
    const requestedStartTime = startTimestamp.toDate().toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: false }); // HH:MM
    const requestedEndTime = endTimestamp.toDate().toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: false });   // HH:MM

    const isValidSlot = teacherAvailability.some(slot => {
      return slot.dayOfWeek === requestedDayOfWeek &&
             slot.startTime === requestedStartTime &&
             slot.endTime === requestedEndTime &&
             slot.type === bookingType; // Also check if the booking type matches
    });

    if (!isValidSlot) {
      return res.status(400).json({ message: 'The requested time slot does not match the teacher\'s availability or booking type.' });
    }
    // --- End Enhanced Availability Check ---


    // --- Enhanced Conflicting Bookings Check ---
    const bookingsRef = db.collection('bookings');
    // Query for bookings that overlap with the requested time slot for the specific teacher
    // A booking conflicts if:
    // (ExistingStartTime < RequestedEndTime) AND (ExistingEndTime > RequestedStartTime)
    const conflictQuery1 = bookingsRef
        .where('teacherId', '==', teacherId)
        .where('status', 'in', ['pending_payment', 'confirmed'])
        .where('bookingStartTime', '<', endTimestamp); // Existing starts before new one ends
        // Further client-side/function filtering needed if we can't do the second part of the AND

    const conflictQuery2 = bookingsRef
        .where('teacherId', '==', teacherId)
        .where('status', 'in', ['pending_payment', 'confirmed'])
        .where('bookingEndTime', '>', startTimestamp); // Existing ends after new one starts
        // Further client-side/function filtering needed

    // Firestore does not support direct OR queries across different fields like (startTime < X AND endTime > Y).
    // A common approach is to query a broader range and filter results, or perform multiple queries and merge.
    // For a more robust solution:
    // 1. Query for bookings that start within the requested slot.
    // 2. Query for bookings that end within the requested slot.
    // 3. Query for bookings that completely encompass the requested slot.

    // Simplified approach for this step: Query for any booking that has the same start time.
    // This is NOT a complete overlap check but better than previous.
    // A full solution might involve a cloud function for complex queries or denormalization.
    const stricterConflictSnapshot = await bookingsRef
        .where('teacherId', '==', teacherId)
        .where('status', 'in', ['pending_payment', 'confirmed'])
        .where('bookingStartTime', '==', startTimestamp) // Check if any existing booking starts at the same time
        .get();

    if (!stricterConflictSnapshot.empty) {
         // This implies an exact start time collision. A more granular check for any overlap is needed for production.
        return res.status(409).json({ message: 'This exact time slot is already booked or pending payment. Full overlap check pending.' });
    }

    // Query for bookings that *surround* the requested slot (if necessary, though less common for exact slot booking)
    // Query for bookings that *are surrounded by* the requested slot (if booking arbitrary times)

    // For a truly robust check of (ExistingStartTime < RequestedEndTime) AND (ExistingEndTime > RequestedStartTime):
    // You would typically fetch a slightly wider range of bookings around the requested time for the teacher
    // and then iterate through them in your backend code to perform the precise overlap logic.
    // Example: Fetch bookings where `bookingStartTime` is between `requestedStartTime - X hours` and `requestedEndTime + X hours`.
    // Then filter:
    const potentiallyConflictingBookingsSnapshot = await bookingsRef
        .where('teacherId', '==', teacherId)
        .where('status', 'in', ['pending_payment', 'confirmed'])
        // Get bookings that start up to X hours before the requested end time and end up to X hours after requested start time
        // This range needs careful consideration. For exact slot matching, it's simpler.
        // If booking custom ranges, this is more critical.
        .orderBy('bookingStartTime') // Necessary for inequality on another field if used
        .where('bookingStartTime', '<', endTimestamp) // existing starts before new ends
        // .where('bookingEndTime', '>', startTimestamp) // CANNOT do two inequalities on different fields
        .get();

    for (const doc of potentiallyConflictingBookingsSnapshot.docs) {
        const existingBooking = doc.data();
        // Now apply the second condition in code: existingBooking.bookingEndTime > startTimestamp
        if (existingBooking.bookingEndTime.toDate() > startTimestamp.toDate()) {
            // True overlap detected
            return res.status(409).json({
                message: 'This time slot conflicts with an existing booking. (Overlap detected)',
                conflictingBookingId: doc.id
            });
        }
    }
    // --- End Enhanced Conflicting Bookings Check ---

    // Create new booking object
    const newBookingData = createBooking(
      teacherId,
      studentId,
      bookingStartTime, // Store as ISO string as per model, or convert to Timestamp if preferred for all date fields
      bookingEndTime,
      bookingType,
      price
    );

    // Add to Firestore
    const bookingRef = await db.collection('bookings').add({
        ...newBookingData, // Contains ISO strings for bookingStart/EndTime from the model
        bookingStartTime: startTimestamp, // Overwrite with Firestore Timestamp for querying
        bookingEndTime: endTimestamp,     // Overwrite with Firestore Timestamp for querying
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      message: 'Booking successfully created and is pending payment.',
      bookingId: bookingRef.id,
      // Return the data as it was passed to createBooking, plus the ID.
      // The Timestamps are for DB internal use mainly. Client might prefer ISO strings.
      data: { ...newBookingData, id: bookingRef.id, bookingStartTime, bookingEndTime }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.message.startsWith("Missing required fields") || error.message.includes("must be before end time")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating booking.', error: error.message });
  }
};

module.exports = {
  createNewBooking,
};
