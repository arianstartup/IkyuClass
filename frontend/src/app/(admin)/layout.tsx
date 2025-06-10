"use client"; // Route group layouts using HOCs for auth need to be client components

import React from 'react';
import AdminLayoutClient from '@/components/admin/layout/AdminLayout';
import withAuth from '@/components/auth/withAuth'; // Import the HOC

const AdminPanelLayoutContent = ({ children }: { children: React.ReactNode }) => {
  // This component now receives children and is wrapped by AdminLayoutClient
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
};

// Wrap the content component with withAuth, specifying allowed roles
const ProtectedAdminLayout = withAuth(AdminPanelLayoutContent, ['admin']);

export default ProtectedAdminLayout;
