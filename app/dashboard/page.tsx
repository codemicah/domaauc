'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/domains');
  }, [router]);

  return <div></div>;
}
