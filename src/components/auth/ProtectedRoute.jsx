import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoading } from '@/components/ui/loading';

export function ProtectedRoute({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(router.asPath || '/financas');
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [loading, user, router]);

  if (loading || (!user && typeof window !== 'undefined')) {
    return <FullPageLoading />;
  }

  return children;
}
