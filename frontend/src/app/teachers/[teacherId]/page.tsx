"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Correct hook for App Router
import TeacherProfile from '@/components/teachers/TeacherProfile';
import Link from 'next/link';

// Define the structure of the teacher's full profile data
interface AvailabilitySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: 'online' | 'in-person';
}

export interface TeacherProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subjectTaught: string[] | string;
  qualifications: string;
  availability: AvailabilitySlot[];
  // Add any other fields that getTqseacherById might return
  hourlyRate?: number; // Example optional field
  bio?: string; // Example optional field
}


const TeacherProfilePage = () => {
  const params = useParams();
  const teacherId = params?.teacherId as string | undefined;

  const [teacher, setTeacher] = useState<TeacherProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacherId) {
      const fetchTeacherProfile = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/teachers/${teacherId}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('معلم مورد نظر یافت نشد.');
            }
            throw new Error(`خطا در دریافت اطلاعات معلم: ${response.statusText}`);
          }
          const data = await response.json();
          setTeacher(data);
        } catch (err: any) {
          setError(err.message);
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchTeacherProfile();
    } else {
      // Handle case where teacherId is not available (e.g., redirect or show error)
      setLoading(false);
      setError("شناسه معلم نامعتبر است.");
    }
  }, [teacherId]);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری اطلاعات معلم...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">خطا: {error}</div>;
  }

  if (!teacher) {
    return <div className="text-center py-10">اطلاعات معلم در دسترس نیست.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/teachers" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
          &larr; بازگشت به لیست معلمان
        </Link>
      </div>
      <TeacherProfile teacher={teacher} />
    </div>
  );
};

export default TeacherProfilePage;
