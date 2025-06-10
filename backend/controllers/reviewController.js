const { db } = require('../config/firebaseConfig');
const { createTeacherReview } = require('../models/reviewTypes');
const admin = require('firebase-admin');

// Submit a review for a teacher
const submitTeacherReview = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { uid: studentId, role: studentRole } = req.user; // Get studentId and role from authenticated user
    const { bookingId, rating, comment } = req.body;

    // studentId is now from req.user.uid, so it's guaranteed.
    // Role check is done by middleware, but can double check if needed:
    // if (studentRole !== 'student' && studentRole !== 'university_student' && studentRole !== 'admin') {
    //    return res.status(403).json({ message: "User role not authorized to submit reviews." });
    // }

    if (!teacherId || rating === undefined) { // studentId is from req.user
      return res.status(400).json({ message: "Teacher ID and rating are required." });
    }

    // --- Start: Prevent duplicate reviews (basic example) ---
    // One review per student per teacher (or per bookingId if provided and mandatory)
    let existingReviewQuery = db.collection('teacherReviews')
                                  .where('teacherId', '==', teacherId)
                                  .where('studentId', '==', studentId);

    if (bookingId) { // If a bookingId is provided, make the review unique to that booking for that student
      existingReviewQuery = existingReviewQuery.where('bookingId', '==', bookingId);
    // }

    const existingReviewSnapshot = await existingReviewQuery.limit(1).get();
    if (!existingReviewSnapshot.empty) {
      // For now, let's allow updating an existing review, or return an error.
      // To allow updates:
      // const existingDoc = existingReviewSnapshot.docs[0];
      // await existingDoc.ref.update({ rating, comment, updatedAt: admin.firestore.FieldValue.serverTimestamp(), isEdited: true });
      // return res.status(200).json({ message: "Review updated successfully.", reviewId: existingDoc.id });
      return res.status(409).json({ message: "You have already submitted a review for this teacher." });
    }
    // --- End: Prevent duplicate reviews ---

    // Optional: Verify student had a completed booking with the teacher
    if (bookingId) {
        const bookingDoc = await db.collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists || bookingDoc.data().studentId !== studentId || bookingDoc.data().teacherId !== teacherId) {
            return res.status(403).json({ message: "Review must be linked to a valid booking you attended with this teacher." });
        }
        if (bookingDoc.data().status !== 'completed') { // Only allow reviews for completed sessions
            // return res.status(400).json({ message: "You can only review completed sessions." });
        }
    } else {
        // If bookingId is not provided, consider if reviews are allowed without a specific booking.
        // This might depend on your platform's rules.
        // For now, let's make bookingId optional.
    }


    const newReviewData = createTeacherReview(teacherId, studentId, rating, comment, bookingId);

    const reviewRef = await db.collection('teacherReviews').add({
        ...newReviewData,
        reviewDate: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
        // isApproved will use default from model (true for now)
    });

    // Update teacher's average rating and total ratings
    // This is a simple recalculation. For performance, use Cloud Functions or incremental updates.
    const teacherRef = db.collection('teachers').doc(teacherId);
    const reviewsSnapshot = await db.collection('teacherReviews')
                                    .where('teacherId', '==', teacherId)
                                    .where('isApproved', '==', true) // Only consider approved reviews for average
                                    .get();

    let totalRatingSum = 0;
    let approvedReviewsCount = 0;
    reviewsSnapshot.forEach(doc => {
      totalRatingSum += doc.data().rating;
      approvedReviewsCount++;
    });

    const averageRating = approvedReviewsCount > 0 ? (totalRatingSum / approvedReviewsCount) : 0;

    await teacherRef.update({
      averageRating: parseFloat(averageRating.toFixed(2)), // Store with 2 decimal places
      totalRatings: approvedReviewsCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
        message: 'Review submitted successfully!',
        reviewId: reviewRef.id,
        newAverageRating: parseFloat(averageRating.toFixed(2)),
        totalRatings: approvedReviewsCount
    });

  } catch (error) {
    console.error('Error submitting teacher review:', error);
    if (error.message.startsWith("Missing required fields") || error.message.startsWith("Rating must be") || error.message.startsWith("Comment cannot exceed")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error submitting review.', error: error.message });
  }
};

// Get all approved reviews for a specific teacher
const getTeacherReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required." });
    }

    const reviewsSnapshot = await db.collection('teacherReviews')
                                    .where('teacherId', '==', teacherId)
                                    .where('isApproved', '==', true)
                                    .orderBy('reviewDate', 'desc') // Show newest first
                                    .get();

    if (reviewsSnapshot.empty) {
      return res.status(200).json([]); // No reviews found
    }

    const reviews = [];
    for (const doc of reviewsSnapshot.docs) {
      const review = { id: doc.id, ...doc.data() };
      // Optionally, populate student info (e.g., name) if a 'users' or 'students' collection exists.
      // For now, studentId is returned.
      // if (review.studentId) {
      //   const studentDoc = await db.collection('users').doc(review.studentId).get(); // Or 'students'
      //   if (studentDoc.exists) {
      //     review.studentInfo = {
      //       name: studentDoc.data().firstName || "دانش‌آموز",
      //       // avatar: studentDoc.data().avatarUrl
      //     };
      //   }
      // }
      reviews.push(review);
    }
    res.status(200).json(reviews);
  } catch (error) {
    console.error(`Error fetching reviews for teacher ${req.params.teacherId}:`, error);
    res.status(500).json({ message: 'Error fetching reviews.', error: error.message });
  }
};

module.exports = {
  submitTeacherReview,
  getTeacherReviews,
};
