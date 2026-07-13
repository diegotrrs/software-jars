import { AppShell } from '@/components/app-shell';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return <AppShell>{children}</AppShell>;
};

export default AppLayout;
