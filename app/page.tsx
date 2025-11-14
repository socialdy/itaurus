import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export default async function RootPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    // Redirect authenticated users to the dashboard
    redirect('/dashboard/');
  } else {
    // Middleware should handle redirecting non-authenticated users to /login
    // This page won't be reached by non-authenticated users due to middleware
    return null; // Or render a public landing page if you have one
  }
} 