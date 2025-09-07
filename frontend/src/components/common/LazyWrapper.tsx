import React, { Suspense, forwardRef } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Higher-order component for lazy loading with proper typing
function withLazyLoadingInner<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return forwardRef<any, P>((props, ref) => (
    <LazyWrapper fallback={fallback}>
      <Component {...(props as P)} ref={ref} />
    </LazyWrapper>
  ));
}

// Type assertion to fix the generic forwardRef issue
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return withLazyLoadingInner(Component, fallback) as React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<any>
  >;
}

export default LazyWrapper;
