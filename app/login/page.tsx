import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import { getSession } from '@/lib/auth';
import { getSafeAdminRedirectPath } from '@/lib/auth-redirect';

interface LoginPageProps {
  searchParams: Promise<{
    redirect?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectParam = Array.isArray(params.redirect)
    ? params.redirect[0]
    : params.redirect;
  const redirectPath = getSafeAdminRedirectPath(redirectParam);
  const session = await getSession();

  if (session.isAdmin) {
    redirect(redirectPath);
  }

  return <LoginForm redirectPath={redirectPath} />;
}
