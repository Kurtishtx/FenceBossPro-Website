import type { Metadata } from "next";
import Script from "next/script";
import Footer from "./components/Footer";
import DemoPopup from "./components/DemoPopup";
import "./globals.css";
import MetaPixel from './components/MetaPixel';

export const metadata: Metadata = {
  /* Every route resolves its own canonical against this base, so a page reached as www vs
     non-www, with a trailing slash, or carrying ?fbclid=/?utm_source= all point at one URL
     instead of competing with each other. */
  metadataBase: new URL('https://www.fencebosspro.com'),
  alternates: { canonical: './' },

  title: 'FenceBossPro | Fence Company Software',
  description: "FenceBossPro is fence company software built by people who've run real jobs — estimating, job scheduling, crew dispatch, invoicing, and card-on-file billing. from $59/month, everything included.",
};


const structuredData = {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://fencebosspro.com/#organization","name":"FenceBossPro","url":"https://fencebosspro.com","logo":"https://fencebosspro.com/icon.png","description":"Fence company software with estimating, job scheduling, crew dispatch, invoicing, and card-on-file billing for fence contractors."},{"@type":"WebSite","@id":"https://fencebosspro.com/#website","url":"https://fencebosspro.com","name":"FenceBossPro","publisher":{"@id":"https://fencebosspro.com/#organization"}},{"@type":"SoftwareApplication","name":"FenceBossPro","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","description":"Fence company software with estimating, job scheduling, crew dispatch, invoicing, and card-on-file billing for fence contractors.","offers":{"@type":"AggregateOffer","lowPrice":"59","highPrice":"199","offerCount":"3","priceCurrency":"USD","description":"from $59/month flat — everything included, 14-day free trial."},"publisher":{"@id":"https://fencebosspro.com/#organization"}}]};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        {/* Meta Pixel — builds the retargeting audience. Inert until
            NEXT_PUBLIC_META_PIXEL_ID is set on the Vercel project. */}
        <MetaPixel />
        <DemoPopup />
        <Footer />
        <Script
          src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
