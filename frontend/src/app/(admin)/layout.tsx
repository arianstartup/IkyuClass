// This is a server component by default in App Router
import React from 'react';
import AdminLayoutClient from '@/components/admin/layout/AdminLayout'; // The client component we just created

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If you need to fetch data here for the layout (e.g. logged-in admin user),
  // this would be the place for a Server Component.
  // For now, AdminLayoutClient handles its own client-side state (like sidebar toggle).
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
