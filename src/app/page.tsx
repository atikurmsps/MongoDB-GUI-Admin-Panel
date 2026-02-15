'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/auth/register');
        const data = await res.json();

        if (data.exists) {
          router.push('/login');
        } else {
          router.push('/register');
        }
      } catch (err) {
        router.push('/login');
      }
    }
    checkStatus();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
