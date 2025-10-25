export const getToken = (): string | null => {
  // This function safely accesses localStorage only on the client-side,
  // preventing errors during server-side rendering in Next.js.
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userToken');
  }
  return null;
};
