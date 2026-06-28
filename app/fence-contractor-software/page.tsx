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

export default function FenceContractorSoftware() {
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
        <h1>Fence Contractor Software<br /><span>Built for How You Actually Build</span></h1>
        <p>Most field service software is built for plumbers and HVAC techs. FenceBossPro is built from the ground up for fence companies &mdash; the way you bid line-item jobs, take off linear footage, order materials, schedule crews, and bill deposits is completely different, and your software should be too.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Linear Ft</div><div className="hero-stat-lbl">Takeoffs Drive Every Bid</div></div>
          <div><div className="hero-stat-val">$129</div><div className="hero-stat-lbl">Flat Monthly &mdash; No Add-Ons</div></div>
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
          alt="FenceBossPro fence contractor software dashboard on laptop showing line-item estimate builder, material list, and job board, with mobile app on phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Fence Software.</span></h2>
        <p>$129/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. FenceBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature you actually need.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📐</div><h4>Linear-Foot Takeoffs</h4><p>Enter the run, pick the fence type, and FenceBossPro calculates posts, panels, rails, pickets, concrete, and gate hardware automatically. Every bid is built on a real takeoff &mdash; not a guess scribbled on the back of a contract.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🧾</div><h4>Line-Item Estimates</h4><p>Build a detailed, itemized fence bid in minutes &mdash; wood, vinyl, chain link, aluminum, or ornamental &mdash; with labor, materials, and gates broken out line by line so the customer sees exactly what they&apos;re paying for.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Communication Suite</h4><p>Two-way SMS inbox, 10+ automated alert types, estimate follow-up sequences, payment reminders, review requests &mdash; all built in at the flat price. No Twilio account, no Mailchimp, no third-party setup.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Payments</h4><p>Cards on file, deposits, progress billing, invoicing, and overdue reports &mdash; the full Stripe integration is wired in. Collect a deposit before you order materials and the balance the day the gate swings.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Owner, Manager, Office Staff, Crew Lead, and Mobile-only roles. Granular permission control so your install crews only see what they need and your office manager can&apos;t accidentally delete a client record.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your crews get a mobile-optimized dashboard with their jobs for the day, the material list, and the site notes. Complete, reschedule, snap photos, and log progress &mdash; all from the jobsite without calling the office once.</p></div>
        </div>
      </div>

      {/* JOB BOARD */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The Job Board &mdash; Project Pipeline</span>
            <h2 style={{color:'#fff'}}>Every Fence Job, From Signed Bid to Final Walkthrough, on One Board.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>The Job Board is the fastest way to run a fence shop we&apos;ve ever seen. Every signed project moves across the board &mdash; awaiting materials, scheduled, in progress, punch list, paid &mdash; so you always know which jobs are waiting on posts, which crews are dispatched where, and which balances are still owed, all in real time before anyone leaves the yard.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Drag a job from &quot;Awaiting Materials&quot; to &quot;Scheduled&quot; in one move</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>See linear feet, fence type, and crew assigned on every card</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Flags jobs whose materials haven&apos;t been ordered yet</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>One click to dispatch a crew to a date and route their stops</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Tightens scheduling geographically &mdash; no more crews crossing town twice</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Works across wood, vinyl, chain link, aluminum, and gate jobs at once</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts daily planning from an hour to under 5 minutes</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Shows deposits collected vs. balances still owed on every project</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Job Board &mdash; Project Pipeline</div>
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
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Active Projects</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>3,840</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Linear Ft Booked</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>11</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Gates In Queue</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Wood &middot; 6 &nbsp;|&nbsp; Vinyl &middot; 5 &nbsp;|&nbsp; Chain Link &middot; 5 &nbsp;|&nbsp; Aluminum &middot; 3</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Breakdown by Fence Type</div>
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
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. FenceBossPro is the exception. Every screen was designed by people who have set posts and hung gates &mdash; not UX designers who&apos;ve never run a string line. Your team will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your fence types, build your material catalog, import your clients and properties, set up your automated alerts, and connect Stripe — most owners are fully operational the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Estimating, the Job Board, dispatch, material lists, and invoicing are all connected. You\'re not jumping between five different modules or browser tabs. Pull up the board and everything you need for the day is right there in a single view.'},
            {n:'03', title:'Your Crews Learn It in Minutes', body:'The mobile app your crews use shows them exactly what they need and nothing they don\'t. Their jobs for the day, the property info, the material list, the site notes, and the complete button. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your SMS alerts, estimate follow-ups, and payment reminders once. After that, FenceBossPro handles every notification, every follow-up, and every review request automatically — whether you\'re on a jobsite, at the supply yard, or on vacation.'},
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
          <h2 className="section-title">Generic Software Wasn&apos;t Built for Fence Contractors</h2>
          <p className="section-sub">Fencing is not plumbing. You&apos;re not sending one tech to one job for two hours. You&apos;re bidding line-item projects, taking off hundreds of linear feet, ordering posts and panels, collecting deposits, and juggling install crews across a dozen jobs at once.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own crews, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to bid a <strong>340-foot cedar privacy fence with two gates</strong> and need posts, rails, pickets, concrete, and hardware calculated before you ever quote a price.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t have that. Because they weren&apos;t built by someone who runs a fence business. <strong>We were.</strong> We&apos;ve been in the trades since 2006, and FenceBossPro is the software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in FenceBossPro exists because we needed it on a real fence job. Not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Fencing</span>
          <h2 className="section-title">Features Designed Around Your Operation</h2>
          <p className="section-sub">Every tool in FenceBossPro was built with fence workflows in mind &mdash; not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📐', title:'Linear-Foot Takeoffs', body:'Enter the run and pick the fence style — FenceBossPro calculates posts, panels, rails, pickets, concrete, and gate hardware automatically. Every bid is built on a real takeoff instead of a rough guess.'},
            {icon:'🧾', title:'Line-Item Estimates', body:'Build detailed, itemized fence bids in minutes — wood, vinyl, chain link, aluminum, or ornamental — with labor, materials, and gates broken out line by line. Email it and let the client accept with one click.'},
            {icon:'📦', title:'Materials & Parts Catalog', body:'Store posts, panels, pickets, rails, caps, concrete, gates, and hardware with your real costs. Every estimate pulls from the catalog, so your material list is ready the moment the job is sold.'},
            {icon:'📋', title:'Per-Job Material Lists', body:'Every signed project generates a pull list — exactly what to load on the truck and what to order from the supplier. No more short trips back for three more posts and a bag of concrete.'},
            {icon:'🗂️', title:'The Job Board', body:'Every project moves from signed bid to awaiting materials, scheduled, in progress, punch list, and paid. One board shows you the whole pipeline and what each job is waiting on.'},
            {icon:'🚚', title:'Crew Dispatch & Routing', body:'Assign jobs to crews and dates, then route the day geographically. Your leads see their stops, the material list, and the site notes from the truck — no calls to the office.'},
            {icon:'💬', title:'Automated Job Alerts', body:'Automatically text customers when their install is scheduled, when the crew is on the way, and when the fence is finished. Set it once and FenceBossPro handles every job.'},
            {icon:'💳', title:'Deposits & Card-on-File', body:'Collect a deposit before you order materials and store the card on file via Stripe. Charge the balance the day the gate swings — without chasing anyone down.'},
            {icon:'📈', title:'Progress Billing', body:'Bill a deposit up front, a draw at material delivery, and the balance at completion. FenceBossPro tracks what\'s been collected and what\'s still owed on every project.'},
            {icon:'🏠', title:'Property Profiles', body:'Every property has its own record — fence type, linear footage, gate locations, install history, site notes, GPS coordinates, and photos. Everything tied to the address, not just the customer.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive text messages with customers directly inside FenceBossPro. Full conversation history organized by contact — no more switching to your personal phone.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed install, FenceBossPro automatically sends a Google review request to the customer — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a client doesn\'t respond to your fence bid. Let FenceBossPro chase the deal so you don\'t have to.'},
            {icon:'💳', title:'Payment Follow-Up Sequences', body:'Unpaid balances trigger 3 automated payment reminder texts. Collect what you\'re owed on a finished fence without making uncomfortable calls.'},
            {icon:'👥', title:'Client & Lead Management', body:'Manage existing clients and active prospects side by side. Track bids, install history, and notes all tied to each contact — with a full searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted bids to invoices instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🏷️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any estimate. Set sales tax rates by jurisdiction and let FenceBossPro calculate and track tax on every invoice automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Crew Lead, and Mobile roles. Control exactly what each person on your team can see and do — from full access down to field-only.'},
            {icon:'🚛', title:'Truck & Trailer Management', body:'Create vehicle profiles, assign rigs to jobs, and track which truck and trailer handled each install. Know exactly what\'s on every truck every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track crew hours per job and generate payroll-ready reports. Know exactly what you owe before payday without running a separate system.'},
            {icon:'📊', title:'Dashboard & Reports', body:'Custom stat cards on your dashboard show today\'s revenue, jobs completed, projects in progress, money owed, and more — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Install scheduled, completed, rescheduled, estimate sent, estimate accepted, deposit received, review request, payment declined, inbound text — all automated, all customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every crew member, office staff member, and lead at no extra cost. No per-seat fees. Unlimited users are included in the flat $129/month rate.'},
            {icon:'🏢', title:'Unlimited Clients & Projects', body:'No caps on clients, properties, or jobs. Whether you run 50 fences a year or 5,000 — FenceBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ESTIMATING / TAKEOFFS */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Fence Estimating</span>
            <h2>Build a Line-Item Bid From a Linear-Foot Takeoff in Minutes</h2>
            <p>This is the feature no other field service software has. FenceBossPro&apos;s estimator doesn&apos;t just hold a price &mdash; you enter the run and the fence style, and it calculates posts, panels, rails, pickets, concrete, and gate hardware, then drops every line onto the bid with your real costs. For a closer look at how the estimate and material list become the daily operational hub for a fence shop, read <a href="/blogs/what-is-fence-contractor-software" style={{color:'var(--orange)', fontWeight:600}}>What Is Fence Contractor Software, and What Should It Actually Do?</a></p>
            <ul className="check-list">
              <li>Linear-foot takeoff auto-counts posts, panels, rails &amp; pickets</li>
              <li>Line-item bids for wood, vinyl, chain link, aluminum &amp; ornamental</li>
              <li>Gates and hardware added as their own line items</li>
              <li>Material list generated automatically from the accepted bid</li>
              <li>Email the bid and let clients accept with one click</li>
              <li>Collect a deposit the moment the estimate is approved</li>
              <li>Convert the accepted bid to an invoice instantly</li>
              <li>Summary bar: linear feet, materials, labor, and total for the job</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Estimate &mdash; Cedar Privacy Fence</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>6&apos; Cedar Privacy &middot; 340 ft</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>43 posts &middot; 510 pickets</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$9,840</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#2b6ca3', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Concrete &middot; 43 bags</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Post setting material</div></div>
              <div style={{marginLeft:'auto', background:'#2b6ca3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$430</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#94a3b8', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Walk Gate &middot; 4 ft</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Hinges, latch &amp; hardware</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$380</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Double Drive Gate &middot; 12 ft</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Drop rod &amp; cane bolt</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,140</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#2b6ca3', fontSize:'16px', fontWeight:700}}>Takeoff to bid in minutes.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Materials counted before you quote a price.</div>
            </div>
          </div>
        </div>
      </section>

      {/* MATERIALS TRACKING */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Materials &amp; Job Costing</span>
            <h2>Materials Tracking Built for the Way Fence Jobs Get Ordered</h2>
            <p>Every fence job lives or dies on materials. FenceBossPro turns each accepted bid into a precise pull list &mdash; posts, panels, rails, pickets, concrete, gates, and hardware &mdash; so you order the right quantities once and your crews load the truck right the first time.</p>
            <ul className="check-list">
              <li>Per-job material list generated from the accepted bid</li>
              <li>Track posts, panels, rails, pickets, concrete &amp; caps by job</li>
              <li>Separate gate and hardware lines for every opening</li>
              <li>Store real supplier costs in the material catalog</li>
              <li>Compare estimated materials against actual usage</li>
              <li>Print pull sheets for the supply yard and the crew</li>
              <li>Full material catalog with your pricing stored in the system</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Material List &mdash; June 2026</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>218</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Posts Ordered</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>134</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Panels Pulled</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#2b6ca3', fontSize:'20px', fontWeight:700}}>3,840</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Linear Ft Booked</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#2b6ca3', fontSize:'20px', fontWeight:700}}>27</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Gates Built</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Cedar Privacy &middot; 340 ft</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Crew A &middot; Scheduled Tue</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>43 posts</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#2b6ca3', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Chain Link &middot; 220 ft</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Crew B &middot; Awaiting Materials</div></div>
              <div style={{background:'#2b6ca3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>28 posts</div>
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
              <li>Materials Catalog &amp; Per-Job Material Lists</li>
              <li>The Job Board, Dispatch &amp; Crew Routing</li>
              <li>Invoices, Deposits, Progress Billing &amp; Stripe Payments</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Property Profiles &amp; Photos</li>
              <li>Mobile App for Crews</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees &mdash; ever.</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Fence Contractor Software &mdash; Common Questions</h2>
          {[
            {q:'Is FenceBossPro built for fence contractors?', a:'Yes. FenceBossPro handles the full fence operation: linear-foot takeoffs, line-item estimates, material lists, the Job Board, crew dispatch, deposit and progress billing, automated customer SMS, and card-on-file payments. It\'s designed for companies installing and repairing fence and gates, not general service businesses.'},
            {q:'Can I estimate wood, vinyl, chain link, aluminum, and ornamental fence in one platform?', a:'Yes. FenceBossPro supports every fence type from one account. Pick the style, enter the run, and the takeoff counts posts, panels, rails, pickets, concrete, and gate hardware for that material — then drops each one onto a line-item bid with your real costs.'},
            {q:'How does scheduling and dispatch work for fence jobs?', a:'Every signed project lands on the Job Board and moves through awaiting materials, scheduled, in progress, punch list, and paid. You assign crews and dates, route the day geographically, and your leads see their jobs, material lists, and site notes from the truck.'},
            {q:'Does FenceBossPro handle deposits and progress billing?', a:'Yes. Collect a deposit the moment a bid is accepted, store the card on file via Stripe, bill a draw at material delivery, and charge the balance at completion. FenceBossPro tracks what\'s collected and what\'s still owed on every project.'},
            {q:'Does it replace spreadsheets and paper bids?', a:'Yes. FenceBossPro replaces spreadsheet estimating, paper material lists, scheduling boards, customer tracking, and SMS tools in one platform. Most owners are fully operational the same day they sign up — no onboarding consultant, no implementation timeline.'},
            {q:'How much does FenceBossPro cost?', a:'$129/month, all features included. No per-user fees, no add-ons for SMS or the estimator, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>FenceBossPro handles wood, vinyl, chain link, aluminum, and ornamental fence &mdash; plus repairs and gates &mdash; all from one platform &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>see the full FenceBossPro platform overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Fence Business<br />on Software Built for Plumbers.</h2>
        <p>FenceBossPro is the only fence contractor software built by someone who has actually set posts and hung gates. Try it free for 14 days.</p>
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
