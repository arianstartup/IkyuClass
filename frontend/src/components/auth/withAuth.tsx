"use client";

import React, { ComponentType, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Your AuthContext hook

interface WithAuthProps {
  // Props of the wrapped component can be passed through if needed, but often not necessary for basic auth HOC
}

const withAuth = <P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedRoles?: string[]
) => {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { currentUser, userRole, loadingAuth } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loadingAuth) {
        return; // Wait until authentication status is resolved
      }

      if (!currentUser) {
        // If not logged in, redirect to login page
        console.log("withAuth: No user, redirecting to /login");
        router.replace('/login'); // Use replace to not add to history stack
        return;
      }

      if (allowedRoles && allowedRoles.length > 0) {
        if (!userRole || !allowedRoles.includes(userRole)) {
          // If logged in but role is not allowed, redirect to unauthorized page
          console.log(`withAuth: User role "${userRole}" not in allowed roles [${allowedRoles.join(', ')}]. Redirecting to /unauthorized.`);
          router.replace('/unauthorized');
        }
      }
      // If currentUser exists and (no specific roles are required OR userRole is in allowedRoles), render the component.
    }, [currentUser, userRole, loadingAuth, router, allowedRoles]);


    if (loadingAuth) {
      return <div className="flex justify-center items-center h-screen"><p className="text-lg dark:text-gray-200">در حال بررسی دسترسی...</p></div>; // Or a proper loading spinner component
    }

    if (!currentUser) {
      // Render nothing or a minimal message while redirecting
      return <div className="flex justify-center items-center h-screen"><p className="text-lg dark:text-gray-200">در حال انتقال به صفحه ورود...</p></div>;
    }

    if (allowedRoles && allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
        // Render nothing or a minimal message while redirecting
        return <div className="flex justify-center items-center h-screen"><p className="text-lg dark:text-gray-200">دسترسی شما مجاز نیست. در حال انتقال...</p></div>;
    }

    // If all checks pass, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  // Set a display name for easier debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAuthComponent.displayName = `WithAuth(${displayName})`;

  return WithAuthComponent;
};

export default withAuth;
