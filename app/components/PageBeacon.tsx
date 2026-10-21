'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/* Pageview tracker, mounted in the root layout so it fires on EVERY page: articles, landing pages,
   pricing, features. It used to live inside HeroDemo, which only renders on the home page, so a visitor
   who found an article through Google was never recorded, and Search Console clicks could not be matched.
   Rows land in demo_session_log (event 'pageview'). Visiting any page once with ?notrack=1 marks this
   browser as the owner's and its visits are dropped. */

const ENDPOINT = 'https://knjdbgroiyhvqwrpqzcx.supabase.co/functions/v1/demo-session';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamRiZ3JvaXlodnF3cnBxemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTczMDMsImV4cCI6MjA5NTA3MzMwM30.zoExtkem-XZqU86S4yJjA_xOOaS1G0IPU2M9OAAza2g';
const NOTRACK_KEY = 'bp_notrack';

function readNoTrack(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('notrack') === '1') localStorage.setItem(NOTRACK_KEY, '1');
    return localStorage.getItem(NOTRACK_KEY) === '1';
  } catch { return false; }
}

export default function PageBeacon() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);
  useEffect(() => {
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
        body: JSON.stringify({
          product: 'fencebosspro',
          event: 'pageview',
          // On a client-side route change document.referrer still holds the ORIGINAL outside source.
          referrer: document.referrer || 'direct',
          landing_url: window.location.href,
          notrack: readNoTrack(),
        }),
      }).catch(() => {});
    } catch { /* analytics only - never block the page */ }
  }, [pathname]);
  return null;
}
