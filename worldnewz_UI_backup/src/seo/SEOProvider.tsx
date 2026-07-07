import { HelmetProvider } from 'react-helmet-async';
import type { ReactNode } from 'react';

interface SEOProviderProps {
  children: ReactNode;
}

export const SEOProvider = ({ children }: SEOProviderProps) => (
  <HelmetProvider>{children}</HelmetProvider>
);
