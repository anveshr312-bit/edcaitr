import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { createPrivateMetadata } from '../../lib/seo';

export const metadata: Metadata = createPrivateMetadata('Account & Security');

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
