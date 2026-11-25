import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { createPrivateMetadata } from '../../lib/seo';

export const metadata: Metadata = createPrivateMetadata('Team Workspace');

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
