"use client";

import React, { useEffect, useState } from 'react';
import { adminApiFetch } from '@/utils/adminApi';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Colors // Import Colors
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Colors // Register Colors
);

interface UserStats {
  totalTeachers: number;
  totalVerifiedPhoneUsers: number;
}
interface ResearchOrderStats {
  totalOrders: number;
  completedAndPaidOrders: number;
}
interface BookingStats {
  totalConfirmedOrCompleted: number;
}
interface StoreOrderStats {
  totalPaidOrShippedOrDelivered: number;
}
interface RevenueStats {
    totalBookingRevenue: number;
    totalStoreRevenue: number;
    overallTotalRevenue: number;
    currency: string;
}

interface DashboardStats {
  userStats: UserStats;
  researchOrderStats: ResearchOrderStats;
  bookingStats: BookingStats;
  storeOrderStats: StoreOrderStats;
  revenueStats: RevenueStats;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#9ca3af' }, // text-gray-400 for y-axis labels
      grid: { color: '#374151' } // border-gray-700 for y-axis grid lines
    },
    x: {
      ticks: { color: '#9ca3af' }, // text-gray-400 for x-axis labels
      grid: { color: '#374151' } // border-gray-700 for x-axis grid lines
    }
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { color: '#d1d5db' } // text-gray-300 for legend
    },
    title: {
      display: true,
      text: 'نمودار آمار',
      color: '#f3f4f6' // text-gray-100 for title
    },
    colors: { // Enable the colors plugin
        enabled: true
    }
  }
};


const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApiFetch('/api/admin/dashboard/stats');
        setStats(data);
      } catch (err: any) {
        setError(err.message || "خطا در بارگذاری آمار داشبورد.");
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-gray-300">در حال بارگذاری آمار داشبورد...</div>;
  }
  if (error) {
    return <div className="bg-red-700 border-red-900 text-red-200 p-4 rounded-md">خطا: {error}</div>;
  }
  if (!stats) {
    return <div className="text-center py-10 text-gray-400">اطلاعاتی برای نمایش وجود ندارد.</div>;
  }

  const usersChartData = {
    labels: ['معلمان', 'کاربران تایید شده (تلفن)'],
    datasets: [
      {
        label: 'تعداد کاربران',
        data: [stats.userStats.totalTeachers, stats.userStats.totalVerifiedPhoneUsers],
        backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'],
        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const ordersChartData = {
    labels: ['سفارشات تحقیق (کل)', 'سفارشات فروشگاه (پرداخت شده)', 'رزروهای کلاس (تایید/تکمیل شده)'],
    datasets: [
      {
        label: 'تعداد سفارشات/رزروها',
        data: [
          stats.researchOrderStats.totalOrders,
          stats.storeOrderStats.totalPaidOrShippedOrDelivered,
          stats.bookingStats.totalConfirmedOrCompleted,
        ],
        backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(139, 92, 246, 0.7)'],
        borderColor: ['rgba(239, 68, 68, 1)', 'rgba(245, 158, 11, 1)', 'rgba(139, 92, 246, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const revenueData = {
    labels: ['درآمد رزروها', 'درآمد فروشگاه', 'درآمد کل'],
    datasets: [{
        label: `درآمد (${stats.revenueStats.currency || 'تومان'})`,
        data: [
            stats.revenueStats.totalBookingRevenue,
            stats.revenueStats.totalStoreRevenue,
            stats.revenueStats.overallTotalRevenue
        ],
        // Chart.js Colors plugin will pick colors unless specified
    }]
  };


  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-100 mb-6">داشبورد مدیریت</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-medium text-gray-400">کل معلمان</h2>
          <p className="text-3xl font-bold text-blue-400 mt-2">{stats.userStats.totalTeachers.toLocaleString('fa-IR')}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-medium text-gray-400">سفارشات فروشگاه (پرداخت شده)</h2>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.storeOrderStats.totalPaidOrShippedOrDelivered.toLocaleString('fa-IR')}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-medium text-gray-400">رزروهای کلاس (تایید شده)</h2>
          <p className="text-3xl font-bold text-purple-400 mt-2">{stats.bookingStats.totalConfirmedOrCompleted.toLocaleString('fa-IR')}</p>
        </div>
         <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-medium text-gray-400">درآمد کل</h2>
          <p className="text-3xl font-bold text-green-400 mt-2">{stats.revenueStats.overallTotalRevenue.toLocaleString('fa-IR')} <span className="text-sm">{stats.revenueStats.currency}</span></p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-80 md:h-96">
          <h2 className="text-xl font-semibold text-gray-100 mb-3 text-center">آمار کاربران</h2>
          <Bar options={{...chartOptions, plugins: {...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'تفکیک کاربران'} }}} data={usersChartData} />
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-80 md:h-96">
          <h2 className="text-xl font-semibold text-gray-100 mb-3 text-center">آمار سفارشات و رزروها</h2>
          <Bar options={{...chartOptions, plugins: {...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'تفکیک سفارشات'} }}} data={ordersChartData} />
        </div>
      </div>
       <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-80 md:h-96">
          <h2 className="text-xl font-semibold text-gray-100 mb-3 text-center">آمار درآمد</h2>
          <Line options={{...chartOptions, plugins: {...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'نمودار درآمد'} }}} data={revenueData} />
        </div>
    </div>
  );
};

export default AdminDashboardPage;
