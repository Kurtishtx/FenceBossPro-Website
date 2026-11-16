'use client';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import SignupModal from '../components/SignupModal';

// Videos + thumbnails live on Cloudflare R2 (no bandwidth charges), not on this site.
const BASE = 'https://videos.bossprohq.com/fencebosspro';

// Play tracking (11/15): started / past halfway / finished, logged like pageviews (skipped for ?notrack=1 browsers).
function trackVideo(event: string, id: string) {
  try {
    let notrack = false;
    try { notrack = localStorage.getItem('bp_notrack') === '1'; } catch {}
    fetch('https://knjdbgroiyhvqwrpqzcx.supabase.co/functions/v1/demo-session', {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamRiZ3JvaXlodnF3cnBxemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTczMDMsImV4cCI6MjA5NTA3MzMwM30.zoExtkem-XZqU86S4yJjA_xOOaS1G0IPU2M9OAAza2g' },
      body: JSON.stringify({ product: 'fencebosspro', event, referrer: document.referrer || 'direct', landing_url: window.location.href.split('#')[0] + '#' + id, notrack }),
    }).catch(() => {});
  } catch { /* analytics only */ }
}

type V = { id: string; title: string; text: string; secs: number };
const GROUPS: { name: string; videos: V[] }[] = [
  { name: 'Getting started', videos: [
    { id: '01_overview', title: 'Your whole fence business in one app', text: 'Installs, repairs, crews, invoices and customer texts in one quick tour.', secs: 73 },
    { id: '02_setup', title: 'Set up your account', text: 'One Setup page shows what’s done and what’s left, from company info to texting and card processing.', secs: 62 },
    { id: '03_import', title: 'Switch from Jobber, Housecall Pro and others', text: 'Bring your customers over from another app or any spreadsheet in minutes.', secs: 58 },
  ] },
  { name: 'Jobs, routes and your crew', videos: [
    { id: '17_measuring', title: 'Measure fence lines from your desk', text: 'Draw the fence line on the satellite map and get the linear feet in seconds.', secs: 46 },
    { id: '23_job_board', title: 'Every crew’s week on one board', text: 'Installs, gates, repairs and staining by day, by crew and on a map.', secs: 55 },
    { id: '04_schedule_route', title: 'Schedule and route your day', text: 'Put repairs and gate jobs on a day, then sort the stops into driving order.', secs: 75 },
    { id: '05_crew_app', title: 'The crew app', text: 'Today’s jobs, gate codes, notes and on-the-way texts on every builder’s phone.', secs: 40 },
    { id: '10_reviews_tips', title: 'Crew reviews, tips and bonuses', text: 'Customers rate the crew and leave a tip, and it flows straight into payroll.', secs: 56 },
  ] },
  { name: 'Getting paid', videos: [
    { id: '07_estimates', title: 'Estimates customers approve online', text: 'Quote a fence in a minute, and the customer approves and adds a card from their phone.', secs: 69 },
    { id: '06_invoicing', title: 'Automatic invoicing and card charging', text: 'Finish the job, the invoice goes out and the card on file gets charged.', secs: 65 },
    { id: '25_job_costing', title: 'Know what every job really made', text: 'Job costing from real crew hours, lumber and materials.', secs: 37 },
    { id: '27_costs_receipts', title: 'Track every cost, receipt by receipt', text: 'Builders snap lumber and hardware receipts, AI fills them in, and you see where the money goes.', secs: 72 },
    { id: '20_reports', title: 'Reports that add themselves up', text: 'Sales, crew hours and what each builder brings in.', secs: 50 },
    { id: '19_integrations', title: 'QuickBooks, Zapier and Make', text: 'Connect your books and the rest of your tools.', secs: 38 },
  ] },
  { name: 'Your customers', videos: [
    { id: '08_client_app', title: 'The client app', text: 'Customers see their jobs, pay bills and book a stain and seal themselves.', secs: 34 },
    { id: '09_texting_alerts', title: 'Texting and automatic alerts', text: 'Night-before, on-the-way and crew-started texts that send themselves.', secs: 44 },
  ] },
  { name: 'AI and marketing', videos: [
    { id: '11_ai_receptionist', title: 'AI receptionist', text: 'An AI answers your phone 24/7, quotes fence prices, and sends you each call.', secs: 78 },
    { id: '12_ai_assistant', title: 'AI Assistant: ask your business anything', text: 'Ask who owes you or how busy you are, and get the answer in seconds.', secs: 34 },
    { id: '13_reviews_ai_replies', title: 'Google reviews with AI replies', text: 'Every review in one place, with a reply written for you.', secs: 54 },
    { id: '14_social_inbox', title: 'Social inbox and posting', text: 'Messages, comments, reviews and lead forms in one inbox, plus posts written for you.', secs: 80 },
    { id: '15_auto_posts', title: 'AI auto posts', text: 'Fence posts written and scheduled for you on the days you pick.', secs: 56 },
    { id: '16_neighbor_postcards', title: 'Neighbor postcards', text: 'Every finished fence tells the street who built it.', secs: 63 },
  ] },
];

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function Card({ v }: { v: V }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="vid-card" id={v.id.replace(/^\d+_/, '')}>
      <div className="vid-frame">
        {playing ? (
          <video src={`${BASE}/${v.id}.mp4`} poster={`${BASE}/${v.id}.jpg`} controls autoPlay playsInline preload="auto"
            onPlay={(e) => { const el = e.currentTarget as any; if (!el.dataset.p) { el.dataset.p = '1'; trackVideo('video_play', v.id); } }}
            onTimeUpdate={(e) => { const el = e.currentTarget as any; if (!el.dataset.h && el.duration && el.currentTime / el.duration >= 0.5) { el.dataset.h = '1'; trackVideo('video_half', v.id); } }}
            onEnded={(e) => { const el = e.currentTarget as any; if (!el.dataset.d) { el.dataset.d = '1'; trackVideo('video_done', v.id); } }} />
        ) : (
          <button className="vid-poster" onClick={() => setPlaying(true)} aria-label={`Play: ${v.title}`}>
            <img src={`${BASE}/${v.id}.jpg`} alt={v.title} loading="lazy" width={960} height={540} />
            <span className="vid-play">&#9658;</span>
            <span className="vid-len">{mmss(v.secs)}</span>
          </button>
        )}
      </div>
      <h3>{v.title}</h3>
      <p>{v.text}</p>
    </div>
  );
}

