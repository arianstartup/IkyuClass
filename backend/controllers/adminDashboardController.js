const { db } = require('../config/firebaseConfig');
const admin = require('firebase-admin'); // For potential server timestamps or advanced queries if needed

// Get platform dashboard statistics (Admin action)
const getDashboardStats = async (req, res) => {
  try {
    // TODO: Ensure robust admin authentication (isAdmin middleware will be applied on the route)

    // 1. User Counts
    // Count teachers
    const teachersSnapshot = await db.collection('teachers').get();
    const teacherCount = teachersSnapshot.size;

    // Count verified phone numbers as a proxy for "registered users" or "students" for now
    // This is a simplification as we don't have a dedicated 'students' or general 'users' collection yet with roles.
    const verifiedPhonesSnapshot = await db.collection('verificationCodes').where('verified', '==', true).get();
    const verifiedUserCount = verifiedPhonesSnapshot.size;
    // Note: This doesn't guarantee they completed full registration if that's a separate step not yet implemented for students.

    // 2. Research Orders Count
    const researchOrdersSnapshot = await db.collection('researchOrders').get();
    const totalResearchOrders = researchOrdersSnapshot.size;

    let completedResearchOrders = 0;
    researchOrdersSnapshot.forEach(doc => {
        if (doc.data().contentGenerationStatus === 'completed' && doc.data().paymentStatus === 'paid') {
            completedResearchOrders++;
        }
    });

    // 3. Teacher Bookings Count (confirmed or completed)
    const bookingsSnapshot = await db.collection('bookings')
                                     .where('status', 'in', ['confirmed', 'completed'])
                                     .get();
    const totalBookings = bookingsSnapshot.size;

    // 4. Store Orders Count (paid, shipped, or delivered)
    const storeOrdersSnapshot = await db.collection('storeOrders')
                                       .where('status', 'in', ['paid', 'shipped', 'delivered'])
                                       .get();
    const totalStoreOrders = storeOrdersSnapshot.size;

    // 5. (Optional) Total Revenue
    let totalBookingRevenue = 0;
    bookingsSnapshot.forEach(doc => { // Iterate over the already fetched 'confirmed' or 'completed' bookings
      totalBookingRevenue += doc.data().price || 0;
    });

    let totalStoreRevenue = 0;
    storeOrdersSnapshot.forEach(doc => { // Iterate over already fetched 'paid', 'shipped', 'delivered' orders
      totalStoreRevenue += doc.data().finalAmount || 0;
    });

    const totalRevenue = totalBookingRevenue + totalStoreRevenue;

    res.status(200).json({
      userStats: {
        totalTeachers: teacherCount,
        totalVerifiedPhoneUsers: verifiedUserCount, // Proxy for students/general users
        // Add more user roles here as they are defined e.g. totalStudents
      },
      researchOrderStats: {
        totalOrders: totalResearchOrders,
        completedAndPaidOrders: completedResearchOrders,
      },
      bookingStats: {
        totalConfirmedOrCompleted: totalBookings,
      },
      storeOrderStats: {
        totalPaidOrShippedOrDelivered: totalStoreOrders,
      },
      revenueStats: {
        totalBookingRevenue: totalBookingRevenue,
        totalStoreRevenue: totalStoreRevenue,
        overallTotalRevenue: totalRevenue,
        currency: 'Toman' // Assuming Toman
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats.', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
