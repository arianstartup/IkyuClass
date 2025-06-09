// This utility helps in making authenticated API calls for admin panel

// In a real app, the admin secret/token would be managed more securely,
// possibly via an auth context after an admin login.
// For this simulation, we'll use a simple hardcoded value or an environment variable.
// This is NOT secure for production.

const ADMIN_AUTH_HEADER_KEY = 'X-Admin-Auth';
const ADMIN_AUTH_HEADER_VALUE = 'true'; // Matches the basic check in middleware

// Alternatively, to use the query parameter method:
// const ADMIN_SECRET_QUERY_PARAM = 'admin_secret';
// const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || "SUPER_SECRET_ADMIN_KEY_FOR_DEV_ONLY";

interface AdminApiOptions extends RequestInit {
  useQueryParam?: boolean; // To switch to query param method if desired
}

export const adminApiFetch = async (url: string, options: AdminApiOptions = {}) => {
  const headers = new Headers(options.headers || {});
  let fullUrl = url;

  // if (options.useQueryParam) {
  //   const separator = fullUrl.includes('?') ? '&' : '?';
  //   fullUrl = `${fullUrl}${separator}${ADMIN_SECRET_QUERY_PARAM}=${ADMIN_SECRET_KEY}`;
  // } else {
  //   headers.append(ADMIN_AUTH_HEADER_KEY, ADMIN_AUTH_HEADER_VALUE);
  // }

  // Sticking to header method as it's slightly cleaner for POST/PUT
  headers.append(ADMIN_AUTH_HEADER_KEY, ADMIN_AUTH_HEADER_VALUE);


  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    console.error('Admin API Error:', errorData);
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  // If response has no content (e.g. for a 204), don't try to parse JSON
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
};