export default function VideosPage() {
  const openTrial = (el: HTMLElement) => { (window as any).__openSignup?.(1, el); };
  const all = GROUPS.flatMap((g) => g.videos);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': all.map((v) => ({
      '@type': 'VideoObject',
      name: `${v.title} | FenceBossPro`,
      description: v.text,
      thumbnailUrl: `${BASE}/${v.id}.jpg`,
      contentUrl: `${BASE}/${v.id}.mp4`,
      uploadDate: '2026-11-15',
      duration: `PT${Math.floor(v.secs / 60)}M${v.secs % 60}S`,
    })),
  };
  return (
    <>
      <Navbar onTrialClick={openTrial} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <style>{`
        .vid-wrap{max-width:1180px;margin:0 auto;padding:56px 20px 80px}
        section.vid-group{margin:0 0 56px;padding:0!important;min-height:0!important}
        .vid-group h2{font-size:26px;font-weight:800;color:var(--text);margin:0 0 20px}
        .vid-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:28px}
        .vid-card h3{font-size:18px;font-weight:800;color:var(--text);margin:14px 0 6px}
        .vid-card p{font-size:15px;color:var(--muted);line-height:1.6;margin:0}
        .vid-frame{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:var(--purple-deep);box-shadow:0 6px 22px rgba(19,5,32,.18)}
        .vid-frame video,.vid-poster img{width:100%;height:100%;display:block;object-fit:cover}
        .vid-poster{all:unset;cursor:pointer;display:block;width:100%;height:100%;position:relative}
        .vid-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:68px;height:68px;border-radius:50%;background:var(--orange);color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;padding-left:5px;box-shadow:0 6px 20px rgba(0,0,0,.35);transition:transform .15s}
        .vid-poster:hover .vid-play{transform:translate(-50%,-50%) scale(1.08)}
        .vid-len{position:absolute;right:10px;bottom:10px;background:rgba(0,0,0,.75);color:#fff;font-size:13px;font-weight:700;padding:3px 8px;border-radius:6px}
        @media (max-width:640px){.vid-grid{grid-template-columns:1fr}.vid-wrap{padding:36px 16px 60px}}
      `}</style>

      <div className="hero">
        <div className="hero-badge">Videos</div>
        <h1>See FenceBossPro in action</h1>
        <p>Short videos of every feature, recorded in the real app. Most are about a minute.</p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={(e) => openTrial(e.currentTarget as HTMLElement)}>Start Your 14-Day Free Trial</button>
        </div>
      </div>

      <div className="vid-wrap">
        {GROUPS.map((g) => (
          <section className="vid-group" key={g.name}>
            <h2>{g.name}</h2>
            <div className="vid-grid">{g.videos.map((v) => <Card key={v.id} v={v} />)}</div>
          </section>
        ))}
      </div>

      <div className="cta-band">
        <h2>Try it on your own business</h2>
        <p>14 days free. No card needed.</p>
        <div className="hero-btns">
          <button className="btn-primary" style={{ fontSize: '17px', padding: '18px 44px' }} onClick={(e) => openTrial(e.currentTarget as HTMLElement)}>Start Your 14-Day Free Trial</button>
        </div>
      </div>
      <SignupModal />
    </>
  );
}
