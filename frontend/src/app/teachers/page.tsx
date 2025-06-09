"use client";

import React, { useEffect, useState } from 'react';
import TeacherCard from '@/components/teachers/TeacherCard';
import Link from 'next/link';

interface TeacherSummary {
  id: string;
  firstName: string;
  lastName: string;
  subjectTaught: string[] | string; // subjectTaught might be an array or string
  qualifications: string;
}

const TeachersListPage = () => {
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/teachers');
        if (!response.ok) {
          throw new Error(`خطا در دریافت لیست معلمان: ${response.statusText}`);
        }
        const data = await response.json();
        setTeachers(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری لیست معلمان...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">خطا: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white">
        لیست معلمان مجرب ما
      </h1>
      {teachers.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-300">در حال حاضر معلمی برای نمایش وجود ندارد.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teachers.map(teacher => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}
      {/* Example link to a specific teacher - will be part of TeacherCard */}
      {/* <div className="mt-8 text-center">
        <Link href="/teachers/someTeacherIdExample" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
          مشاهده پروفایل نمونه معلم (تستی)
        </Link>
      </div> */}
    </div>
  );
};

export default TeachersListPage;
