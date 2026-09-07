'use client';

import { usePathname } from 'next/navigation';

// Site header and footer, hidden on /embed/ pages, which are loaded inside the admin
// overlay and should show only their content.
export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/embed/')) return null;
  return <>{children}</>;
}
