import React from 'react';
import Link from 'next/link';

interface TeacherSummary {
  id: string;
  firstName: string;
  lastName: string;
  subjectTaught: string[] | string;
  qualifications: string;
}

interface TeacherCardProps {
  teacher: TeacherSummary;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher }) => {
  const subjects = Array.isArray(teacher.subjectTaught)
    ? teacher.subjectTaught.join('، ')
    : teacher.subjectTaught;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transform transition-all hover:scale-105 duration-300 ease-in-out">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
          {teacher.firstName} {teacher.lastName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
          <strong>تخصص:</strong> {subjects || 'اعلام نشده'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 h-16 overflow-y-auto">
          <strong>سوابق:</strong> {teacher.qualifications || 'اعلام نشده'}
        </p>
        <Link
          href={`/teachers/${teacher.id}`}
          className="inline-block w-full text-center bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
        >
          مشاهده پروفایل و برنامه زمانی
        </Link>
      </div>
    </div>
  );
};

export default TeacherCard;
