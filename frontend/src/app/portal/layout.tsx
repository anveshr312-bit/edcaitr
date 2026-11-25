import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { createPrivateMetadata } from '../../lib/seo';

export const metadata: Metadata = createPrivateMetadata('Participant Portal');

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
