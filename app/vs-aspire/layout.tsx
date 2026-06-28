import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FenceBossPro vs Aspire Software | FenceBossPro',
  description: 'FenceBossPro vs Aspire Software: purpose-built spray routes, flat $129/month pricing, and no enterprise implementation timeline. See how they compare.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
