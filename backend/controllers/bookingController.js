const { db } = require('../config/firebaseConfig');
const { createBooking } = require('../models/orderTypes');
const admin = require('firebase-admin');

// Create a new booking
const createNewBooking = async (req, res) => {
  try {
    const { teacherId, bookingStartTime, bookingEndTime, bookingType, price } = req.body;
    const { uid: studentId } = req.user; // Get studentId from authenticated user

    if (!teacherId || !studentId || !bookingStartTime || !bookingEndTime || !bookingType || price === undefined) {
      return res.status(400).json({ message: 'Missing required fields for booking.' });
    }

    const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(bookingStartTime));
    const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(bookingEndTime));

    if (startTimestamp.toDate() >= endTimestamp.toDate()) {
        return res.status(400).json({ message: "Booking start time must be before end time." });
    }

    const teacherRef = db.collection('teachers').doc(teacherId);
    const teacherDoc = await teacherRef.get();
    if (!teacherDoc.exists) return res.status(404).json({ message: 'Teacher not found.' });

    const teacherData = teacherDoc.data();
    const teacherAvailability = teacherData.availability || [];
    const requestedDayOfWeek = startTimestamp.toDate().toLocaleDateString('fa-IR-u-nu-latn', { weekday: 'long' });
    const requestedStartTime = startTimestamp.toDate().toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: false });
    const requestedEndTime = endTimestamp.toDate().toLocaleTimeString('fa-IR-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: false });

    const isValidSlot = teacherAvailability.some(slot =>
      slot.dayOfWeek === requestedDayOfWeek &&
      slot.startTime === requestedStartTime &&
      slot.endTime === requestedEndTime &&
      slot.type === bookingType
    );
    if (!isValidSlot) return res.status(400).json({ message: 'The requested time slot does not match the teacher\'s availability or booking type.' });

    const bookingsRef = db.collection('bookings');
    const potentiallyConflictingBookingsSnapshot = await bookingsRef
        .where('teacherId', '==', teacherId)
        .where('status', 'in', ['pending_payment', 'confirmed'])
        .where('bookingStartTime', '<', endTimestamp)
        .get();

    for (const doc of potentiallyConflictingBookingsSnapshot.docs) {
        const existingBooking = doc.data();
        if (existingBooking.bookingEndTime.toDate() > startTimestamp.toDate()) {
            return res.status(409).json({ message: 'This time slot conflicts with an existing booking.'});
        }
    }

    const newBookingData = createBooking(teacherId, studentId, bookingStartTime, bookingEndTime, bookingType, price);
    const bookingRef = await db.collection('bookings').add({
        ...newBookingData,
        bookingStartTime: startTimestamp,
        bookingEndTime: endTimestamp,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({ message: 'Booking successfully created and is pending payment.', bookingId: bookingRef.id, data: { ...newBookingData, id: bookingRef.id, bookingStartTime, bookingEndTime } });
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.message.startsWith("Missing required fields") || error.message.includes("must be before end time")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating booking.', error: error.message });
  }
};

// Get bookings for a specific student (using req.user.uid)
const getMyStudentBookings = async (req, res) => {
  try {
    const { uid: studentId } = req.user;
    const bookingsSnapshot = await db.collection('bookings')
                                     .where('studentId', '==', studentId)
                                     .orderBy('bookingStartTime', 'desc')
                                     .get();
    if (bookingsSnapshot.empty) return res.status(200).json([]);
    const studentBookings = [];
    for (const doc of bookingsSnapshot.docs) {
      const booking = { id: doc.id, ...doc.data() };
      if (booking.teacherId) {
        const teacherDoc = await db.collection('teachers').doc(booking.teacherId).get();
        if (teacherDoc.exists) {
          const td = teacherDoc.data();
          booking.teacherInfo = { firstName: td.firstName, lastName: td.lastName, subjectTaught: td.subjectTaught };
        } else {
          booking.teacherInfo = { name: "معلم یافت نشد" };
        }
      }
      studentBookings.push(booking);
    }
    res.status(200).json(studentBookings);
  } catch (error) {
    console.error(`Error fetching bookings for student ${req.user.uid}:`, error);
    res.status(500).json({ message: 'Error fetching student bookings.', error: error.message });
  }
};

// Get bookings for a specific teacher (using req.user.uid)
const getMyTeacherBookings = async (req, res) => {
  try {
    const { uid: teacherId } = req.user;
    const bookingsSnapshot = await db.collection('bookings')
                                     .where('teacherId', '==', teacherId)
                                     .orderBy('bookingStartTime', 'desc')
                                     .get();
    if (bookingsSnapshot.empty) return res.status(200).json([]);
    const teacherBookings = [];
    for (const doc of bookingsSnapshot.docs) {
      const booking = { id: doc.id, ...doc.data() };
      if (booking.studentId) {
        const studentUserDoc = await db.collection('users').doc(booking.studentId).get();
        if (studentUserDoc.exists) {
          const sud = studentUserDoc.data();
          booking.studentInfo = { id: booking.studentId, name: `${sud.firstName || ''} ${sud.lastName || ''}`.trim() || `دانش‌آموز (${booking.studentId.substring(0,5)}...)`};
        } else {
          booking.studentInfo = { id: booking.studentId, name: `دانش‌آموز (${booking.studentId.substring(0,5)}...)` };
        }
      } else {
         booking.studentInfo = { id: null, name: "دانش‌آموز نامشخص" };
      }
      teacherBookings.push(booking);
    }
    res.status(200).json(teacherBookings);
  } catch (error) {
    console.error(`Error fetching bookings for teacher ${req.user.uid}:`, error);
    res.status(500).json({ message: 'Error fetching teacher bookings.', error: error.message });
  }
};

// Cancel a booking (by student, teacher, or admin)
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { uid: userId, role } = req.user;
    const { reason: cancellationReasonFromRequest } = req.body;

    if (!bookingId) return res.status(400).json({ message: "Booking ID is required." });

    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) return res.status(404).json({ message: "Booking not found." });

    const bookingData = bookingDoc.data();

    // Authorization check: user must be student owner, teacher owner, or an admin
    if (role !== 'admin' && bookingData.studentId !== userId && bookingData.teacherId !== userId) {
      return res.status(403).json({ message: "User not authorized to cancel this booking." });
    }
    // If not admin, ensure they are cancelling based on their role in the booking
    if (role === 'student' && bookingData.studentId !== userId) return res.status(403).json({ message: "Student can only cancel their own bookings."});
    if (role === 'teacher' && bookingData.teacherId !== userId) return res.status(403).json({ message: "Teacher can only cancel their own bookings."});


    if (bookingData.status !== 'pending_payment' && bookingData.status !== 'confirmed') {
      return res.status(400).json({ message: `Booking cannot be cancelled. Current status: ${bookingData.status}.` });
    }

    const bookingStartTime = bookingData.bookingStartTime.toDate();
    const now = new Date();
    if (bookingStartTime < now || (bookingStartTime.getTime() - now.getTime()) < (1 * 60 * 60 * 1000)) { // 1 hour policy
        // For admin, maybe allow override or log differently
        if (role !== 'admin') {
            // return res.status(400).json({ message: "Booking is too close to its start time or has already passed, and cannot be cancelled by user." });
            console.warn(`User (role: ${role}, id: ${userId}) cancellation attempt for booking ${bookingId} close to or after start time.`);
        } else {
            console.log(`Admin (id: ${userId}) cancelling booking ${bookingId} close to or after start time.`);
        }
    }

    let newStatus;
    if (role === 'admin') {
        newStatus = cancellationReasonFromRequest ? 'cancelled_by_admin' : `cancelled_by_admin_no_reason`;
    } else {
        newStatus = role === 'student' ? 'cancelled_by_student' : 'cancelled_by_teacher';
    }
    const cancellationReason = cancellationReasonFromRequest || `Cancelled by ${role}`;

    await bookingRef.update({
      status: newStatus, cancellationReason: cancellationReason,
      'paymentDetails.cancellationProcessedAt': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // TODO: Implement refund logic if applicable
    res.status(200).json({ message: `Booking ${bookingId} successfully cancelled by ${role}.`, newStatus });
  } catch (error) {
    console.error(`Error cancelling booking ${req.params.bookingId}:`, error);
    res.status(500).json({ message: 'Error cancelling booking.', error: error.message });
  }
};

module.exports = {
  createNewBooking,
  getMyStudentBookings,
  getMyTeacherBookings,
  cancelBooking,
};
