import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Videos | FenceBossPro',
  description: 'Short videos of every FenceBossPro feature: fence lines measured from satellite, job costing, the crew app, invoicing, estimates, texting, AI tools and more.',
  alternates: { canonical: 'https://fencebosspro.com/videos' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
