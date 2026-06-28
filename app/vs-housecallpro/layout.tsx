import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FenceBossPro vs Housecall Pro | FenceBossPro',
  description: 'FenceBossPro vs Housecall Pro: spray-specific scheduling, circle-map routing, waiting list dispatch, and chemical compliance logs. See how they compare.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}