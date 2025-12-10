import { Sidebar } from '@/components/ui/sidebar';
import { UserProfile } from '@/components/ui/user-profile';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex min-h-screen bg-background flex-col lg:flex-row">
      <Sidebar user={session?.user} />
      <main className="flex-1 flex flex-col">
        <header className="hidden lg:flex h-16 items-center justify-end border-b border-border px-6 w-full flex-shrink-0">
          <UserProfile user={session?.user || null} />
        </header>
        <div className="flex-1 px-4 lg:px-8 pt-6">
          {children}
        </div>
      </main>
    </div>
  );
} 