'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function CentreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams?.id) {
      router.replace(`/farmer/book?centreId=${resolvedParams.id}`);
    } else {
      router.replace('/farmer/centres');
    }
  }, [resolvedParams?.id, router]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
      Redirecting to unified procurement booking...
    </div>
  );
}
