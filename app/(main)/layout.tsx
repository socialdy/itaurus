import { Sidebar } from '@/components/ui/sidebar';

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

        <div className="flex-1 px-4 lg:px-8 pt-6">
          {children}
        </div>
      </main>
    </div>
  );
} 