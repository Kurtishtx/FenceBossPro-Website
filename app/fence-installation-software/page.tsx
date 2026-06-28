'use client';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

const SBP_URL  = 'https://knjdbgroiyhvqwrpqzcx.supabase.co';
const SBP_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamRiZ3JvaXlodnF3cnBxemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTczMDMsImV4cCI6MjA5NTA3MzMwM30.zoExtkem-XZqU86S4yJjA_xOOaS1G0IPU2M9OAAza2g';
let sbpClient: any = null;
let sbpOpenForm = 0;

function getSbpClient() {
  if (!sbpClient) sbpClient = (window as any).supabase.createClient(SBP_URL, SBP_ANON);
  return sbpClient;
}

function openSignupModal(n: number, btn: HTMLElement) {
  closeAllModals();
  sbpOpenForm = n;
  const form = document.getElementById('sbp-form-' + n)!;
  const rect = btn.getBoundingClientRect();
  const formW = Math.min(420, window.innerWidth - 24);
  const centerX = rect.left + rect.width / 2;
  let top  = rect.bottom + 12;
  let left = centerX - formW / 2;
  if (top + 460 > window.innerHeight) { top = rect.top - 460 - 12; if (top < 12) top = 12; }
  top  = Math.max(12, top);
  left = Math.max(12, Math.min(left, window.innerWidth - formW - 12));
  form.style.top  = top  + 'px';
  form.style.left = left + 'px';
  form.style.display = 'block';
  document.getElementById('sbp-backdrop')!.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeSignupModal(n: number) {
  document.getElementById('sbp-form-' + n)!.style.display = 'none';
  document.getElementById('sbp-backdrop')!.style.display = 'none';
  document.body.style.overflow = '';
  sbpOpenForm = 0;
}

function closeAllModals() {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('sbp-form-' + i);
    if (el) el.style.display = 'none';
  });
  const backdrop = document.getElementById('sbp-backdrop');
  if (backdrop) backdrop.style.display = 'none';
  document.body.style.overflow = '';
  sbpOpenForm = 0;
}

function sbpStep2(n: number) {
  const err = document.getElementById(`sbp${n}-err1`)!;
  err.style.display = 'none';
  const first = (document.getElementById(`sbp${n}-first`) as HTMLInputElement).value.trim();
  const last  = (document.getElementById(`sbp${n}-last`)  as HTMLInputElement).value.trim();
  const comp  = (document.getElementById(`sbp${n}-company`) as HTMLInputElement).value.trim();
  const email = (document.getElementById(`sbp${n}-email`) as HTMLInputElement).value.trim();
  if (!first || !last)                return sbpShowErr(err, 'Please enter your first and last name.');
  if (!comp)                          return sbpShowErr(err, 'Please enter your company name.');
  if (!email || !email.includes('@')) return sbpShowErr(err, 'Please enter a valid email address.');
  (document.getElementById(`sbp${n}-login-email`) as HTMLInputElement).value = email;
  document.getElementById(`sbp${n}-step1`)!.style.display = 'none';
  document.getElementById(`sbp${n}-step2`)!.style.display = 'block';
  (document.getElementById(`sbp${n}-password`) as HTMLInputElement).focus();
}

function sbpBackToStep1(n: number) {
  document.getElementById(`sbp${n}-step2`)!.style.display = 'none';
  document.getElementById(`sbp${n}-step1`)!.style.display = 'block';
  document.getElementById(`sbp${n}-err2`)!.style.display  = 'none';
}

