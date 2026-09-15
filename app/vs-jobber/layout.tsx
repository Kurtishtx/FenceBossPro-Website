import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FenceBossPro vs Jobber | FenceBossPro',
  description: 'FenceBossPro vs Jobber: spray-native scheduling, flat from $59/month pricing, circle-map routing, and chemical compliance logs. Feature-by-feature comparison.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
