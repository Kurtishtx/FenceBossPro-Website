import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fence Contractor Software for Canada | CAD Invoicing Built In — FenceBossPro',
  description:
    'Fence contractor software that invoices your customers in Canadian dollars — set your country to Canada and every invoice, card charge, and payment link bills in CAD through your own Canadian Stripe account. Estimates, install scheduling, crew dispatch, and a customer app. $129/month flat, 14-day free trial, no credit card.',
  alternates: { canonical: 'https://fencebosspro.com/fence-contractor-software-canada' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
