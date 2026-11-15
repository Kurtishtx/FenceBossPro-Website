'use client';
import { useEffect } from 'react';
import PlanCompare from './components/PlanCompare';
import Navbar from './components/Navbar';
import SiteScore from './components/SiteScore';
import { pixelDemoStarted } from './components/MetaPixel';

const SBP_URL  = 'https://knjdbgroiyhvqwrpqzcx.supabase.co';
const SBP_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamRiZ3JvaXlodnF3cnBxemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTczMDMsImV4cCI6MjA5NTA3MzMwM30.zoExtkem-XZqU86S4yJjA_xOOaS1G0IPU2M9OAAza2g';
let sbpClient: any = null;
let sbpOpenForm = 0;

function getSbpClient() { if (!sbpClient) sbpClient = (window as any).supabase.createClient(SBP_URL, SBP_ANON); return sbpClient; }

function openSignupModal(n: number, btn: HTMLElement) {
  closeAllModals(); sbpOpenForm = n;
  const form = document.getElementById('sbp-form-' + n)!;
  const rect = btn.getBoundingClientRect();
  const formW = Math.min(420, window.innerWidth - 24);
  const centerX = rect.left + rect.width / 2;
  let top = rect.bottom + 12;
  let left = centerX - formW / 2;
  if (top + 460 > window.innerHeight) { top = rect.top - 460 - 12; if (top < 12) top = 12; }
  top = Math.max(12, top);
  left = Math.max(12, Math.min(left, window.innerWidth - formW - 12));
  form.style.top = top + 'px'; form.style.left = left + 'px'; form.style.display = 'block';
  document.getElementById('sbp-backdrop')!.style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeSignupModal(n: number) { document.getElementById('sbp-form-' + n)!.style.display = 'none'; document.getElementById('sbp-backdrop')!.style.display = 'none'; document.body.style.overflow = ''; sbpOpenForm = 0; }
function closeAllModals() { [1,2,3].forEach(i => { const el = document.getElementById('sbp-form-' + i); if (el) el.style.display = 'none'; }); const bd = document.getElementById('sbp-backdrop'); if (bd) bd.style.display = 'none'; document.body.style.overflow = ''; sbpOpenForm = 0; }
function sbpStep2(n: number) { const err = document.getElementById('sbp' + n + '-err1')!; err.style.display = 'none'; const first = (document.getElementById('sbp' + n + '-first') as HTMLInputElement).value.trim(); const last = (document.getElementById('sbp' + n + '-last') as HTMLInputElement).value.trim(); const comp = (document.getElementById('sbp' + n + '-company') as HTMLInputElement).value.trim(); const email = (document.getElementById('sbp' + n + '-email') as HTMLInputElement).value.trim(); if (!first || !last) return sbpShowErr(err as HTMLElement, 'Please enter your first and last name.'); if (!comp) return sbpShowErr(err as HTMLElement, 'Please enter your company name.'); if (!email || !email.includes('@')) return sbpShowErr(err as HTMLElement, 'Please enter a valid email address.'); (document.getElementById('sbp' + n + '-login-email') as HTMLInputElement).value = email; document.getElementById('sbp' + n + '-step1')!.style.display = 'none'; document.getElementById('sbp' + n + '-step2')!.style.display = 'block'; (document.getElementById('sbp' + n + '-password') as HTMLInputElement).focus(); }
function sbpBackToStep1(n: number) { document.getElementById('sbp' + n + '-step2')!.style.display = 'none'; document.getElementById('sbp' + n + '-step1')!.style.display = 'block'; document.getElementById('sbp' + n + '-err2')!.style.display = 'none'; }
async function sbpCreateAccount(n: number) {
  const err = document.getElementById('sbp' + n + '-err2')!; const btn = document.getElementById('sbp' + n + '-create-btn') as HTMLButtonElement; err.style.display = 'none';
  const email = (document.getElementById('sbp' + n + '-login-email') as HTMLInputElement).value.trim(); const password = (document.getElementById('sbp' + n + '-password') as HTMLInputElement).value; const confirm = (document.getElementById('sbp' + n + '-confirm') as HTMLInputElement).value;
  if (password.length < 8) return sbpShowErr(err as HTMLElement, 'Password must be at least 8 characters.'); if (password !== confirm) return sbpShowErr(err as HTMLElement, 'Passwords do not match.'); if (!(document.getElementById('sbp' + n + '-agree') as HTMLInputElement).checked) return sbpShowErr(err as HTMLElement, 'Please agree to the Terms of Service and Privacy Policy.');
  btn.disabled = true; btn.textContent = 'Creating your account…';
  try {
    const res = await fetch(SBP_URL + '/functions/v1/manage-users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SBP_ANON, 'apikey': SBP_ANON }, body: JSON.stringify({ action: 'create', email, password }) });
    const result = await res.json(); if (result.error) throw new Error(result.error);
    const sb = getSbpClient(); const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({ email, password }); if (signInErr) throw new Error(signInErr.message);
    const uid = signInData.user.id; const first = (document.getElementById('sbp' + n + '-first') as HTMLInputElement).value.trim(); const last = (document.getElementById('sbp' + n + '-last') as HTMLInputElement).value.trim(); const comp = (document.getElementById('sbp' + n + '-company') as HTMLInputElement).value.trim();
    await sb.auth.updateUser({ data: { full_name: first + ' ' + last } });
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('user_profiles').upsert({ id: uid, email, role: 'full_access', is_primary_owner: true, tenant_id: null, trial_ends_at: trialEnd, product: 'fencebosspro' }, { onConflict: 'id' });
    await sb.from('company_info').insert({ user_id: uid, company_name: comp, display_name: comp });
    await sb.from('platform_accounts').insert({ user_id: uid, email, plan: 'Monthly Subscription', plan_key: 'start', monthly_amount: 59, trial_ends_at: trialEnd, active: false });
    const reasons = ['Cancel Maintaining Self','Cancel Sold House','Cancel Too Expensive','Cancel Unknown','Dropping Customer','Sold House'].map(nm => ({ name: nm, active: true, user_id: uid }));
    await sb.from('cancellation_reasons').insert(reasons);
    document.getElementById('sbp' + n + '-step2')!.style.display = 'none'; document.getElementById('sbp' + n + '-success')!.style.display = 'block';
    let secs = 4; const cd = document.getElementById('sbp' + n + '-countdown')!; cd.textContent = 'Redirecting in ' + secs + ' seconds…';
    const iv = setInterval(() => { secs--; if (secs <= 0) { clearInterval(iv); window.location.href = 'https://my.fencebosspro.com/dashboard.html' + (typeof signInData!=='undefined'&&signInData&&signInData.session?'#access_token='+encodeURIComponent(signInData.session.access_token)+'&refresh_token='+encodeURIComponent(signInData.session.refresh_token):''); } else cd.textContent = 'Redirecting in ' + secs + ' second' + (secs === 1 ? '' : 's') + '…'; }, 1000);
  } catch (e: any) { sbpShowErr(err as HTMLElement, e.message || 'Something went wrong. Please try again.'); btn.disabled = false; btn.textContent = 'Create My Account'; }
}
function sbpShowErr(el: HTMLElement, msg: string) { el.textContent = msg; el.style.display = 'block'; }

export default function Home() {
  useEffect(() => {
    // Supabase is loaded once globally via <Script> in app/layout.tsx — no per-page load needed.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !sbpOpenForm) return;
      const n = sbpOpenForm;
      const form = document.getElementById('sbp-form-' + n);
      if (!form || form.style.display !== 'block') return;
      const step2 = document.getElementById('sbp' + n + '-step2');
      if (step2 && step2.style.display === 'block') sbpCreateAccount(n); else sbpStep2(n);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --purple-dark:#0f1720; --purple-mid:#0d141c; --purple-deep:#16202b; --orange:#2b6ca3; --orange-dark:#1f5680; --blue:#94a3b8; --text:#1a1a2e; --muted:#555; --light-bg:#f8f7fc; --border:#e4e0f0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: var(--text); background: #fff; line-height: 1.6; }
        .hero { background: linear-gradient(135deg, #0f1720 0%, #16202b 60%, #1f2d3d 100%); padding: 100px 40px 80px; text-align: center; position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(43,108,163,.15) 0%, transparent 70%); pointer-events: none; }
        .hero-badge { display: inline-block; background: rgba(43,108,163,.15); border: 1px solid rgba(43,108,163,.4); color: var(--orange); font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 24px; }
        .hero h1 { color: #fff; font-size: clamp(32px, 5vw, 58px); font-weight: 800; line-height: 1.15; max-width: 820px; margin: 0 auto 20px; }
        .hero h1 span { color: var(--orange); }
        .hero p { color: rgba(255,255,255,.75); font-size: clamp(16px, 2vw, 20px); max-width: 620px; margin: 0 auto 40px; }
        .hero-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-demo { display: inline-flex; align-items: center; gap: 9px; background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.32); color: #fff; font-size: 16px; font-weight: 700; padding: 15px 30px; border-radius: 8px; text-decoration: none; transition: background .18s, border-color .18s, transform .18s; }
        .btn-demo:hover { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.6); transform: translateY(-1px); }
        .btn-demo .btn-demo-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.22); }
        .btn-primary { background: var(--orange); color: #fff; padding: 16px 36px; border-radius: 6px; font-size: 16px; font-weight: 700; text-decoration: none; transition: background .2s, transform .1s; display: inline-block; cursor: pointer; border: none; }
        .btn-primary:hover { background: var(--orange-dark); transform: translateY(-1px); }
        .btn-secondary { background: transparent; color: #fff; padding: 16px 36px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; border: 2px solid rgba(255,255,255,.3); transition: border-color .2s, background .2s; display: inline-block; }
        .btn-secondary:hover { border-color: #fff; background: rgba(255,255,255,.05); }
        .hero-stats { display: flex; justify-content: center; gap: 50px; margin-top: 64px; flex-wrap: wrap; }
        .hero-stat-val { color: var(--orange); font-size: 36px; font-weight: 800; }
        .hero-stat-lbl { color: rgba(255,255,255,.6); font-size: 13px; margin-top: 2px; }
        section { padding: 90px 40px; }
        .section-label { display: inline-block; color: var(--orange); font-size: 12px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; margin-bottom: 12px; }
        .section-title { font-size: clamp(26px, 4vw, 40px); font-weight: 800; line-height: 1.2; margin-bottom: 16px; color: var(--text); }
        .section-sub { color: var(--muted); font-size: 17px; max-width: 600px; margin-bottom: 56px; }
        .centered { text-align: center; }
        .centered .section-sub { margin-left: auto; margin-right: auto; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }
        .feature-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 30px 28px; transition: box-shadow .2s, border-color .2s, transform .2s; }
        .feature-card:hover { box-shadow: 0 8px 32px rgba(15,23,32,.1); border-color: var(--orange); transform: translateY(-3px); }
        .feature-icon { font-size: 32px; margin-bottom: 14px; display: block; }
        .feature-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
        .feature-card p { color: var(--muted); font-size: 14px; line-height: 1.6; }
        .hub-card { display: block; text-decoration: none; }
        .hub-card h3 { color: var(--text); }
        .hub-card .hub-go { color: var(--orange); font-size: 13px; font-weight: 700; margin-top: 14px; display: inline-block; }
        .dark-section { background: linear-gradient(135deg, var(--purple-dark) 0%, var(--purple-deep) 100%); color: #fff; }
        .dark-section .section-title { color: #fff; }
        .dark-section .section-sub { color: rgba(255,255,255,.65); }
        .highlight-row { display: flex; align-items: center; gap: 60px; max-width: 1100px; margin: 0 auto; flex-wrap: wrap; }
        .highlight-row.reverse { flex-direction: row-reverse; }
        .highlight-text { flex: 1; min-width: 280px; }
        .highlight-text h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 800; line-height: 1.2; margin-bottom: 16px; }
        .highlight-text p { font-size: 16px; color: var(--muted); margin-bottom: 20px; }
        .highlight-visual { flex: 1; min-width: 280px; background: linear-gradient(135deg, var(--purple-deep) 0%, #1f2d3d 100%); border-radius: 14px; padding: 36px 32px; border: 2px solid rgba(43,108,163,.3); }
        .check-list { list-style: none; margin-top: 16px; }
        .check-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: var(--muted); margin-bottom: 12px; }
        .check-list li::before { content: '✓'; background: var(--orange); color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
        .mock-item { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; }
        .mock-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .mock-dot.orange { background: var(--orange); }
        .mock-dot.green { background: #22c55e; }
        .mock-dot.blue { background: var(--blue); }
        .mock-dot.yellow { background: #7ba4c5; }
        .mock-label { color: rgba(255,255,255,.85); font-size: 13px; font-weight: 600; }
        .mock-sub { color: rgba(255,255,255,.45); font-size: 11px; margin-top: 1px; }
        .mock-badge { margin-left: auto; background: var(--orange); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 10px; flex-shrink: 0; }
        .mock-badge.green-badge { background: #15803d; }
        .mock-badge.blue-badge { background: #2272c3; color: #fff; }
        .alert-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; max-width: 1100px; margin: 0 auto; }
        .alert-pill { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 16px 18px; display: flex; align-items: center; gap: 12px; }
        .alert-pill .ap-icon { font-size: 22px; flex-shrink: 0; }
        .alert-pill .ap-label { color: rgba(255,255,255,.9); font-size: 14px; font-weight: 600; }
        .alert-pill .ap-sub { color: rgba(255,255,255,.45); font-size: 12px; }
        .stats-band { background: var(--orange); padding: 56px 40px; }
        .stats-band-inner { display: flex; justify-content: center; gap: 60px; max-width: 1000px; margin: 0 auto; flex-wrap: wrap; }
        .stat-item { text-align: center; }
        .stat-item .val { font-size: 44px; font-weight: 800; color: #fff; line-height: 1; }
        .stat-item .lbl { color: rgba(255,255,255,.85); font-size: 14px; margin-top: 6px; }
        .pricing-grid { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; max-width: 1000px; margin: 0 auto; }
        .price-card { background: #fff; border: 2px solid var(--border); border-radius: 14px; padding: 36px 32px; width: 280px; position: relative; transition: box-shadow .2s, transform .2s; }
        .price-card:hover { box-shadow: 0 12px 40px rgba(15,23,32,.12); transform: translateY(-4px); }
        .price-card.featured { border-color: var(--orange); background: linear-gradient(180deg, #fff 0%, #fff8f2 100%); }
        .featured-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: var(--orange); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; white-space: nowrap; }
        .price-tier { font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .price-amount { font-size: 48px; font-weight: 800; color: var(--text); line-height: 1; }
        .price-amount sup { font-size: 22px; vertical-align: super; }
        .price-period { color: var(--muted); font-size: 13px; margin-bottom: 24px; margin-top: 4px; }
        .price-desc { color: var(--muted); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
        .price-features { list-style: none; margin-bottom: 32px; }
        .price-features li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text); padding: 6px 0; border-bottom: 1px solid var(--border); }
        .price-features li:last-child { border-bottom: none; }
        .price-features li::before { content: '✓'; color: var(--orange); font-weight: 700; flex-shrink: 0; }
        .price-btn { display: block; text-align: center; padding: 13px; border-radius: 6px; font-weight: 700; font-size: 15px; text-decoration: none; transition: background .2s; cursor: pointer; border: none; }
        .price-btn-primary { background: var(--orange); color: #fff; }
        .price-btn-primary:hover { background: var(--orange-dark); }
        .price-btn-outline { border: 2px solid var(--orange); color: var(--orange); }
        .price-btn-outline:hover { background: var(--orange); color: #fff; }
        .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; }
        .testimonial-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 28px 26px; }
        .testimonial-stars { color: var(--orange); font-size: 18px; margin-bottom: 12px; letter-spacing: 2px; }
        .testimonial-body { font-size: 15px; color: var(--muted); line-height: 1.7; margin-bottom: 20px; font-style: italic; }
        .testimonial-author { font-weight: 700; font-size: 14px; color: var(--text); }
        .testimonial-role { font-size: 12px; color: var(--muted); }
        .cta-band { background: linear-gradient(135deg, var(--purple-dark) 0%, #1f2d3d 100%); text-align: center; padding: 100px 40px; position: relative; overflow: hidden; }
        .cta-band::before { content: ''; position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(43,108,163,.12) 0%, transparent 70%); pointer-events: none; }
        .cta-band h2 { color: #fff; font-size: clamp(28px, 4vw, 46px); font-weight: 800; margin-bottom: 16px; }
        .cta-band p { color: rgba(255,255,255,.7); font-size: 18px; margin-bottom: 40px; max-width: 560px; margin-left: auto; margin-right: auto; }
        footer { background: var(--purple-dark); padding: 50px 40px 30px; border-top: 1px solid rgba(255,255,255,.08); }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 32px; padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,.08); }
        .footer-brand .leaf { font-size: 28px; display: block; margin-bottom: 4px; }
        .footer-brand .name { color: #fff; font-size: 18px; font-weight: 700; }
        .footer-brand .sub { color: var(--blue); font-size: 12px; }
        .footer-brand p { color: rgba(255,255,255,.5); font-size: 13px; margin-top: 10px; max-width: 220px; line-height: 1.5; }
        .footer-links { color: rgba(255,255,255,.4); font-size: 13px; margin-top: 20px; text-align: center; }
        .footer-links a { color: rgba(255,255,255,.5); text-decoration: none; }
        .footer-links a:hover { color: #fff; }
        .premium-band { background: linear-gradient(135deg, var(--purple-dark) 0%, #18222e 100%); padding: 90px 40px; text-align: center; position: relative; overflow: hidden; }
        .premium-band::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(43,108,163,.1) 0%, transparent 65%); pointer-events: none; }
        .premium-band h2 { color: #fff; font-size: clamp(26px, 4vw, 44px); font-weight: 800; line-height: 1.2; max-width: 860px; margin: 0 auto 18px; }
        .premium-band h2 span { color: var(--orange); }
        .premium-band > p { color: rgba(255,255,255,.65); font-size: 17px; max-width: 700px; margin: 0 auto 52px; line-height: 1.8; }
        .premium-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; max-width: 1100px; margin: 0 auto; }
        .premium-card { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 28px 24px; text-align: left; transition: border-color .2s; }
        .premium-card:hover { border-color: var(--orange); }
        .premium-card-icon { font-size: 28px; margin-bottom: 14px; }
        .premium-card h4, .premium-card h3 { color: #fff; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .premium-card p { color: rgba(255,255,255,.52); font-size: 13px; line-height: 1.6; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .stat-cell { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 12px 14px; }
        .stat-val { color: var(--orange); font-size: 18px; font-weight: 800; }
        .stat-lbl { color: rgba(255,255,255,.42); font-size: 11px; margin-top: 1px; }
        .stat-cell.full { grid-column: span 2; }
        .stat-cell.full .stat-val { color: #fff; font-size: 13px; font-weight: 600; }
        .simple-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; }
        .simple-card { background: #fff; border: 1.5px solid var(--border); border-radius: 12px; padding: 30px 26px; transition: border-color .2s, box-shadow .2s, transform .15s; }
        .simple-card:hover { border-color: var(--orange); box-shadow: 0 6px 24px rgba(43,108,163,.1); transform: translateY(-2px); }
        .simple-num { font-size: 40px; font-weight: 800; color: var(--orange); opacity: .72; line-height: 1; margin-bottom: 12px; }
        .simple-card h3 { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .simple-card p { color: var(--muted); font-size: 14px; line-height: 1.6; }
        @media (max-width: 700px) {
          nav { padding: 0 20px; } .nav-links { display: none; }
          section { padding: 60px 20px; } .hero { padding: 70px 20px 60px; }
          .hero-stats { gap: 30px; } .highlight-row, .highlight-row.reverse { flex-direction: column; }
          .stats-band-inner { gap: 36px; } footer { padding: 40px 20px 20px; }
        }
      `}</style>

      <Navbar onTrialClick={(el) => openSignupModal(1, el)} />

      {/* ═══ PRICE + LIVE DEMO ═══ */}
      <div style={{background:'linear-gradient(135deg, #0f1720 0%, #16202b 60%, #1f2d3d 100%)', padding:'clamp(76px,7vw,80px) clamp(14px,4vw,40px) 0', textAlign:'center'}}>
        {/* ═══ AI ANSWERING — headline feature ═══ */}
        <style>{`
          @keyframes aiGlow { 0%,100% { box-shadow: 0 0 0 1px rgba(43,108,163,.55), 0 12px 40px rgba(43,108,163,.25); } 50% { box-shadow: 0 0 0 1px rgba(128,167,200,.9), 0 14px 56px rgba(43,108,163,.45); } }
          @keyframes aiStar { 0%,100% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(18deg) scale(1.15); } }
          .ai-card { max-width: 900px; margin: 0 auto clamp(28px,4vw,40px); text-align: left; border-radius: 18px; padding: clamp(20px,3vw,30px) clamp(18px,3.4vw,34px); background: linear-gradient(135deg, rgba(43,108,163,.16) 0%, rgba(47,60,75,.96) 55%, rgba(43,108,163,.10) 100%); animation: aiGlow 3.2s ease-in-out infinite; position: relative; }
          .ai-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
          .ai-star { font-size: 26px; display: inline-block; animation: aiStar 2.4s ease-in-out infinite; filter: drop-shadow(0 0 8px rgba(255,190,90,.8)); }
          .ai-tag { font-size: 11px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; color: #fff; background: #2b6ca3; border-radius: 20px; padding: 4px 11px; }
          .ai-soon { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: rgb(128,167,200); border: 1px solid rgba(128,167,200,.5); border-radius: 20px; padding: 3px 10px; }
          .ai-h { color: #fff; font-size: clamp(24px,3.6vw,38px); font-weight: 800; line-height: 1.15; margin: 0 0 8px; }
          .ai-h b { color: #2b6ca3; }
          .ai-p { color: rgba(255,255,255,.82); font-size: clamp(15px,1.8vw,17px); line-height: 1.55; margin: 0 0 16px; max-width: 760px; }
          .ai-chips { display: flex; flex-wrap: wrap; gap: 8px; }
          .ai-chip { color: #fff; font-size: 13px; font-weight: 700; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16); border-radius: 20px; padding: 6px 12px; }
          .top-h { color: #fff; font-size: clamp(24px,3.6vw,40px); font-weight: 800; line-height: 1.15; margin: 0 auto clamp(14px,2vw,20px); max-width: 900px; }
          .top-h span { color: #2b6ca3; }
          .addons-label { color: #ffffff; font-size: clamp(26px,3.6vw,40px); font-weight: 900; letter-spacing: 3px; text-transform: uppercase; text-align: center; margin: 8px 0 14px; }
          .top-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin: 4px 0 clamp(26px,4vw,40px); }
          .cta-demo { background: #2b6ca3; color: #fff; font-weight: 800; font-size: 17px; padding: 15px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 10px 30px rgba(43,108,163,.45); }
          .cta-trial { background: transparent; color: #fff; font-weight: 800; font-size: 17px; padding: 14px 26px; border-radius: 10px; text-decoration: none; border: 2px solid rgba(255,255,255,.5); }
          /* Add-ons sit last in the dark band here (the picture is above them), so the grid carries the band's bottom padding. */
          .addons { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; max-width: 1200px; margin: 0 auto; padding-bottom: clamp(40px,6vw,80px); align-items: stretch; }
          .addons .ai-card { margin: 0; max-width: none; }
          .addons .ai-h { font-size: clamp(22px,2.4vw,28px); }
          @media (max-width: 900px) { .addons { grid-template-columns: 1fr; } }
          .ss-btn { margin-top: 4px; background: #2b6ca3; color: #fff; border: none; border-radius: 10px; padding: 12px 18px; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
          .ss-go { background: #2b6ca3; }
          .hero-mock { display: block; width: 100%; max-width: 1200px; height: auto; margin: 0 auto; }
          .ai-pill { display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; max-width: 900px; margin: 0 auto clamp(18px,3vw,26px); padding: 8px 16px 8px 12px; border-radius: 30px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.9); font-size: clamp(13px,1.6vw,15px); line-height: 1.35; animation: aiGlow 3.2s ease-in-out infinite; }
          .ai-pill .ai-star { font-size: 18px; }
          .ai-pill b { color: #fff; } .ai-pill .ai-price { color: #2b6ca3; }
        `}</style>
        <h2 className="top-h">CRM &amp; Scheduling Software for <span>Fence &amp; Gate Contractors</span></h2>

        {/* Price up top, above the demo — same order sprayboss-website uses. */}
        <div style={{textAlign:'center', marginBottom:'clamp(22px,3vw,32px)'}}>
          <div style={{display:'inline-flex', alignItems:'baseline', gap:'12px', flexWrap:'wrap', justifyContent:'center', color:'#fff'}}>
            <span style={{fontSize:'clamp(30px,4.6vw,46px)', fontWeight:800, lineHeight:1}}><span style={{fontSize:'.46em', fontWeight:700, color:'rgba(255,255,255,.6)'}}>CRM Software starting at </span>$59<span style={{fontSize:'.46em', fontWeight:700, color:'rgba(255,255,255,.6)'}}>/month</span></span>
            <span style={{fontSize:'clamp(16px,2.2vw,22px)', fontWeight:800, color:'var(--orange)'}}>&middot; 14-Day Free Trial</span>
          </div>
          <div style={{color:'rgba(255,255,255,.6)', fontSize:'13px', fontWeight:600, marginTop:'7px', letterSpacing:'.3px'}}>No credit card required &middot; Cancel anytime</div>
        </div>
        <div className="top-cta"><a href="https://my.fencebosspro.com/demo.html" target="_blank" rel="noopener" className="cta-demo" onClick={(e) => { if (typeof window !== 'undefined' && screen.availWidth > 900) { e.preventDefault(); window.open((e.currentTarget as HTMLAnchorElement).href, 'bossprodemo', 'width=' + screen.availWidth + ',height=' + screen.availHeight + ',left=0,top=0,resizable=yes,scrollbars=yes'); }  try { if (localStorage.getItem('bp_notrack') !== '1') pixelDemoStarted(); } catch (e) { pixelDemoStarted(); } }}>&#9654; Try the Live Demo</a><a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="cta-trial">Start Free Trial</a></div>
        <link rel="preload" as="image" href="/hero-mockup.webp" fetchPriority="high" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* 10/31 owner: highlight offline crew app + QuickBooks auto-sync */}
        <div className="hl-band" style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:16, maxWidth:1000, margin:'0 auto 22px', padding:'0 16px'}}>
          <div style={{flex:'1 1 300px', maxWidth:480, background:'rgba(255,255,255,.07)', border:'2px solid #facc15', borderRadius:14, padding:'16px 18px', boxShadow:'0 0 24px rgba(250,204,21,.18)'}}>
            <div style={{display:'flex', alignItems:'center', gap:10, fontWeight:900, fontSize:19, color:'#fff', marginBottom:6}}><span style={{fontSize:26}}>&#128246;</span>Works even when you&apos;re offline</div>
            <p style={{margin:0, color:'#e5e7eb', fontSize:15, lineHeight:1.55}}>No signal? No problem. The crew app keeps working: jobs, notes, photos and estimates save on the phone and sync the moment you&apos;re back online.</p>
          </div>
          <div style={{flex:'1 1 300px', maxWidth:480, background:'rgba(255,255,255,.07)', border:'2px solid #facc15', borderRadius:14, padding:'16px 18px', boxShadow:'0 0 24px rgba(250,204,21,.18)'}}>
            <div style={{display:'flex', alignItems:'center', gap:10, fontWeight:900, fontSize:19, color:'#fff', marginBottom:6}}><span style={{fontSize:26}}>&#128260;</span>QuickBooks syncs automatically every 5 minutes</div>
            <p style={{margin:0, color:'#e5e7eb', fontSize:15, lineHeight:1.55}}>Connect QuickBooks Online with one click. Your customers, invoices and payments sync to QuickBooks every 5 minutes, so there&apos;s no double entry.</p>
          </div>
        </div>
        <div className="integ-strip" style={{display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:'10px 14px', maxWidth:1000, margin:'0 auto clamp(26px,4vw,40px)', color:'rgba(255,255,255,.82)', fontSize:'clamp(14px,1.7vw,16px)', textAlign:'center'}}>
          <span style={{fontWeight:800, color:'#fff'}}>Integrates with</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1f1f1f', borderRadius:20, padding:'6px 14px', fontWeight:800}}><span aria-hidden="true" style={{width:10, height:10, borderRadius:'50%', background:'#ff4f00'}}></span>Zapier</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1f1f1f', borderRadius:20, padding:'6px 14px', fontWeight:800}}><span aria-hidden="true" style={{width:10, height:10, borderRadius:'50%', background:'#6d00cc'}}></span>Make</span>
          <span style={{fontWeight:800, color:'#fff', marginLeft:6}}>Payroll</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1f1f1f', borderRadius:20, padding:'6px 14px', fontWeight:800}}><span aria-hidden="true" style={{width:10, height:10, borderRadius:'50%', background:'#f45d48'}}></span>Gusto</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1f1f1f', borderRadius:20, padding:'6px 14px', fontWeight:800}}><span aria-hidden="true" style={{width:10, height:10, borderRadius:'50%', background:'#2ca01c'}}></span>QuickBooks</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1f1f1f', borderRadius:20, padding:'6px 14px', fontWeight:800}}><span aria-hidden="true" style={{width:10, height:10, borderRadius:'50%', background:'#d0271d'}}></span>ADP</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:7, background:'#fff', color:'#1f1f1f', borderRadius:20, padding:'6px 14px', fontWeight:800}}><span aria-hidden="true" style={{width:10, height:10, borderRadius:'50%', background:'#004b8d'}}></span>Paychex</span>
          <span>Connect to thousands of apps, and run payroll: hours, overtime, tips &amp; bonuses</span>
        </div>
        <img src="/hero-mockup.webp" srcSet="/hero-mockup-640.webp 640w, /hero-mockup.webp 1200w" sizes="(max-width: 700px) 100vw, 1200px" fetchPriority="high" decoding="async" alt="FenceBossPro software on a laptop with the AI Assistant button and a hand-drawn map lasso, plus the client app and crew app on phones" className="hero-mock" width={1600} height={880} />
        <div className="addons-label" style={{marginTop:'clamp(28px,4vw,44px)'}}>Add-ons</div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.82)', fontSize: 'clamp(14px,1.7vw,16px)', lineHeight: 1.55, margin: '-6px auto 18px', maxWidth: 720 }}>All optional &mdash; use the ones you want, skip the ones you don&apos;t. Everything else in FenceBossPro works the same either way, and you can turn any of them on or off anytime.</p>
        <div className="addons">
        <div className="ai-card">
          <div className="ai-top">
            <span className="ai-star" aria-hidden="true">&#11088;</span>
            <span className="ai-tag">AI Answering</span>
            <span className="ai-soon">New Add-On</span>
          </div>
          <h2 className="ai-h">An AI receptionist for only <b>49&cent; a minute</b></h2>
          <p className="ai-p ai-vol" style={{ fontWeight: 700, marginTop: 4 }}>Answering 100+ calls a day? Email <a href="mailto:Support@bossprohq.com" style={{ color: 'inherit', textDecoration: 'underline' }}>Support@bossprohq.com</a> for our 29&cent; volume rate.</p>
          <p className="ai-p">The most real, human-sounding AI on the market &mdash; and it&apos;s built into FenceBossPro, so it doesn&apos;t just take messages. It knows your customers and your CRM, tells them when you&apos;re coming, skips and reschedules services, tells existing customers your pricing and adds new services, sends a secure form to update their card, and takes down new customers for you. 24/7. You only pay when it answers.</p>
          <div className="ai-chips">
            <span className="ai-chip">&#128222; Answers every call, 24/7</span>
            <span className="ai-chip">&#129504; Knows your customers &amp; CRM</span>
            <span className="ai-chip">&#128197; Skips &amp; reschedules</span>
            <span className="ai-chip">&#128178; Quotes &amp; adds services</span>
            <span className="ai-chip">&#128179; Sends card-update form</span>
            <span className="ai-chip">&#128221; Takes new leads</span>
            <span className="ai-chip">&#9989; No monthly fee</span>
          </div>
        </div>
        <div className="ai-card">
          <div className="ai-top">
            <span className="ai-star" aria-hidden="true">&#10024;</span>
            <span className="ai-tag">AI Assistant</span>
            <span className="ai-soon">Included on every plan</span>
          </div>
          <h2 className="ai-h">An AI office assistant that <b>does the work</b></h2>
          <p className="ai-p ai-vol" style={{ fontWeight: 700, marginTop: 4 }}>Included on every plan &mdash; see the plans below for how many questions each one comes with.</p>
          <p className="ai-p">Just tell it what to do &mdash; like you&apos;d tell your office manager. It&apos;s built into FenceBossPro, so it knows your customers, your schedule and your money. It schedules and moves visits, adds plans at your price-table prices, texts customers, sends invoices and card forms, runs reports like your sales tax, and opens any page you ask for. It shows you every change first, and nothing happens until you press Confirm.</p>
          <div className="ai-chips">
            <span className="ai-chip">&#128197; Schedules &amp; moves visits</span>
            <span className="ai-chip">&#10133; Adds plans &amp; customers</span>
            <span className="ai-chip">&#128172; Texts customers</span>
            <span className="ai-chip">&#128196; Sends invoices</span>
            <span className="ai-chip">&#128202; Reports in seconds</span>
            <span className="ai-chip">&#129517; Opens any page</span>
            <a className="ai-chip" href="#ai-assistant" style={{ textDecoration: 'none' }}>&#128064; See it work &rarr;</a>
          </div>
        </div>
        <div className="ai-card" style={{ gridColumn: '1 / -1' }}>
          <div className="ai-top">
            <span className="ai-star" aria-hidden="true">&#128236;</span>
            <span className="ai-tag">Neighbor Postcards</span>
            <span className="ai-soon">New Add-On</span>
          </div>
          <h2 className="ai-h">Every finished job mails <b>your neighbors</b></h2>
          <p className="ai-p ai-vol" style={{ fontWeight: 700, marginTop: 4 }}>$1.59 a postcard, printing and postage included. No monthly fee.</p>
          <p className="ai-p" style={{ marginTop: -6 }}>Mailed within 1&ndash;2 business days of the job, First Class. Usually arrives 5&ndash;10 business days after that.</p>
          <p className="ai-p">When your crew finishes a job, FenceBossPro automatically mails your postcard to the closest homes on that street &mdash; 5, 10, 20 or as many as you want &mdash; and skips anyone who&apos;s already your customer. Pick a template or make it 100% your own with the drag-and-drop designer, set a monthly budget, and see every card that went out. Or pick properties on your list and mail around all of them at once.</p>
          <div className="ai-chips">
            <span className="ai-chip">&#128236; Mails after every job</span>
            <span className="ai-chip">&#127969; Closest neighbors, not random</span>
            <span className="ai-chip">&#128683; Skips current customers</span>
            <span className="ai-chip">&#127912; Templates or fully custom</span>
            <span className="ai-chip">&#128207; QR code to book</span>
            <span className="ai-chip">&#128176; Monthly budget cap</span>
          </div>
        </div>
        <div className="ai-card" style={{ gridColumn: '1 / -1' }}>
          <div className="ai-top">
            <span className="ai-star" aria-hidden="true">&#129534;</span>
            <span className="ai-tag">Costs &amp; Receipts</span>
            <span className="ai-soon">New &middot; Included</span>
          </div>
          <h2 className="ai-h">Snap a receipt. <b>See where the money goes.</b></h2>
          <p className="ai-p ai-vol" style={{ fontWeight: 700, marginTop: 4 }}>Included on every plan. Each AI receipt read uses 1 AI question from your plan.</p>
          <p className="ai-p">In the FenceBossPro crew app, your techs tap Menu &gt; Receipts and take a picture. AI reads the amount, store and date and picks the cost type, then they pick the truck and the job. No signal? It saves on the phone and uploads later. In the office, Costs &amp; Receipts adds it all up by type, truck, employee, job and month for any dates. Make your own cost types like Gas, Parts, Supplies and Repairs, add costs with no receipt like insurance or software, and export it for your bookkeeper. Receipts tied to a job count as materials in job costing, so every job shows its real profit.</p>
          <div className="ai-chips">
            <span className="ai-chip">&#128248; Snap a receipt</span>
            <span className="ai-chip">&#129302; AI fills it in</span>
            <span className="ai-chip">&#127991;&#65039; Your own cost types</span>
            <span className="ai-chip">&#128666; By truck &amp; job</span>
            <span className="ai-chip">&#128202; Totals by type &amp; month</span>
            <span className="ai-chip">&#128246; Works offline</span>
            <span className="ai-chip">&#128176; Real profit per job</span>
          </div>
        </div>
        <div className="ai-card" style={{ gridColumn: '1 / -1' }}>
          <div className="ai-top">
            <span className="ai-star" aria-hidden="true">&#127760;</span>
            <span className="ai-tag">Free Website</span>
            <span className="ai-soon">Included</span>
          </div>
          <h2 className="ai-h">A professional website, <b>free</b> with any paid plan</h2>
          <p className="ai-p ai-vol" style={{ fontWeight: 700, marginTop: 4 }}>Websites like this often cost $5,000&ndash;$15,000 to have built. Yours is free.</p>
          <p className="ai-p">We build it for you &mdash; a perfectly built 200&ndash;300 page website with a free domain, or use your own. Built to score 90+ on Google, and 100 on SEO, and we send you the score report once it&apos;s built. Fast on every phone, and every form on it goes straight into FenceBossPro as a new lead.</p>
          <div className="ai-chips">
            <span className="ai-chip">&#127760; Free domain (or use yours)</span>
            <span className="ai-chip">&#128196; 200&ndash;300 pages</span>
            <span className="ai-chip">&#128200; 90+ and 100 on SEO</span>
            <span className="ai-chip">&#128221; Forms flow into your CRM</span>
            <span className="ai-chip">&#128241; Mobile-perfect</span>
            <span className="ai-chip">&#128736; We build it for you</span>
          </div>
          <p className="ai-p" style={{margin:'14px 0 10px'}}>Compare our score to any other website you&apos;ve been quoted &mdash; or the one you have now.</p>
          <SiteScore />
        </div>
        </div>
      </div>

      {/* The 3 plans, right after the top picture and before the real-picture sections (owner, 10/30). */}
      <PlanCompare onTrial={(el) => openSignupModal(1, el)} />

      {/* ═══ BILLING DEEP DIVE ═══ */}
      <section id="billing" style={{background:'var(--light-bg)'}}>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Invoicing &amp; Billing</span>
            <h2>Get Paid Faster. Chase Less.</h2>
            <p>Build a bid in minutes, text or email it straight from the platform, and let customers accept with a single tap. The moment they accept, collect a deposit, schedule the install, and convert the bid to an invoice &mdash; all without leaving FenceBossPro.</p>
            <p><strong>Fully customizable, top to bottom.</strong> Change every color, choose exactly what shows and what doesn&apos;t, and pick from over 100 preloaded header photos &mdash; or upload your own photos and logos.</p>
            <ul className="check-list">
              <li>Estimate builder with your full fence material catalog and line items</li>
              <li>Email and text bids with custom branded templates</li>
              <li>Customer-facing bid page with Accept / Decline buttons</li>
              <li>Collect deposits up front before you order materials</li>
              <li>Progress billing in stages on multi-day fence builds</li>
              <li>Automatic status tracking: Draft &rarr; Sent &rarr; Accepted &rarr; Invoiced</li>
              <li>Card-on-file for fast, secure payment collection</li>
              <li>Sales tax management by jurisdiction with tax reports</li>
              <li>Full payment history with method, date, and reference tracking</li>
            </ul>
          </div>
          <div className="highlight-visual" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', alignItems:'start', padding:'24px', background:'#7d838c', border:'none'}}>
              <figure style={{margin:0}}>
                <figcaption style={{color:'#ffffff', fontWeight:700, fontSize:'12px', textAlign:'center', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px'}}>Branded Estimate</figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/branded-estimate-v5.webp" width={900} height={2397} loading="lazy" decoding="async" alt="Branded estimate email with the company logo, a header photo, service badges and an Approve Estimate button" style={{display:'block', width:'100%', height:'auto', borderRadius:'8px', boxShadow:'0 10px 30px rgba(0,0,0,.35)', border:'3px solid #ffffff'}} />
              </figure>
              <figure style={{margin:0}}>
                <figcaption style={{color:'#ffffff', fontWeight:700, fontSize:'12px', textAlign:'center', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px'}}>Branded Invoice</figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/branded-invoice-v5.webp" width={900} height={1681} loading="lazy" decoding="async" alt="Branded invoice email with line items, sales tax, amount due and a Pay Now button" style={{display:'block', width:'100%', height:'auto', borderRadius:'8px', boxShadow:'0 10px 30px rgba(0,0,0,.35)', border:'3px solid #ffffff'}} />
              </figure>
          </div>
        </div>
      </section>

      {/* ═══ MEETINGS: real screenshots of the Meetings page and Meeting Alerts (10/29) ═══ */}
      <section id="ai-assistant" aria-label="AI office assistant" style={{ background: '#ffffff', padding: 'clamp(44px,7vw,80px) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 'clamp(24px,4vw,48px)', alignItems: 'center' }}>
          <figure style={{ margin: 0, background: '#7d838c', borderRadius: 16, padding: 'clamp(14px,2.5vw,24px)' }}>
            <figcaption style={{ color: '#ffffff', fontWeight: 700, fontSize: 12, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>A Real Task, Start to Finish</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ai-assistant.webp" width={720} height={938} loading="lazy" decoding="async" alt="AI Assistant scheduling a Mosquito Control visit for Tuesday, with a Confirm card" style={{ display: 'block', width: '100%', maxWidth: 420, margin: '0 auto', height: 'auto', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,.35)', border: '3px solid #ffffff' }} />
          </figure>
          <div>
            <span style={{ display: 'inline-block', color: '#ff6a00', fontWeight: 900, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>AI Assistant</span>
            <h2 style={{ color: '#111827', fontSize: 'clamp(26px,3.8vw,42px)', fontWeight: 900, lineHeight: 1.12, margin: '0 0 12px' }}>Your AI Office Assistant. Just Tell It What To Do.</h2>
            <p style={{ color: '#4b5563', fontSize: 'clamp(15px,1.9vw,18px)', lineHeight: 1.7, margin: '0 0 14px' }}>It&apos;s built right into FenceBossPro and knows your customers, your schedule and your money. Type "Schedule Mary Jones&apos;s Mosquito Control for this Tuesday" and it finds the job, picks the date and shows you a card. Nothing changes until you press Confirm.</p>
            <p style={{ color: '#111827', fontSize: 15.5, fontWeight: 800, margin: '0 0 10px' }}>Talk to it like you&apos;d talk to your office manager:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'grid', gap: '8px' }}>
              {[
                ['"Schedule the Smiths for Tuesday"', 'Done'],
                ['"Add a plan for Dirk at $50 a visit"', 'Done'],
                ['"Text Mary we\'re running late"', 'Sent'],
                ['"Take me to unpaid invoices"', 'Opens the page'],
                ['"How much sales tax did I collect last month?"', 'Answered in seconds'],
                ['"How do I set up auto-billing?"', 'Explains it, with an Open button'],
              ].map(([say, did]) => (
                <li key={say} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px', background: '#f3f4f6', borderRadius: 10, padding: '9px 12px', fontSize: 15, lineHeight: 1.45 }}>
                  <span style={{ color: '#111827', fontStyle: 'italic', fontWeight: 600 }}>{say}</span>
                  <span style={{ color: '#16a34a', fontWeight: 900, whiteSpace: 'nowrap' }}>&rarr; {did}</span>
                </li>
              ))}
            </ul>
            <p style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6, margin: '0 0 12px' }}>It shows you every change first. Nothing happens until you press <b>Confirm</b>.</p>
            <p style={{ color: '#111827', fontSize: 15.5, lineHeight: 1.6, margin: 0, fontWeight: 700 }}>Included on every plan: 50, 100 or 250 questions a month. Need more? 250 more for $15.</p>
          </div>
        </div>
      </section>

      <section id="meetings" aria-label="Meetings and booking link" style={{ background: '#f6f7f9', padding: 'clamp(44px,7vw,80px) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto clamp(22px,3.5vw,36px)' }}>
            <span style={{ display: 'inline-block', color: '#ff6a00', fontWeight: 900, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Meetings</span>
            <h2 style={{ color: '#111827', fontSize: 'clamp(26px,3.8vw,42px)', fontWeight: 900, lineHeight: 1.12, margin: '0 0 12px' }}>Book Meetings. Get a YES Back by Text.</h2>
            <p style={{ color: '#4b5563', fontSize: 'clamp(15px,1.9vw,18px)', lineHeight: 1.7, margin: 0 }}>Estimate walkthroughs, phone calls or video meetings &mdash; your customers pick a day and time from your booking link, or you and your staff set it up for them. FenceBossPro texts them right away and sends reminders before, and when they reply YES or NO the meeting marks itself Confirmed or Can&apos;t make it.</p>
          </div>
          <div style={{ background: '#7d838c', borderRadius: 16, padding: 'clamp(14px,2.5vw,24px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 18, alignItems: 'start' }}>
            <figure style={{ margin: 0 }}>
              <figcaption style={{ color: '#ffffff', fontWeight: 700, fontSize: 12, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Your Meetings Page</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/meetings-list.webp" width={1200} height={617} loading="lazy" decoding="async" alt="Meetings page: upcoming meetings by day with Confirmed, Waiting on reply and Booked online tags, a Copy booking link button and New Meeting" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,.35)', border: '3px solid #ffffff' }} />
            </figure>
            <figure style={{ margin: 0 }}>
              <figcaption style={{ color: '#ffffff', fontWeight: 700, fontSize: 12, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>The Texts They Get</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/meetings-alerts.webp" width={1000} height={921} loading="lazy" decoding="async" alt="Meeting Alerts: reminders 1 day and 1 hour before, a Reply YES to confirm option, and the booked text with a live preview" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,.35)', border: '3px solid #ffffff' }} />
            </figure>
            <figure style={{ margin: 0, gridColumn: '1 / -1' }}>
              <figcaption style={{ color: '#ffffff', fontWeight: 700, fontSize: 12, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Turn Each One On or Off Under Alerts</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/meetings-toggles.webp" width={1400} height={439} loading="lazy" decoding="async" alt="Alerts page, Client Meeting Alerts: Meeting Booked, Reminder, Moved and Canceled, each with its own Text and Email switch" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,.35)', border: '3px solid #ffffff' }} />
            </figure>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 'clamp(20px,3vw,30px) auto 0', maxWidth: 1000, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px 28px' }}>
            {[
              'Customers book themselves from your link',
              'Or you and your staff book it for them',
              'In person, phone or video',
              'Booked, moved and canceled texts',
              'Reminders whenever you want them',
              'YES / NO replies confirm on their own',
              'Assign each meeting to someone on your team',
              'Turn it on any time in Settings › Add-ons',
            ].map((t) => (
              <li key={t} style={{ display: 'flex', gap: 10, color: '#374151', fontSize: 15.5, lineHeight: 1.5 }}><span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ HERO ═══ */}
      <div className="hero" style={{paddingTop:'60px'}}>
        <div className="hero-badge">Built for Fence &amp; Gate Contractors</div>

        <h1>Run Your Whole Fence Business<br /><span>From One Dashboard</span></h1>
        <p>FenceBossPro is the all-in-one platform built specifically for fence and gate contractors. Build line-item estimates, track materials and parts, schedule installs, dispatch your crews, and collect payments &mdash; all in one place.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <a href="https://my.fencebosspro.com/demo.html" className="btn-demo"><span className="btn-demo-dot" />Try the Live Demo</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>from $59/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">100+</div><div className="hero-stat-lbl">Features Built In</div></div>
          <div><div className="hero-stat-val">89</div><div className="hero-stat-lbl">Screens &amp; Tools</div></div>
          <div><div className="hero-stat-val">0</div><div className="hero-stat-lbl">Apps to Install</div></div>
          <div><div className="hero-stat-val">24/7</div><div className="hero-stat-lbl">Access Anywhere</div></div>
        </div>

      </div>

      {/* ═══ PREMIUM BAND ═══ */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Software.</span></h2>
        <p>We charged less because we&apos;ve been the customer. We know what it feels like to pay $600 a month for software that still can&apos;t build a clean fence bid. FenceBossPro does everything the big platforms do &mdash; line-item estimates, materials and parts tracking, project scheduling, crew dispatch, card payments, role-based access, and a mobile app &mdash; built specifically for fence contractors, and priced for the real world. $59 a month isn&apos;t a cheap price. It&apos;s a fair price. The big platforms aren&apos;t charging $500 because they&apos;re better. They&apos;re charging $500 because they can &mdash; and because their customers don&apos;t have a better option. Now you do.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📐</div><h3>Line-Item Estimating &amp; Bids</h3><p>Build detailed fence bids from saved line items &mdash; posts, panels, pickets, rails, concrete, gates, and hardware &mdash; with linear-foot takeoffs that price a job in minutes instead of an hour at the kitchen table.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🧱</div><h3>Materials &amp; Parts Tracking</h3><p>A full parts catalog with your real costs and margins. Every estimate rolls up the exact materials list for the job, so you know what to order and what to load before the crew rolls out.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h3>Automated Customer Texts</h3><p>Estimate-sent alerts, follow-up sequences, install reminders, and a two-way texting inbox &mdash; all running on their own so your fence customers always know what&apos;s happening.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h3>Card Payments &amp; Deposits</h3><p>Card-on-file storage, collect deposits up front, progress billing on multi-day builds, partial payments, and full payment history. The same billing the big guys use &mdash; included in your $59.</p></div>
          <div className="premium-card"><div className="premium-card-icon">👑</div><h3>Role-Based Access Control</h3><p>Owner, Manager, Office, Crew Lead, and Mobile roles &mdash; the same granular permissions as platforms charging 5&times; more. Your office sees the books; your crews see only their jobs.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h3>Full Mobile App for Crews</h3><p>Your crews pull up the job, see the materials list, mark phases complete, add photos and notes, and capture sign-off &mdash; all in a mobile view built for someone standing at the fence line.</p></div>
        </div>
      </div>

      {/* ═══ EIGHT HUBS ═══ */}
      <section id="hubs">
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Explore the Platform</span>
          <h2 className="section-title">Everything a Fence Company Needs, in One Place</h2>
          <p className="section-sub">From the first on-site bid to the final invoice, FenceBossPro covers every part of running a fence and gate business. Dig into each area below.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card"><span className="feature-icon">📞</span><h3>AI Receptionist</h3><p>A human-sounding AI answers your phone 24/7, knows your customers, books and reschedules, and takes new leads. 49¢ a minute, only when it answers.</p></div>
          <div className="feature-card"><span className="feature-icon">📬</span><h3>Neighbor Postcards</h3><p>Every finished job mails your postcard to the closest neighbors, skipping current customers. Design it yourself, set a budget. $1.59 a card, First Class postage included.</p></div>
          <div className="feature-card"><span className="feature-icon">🧾</span><h3>Costs &amp; Receipts</h3><p>Crews snap receipts in the app and AI fills in the amount, store and date. Job receipts count in job costing, so you see real profit.</p></div>
          <div className="feature-card"><span className="feature-icon">⭐</span><h3>Tech Reviews &amp; Tips</h3><p>After every job, customers rate the tech who did it and can leave a tip. Every tip is tracked per employee.</p></div>
          <div className="feature-card"><span className="feature-icon">🎯</span><h3>Crew Bonuses &amp; Splits</h3><p>Set bonus goals by gross, jobs or rating. Give drivers a bigger share. Techs see &ldquo;You&rsquo;re $200 away from your bonus&rdquo; in the crew app.</p></div>
          <div className="feature-card"><span className="feature-icon">💸</span><h3>One-Click Payroll</h3><p>Hours and overtime from the time clock, plus tips and bonuses, ready for Gusto, QuickBooks, ADP or Paychex. By hand or on a schedule.</p></div>
          <div className="feature-card"><span className="feature-icon">👋</span><h3>Meet Your Tech</h3><p>Customers see who is coming before the visit, with a photo, star rating, reviews and an &ldquo;about me.&rdquo;</p></div>
          <div className="feature-card"><span className="feature-icon">🔗</span><h3>Zapier &amp; Make</h3><p>Connect FenceBossPro to thousands of apps like Google Sheets, Mailchimp and Slack with instant webhooks and an API key.</p></div>
          <div className="feature-card"><span className="feature-icon">📱</span><h3>Google Reviews &amp; Social Inbox</h3><p>Connect your Google Business Profile to see and reply to every Google review, and let AI write the replies for you to approve or post automatically. Facebook and Instagram messages, comments and lead forms are coming soon.</p></div>
          <div className="feature-card"><span className="feature-icon">⚡</span><h3>Fast Setup</h3><p>Trucks, crew, products, services, pricing and packages in about 10 minutes. Upload what you already have.</p></div>
          <div className="feature-card"><span className="feature-icon">🌐</span><h3>Free Website</h3><p>A 200–300 page website built for Google, with a free domain. Every form goes straight into FenceBossPro as a new lead.</p></div>
          <div className="feature-card"><span className="feature-icon">🎨</span><h3>Make It Yours</h3><p>Pick any colors for your software and choose exactly what shows in your sidebar, in any order.</p></div>
          <div className="feature-card"><span className="feature-icon">📝</span><h3>Estimates from the Field</h3><p>Techs write and send estimates from the crew app on the spot, even with no signal.</p></div>
          <div className="feature-card"><span className="feature-icon">🔒</span><h3>Your Data Is Yours</h3><p>Never sold, never shared. Export anytime. Bigger companies get a signed data protection agreement.</p></div>
          <a href="/fencing-software" className="feature-card hub-card"><span className="feature-icon">🛠️</span><h3>Fencing Software</h3><p>The complete all-in-one platform for fence companies &mdash; estimates, materials, scheduling, dispatch, and billing under one roof.</p><span className="hub-go">Explore &rarr;</span></a>
          <a href="/fence-estimating-software" className="feature-card hub-card"><span className="feature-icon">📐</span><h3>Fence Estimating Software</h3><p>Build line-item bids with linear-foot takeoffs, posts, panels, pickets, rails, concrete, gates, and hardware priced in minutes.</p><span className="hub-go">Explore &rarr;</span></a>
          <a href="/fence-scheduling-software" className="feature-card hub-card"><span className="feature-icon">📅</span><h3>Fence Scheduling Software</h3><p>Schedule installs and multi-day builds around material delivery, keep the calendar full, and never double-book a crew.</p><span className="hub-go">Explore &rarr;</span></a>
          <a href="/fence-dispatch-software" className="feature-card hub-card"><span className="feature-icon">🚚</span><h3>Fence Crew &amp; Dispatch Software</h3><p>Dispatch crews, build tight routes between jobs, and give every lead a clear day on the Pending Jobs board from their phone.</p><span className="hub-go">Explore &rarr;</span></a>
          <a href="/fence-invoicing-software" className="feature-card hub-card"><span className="feature-icon">💳</span><h3>Fence Invoicing &amp; Billing</h3><p>Turn accepted bids into invoices, collect deposits and progress payments, and store cards on file.</p><span className="hub-go">Explore &rarr;</span></a>
          <a href="/fence-business-software" className="feature-card hub-card"><span className="feature-icon">📊</span><h3>Fence Business Software</h3><p>Run the whole operation &mdash; clients, properties, pipeline, reporting, and team management &mdash; from one dashboard.</p><span className="hub-go">Explore &rarr;</span></a>
          <a href="/fence-contractor-software" className="feature-card hub-card"><span className="feature-icon">👷</span><h3>Fence Contractor Software</h3><p>Built for the way fence contractors actually work &mdash; on-site bids, supplier orders, change orders, and crew coordination.</p><span className="hub-go">Explore &rarr;</span></a>
          <a href="/fence-installation-software" className="feature-card hub-card"><span className="feature-icon">🧱</span><h3>Fence Installation Software</h3><p>Take a job from estimate to scheduled install to final walk &mdash; with the materials list, Pending Jobs board, and customer texts all connected.</p><span className="hub-go">Explore &rarr;</span></a>
        </div>
      </section>

      {/* ═══ ESTIMATING FEATURE ═══ */}
      <section id="estimating" style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Only in FenceBossPro</span>
            <h2>Build a Tight Fence Bid<br />Before You Leave the Driveway.</h2>
            <p>Stop pricing fence jobs on a notepad and hoping you didn&apos;t forget the gate hardware. On site, drop in your linear-foot takeoff, pick the fence type, and FenceBossPro pulls every material &mdash; posts, panels, pickets, rails, concrete, gates, and hardware &mdash; into a clean line-item bid with your real costs and margins built in.</p>
            <p style={{marginTop:'12px'}}>This isn&apos;t just a quote tool. It&apos;s a profit tool. You can see exactly what a 180-foot wood privacy run will cost in materials and labor before you ever quote a price &mdash; so you stop underbidding, stop eating cost overruns, and win the job at a number that actually pays.</p>
            <ul className="check-list">
              <li>Linear-foot takeoffs by fence type &mdash; wood, vinyl, chain link, aluminum, ornamental</li>
              <li>Auto-calculated post counts and concrete footings from the run length</li>
              <li>Saved line items for posts, panels, pickets, rails, gates, and hardware</li>
              <li>Good / Better / Best options on a single bid so customers choose up</li>
              <li>Material cost and margin shown on every line before you send the price</li>
              <li>Every fence type and part is fully customizable to match how you build</li>
              <li>Accepted bids drop straight onto the Pending Jobs board with a full materials list</li>
              <li>Know your number before you quote. Stop guessing. Stop losing margin.</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Estimate Builder &mdash; Wood Privacy Fence</div>
            <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', marginBottom:'10px'}}>
              <div style={{color:'rgba(255,255,255,.6)', fontSize:'12px', marginBottom:'6px'}}>Line Items &mdash; 180 linear ft</div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                <span>4&times;4 Posts (24)</span><span>$648.00</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                <span>6 ft Pickets (300)</span><span>$1,050.00</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                <span>Concrete (24 bags)</span><span>$144.00</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                <span>4 ft Gate + Hardware</span><span>$385.00</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', color:'#fff', fontSize:'14px', fontWeight:700, paddingTop:'8px', marginTop:'4px'}}>
                <span>Materials + Labor</span><span style={{color:'var(--orange)'}}>$6,240.00</span>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-cell"><div className="stat-val">180 ft</div><div className="stat-lbl">Run Length</div></div>
              <div className="stat-cell"><div className="stat-val">24</div><div className="stat-lbl">Posts &amp; Footings</div></div>
              <div className="stat-cell"><div className="stat-val">38%</div><div className="stat-lbl">Gross Margin</div></div>
              <div className="stat-cell"><div className="stat-val">1</div><div className="stat-lbl">Gate</div></div>
            </div>
            <button style={{width:'100%', marginTop:'12px', background:'var(--orange)', color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>Send Bid to Customer →</button>
            <div style={{marginTop:'10px', textAlign:'center', color:'rgba(255,255,255,.35)', fontSize:'11px'}}>Accepted bids drop to the Pending Jobs board with a full materials list</div>
          </div>
        </div>
      </section>

      {/* ═══ CUSTOMER APP ═══ */}
      <section style={{background:'linear-gradient(135deg,#16202b,#0f1720)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Your Customers Get an App, Too</span>
          <h2 className="section-title" style={{color:'#fff'}}>Give Every Customer Their Own App —<br />And You Decide What They See.</h2>
          <p className="section-sub" style={{color:'rgba(255,255,255,.7)'}}>Most software this powerful stops at you and your crew. FenceBossPro gives your customers their own branded app they install right on their phone — no app store, no password, just a secure text-link login. It&apos;s the kind of thing platforms charging 5× more don&apos;t even offer.</p>
        </div>
        <div style={{maxWidth:'1000px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'14px 40px'}}>
          {[
            'See upcoming visits and full history — what was done, tech notes, and before/after photos',
            'View and pay invoices right from their phone — card on file, one-tap Pay Now',
            'Sign up for new services with live pricing figured from their own property — and see what they already have',
            'Update their card, reschedule or skip a visit, contact you, or refer a friend',
            'Get alerts their way — text, email, or app pop-up — and pick which ones they receive',
            'Leave a review — or a private “Rate Us” that sends only your happy customers to Google & Facebook',
          ].map((t, i) => (
            <div key={i} style={{display:'flex', gap:'10px', alignItems:'flex-start', color:'rgba(255,255,255,.82)', fontSize:'15px', lineHeight:1.6}}>
              <span style={{color:'var(--orange)', fontWeight:800, flexShrink:0}}>✓</span><span>{t}</span>
            </div>
          ))}
        </div>
        <p style={{maxWidth:'900px', margin:'34px auto 0', textAlign:'center', color:'#fff', fontSize:'19px', fontWeight:700, lineHeight:1.5}}>You choose exactly what each customer can see — flip any feature on or off with a single switch.</p>
      </section>

      {/* ═══ EASIER TO USE ═══ */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Built Different</span>
          <h2 className="section-title">Powerful Doesn&apos;t Have to Mean Complicated.</h2>
          <p className="section-sub">The big enterprise platforms take weeks to learn, months to set up, and require a dedicated person just to manage them. FenceBossPro is designed so any owner or office manager can be building real bids on day one &mdash; without training, without a consultant, without an IT department.</p>
        </div>
        <div className="simple-grid">
          <div className="simple-card"><div className="simple-num">01</div><h3>Set Up in One Afternoon</h3><p>Add your fence types, load your material and parts catalog with your real costs, import your clients and properties, and set up your text templates. Most fence companies are sending real bids the same day they sign up. No implementation fee. No onboarding consultant.</p></div>
          <div className="simple-card"><div className="simple-num">02</div><h3>One Screen Does Everything</h3><p>The Pending Jobs board shows your open bids, your scheduled installs, your crew assignments, and the materials needed for each job all in one place. Your crews get their jobs on their phone. You&apos;re not switching between six different apps to run your day.</p></div>
          <div className="simple-card"><div className="simple-num">03</div><h3>Your Crews Learn It in Minutes</h3><p>The mobile crew view is built for people at the fence line, not office managers at desks. Big buttons, clear job phases, one tap to mark a section complete, add a photo, or capture customer sign-off. Crews learn it in the truck before the first post hole.</p></div>
          <div className="simple-card"><div className="simple-num">04</div><h3>Automation Runs Without You</h3><p>Set your text templates once &mdash; bid sent, bid follow-ups, install reminders, payment follow-ups, review requests. After that, FenceBossPro keeps your fence customers updated automatically on every job, every day, without you having to think about it.</p></div>
        </div>
      </section>

      {/* ═══ FEATURES OVERVIEW ═══ */}
      <section id="features" style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Everything You Need</span>
          <h2 className="section-title">Stop Juggling 5 Different Apps</h2>
          <p className="section-sub">FenceBossPro replaces your estimating spreadsheet, your billing software, your texting tool, and your scheduling board &mdash; all under one roof.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card"><span className="feature-icon">📐</span><h3>Line-Item Estimating</h3><p>Build professional fence bids from saved line items &mdash; posts, panels, pickets, rails, concrete, gates, and hardware. Linear-foot takeoffs price a run in minutes, and Good / Better / Best options help you close at a higher number.</p></div>
          <div className="feature-card"><span className="feature-icon">🧱</span><h3>Materials &amp; Parts List</h3><p>A full parts catalog with your costs and margins. Every accepted bid rolls up the exact materials needed for the job, so you know what to order from your supplier and what to load on the truck.</p></div>
          <div className="feature-card"><span className="feature-icon">📅</span><h3>Project Scheduling</h3><p>Schedule single-day repairs and multi-day fence builds around material delivery. See your whole calendar, assign crews, and keep every install on track.</p></div>
          <div className="feature-card"><span className="feature-icon">🚚</span><h3>Crew Dispatch &amp; Routing</h3><p>Assign jobs to crews, order stops to cut drive time, and give every crew lead a clear route and job list for the day &mdash; right on their phone.</p></div>
          <div className="feature-card"><span className="feature-icon">📋</span><h3>The Pending Jobs board</h3><p>Every fence project lives on one board, moving from bid to scheduled to in-progress to complete. Nothing slips through the cracks between the sale and the final walk.</p></div>
          <div className="feature-card"><span className="feature-icon">💳</span><h3>Invoicing &amp; Card Payments</h3><p>Convert accepted bids to invoices, store cards on file, and collect payment through the platform. Track unpaid, partial, paid, and overdue at a glance.</p></div>
          <div className="feature-card"><span className="feature-icon">💰</span><h3>Deposits &amp; Progress Billing</h3><p>Collect a deposit before you order materials, bill in stages on big multi-day builds, and take the balance at the final walk &mdash; all tracked automatically.</p></div>
          <div className="feature-card"><span className="feature-icon">💬</span><h3>Customer Texts</h3><p>Send and receive texts from fence customers right inside the app. Full conversation history by contact, plus automated bid and install updates &mdash; no more using your personal phone.</p></div>
          <div className="feature-card"><span className="feature-icon">🔔</span><h3>Automated Alerts</h3><p>Auto-text and email customers when a bid is sent, an install is scheduled, or a job is complete. Set it once and let FenceBossPro handle the follow-up.</p></div>
          <div className="feature-card"><span className="feature-icon">👥</span><h3>Client &amp; Lead Management</h3><p>Manage existing fence clients and active leads side by side. Track bids, job history, and notes all tied to each contact, with a clear pipeline of who to follow up with next.</p></div>
          <div className="feature-card"><span className="feature-icon">🏠</span><h3>Property Profiles</h3><p>Every fence-line address gets its own profile with measurements, gate locations, access notes, photos, and full job history &mdash; so the next crew knows the property before they arrive.</p></div>
          <div className="feature-card"><span className="feature-icon">📊</span><h3>Dashboard &amp; Reports</h3><p>Custom stat cards show this month&apos;s booked revenue, jobs completed, bids out, and money owed &mdash; all at a glance the moment you log in.</p></div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Simple Pricing</span>
          <h2 className="section-title">We Got Tired of Getting Ripped Off.<br />So We Fixed It.</h2>
          <p className="section-sub">Over the years we tried just about every contractor software out there &mdash; and for a long time we were paying $500&ndash;$700 a month. Every feature was an add-on. Every user cost more. Every upgrade was another invoice.</p>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', maxWidth:'800px', margin:'0 auto 56px', textAlign:'left', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:'1.8', marginBottom:'16px'}}>We were paying <strong>$500 to $700 a month</strong> for software that nickel-and-dimed us at every turn. Want texting? That&apos;s an add-on. Want more users? Pay per user. Want the reporting module? Upgrade your plan. It never ended &mdash; and none of those people had ever set a fence post in their life.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:'1.8', marginBottom:'16px'}}>That&apos;s exactly why we built FenceBossPro with one flat price that includes everything. <strong>$59 a month.</strong> No add-ons. No user fees. No locked features. We include it all because that&apos;s how it should have been from day one.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:'1.8'}}>The only reason we charge a small fee for outbound text messages is simple &mdash; they cost us money to send. We&apos;re not marking them up to make a profit off you. 500 outbound messages are included every month, and if you go over, it&apos;s just $15 per additional 500. That&apos;s it. No gotchas. No surprises. We&apos;re fence contractors just like you, and we built the pricing we always wished existed.</p>
          </div>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="price-card featured" style={{width:'100%'}}>
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div className="price-amount"><sup>$</sup>59</div>
            <div className="price-period">per month</div>
            <div className="price-desc">Every feature. Unlimited clients, properties, crews, and users. Three plans, from $59. No per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Clients, Properties &amp; Leads</li>
              <li>Unlimited Crews &amp; Users</li>
              <li>Line-Item Estimating &amp; Linear-Foot Takeoffs</li>
              <li>Materials &amp; Parts Catalog</li>
              <li>Project Scheduling &amp; Pending Jobs Board</li>
              <li>Crew Dispatch &amp; Routing</li>
              <li>Invoicing, Deposits &amp; Card Payments</li>
              <li>Two-Way Customer Texts &amp; Automated Alerts</li>
              <li>Mobile App for Crews</li>
              <li>500 texts/month included (sent + received, US &amp; Canada)</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(2, e.currentTarget as HTMLElement); }} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</a>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees &mdash; ever.</p>
      </section>

      <section aria-label="Our promise" style={{ background: '#0b0b12', padding: 'clamp(40px,6vw,64px) 20px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 'clamp(24px,3.4vw,38px)', fontWeight: 800, lineHeight: 1.2, margin: '0 auto 12px', maxWidth: 900 }}>We give you everything you need to succeed, <span style={{ color: 'var(--orange)' }}>because we want you to win.</span></h2>
        <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 'clamp(15px,1.8vw,18px)', lineHeight: 1.6, margin: '0 auto', maxWidth: 760 }}>Software, a free website, AI answering, and a real owner who&apos;ll move your data and pick up the phone.</p>
      </section>
      <section aria-label="Your data is yours" style={{ background: '#f6f7f9', padding: 'clamp(40px,6vw,70px) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#111827', fontSize: 'clamp(26px,3.6vw,40px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 10px' }}>Your data is yours. Period.</h2>
          <p style={{ color: '#4b5563', fontSize: 'clamp(15px,1.8vw,18px)', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: 720 }}>Moving your business into new software is a big deal. Here is our promise, in writing.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, textAlign: 'left' }}>
            {[
              ['\u{1F512}', 'We never sell your data', 'Not your info, not your customers\u2019. Not ever, to anyone.'],
              ['\u{1F91D}', 'Your customers are yours', 'We never contact, market to, or sell to your customers.'],
              ['\u{1F6AB}', 'Never used against you', 'We won\u2019t use your data to compete with you or hand it to anyone in your industry.'],
              ['\u{1F4E4}', 'Take it with you anytime', 'Export your customers, properties, invoices and history whenever you want.'],
              ['\u{1F5D1}\uFE0F', 'Leave and it\u2019s deleted', 'Cancel and we delete it within 90 days, or sooner if you ask.'],
              ['\u{1F440}', 'Nobody snoops', 'We only open your account when you ask us for help. Your data never trains AI.'],
            ].map(([ic, h, t]) => (
              <div key={h} style={{ background: '#fff', borderRadius: 12, padding: '18px 18px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
                <div aria-hidden="true" style={{ fontSize: 24, marginBottom: 6 }}>{ic}</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 4 }}>{h}</div>
                <div style={{ fontSize: 14.5, color: '#4b5563', lineHeight: 1.5 }}>{t}</div>
              </div>
            ))}
          </div>
          <p style={{ color: '#374151', fontSize: 15, margin: '24px 0 0', lineHeight: 1.6 }}>
            <b>Larger company?</b> We&apos;ll sign a Data Protection Agreement with you, already signed on our side. <a href="mailto:Support@bossprohq.com?subject=Data%20Protection%20Agreement%20request" style={{ color: '#1d4ed8', fontWeight: 700 }}>Request it</a>
            <span style={{ color: '#6b7280' }}> &middot; <a href="/privacy-policy" style={{ color: '#4b5563' }}>Privacy Policy</a> &middot; <a href="/terms" style={{ color: '#4b5563' }}>Terms</a></span>
          </p>
        </div>
      </section>
      <section aria-label="Tech reviews, tips and bonuses" style={{ background: '#ffffff', padding: 'clamp(44px,7vw,80px) 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(22px,3.5vw,36px)' }}>
            <span style={{ display: 'inline-block', background: '#16a34a', color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: 1.5, borderRadius: 20, padding: '5px 12px', marginBottom: 12 }}>NEW</span>
            <h2 style={{ color: '#111827', fontSize: 'clamp(26px,3.8vw,42px)', fontWeight: 900, lineHeight: 1.12, margin: '0 0 12px' }}>Tech reviews, tips &amp; crew bonuses</h2>
            <p style={{ color: '#4b5563', fontSize: 'clamp(15px,1.9vw,19px)', lineHeight: 1.6, margin: '0 auto', maxWidth: 780 }}>Your customers rate the tech who did the job and can leave a tip. Your crew sees their stars, their tips and exactly how close they are to their next bonus. Included on every FenceBossPro plan.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(20px,3vw,36px)', alignItems: 'center', justifyContent: 'center' }}>
          <figure style={{ flex: '0 0 auto', width: 'min(290px, 82vw)', margin: 0, textAlign: 'center' }}>
            <div style={{ background: '#0b0b0f', borderRadius: 38, padding: 10, boxShadow: '0 24px 60px rgba(15,23,42,.28), 0 0 0 2px #26262c' }}>
              <img src="/crew-bonus.webp" width={600} height={1055} loading="lazy" decoding="async" alt="Crew app Bonus &amp; Tips screen: the tech's star rating, tips owed, how close they are to their bonus, and what customers said" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 29 }} />
            </div>
            <figcaption style={{ color: '#4b5563', fontSize: 13.5, fontWeight: 600, marginTop: 10 }}>What your tech sees in the crew app</figcaption>
          </figure>
          <div style={{ flex: '1 1 520px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
            {[
              ['\u2B50', 'Customers rate their tech', 'After every job, a text, email or app alert asks \u201cHow did Jake do?\u201d One tap for stars and a comment.'],
              ['\u{1F49A}', 'Tips go to the crew', 'Customers tip on their card on file or a new card. Every tip is tracked per employee, minus processing.'],
              ['\u{1F69A}', 'Fair crew splits', 'Set the split per truck, give drivers a bigger share, or change any single job. Drag your crew between trucks.'],
              ['\u{1F3AF}', 'Bonuses they can see', 'Set goals by gross, jobs or rating. Techs see \u201cYou\u2019re $200 away from your bonus\u201d in the crew app.'],
              ['\u{1F44B}', 'Meet your tech', 'Customers see who\u2019s coming, with a photo, rating, reviews and an \u201cabout me\u201d before the visit.'],
              ['\u{1F4B8}', 'Run payroll in one click', 'Hours and overtime from the crew time clock, plus tips and bonuses, ready for Gusto, QuickBooks, ADP or Paychex. By hand or automatically.'],
            ].map(([ic, h, t]) => (
              <div key={h} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 18px 16px' }}>
                <div aria-hidden="true" style={{ fontSize: 26, marginBottom: 6 }}>{ic}</div>
                <div style={{ fontWeight: 800, fontSize: 16.5, color: '#111827', marginBottom: 4 }}>{h}</div>
                <div style={{ fontSize: 14.5, color: '#4b5563', lineHeight: 1.5 }}>{t}</div>
              </div>
            ))}
          </div>
          </div>
          <p style={{ textAlign: 'center', color: '#374151', fontSize: 15, margin: '22px 0 0', lineHeight: 1.6 }}>Happy customers can share it on Google or Facebook too, and private feedback comes straight to you.</p>
        </div>
      </section>

      {/* ═══ SCHEDULING DEEP DIVE ═══ */}
      <section id="scheduling">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Scheduling &amp; Dispatch</span>
            <h2>From Accepted Bid to Crew on Site</h2>
            <p>FenceBossPro gives you a Pending Jobs board of every project not yet scheduled, a full calendar for booked installs, and crew dispatch so you can build tight days and keep every fence job moving from sale to final walk.</p>
            <ul className="check-list">
              <li>Pending Jobs board with every project from bid to complete</li>
              <li>One-click scheduling with date picker and crew assignment</li>
              <li>Schedule multi-day builds around material delivery dates</li>
              <li>Drag-and-drop route ordering between jobs to cut drive time</li>
              <li>Filter by crew, date range, or project status</li>
              <li>Summary bar: booked jobs, revenue, linear ft, jobs complete</li>
              <li>Print dispatch sheets and materials lists for the crew</li>
              <li>Mark phases complete, on hold, or rescheduled with one click</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Today&apos;s Schedule &mdash; Crew A</div>
            <div className="mock-item">
              <div className="mock-dot green"></div>
              <div><div className="mock-label">123 Oak St &mdash; Smith, J.</div><div className="mock-sub">Wood Privacy &middot; 180 linear ft</div></div>
              <div className="mock-badge green-badge">Done</div>
            </div>
            <div className="mock-item">
              <div className="mock-dot orange"></div>
              <div><div className="mock-label">456 Elm Ave &mdash; Torres, M.</div><div className="mock-sub">Chain Link &middot; 240 linear ft</div></div>
              <div className="mock-badge">In Progress</div>
            </div>
            <div className="mock-item" style={{borderColor:'rgba(43,108,163,.5)'}}>
              <div className="mock-dot blue"></div>
              <div><div className="mock-label">789 Pine Rd &mdash; Johnson, K.</div><div className="mock-sub">Aluminum Ornamental &middot; 95 linear ft</div></div>
              <div className="mock-badge blue-badge">Up Next</div>
            </div>
            <div className="mock-item">
              <div className="mock-dot blue"></div>
              <div><div className="mock-label">321 Maple Dr &mdash; Garcia, L.</div><div className="mock-sub">Gate Repair &middot; 1 double gate</div></div>
              <div className="mock-badge blue-badge">Scheduled</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'6px', padding:'12px 14px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', paddingBottom:'8px', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                <span style={{color:'rgba(255,255,255,.45)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'.8px'}}>4 Jobs &middot; Crew A Today</span>
                <span style={{color:'#fff', fontSize:'14px', fontWeight:700}}>$18,940.00</span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'7px'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'7px'}}>
                    <span style={{background:'var(--orange)', color:'#fff', fontSize:'10px', fontWeight:800, padding:'1px 7px', borderRadius:'10px', lineHeight:'16px'}}>1</span>
                    <span style={{color:'rgba(255,255,255,.8)', fontSize:'12px'}}>Wood Privacy</span>
                  </div>
                  <span style={{color:'var(--orange)', fontSize:'12px', fontWeight:700}}>180 ft</span>
                </div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'7px'}}>
                    <span style={{background:'var(--orange)', color:'#fff', fontSize:'10px', fontWeight:800, padding:'1px 7px', borderRadius:'10px', lineHeight:'16px'}}>1</span>
                    <span style={{color:'rgba(255,255,255,.8)', fontSize:'12px'}}>Chain Link</span>
                  </div>
                  <span style={{color:'var(--orange)', fontSize:'12px', fontWeight:700}}>240 ft</span>
                </div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'7px'}}>
                    <span style={{background:'var(--orange)', color:'#fff', fontSize:'10px', fontWeight:800, padding:'1px 7px', borderRadius:'10px', lineHeight:'16px'}}>1</span>
                    <span style={{color:'rgba(255,255,255,.8)', fontSize:'12px'}}>Aluminum Ornamental</span>
                  </div>
                  <span style={{color:'var(--orange)', fontSize:'12px', fontWeight:700}}>95 ft</span>
                </div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'7px'}}>
                    <span style={{background:'var(--orange)', color:'#fff', fontSize:'10px', fontWeight:800, padding:'1px 7px', borderRadius:'10px', lineHeight:'16px'}}>1</span>
                    <span style={{color:'rgba(255,255,255,.8)', fontSize:'12px'}}>Gate Repair</span>
                  </div>
                  <span style={{color:'var(--orange)', fontSize:'12px', fontWeight:700}}>1 gate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ALERTS ═══ */}
      <section id="alerts" className="dark-section">
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Automated Alerts</span>
          <h2 className="section-title">Communicate Like a Big Company.<br />Run Like a Small One.</h2>
          <p className="section-sub">Set up automated text and email alerts once. FenceBossPro sends them automatically &mdash; keeping your fence customers informed without any extra work from you.</p>
        </div>
        <div className="alert-grid">
          <div className="alert-pill"><span className="ap-icon">📄</span><div><div className="ap-label">Bid Sent</div><div className="ap-sub">Text when an estimate hits their inbox</div></div></div>
          <div className="alert-pill"><span className="ap-icon">🔁</span><div><div className="ap-label">Bid Follow-Ups</div><div className="ap-sub">3 automated follow-ups if not accepted</div></div></div>
          <div className="alert-pill"><span className="ap-icon">🎉</span><div><div className="ap-label">Bid Accepted</div><div className="ap-sub">Confirm and collect the deposit</div></div></div>
          <div className="alert-pill"><span className="ap-icon">📅</span><div><div className="ap-label">Install Scheduled</div><div className="ap-sub">Auto-text when a job is booked</div></div></div>
          <div className="alert-pill"><span className="ap-icon">🚚</span><div><div className="ap-label">Crew On The Way</div><div className="ap-sub">Let customers know the crew is heading out</div></div></div>
          <div className="alert-pill"><span className="ap-icon">✅</span><div><div className="ap-label">Job Completed</div><div className="ap-sub">Notify customer when the fence is done</div></div></div>
          <div className="alert-pill"><span className="ap-icon">🔄</span><div><div className="ap-label">Rescheduled Alert</div><div className="ap-sub">Instantly notify on date changes</div></div></div>
          <div className="alert-pill"><span className="ap-icon">💳</span><div><div className="ap-label">Balance Due</div><div className="ap-sub">Follow up on final payment automatically</div></div></div>
          <div className="alert-pill"><span className="ap-icon">⭐</span><div><div className="ap-label">Review Request</div><div className="ap-sub">Auto-ask for Google reviews after install</div></div></div>
          <div className="alert-pill"><span className="ap-icon">💬</span><div><div className="ap-label">Inbound Text Alert</div><div className="ap-sub">Get notified when a customer texts you</div></div></div>
        </div>
        <p style={{textAlign:'center', color:'rgba(255,255,255,.45)', fontSize:'13px', marginTop:'32px'}}>Toggle SMS and Email independently for each alert type &mdash; you&apos;re in full control.</p>
      </section>

      {/* ═══ STATS BAND ═══ */}
      <div className="stats-band">
        <div className="stats-band-inner">
          <div className="stat-item"><div className="val">10+</div><div className="lbl">Automated Alert Types</div></div>
          <div className="stat-item"><div className="val">3</div><div className="lbl">Bid Follow-Up Sequences</div></div>
          <div className="stat-item"><div className="val">3</div><div className="lbl">Payment Follow-Up Sequences</div></div>
          <div className="stat-item"><div className="val">∞</div><div className="lbl">Custom Text Templates</div></div>
        </div>
      </div>

      {/* ═══ TEAM / MOBILE ═══ */}
      <section>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Your Team</span>
            <h2>Office, Field, and Mobile &mdash; All Connected</h2>
            <p>FenceBossPro isn&apos;t just for the office. Your crews get a mobile-optimized version built for the job site. Roles control exactly what each person can see and do.</p>
            <ul className="check-list">
              <li>Role-based access: Owner, Manager, Office, Crew Lead, Mobile</li>
              <li>Mobile crews see their jobs, materials list, and mark phases complete</li>
              <li>Office staff manages scheduling, billing, and messaging</li>
              <li>Employee hour tracking and payroll-ready reports</li>
              <li>Crew and truck management &mdash; assign jobs to the right team</li>
              <li>Admin controls for adding, deactivating, and managing users</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Team Access Levels</div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>👑</span><div><div className="mock-label">Owner</div><div className="mock-sub">Full access &mdash; all features, billing, users</div></div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>🏢</span><div><div className="mock-label">Manager</div><div className="mock-sub">Scheduling, clients, bids, reports</div></div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>📋</span><div><div className="mock-label">Office Staff</div><div className="mock-sub">Billing, messaging, client management</div></div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>📱</span><div><div className="mock-label">Crew Lead (Mobile)</div><div className="mock-sub">Today&apos;s jobs only &mdash; materials &amp; sign-off</div></div></div>
          </div>
        </div>
      </section>

      {/* ═══ MATERIALS TRACKING ═══ */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Materials &amp; Parts</span>
            <h2>Know Exactly What to Order and Load</h2>
            <p>Every bid you accept rolls up the exact materials for the job &mdash; posts, panels, pickets, rails, concrete, gates, and hardware. FenceBossPro gives you a clean parts list you can send to your supplier and hand to the crew, so you stop over-ordering and stop showing up a gate short.</p>
            <ul className="check-list">
              <li>Full parts catalog with your real costs and margins</li>
              <li>Auto-generated materials list from every accepted bid</li>
              <li>Post counts and concrete bags calculated from the run length</li>
              <li>Gate and hardware add-ons tracked as their own line items</li>
              <li>Purchase-order-ready lists to send straight to your supplier</li>
              <li>Material cost rolled into every estimate to protect your margin</li>
              <li>Track parts by fence type &mdash; wood, vinyl, chain link, aluminum</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Materials List &mdash; 456 Elm Ave</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>32</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Terminal &amp; Line Posts</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>240 ft</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Chain Link Fabric</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'var(--orange)', fontSize:'20px', fontWeight:700}}>40</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Concrete Bags</div></div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}><div style={{color:'var(--orange)', fontSize:'20px', fontWeight:700}}>2</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Gates + Hardware</div></div>
            </div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Top Rail &amp; Tension Wire</div><div className="mock-sub">On supplier PO &middot; 6/14/2026</div></div><div className="mock-badge green-badge">Ordered</div></div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">Post Caps &amp; Tension Bands</div><div className="mock-sub">Pull from shop stock</div></div><div className="mock-badge">In Stock</div></div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Who We Are</span>
          <h2 className="section-title">Built by a Contractor. Owned by a Contractor.</h2>
          <p className="section-sub">We&apos;re not a big corporation. We&apos;re not a venture-backed tech startup. We&apos;re a privately owned company built by someone who has been setting posts and hanging gates for years.</p>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', maxWidth:'800px', margin:'0 auto 56px', textAlign:'left', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:'1.8', marginBottom:'16px'}}>We own and operate a fence business. We&apos;ve been in this trade for years &mdash; which means when we built FenceBossPro, we didn&apos;t have to guess what fence contractors need. We already knew. We lived it on every bid and every install.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:'1.8', marginBottom:'16px'}}>We built this software because everything else out there was built by people who have never priced a fence run, never managed a materials order from a supplier, never had to chase a final payment while also trying to dispatch a crew. They build features they <em>think</em> you need. We build features we <em>know</em> you need.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:'1.8'}}>FenceBossPro is <strong>privately owned</strong> &mdash; no corporate board, no outside investors, no decisions made by people who have never dug a post hole. When you call or message us, you&apos;re talking to the owner. That&apos;s the way we like it, and that&apos;s never going to change.</p>
          </div>
        </div>
        <div className="testimonial-grid" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-body">&ldquo;Before FenceBossPro I was bidding fence jobs on a legal pad and forgetting gate hardware half the time. Now my bids are line-item, my margins are protected, and my close rate is way up because the follow-up texts go out automatically.&rdquo;</p>
            <div className="testimonial-author">Fence Company Owner</div>
            <div className="testimonial-role">Nashville, TN</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-body">&ldquo;The materials list alone is worth it. Every accepted bid spits out exactly what to order &mdash; posts, panels, concrete, gates. I stopped over-ordering and I never show up to an install a section short anymore.&rdquo;</p>
            <div className="testimonial-author">Vinyl &amp; Aluminum Fence Installer</div>
            <div className="testimonial-role">Phoenix, AZ</div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-body">&ldquo;The Pending Jobs board changed how I run my crews. I can see every project from bid to final walk, dispatch the right crew, and collect the deposit before we ever order materials. Nothing falls through the cracks now.&rdquo;</p>
            <div className="testimonial-author">Fence &amp; Gate Contractor</div>
            <div className="testimonial-role">Charlotte, NC</div>
          </div>
        </div>
      </section>

      {/* ═══ TECH ═══ */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Built on Modern Technology</span>
            <h2>Fast. Reliable. No Delays.</h2>
            <p>FenceBossPro runs on the latest and greatest infrastructure available today. That means your bids, texts, and emails go out in seconds &mdash; not hours. No queues backing up, no alerts firing late, no wondering if your customer got the estimate. Everything happens in real time, the way it&apos;s supposed to.</p>
            <p style={{marginTop:'12px'}}>We built on a modern stack specifically to eliminate the performance issues and outages that plague older contractor platforms. Less downtime. Fewer bugs. A faster experience every time you log in.</p>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Alert Delivery</div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Bid Sent Text</div><div className="mock-sub">Sent to customer &middot; 0.4 seconds</div></div><div className="mock-badge green-badge">Delivered</div></div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Estimate Email</div><div className="mock-sub">Sent to customer &middot; 0.9 seconds</div></div><div className="mock-badge green-badge">Delivered</div></div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Review Request Text</div><div className="mock-sub">Sent to customer &middot; 0.6 seconds</div></div><div className="mock-badge green-badge">Delivered</div></div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'22px', fontWeight:800}}>No Hours-Long Delays.</div>
              <div style={{color:'rgba(255,255,255,.55)', fontSize:'13px', marginTop:'4px'}}>Your customers hear from you instantly &mdash; every time.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WE ACTUALLY LISTEN ═══ */}
      <section className="dark-section">
        <div className="highlight-row reverse" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <div className="highlight-text">
            <span className="section-label" style={{color:'var(--orange)'}}>We Actually Listen</span>
            <h2 style={{color:'#fff'}}>Have an Idea? We&apos;ll Build It.</h2>
            <p style={{color:'rgba(255,255,255,.7)'}}>Most software companies put your feature request in a queue and get back to you six months later &mdash; if ever. That&apos;s not us. When you have a suggestion or need something built for the way your fence business runs, we listen. We respond. And we build it fast.</p>
            <p style={{color:'rgba(255,255,255,.7)', marginTop:'12px'}}>Custom features for our clients typically ship in 1&ndash;2 weeks, not months. FenceBossPro is built by someone who runs a fence business, and we know that when you need something, you need it now &mdash; not on the next quarterly release cycle.</p>
            <p style={{color:'rgba(255,255,255,.7)', marginTop:'12px'}}>Our goal is simple: be the best fence business software available. And the only way to get there is by building it with our clients &mdash; not just for them.</p>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Feature Request Timeline</div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>💬</span><div><div className="mock-label">You submit a request</div><div className="mock-sub">Tell us what you need and why</div></div><div className="mock-badge blue-badge">Day 1</div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>⚡</span><div><div className="mock-label">We start building</div><div className="mock-sub">No committees. No approval queues.</div></div><div className="mock-badge blue-badge">Day 2&ndash;3</div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>✅</span><div><div className="mock-label">Feature is live</div><div className="mock-sub">In your account, ready to use</div></div><div className="mock-badge green-badge">Week 1&ndash;2</div></div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'16px', fontWeight:700}}>Not months. Weeks.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Your input shapes the software you use every day.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <div className="cta-band">
        <h2>Your Competition Is Already<br />Using Software Like This.</h2>
        <p>Stop running your fence business out of a notepad and a group text. Get organized, bid faster, get paid sooner, and give your customers an experience that wins referrals.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>from $59/mo</b> after</div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <div id="sbp-backdrop" onClick={() => closeAllModals()} style={{display:'none', position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,.55)', zIndex:99997}}></div>
      {[1,2,3].map(n => (
        <div key={n} id={`sbp-form-${n}`} style={{display:'none', position:'fixed', zIndex:99999, width:'420px', maxWidth:'calc(100vw - 24px)', background:'#fff', borderRadius:'14px', border:'3px solid #2b6ca3', boxShadow:'0 0 0 4px rgba(43,108,163,.35), 0 16px 60px rgba(0,0,0,.45)', maxHeight:'calc(100vh - 40px)', overflowY:'auto'}}>
          <div style={{background:'linear-gradient(135deg,#0f1720,#1f2d3d)', padding:'28px 28px 22px', position:'relative'}}>
            <div style={{color:'#fff', fontSize:'20px', fontWeight:800, paddingRight:'36px'}}>Start Your 14-Day Free Trial</div>
            <div style={{color:'rgba(255,255,255,.6)', fontSize:'13px', marginTop:'5px'}}>No credit card required · Full access · from $59/mo after your 14-day trial</div>
            <button onClick={() => closeSignupModal(n)} style={{position:'absolute', top:'16px', right:'16px', background:'rgba(255,255,255,.12)', border:'none', color:'#fff', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'20px', display:'flex', alignItems:'center', justifyContent:'center'}}>×</button>
          </div>
          <div id={`sbp${n}-step1`} style={{padding:'24px 28px'}}>
            <div id={`sbp${n}-err1`} style={{background:'#fff0f0', border:'1px solid #f5c6c6', color:'#c0392b', borderRadius:'6px', padding:'10px 12px', fontSize:'13px', marginBottom:'14px', display:'none'}}></div>
            <div style={{display:'flex', gap:'12px', marginBottom:'14px'}}>
              <div style={{flex:1}}><label style={{fontSize:'11px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px'}}>First Name</label><input id={`sbp${n}-first`} type="text" placeholder="John" style={{width:'100%', border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'inherit', color:'#333'}} /></div>
              <div style={{flex:1}}><label style={{fontSize:'11px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px'}}>Last Name</label><input id={`sbp${n}-last`} type="text" placeholder="Smith" style={{width:'100%', border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'inherit', color:'#333'}} /></div>
            </div>
            <div style={{marginBottom:'14px'}}><label style={{fontSize:'11px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px'}}>Company Name</label><input id={`sbp${n}-company`} type="text" placeholder="Smith Fence &amp; Gate Co." style={{width:'100%', border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'inherit', color:'#333'}} /></div>
            <div style={{marginBottom:'20px'}}><label style={{fontSize:'11px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px'}}>Email Address</label><input id={`sbp${n}-email`} type="email" placeholder="you@yourcompany.com" style={{width:'100%', border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'inherit', color:'#333'}} /></div>
            <button onClick={() => sbpStep2(n)} style={{width:'100%', background:'#2b6ca3', color:'#fff', border:'none', borderRadius:'6px', padding:'13px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>Next: Create Password →</button>
          </div>
          <div id={`sbp${n}-step2`} style={{padding:'24px 28px', display:'none'}}>
            <div id={`sbp${n}-err2`} style={{background:'#fff0f0', border:'1px solid #f5c6c6', color:'#c0392b', borderRadius:'6px', padding:'10px 12px', fontSize:'13px', marginBottom:'14px', display:'none'}}></div>
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'6px', padding:'10px 14px', marginBottom:'16px'}}>
              <div style={{fontSize:'12px', color:'#16a34a', fontWeight:700}}>14-Day Free Trial — No Credit Card Required</div>
              <div style={{fontSize:'12px', color:'#555', marginTop:'2px'}}>Full access to every feature. from $59/month after trial.</div>
            </div>
            <div style={{marginBottom:'14px'}}><label style={{fontSize:'11px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px'}}>Login Email</label><input id={`sbp${n}-login-email`} type="email" readOnly style={{width:'100%', border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'inherit', background:'#f8f8f8', color:'#333'}} /></div>
            <div style={{marginBottom:'14px'}}><label style={{fontSize:'11px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px'}}>Password</label><input id={`sbp${n}-password`} type="password" placeholder="At least 8 characters" style={{width:'100%', border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'inherit', color:'#333'}} /></div>
            <div style={{marginBottom:'14px'}}><label style={{fontSize:'11px', fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'5px'}}>Confirm Password</label><input id={`sbp${n}-confirm`} type="password" placeholder="Repeat password" style={{width:'100%', border:'1px solid #ddd', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'inherit', color:'#333'}} /></div>
            <div style={{marginBottom:'18px', display:'flex', alignItems:'flex-start', gap:'10px'}}><input type="checkbox" id={`sbp${n}-agree`} style={{width:'16px', height:'16px', accentColor:'#2b6ca3', cursor:'pointer', flexShrink:0, marginTop:'3px'}} /><label htmlFor={`sbp${n}-agree`} style={{fontSize:'13px', color:'#555', cursor:'pointer', lineHeight:1.5}}>I agree to the <a href="https://fencebosspro.com/terms" target="_blank" style={{color:'#2b6ca3'}}>Terms of Service</a> and <a href="https://fencebosspro.com/privacy-policy" target="_blank" style={{color:'#2b6ca3'}}>Privacy Policy</a></label></div>
            <button id={`sbp${n}-create-btn`} onClick={() => sbpCreateAccount(n)} style={{width:'100%', background:'#2b6ca3', color:'#fff', border:'none', borderRadius:'6px', padding:'13px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>Create My Account</button>
            <button onClick={() => sbpBackToStep1(n)} style={{width:'100%', background:'none', border:'none', color:'#888', fontSize:'13px', cursor:'pointer', marginTop:'10px', padding:'6px', fontFamily:'inherit', textDecoration:'underline'}}>← Back</button>
          </div>
          <div id={`sbp${n}-success`} style={{padding:'48px 28px', textAlign:'center', display:'none'}}>
            <div style={{width:'64px', height:'64px', background:'#16a34a', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'30px', color:'#fff', marginBottom:'16px'}}>✓</div>
            <div style={{fontSize:'22px', fontWeight:800, color:'#1a1a2e', marginBottom:'10px'}}>You&apos;re In!</div>
            <div style={{fontSize:'15px', color:'#555', lineHeight:1.6, marginBottom:'6px'}}>Your 14-day free trial has started.<br />Taking you to your dashboard…</div>
            <div id={`sbp${n}-countdown`} style={{fontSize:'12px', color:'#aaa', marginTop:'10px'}}></div>
          </div>
        </div>
      ))}
    </>
  );
}
