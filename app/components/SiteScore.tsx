'use client';
import { useState } from 'react';

/* "Check your website's Google score": runs Google's Lighthouse test (via PageSpeed Insights) on any
   site the visitor types, phone and desktop at the same time, and shows the 4 scores next to what
   we build. Calls our site-score function (our Google key; the keyless API quota is always used up).
   A test takes ~15-40s. */

type Scores = { performance: number; seo: number; accessibility: number; bestPractices: number };
const CATS: [keyof Scores, string][] = [['performance', 'Performance'], ['accessibility', 'Accessibility'], ['bestPractices', 'Best Practices'], ['seo', 'SEO']];
const FN = 'https://knjdbgroiyhvqwrpqzcx.supabase.co/functions/v1/site-score';

function color(n: number) { return n >= 90 ? '#16a34a' : n >= 50 ? '#f59e0b' : '#dc2626'; }

function Ring({ n, label, ours, text }: { n: number; label: string; ours?: boolean; text?: string }) {
  const c = ours ? '#16a34a' : color(n);
  return (
    <div style={{ textAlign: 'center', width: 80 }}>
      <div style={{ width: 62, height: 62, margin: '0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center',
        background: `conic-gradient(${c} ${n * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#16121f', display: 'grid', placeItems: 'center', color: c, fontWeight: 900, fontSize: 18 }}>{text || n}</div>
      </div>
      <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11.5, fontWeight: 700, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Row({ title, s, ours }: { title: string; s: Scores | null; ours?: boolean }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 8 }}>{title}</div>
      {s || ours ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {CATS.map(([k, l]) => ours
            ? <Ring key={k} n={k === 'seo' ? 100 : 92} text={k === 'seo' ? '100' : '90+'} label={l} ours />
            : <Ring key={k} n={(s as Scores)[k]} label={l} />)}
        </div>
      ) : <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>Google couldn&rsquo;t finish this test.</div>}
    </div>
  );
}

async function test(url: string, strategy: 'mobile' | 'desktop'): Promise<Scores> {
  const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, strategy }) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Google couldn’t test that site.');
  return { performance: j.performance, seo: j.seo, accessibility: j.accessibility, bestPractices: j.bestPractices };
}

export default function SiteScore() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [phone, setPhone] = useState<Scores | null>(null);
  const [desk, setDesk] = useState<Scores | null>(null);
  const [tested, setTested] = useState('');

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    let u = url.trim();
    if (!u) { setErr('Type a website address.'); return; }
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { new URL(u); } catch { setErr('That doesn’t look like a website address.'); return; }
    setErr(''); setPhone(null); setDesk(null); setTested(''); setBusy(true);
    const [p, d] = await Promise.allSettled([test(u, 'mobile'), test(u, 'desktop')]);
    if (p.status === 'rejected' && d.status === 'rejected') setErr((p.reason as Error).message);
    else {
      setPhone(p.status === 'fulfilled' ? p.value : null);
      setDesk(d.status === 'fulfilled' ? d.value : null);
      setTested(u.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
    }
    setBusy(false);
  }

  function getOne() {
    setOpen(false);
    const t = document.querySelector('.cta-trial') as HTMLElement | null;
    if (t) t.click();
  }

  return (
    <>
      <button type="button" className="ss-btn" onClick={() => setOpen(true)}>&#128200; Check your website&rsquo;s Google score &rarr;</button>
      {open && (
        <div onClick={() => !busy && setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 2147483000, display: 'grid', placeItems: 'center', padding: 16, overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#16121f', border: '1px solid rgba(255,255,255,.15)', borderRadius: 16, padding: '22px 20px', color: '#fff', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>How does your website score?</div>
            <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>See what your current website scores &mdash; or your competitors&rsquo;. We run Google&rsquo;s own website test (Lighthouse) live, on a phone and a desktop.</div>
            <form onSubmit={run} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourwebsite.com" inputMode="url" autoFocus aria-label="Website address"
                style={{ flex: '1 1 240px', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 16 }} />
              <button type="submit" disabled={busy} className="ss-go" style={{ padding: '12px 18px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 15, cursor: busy ? 'default' : 'pointer', color: '#fff' }}>
                {busy ? 'Testing…' : 'Check score'}
              </button>
            </form>
            {busy && <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginTop: 12 }}>Google is loading the site on a phone and a desktop. This takes 15&ndash;40 seconds&hellip;</div>}
            {err && <div style={{ color: '#fca5a5', fontSize: 14, marginTop: 12 }}>{err}</div>}
            {tested && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{tested}</div>
                <Row title={'\u{1F4F1} On a phone (what Google ranks)'} s={phone} />
                <Row title={'\u{1F5A5}️ On a desktop'} s={desk} />
                <Row title="A website built by us" s={null} ours />
                <button type="button" onClick={getOne} className="ss-go" style={{ width: '100%', marginTop: 18, padding: '13px', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', color: '#fff' }}>
                  Get a free website that scores 90+ &rarr;
                </button>
                <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 8, textAlign: 'center' }}>Google Lighthouse test via PageSpeed Insights. Scores can vary a few points from run to run.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