async function sbpCreateAccount(n: number) {
  const err = document.getElementById(`sbp${n}-err2`)!;
  const btn = document.getElementById(`sbp${n}-create-btn`) as HTMLButtonElement;
  err.style.display = 'none';
  const email    = (document.getElementById(`sbp${n}-login-email`) as HTMLInputElement).value.trim();
  const password = (document.getElementById(`sbp${n}-password`)    as HTMLInputElement).value;
  const confirm  = (document.getElementById(`sbp${n}-confirm`)     as HTMLInputElement).value;
  if (password.length < 8)  return sbpShowErr(err, 'Password must be at least 8 characters.');
  if (password !== confirm)  return sbpShowErr(err, 'Passwords do not match.');
  if (!(document.getElementById(`sbp${n}-agree`) as HTMLInputElement).checked)
    return sbpShowErr(err, 'Please agree to the Terms of Service and Privacy Policy.');
  btn.disabled = true;
  btn.textContent = 'Creating your account…';
  try {
    const res = await fetch(SBP_URL + '/functions/v1/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SBP_ANON, 'apikey': SBP_ANON },
      body: JSON.stringify({ action: 'create', email, password }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    const sb = getSbpClient();
    const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(signInErr.message);
    const uid   = signInData.user.id;
    const first = (document.getElementById(`sbp${n}-first`)   as HTMLInputElement).value.trim();
    const last  = (document.getElementById(`sbp${n}-last`)    as HTMLInputElement).value.trim();
    const comp  = (document.getElementById(`sbp${n}-company`) as HTMLInputElement).value.trim();
    await sb.auth.updateUser({ data: { full_name: first + ' ' + last } });
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('user_profiles').upsert(
      { id: uid, email, role: 'full_access', is_primary_owner: true, tenant_id: null, trial_ends_at: trialEnd },
      { onConflict: 'id' }
    );
    await sb.from('company_info').insert({ user_id: uid, company_name: comp, display_name: comp });
    const reasons = ['Cancel Maintaining Self','Cancel Sold House','Cancel Too Expensive','Cancel Unknown','Dropping Customer','Sold House']
      .map(nm => ({ name: nm, active: true, user_id: uid }));
    await sb.from('cancellation_reasons').insert(reasons);
    document.getElementById(`sbp${n}-step2`)!.style.display   = 'none';
    document.getElementById(`sbp${n}-success`)!.style.display = 'block';
    let secs = 4;
    const cd = document.getElementById(`sbp${n}-countdown`)!;
    cd.textContent = 'Redirecting in ' + secs + ' seconds…';
    const iv = setInterval(() => {
      secs--;
      if (secs <= 0) { clearInterval(iv); window.location.href = 'https://my.fencebosspro.com/dashboard.html'; }
      else cd.textContent = 'Redirecting in ' + secs + ' second' + (secs === 1 ? '' : 's') + '…';
    }, 1000);
  } catch (e: any) {
    sbpShowErr(err, e.message || 'Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create My Account';
  }
}

function sbpShowErr(el: HTMLElement, msg: string) { el.textContent = msg; el.style.display = 'block'; }

function SignupForm({ n }: { n: number }) {
  return (
    <div id={`sbp-form-${n}`} className="sbp-form">
      <div className="sbp-form-header">
        <div className="sbp-form-title">Start Your 14-Day Free Trial</div>
        <div className="sbp-form-subtitle">No credit card required. Full access. Cancel anytime.</div>
        <button className="sbp-form-close" onClick={() => closeSignupModal(n)}>×</button>
      </div>
      <div id={`sbp${n}-step1`} className="sbp-form-body">
        <div id={`sbp${n}-err1`} className="sbp-err"></div>
        <div className="sbp-field-row">
          <div className="sbp-field-half">
            <label className="sbp-label">First Name</label>
            <input id={`sbp${n}-first`} type="text" placeholder="John" className="sbp-input" />
          </div>
          <div className="sbp-field-half">
            <label className="sbp-label">Last Name</label>
            <input id={`sbp${n}-last`} type="text" placeholder="Smith" className="sbp-input" />
          </div>
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Company Name</label>
          <input id={`sbp${n}-company`} type="text" placeholder="Smith Fence &amp; Gate" className="sbp-input" />
        </div>
        <div className="sbp-field-last">
          <label className="sbp-label">Email Address</label>
          <input id={`sbp${n}-email`} type="email" placeholder="you@yourcompany.com" className="sbp-input" />
        </div>
        <button onClick={() => sbpStep2(n)} className="btn-primary" style={{width:'100%', fontSize:'15px', padding:'13px'}}>
          Next: Create Password →
        </button>
      </div>
      <div id={`sbp${n}-step2`} className="sbp-form-body" style={{display:'none'}}>
        <div id={`sbp${n}-err2`} className="sbp-err"></div>
        <div className="sbp-trial-note">
          <div className="sbp-trial-note-title">14-Day Free Trial — No Credit Card Required</div>
          <div className="sbp-trial-note-sub">Full access to every feature. $129/month after trial.</div>
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Login Email</label>
          <input id={`sbp${n}-login-email`} type="email" readOnly className="sbp-input sbp-input-readonly" />
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Password</label>
          <input id={`sbp${n}-password`} type="password" placeholder="At least 8 characters" className="sbp-input" />
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Confirm Password</label>
          <input id={`sbp${n}-confirm`} type="password" placeholder="Repeat password" className="sbp-input" />
        </div>
        <div className="sbp-agree-row">
          <input type="checkbox" id={`sbp${n}-agree`} className="sbp-agree-check" />
          <label htmlFor={`sbp${n}-agree`} className="sbp-agree-label">
            I agree to the{' '}
            <a href="https://fencebosspro.com/terms" target="_blank" rel="noreferrer" className="sbp-link">Terms of Service</a>
            {' '}and{' '}
            <a href="https://fencebosspro.com/privacy-policy" target="_blank" rel="noreferrer" className="sbp-link">Privacy Policy</a>
          </label>
        </div>
        <button id={`sbp${n}-create-btn`} onClick={() => sbpCreateAccount(n)} className="btn-primary" style={{width:'100%', fontSize:'15px', padding:'13px'}}>
          Create My Account
        </button>
        <button className="sbp-btn-back" onClick={() => sbpBackToStep1(n)}>← Back</button>
      </div>
      <div id={`sbp${n}-success`} className="sbp-success-panel">
        <div className="sbp-success-icon">✓</div>
        <div className="sbp-success-title">You&#39;re In!</div>
        <div className="sbp-success-sub">Your 14-day free trial has started.<br />Taking you to your dashboard…</div>
        <div id={`sbp${n}-countdown`} className="sbp-countdown"></div>
      </div>
    </div>
  );
}

export default function FenceInstallationSoftware() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !sbpOpenForm) return;
      const n = sbpOpenForm;
      if (document.getElementById('sbp-form-' + n)?.style.display !== 'block') return;
      if (document.getElementById(`sbp${n}-step2`)?.style.display === 'block') sbpCreateAccount(n);
      else sbpStep2(n);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <Navbar onTrialClick={(el) => openSignupModal(1, el)} />

      <div className="hero">
        <div className="hero-badge">Built Specifically for Fence Contractors</div>
        <h1>Fence Installation Software<br /><span>Built for How You Actually Build Fence</span></h1>
        <p>Most field service software is built for plumbers and HVAC techs. FenceBossPro is built from the ground up for fence companies &mdash; wood, vinyl, chain link, aluminum, and ornamental. The way you bid linear footage, order posts and panels, schedule installs, and bill deposits is completely different, and your software should be too.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Lin Ft</div><div className="hero-stat-lbl">Takeoffs Priced Per Job</div></div>
          <div><div className="hero-stat-val">$129</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">500+</div><div className="hero-stat-lbl">SMS Alerts Included Monthly</div></div>
          <div><div className="hero-stat-val">2006</div><div className="hero-stat-lbl">In the Trades Since</div></div>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div style={{background:'var(--purple-dark)', padding:'0 40px 60px', textAlign:'center'}}>
        <img
          src="/dashboard-mockup.webp"
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
          alt="FenceBossPro fence installation software dashboard on laptop showing a line-item bid and job board, with mobile app on phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Fence Software.</span></h2>
        <p>$129/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. FenceBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature you actually need.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📐</div><h4>Line-Item Estimating</h4><p>Build a fence bid by the linear foot &mdash; posts, panels, pickets, rails, concrete, gates, and hardware all itemized. Adjust the run, swap wood for vinyl, add a double-drive gate, and watch the total recalculate instantly before you hit send.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📦</div><h4>Materials &amp; Parts</h4><p>Every job carries a full materials list pulled from your bid &mdash; how many posts, panels, bags of concrete, and gate kits to load on the trailer. Order off it, build a pull sheet from it, and stop sending crews back for one more bracket.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Communication Suite</h4><p>Two-way SMS inbox, 10+ automated alert types, estimate follow-up sequences, payment reminders, review requests &mdash; all built in at the flat price. No Twilio account, no Mailchimp, no third-party setup.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Payments</h4><p>Cards on file, deposits, progress billing, invoicing, and overdue reports &mdash; the full Stripe integration is wired in. Collect the deposit before you order materials and the balance the day the gate swings.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Owner, Manager, Office Staff, Installer, and Mobile-only roles. Granular permission control so your field crews only see what they need and your office manager can&apos;t accidentally delete a client record.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your installers get a mobile-optimized dashboard with their jobs for the day, the property, the materials list, and the line-item scope. Complete, reschedule, and add notes &mdash; all from the truck without calling the office once.</p></div>
        </div>
      </div>

      {/* JOB BOARD */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The Job Board — Project Pipeline</span>
            <h2 style={{color:'#fff'}}>Every Fence Job From Sold to Set in Concrete, On One Board.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>The Job Board is the fastest way to run a fence backlog we&apos;ve ever seen. Every signed project moves across columns &mdash; deposit collected, materials ordered, scheduled, in progress, and complete &mdash; with linear footage, fence type, gate count, and balance owed visible on every card. You always know what&apos;s ready to dispatch and what&apos;s still waiting on posts.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Drag jobs across stages as deposits, materials, and installs progress</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Each card shows linear feet, fence type, gates, and balance due</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>See what&apos;s waiting on materials vs. ready to schedule at a glance</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>One click to schedule a job to a date and an install crew</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Dispatch and route crews by zip so trucks aren&apos;t crisscrossing town</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Filter by wood, vinyl, chain link, aluminum, or ornamental</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts the &quot;where does this job stand?&quot; phone calls to zero</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Built around how fence projects actually move &mdash; not a generic ticket queue</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Job Board — Project Stages</div>
            <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', padding:'20px', marginBottom:'14px', position:'relative', minHeight:'130px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <div style={{display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:1}}>
                {['s','s','u','s','s','s','u','s','s','u','s','s','s','u','s','s','s','u','s'].map((t,i) => (
                  <div key={i} style={{width:'11px', height:'11px', borderRadius:'50%', flexShrink:0, background: t==='s' ? '#2b6ca3' : 'rgba(255,255,255,.2)', boxShadow: t==='s' ? '0 0 0 3px rgba(43,108,163,.3)' : 'none'}}></div>
                ))}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>14</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Jobs Scheduled</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>19</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Gates On Order</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>8,640</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Linear Ft Sold</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>720</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Posts To Set</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Wood · 6 &nbsp;|&nbsp; Vinyl · 5 &nbsp;|&nbsp; Chain Link · 4 &nbsp;|&nbsp; Aluminum · 4</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Pipeline by Fence Type</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Fence Software Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. FenceBossPro is the exception. Every screen was designed by people who have set posts and hung gates &mdash; not UX designers who&apos;ve never dug a post hole. Your team will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your fence types and materials, import your clients and properties, set up your automated texts, and connect Stripe — most owners are fully operational the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Estimates, the Job Board, scheduling, dispatch, and materials are all connected. You\'re not jumping between five different modules or browser tabs. Pull up the board and everything you need for the day is right there in a single view.'},
            {n:'03', title:'Your Crews Learn It in Minutes', body:'The mobile app your installers use shows them exactly what they need and nothing they don\'t. Their jobs for the day, the property, the scope, the materials list, and the complete button. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your SMS alerts, estimate follow-ups, and payment reminders once. After that, FenceBossPro handles every notification, every follow-up, and every review request automatically — whether you\'re on a job site, at the shop, or home for the night.'},
          ].map(({n, title, body}) => (
            <div key={n} style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'30px 26px'}}>
              <div style={{fontSize:'40px', fontWeight:800, color:'var(--orange)', opacity:.25, lineHeight:1, marginBottom:'12px'}}>{n}</div>
              <h3 style={{fontSize:'17px', fontWeight:700, color:'var(--text)', marginBottom:'8px'}}>{title}</h3>
              <p style={{color:'var(--muted)', fontSize:'14px', lineHeight:1.6}}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">The Problem</span>
          <h2 className="section-title">Generic Software Wasn&apos;t Built for Fence Work</h2>
          <p className="section-sub">Fence installation is not plumbing. You&apos;re not sending one tech to one job for two hours. You&apos;re bidding linear footage, ordering posts and panels, collecting deposits, scheduling multi-day installs, and tracking a backlog of projects that all need materials staged before a crew rolls.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own fence crews, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to bid <strong>340 linear feet of cedar privacy fence with two gates</strong> and need every post, panel, picket, rail, and bag of concrete itemized so you order right the first time.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t have that. Because they weren&apos;t built by someone who runs a fence company. <strong>We were.</strong> We&apos;ve been in the trades since 2006, and FenceBossPro is the software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in FenceBossPro exists because we needed it on a real fence job. Not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Fence Contractors</span>
          <h2 className="section-title">Features Designed Around Your Operation</h2>
          <p className="section-sub">Every tool in FenceBossPro was built with fence workflows in mind &mdash; not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📐', title:'Linear-Foot Takeoffs', body:'Enter the run, set the height and style, and FenceBossPro prices the job by the linear foot — posts, panels, pickets, and rails counted for you. Bid a 200-foot wood privacy run or a 600-foot chain link line with the same accuracy.'},
            {icon:'📋', title:'Line-Item Estimates', body:'Every bid is fully itemized: materials, gates, hardware, concrete, tear-out, and labor on separate lines. Email it from the platform, let the client accept with one click, and auto-follow-ups go out if they don\'t respond.'},
            {icon:'📦', title:'Materials &amp; Parts Lists', body:'Each job auto-builds a materials list from the bid — posts, panels, pickets, rails, concrete, gate kits, and hardware. Use it to order from your supplier and to load the trailer so crews never make a second run.'},
            {icon:'🚪', title:'Gate &amp; Hardware Tracking', body:'Single, double-drive, and walk gates tracked per job with their hinges, latches, and drop rods. Know exactly which gates are on order and which are ready to hang before you schedule the install.'},
            {icon:'🗂️', title:'The Job Board', body:'Run your whole backlog on one board — deposit collected, materials ordered, scheduled, in progress, and complete. Drag jobs across stages and always know what\'s ready to dispatch and what\'s waiting on posts.'},
            {icon:'📅', title:'Project Scheduling', body:'Schedule single-day repairs and multi-day installs alike. Assign each job a date and an install crew, and FenceBossPro keeps the calendar and the Job Board in sync automatically.'},
            {icon:'🚛', title:'Crew Dispatch &amp; Routing', body:'Assign jobs to crews and order them by location so trucks aren\'t crisscrossing the county. Print a dispatch sheet with the address, scope, and materials for every job of the day.'},
            {icon:'💳', title:'Deposits &amp; Progress Billing', body:'Collect a deposit before you order materials, bill a progress draw mid-install, and charge the balance when the last gate swings. FenceBossPro tracks exactly what\'s been collected on every project.'},
            {icon:'💳', title:'Card-on-File Payments', body:'Store cards on file via Stripe. Charge deposits and balances, send invoices, and collect without chasing anyone down. Every dollar tracked in one place.'},
            {icon:'🏠', title:'Property Profiles', body:'Every property has its own record — fence type and footage installed, gate locations, job history, notes, GPS coordinates, and photos of the line. Everything tied to the address, not just the customer.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive text messages with customers directly inside FenceBossPro. Full conversation history organized by contact — no more switching to your personal phone.'},
            {icon:'💬', title:'Automated Job Alerts', body:'Automatically text customers when the deposit is received, when materials are in, when the crew is on the way, and when the fence is finished. Set it once — FenceBossPro handles it on every job.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed install, FenceBossPro automatically sends a Google review request to the customer — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a homeowner doesn\'t respond to your fence bid. Let FenceBossPro chase the deal so you don\'t have to.'},
            {icon:'💵', title:'Payment Follow-Up Sequences', body:'Unpaid balances trigger 3 automated payment reminder texts. Collect what you\'re owed on completed fence jobs without making uncomfortable calls.'},
            {icon:'👥', title:'Client &amp; Lead Management', body:'Manage existing clients and active prospects side by side. Track bids, job history, and notes all tied to each contact — with a full searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted estimates to invoices instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🏷️', title:'Discount Codes &amp; Sales Tax', body:'Apply percentage or fixed-dollar discounts to any fence bid. Set sales tax rates by jurisdiction and let FenceBossPro calculate and track tax on every invoice automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Installer, and Mobile roles. Control exactly what each person on your team can see and do — from full access down to field-only.'},
            {icon:'🚚', title:'Truck &amp; Crew Management', body:'Create truck and crew profiles, assign them to jobs, and track which crew built each fence. Know exactly what\'s rolling and who\'s on it every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track installer hours per job and generate payroll-ready reports. Know exactly what you owe before payday without running a separate system.'},
            {icon:'📊', title:'Dashboard &amp; Reports', body:'Custom stat cards on your dashboard show today\'s revenue, jobs completed, linear feet sold, deposits collected, money owed, and more — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Deposit received, materials in, crew on the way, job completed, rescheduled, estimate sent, estimate accepted, review request, payment declined, inbound text — all automated, all customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every installer, office staff member, and crew lead at no extra cost. No per-seat fees. Unlimited users are included in the flat $129/month rate.'},
            {icon:'🏢', title:'Unlimited Clients &amp; Jobs', body:'No caps on clients, properties, jobs, or leads. Whether you run 50 fence jobs a year or 5,000 — FenceBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ESTIMATING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Fence Estimating</span>
            <h2>Build an Accurate Line-Item Fence Bid in Minutes &mdash; Down to the Last Picket</h2>
            <p>This is where fence jobs are won or lost. FenceBossPro&apos;s estimator prices by the linear foot and itemizes every post, panel, picket, rail, bag of concrete, gate, and piece of hardware so your bid is right the first time and your materials order matches it exactly. For a full walkthrough of how the right platform runs the whole operation, read <a href="/blogs/fence-installation-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Fence Installation Software: The Complete Guide for Fence Contractors</a>.</p>
            <ul className="check-list">
              <li>Price by the linear foot for wood, vinyl, chain link, aluminum, and ornamental</li>
              <li>Auto-count posts, panels, pickets, and rails from the run</li>
              <li>Add single, double-drive, and walk gates with their hardware</li>
              <li>Itemize concrete, tear-out, and labor on separate lines</li>
              <li>Email the bid and let clients accept with one click</li>
              <li>Accepted bids convert straight to a job, materials list, and invoice</li>
              <li>Deposit auto-calculated so you collect before ordering</li>
              <li>Summary bar: total linear feet, gates, materials, and price</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Estimate — Cedar Privacy + 2 Gates</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>6&apos; Cedar Privacy</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>340 linear feet</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$11,560</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#2b6ca3', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Posts &amp; Concrete</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>44 posts · 88 bags</div></div>
              <div style={{marginLeft:'auto', background:'#2b6ca3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,940</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#94a3b8', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Double-Drive Gate</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>10&apos; · hinges + drop rod</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$680</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Walk Gate</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>4&apos; · latch + self-close</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$320</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#2b6ca3', fontSize:'16px', fontWeight:700}}>Bid it right the first time.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>The materials order matches the bid, line for line.</div>
            </div>
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Materials &amp; Parts</span>
            <h2>Every Post, Panel, and Gate Kit Staged Before the Crew Rolls</h2>
            <p>Wasted trips back to the supply yard kill a fence job&apos;s margin. FenceBossPro builds a materials list straight from the bid the moment a job is sold &mdash; so the office orders right, the yard pulls right, and the trailer is loaded right the first time.</p>
            <ul className="check-list">
              <li>Auto-generated parts list from the accepted bid</li>
              <li>Posts, panels, pickets, rails, and concrete counted per job</li>
              <li>Gate kits and hardware itemized so nothing gets left behind</li>
              <li>Track materials ordered, received, and staged per project</li>
              <li>Build a supplier order and a trailer pull sheet from one list</li>
              <li>Flag jobs still waiting on materials right on the Job Board</li>
              <li>Full materials catalog with your costs stored in the system</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Materials List — Job #4182</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>44</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Posts</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>42</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Panels</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#2b6ca3', fontSize:'20px', fontWeight:700}}>88</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Concrete Bags</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#2b6ca3', fontSize:'20px', fontWeight:700}}>3</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Gate Kits</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>4x4x8 Cedar Posts · qty 44</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Received · staged at yard</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>In</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#2b6ca3', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>10&apos; Double-Drive Gate Kit · qty 1</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>On order · ETA Thursday</div></div>
              <div style={{background:'#2b6ca3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>ETA</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Everything Included.</h2>
          <p className="section-sub">We were paying $500&ndash;$700 a month for software that nickel-and-dimed us. We built FenceBossPro to be the pricing we always wished existed.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>129</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited clients, properties, employees, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Clients, Properties &amp; Leads</li>
              <li>Unlimited Employees &amp; Users</li>
              <li>Line-Item Estimates &amp; Linear-Foot Takeoffs</li>
              <li>Materials &amp; Parts Lists per Job</li>
              <li>Job Board, Scheduling &amp; Crew Dispatch</li>
              <li>Deposits, Progress Billing &amp; Stripe Payments</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Gate &amp; Hardware Tracking</li>
              <li>Mobile App for Installers</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees — ever.</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Fence Installation Software — Common Questions</h2>
          {[
            {q:'Is FenceBossPro built for fence companies?', a:'Yes. FenceBossPro handles the full fence operation: linear-foot takeoffs, line-item bids, materials and parts lists, the Job Board, project scheduling, crew dispatch, deposits and progress billing, automated customer SMS, and card-on-file payments. It\'s designed for contractors installing wood, vinyl, chain link, aluminum, and ornamental fence — not general service businesses.'},
            {q:'Can I bid different fence types — wood, vinyl, chain link, aluminum — in one platform?', a:'Yes. FenceBossPro prices every fence type by the linear foot from one account, itemizing posts, panels, pickets, rails, concrete, gates, and hardware for each. Swap materials or change the height and the whole bid recalculates, so a cedar privacy run and an aluminum ornamental line are equally accurate.'},
            {q:'How does the estimate-to-materials workflow work?', a:'You build a line-item bid by the linear foot, the client accepts with one click, and the job converts straight into a project with a materials list, an invoice, and a deposit request. The parts list matches the bid line for line, so the office orders right and the crew loads the trailer right the first time.'},
            {q:'Does FenceBossPro track gates, hardware, and materials per job?', a:'Yes. Every job carries its own materials list — posts, panels, pickets, rails, concrete, gate kits, and hardware — and you can track what\'s ordered, received, and staged. Jobs still waiting on materials are flagged right on the Job Board so you never dispatch a crew to a job that isn\'t ready.'},
            {q:'Can I collect deposits and bill progress draws?', a:'Yes. Collect a deposit before you order materials, bill a progress draw mid-install, and charge the balance when the last gate is hung — all through the built-in Stripe integration with cards on file. Every dollar collected is tracked per project.'},
            {q:'How much does FenceBossPro cost?', a:'$129/month, all features included. No per-user fees, no add-ons for SMS or the Job Board, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>FenceBossPro runs fence installation alongside fence repair and gate work &mdash; estimates, materials, scheduling, dispatch, and billing all from one platform &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>see the full FenceBossPro platform overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Fence Business<br />on Software Built for Plumbers.</h2>
        <p>FenceBossPro is the only fence installation software built by someone who has actually set posts and hung gates. Try it free for 14 days.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
        </div>
      </div>

      <div id="sbp-backdrop" className="sbp-backdrop" onClick={() => closeAllModals()}></div>
      <SignupForm n={1} />
      <SignupForm n={2} />
      <SignupForm n={3} />
    </>
  );
}
