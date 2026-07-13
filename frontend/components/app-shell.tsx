import { DesktopSidebar }  from '@/components/desktop-sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { TopBar }          from '@/components/top-bar';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <TopBar />
      <DesktopSidebar />
      <MobileBottomNav />
      <main className='pb-16 md:ml-16 md:pb-0'>{children}</main>
    </>
  );
};
