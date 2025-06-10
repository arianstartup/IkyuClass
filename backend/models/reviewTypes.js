// Structure for a Teacher Review
function createTeacherReview(teacherId, studentId, rating, comment, bookingId = null, additionalDetails = {}) {
  // Basic validation
  if (!teacherId || !studentId || rating === undefined) {
    throw new Error("Missing required fields for teacher review: teacherId, studentId, rating.");
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new Error("Rating must be a number between 1 and 5.");
  }
  if (comment && typeof comment !== 'string') {
    throw new Error("Comment must be a string.");
  }
  if (comment && comment.length > 2000) { // Max comment length
    throw new Error("Comment cannot exceed 2000 characters.");
  }


  return {
    teacherId,    // ID of the teacher being reviewed
    studentId,    // ID of the student who wrote the review
    bookingId,    // Optional: ID of the booking this review is related to
    rating,       // Number from 1 to 5
    comment: comment || "",      // String, the review text
    reviewDate: new Date().toISOString(), // Timestamp of when the review was submitted
    isApproved: true, // Boolean, for admin moderation (default to true for now)
    isEdited: false,  // Boolean, if the review was edited after submission
    likes: 0,         // Number, count of likes (optional feature)
    reports: 0,       // Number, count of reports (optional feature for moderation)
    ...additionalDetails, // e.g., student's display name at time of review if not joining later
  };
}

module.exports = {
  createTeacherReview,
};
