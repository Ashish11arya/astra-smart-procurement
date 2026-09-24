'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CentreLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/operations/login');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 text-center">
      <div className="space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-semibold">
          Redirecting to Authorised Personnel Login (/operations/login)...
        </p>
      </div>
    </div>
  );
}
