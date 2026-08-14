import type { Metadata } from "next";
import Script from "next/script";
import Footer from "./components/Footer";
import DemoPopup from "./components/DemoPopup";
import "./globals.css";

export const metadata: Metadata = {
  title: 'FenceBossPro | Fence Company Software',
  description: "FenceBossPro is fence company software built by people who've run real jobs — estimating, job scheduling, crew dispatch, invoicing, and card-on-file billing. $129/month, everything included.",
};


const structuredData = {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://fencebosspro.com/#organization","name":"FenceBossPro","url":"https://fencebosspro.com","logo":"https://fencebosspro.com/icon.png","description":"Fence company software with estimating, job scheduling, crew dispatch, invoicing, and card-on-file billing for fence contractors."},{"@type":"WebSite","@id":"https://fencebosspro.com/#website","url":"https://fencebosspro.com","name":"FenceBossPro","publisher":{"@id":"https://fencebosspro.com/#organization"}},{"@type":"SoftwareApplication","name":"FenceBossPro","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","description":"Fence company software with estimating, job scheduling, crew dispatch, invoicing, and card-on-file billing for fence contractors.","offers":{"@type":"Offer","price":"129","priceCurrency":"USD","description":"$129/month flat — everything included, 14-day free trial."},"publisher":{"@id":"https://fencebosspro.com/#organization"}}]};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
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
