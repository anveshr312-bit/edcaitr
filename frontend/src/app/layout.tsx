import type { ReactNode } from 'react';
import Link from 'next/link';
import './style.css';
export const metadata = { title: 'E-Cell AITR', description: 'E-Cell events and member network' };
export default function Layout({children}: {children: ReactNode}) {
  return <html lang="en"><body><header><strong>E-Cell AITR</strong><nav><Link href="/">Home</Link><Link href="/account">Account</Link></nav></header><main>{children}</main></body></html>;
}
