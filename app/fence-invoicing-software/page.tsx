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
      if (secs <= 0) { clearInterval(iv); window.location.href = 'https://my.fencebosspro.com/dashboard.html' + (typeof signInData!=='undefined'&&signInData&&signInData.session?'#access_token='+encodeURIComponent(signInData.session.access_token)+'&refresh_token='+encodeURIComponent(signInData.session.refresh_token):''); }
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

export default function FenceInvoicingSoftware() {
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
        <h1>Fence Invoicing &amp; Billing Software<br /><span>Built for How You Actually Bid and Bill</span></h1>
        <p>Most invoicing software is built for one-off service calls. Fencing isn&apos;t like that. You&apos;re pricing jobs by the linear foot, ordering posts, panels, and gates, collecting a deposit before the auger ever hits dirt, and billing the balance when the last picket goes up. FenceBossPro is built for that exact workflow &mdash; line-item estimates, material takeoffs, deposits, and card-on-file payments all in one place.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Linear Ft</div><div className="hero-stat-lbl">Takeoffs Priced Automatically</div></div>
          <div><div className="hero-stat-val">$129</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">500+</div><div className="hero-stat-lbl">SMS Alerts Included Monthly</div></div>
          <div><div className="hero-stat-val">2006</div><div className="hero-stat-lbl">In the Industry Since</div></div>
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
          alt="FenceBossPro fence invoicing software dashboard on laptop showing a line-item fence estimate, materials list, and deposit collected, with the mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Fence Billing Software.</span></h2>
        <p>$129/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. FenceBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature a fence contractor actually needs.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📐</div><h4>Line-Item Estimates</h4><p>Build a detailed fence bid in minutes &mdash; linear feet of wood, vinyl, chain link, or aluminum, gates, posts, and hardware all priced as separate line items. Email it from the platform and let the customer accept with one click.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📦</div><h4>Materials &amp; Parts</h4><p>Every estimate ties to a materials list: posts, panels, pickets, rails, concrete bags, gates, and hardware. Know your material cost on every job before you ever pick up the phone to your supplier.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Communication Suite</h4><p>Two-way SMS inbox, 10+ automated alert types, estimate follow-up sequences, payment reminders, and review requests &mdash; all built in at the flat price. No Twilio account, no Mailchimp, no third-party setup.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Payments</h4><p>Cards on file, deposits, progress billing, final invoices, and overdue reports &mdash; the full Stripe integration is wired in. Customers pay instantly and you see every dollar collected in one place.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Owner, Manager, Office Staff, Crew Lead, and Mobile-only roles. Granular permission control so your install crews only see what they need and your office manager can&apos;t accidentally delete a client record.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your installers get a mobile-optimized dashboard with their jobs for the day. Complete, reschedule, add job photos, and capture a deposit on site &mdash; all from the truck without calling the office once.</p></div>
        </div>
      </div>

      {/* TAKEOFF */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Linear-Foot Takeoffs &amp; Bids</span>
            <h2 style={{color:'#fff'}}>Price a Fence by the Linear Foot. Watch the Whole Bid Build Itself.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>Enter the run length, pick the fence type, and FenceBossPro does the math &mdash; posts spaced to your standard, panels or pickets counted, rails, concrete, gates, and hardware all dropped in as priced line items. You see the material cost, the labor, and the customer total update in real time before you commit to a number.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Enter linear feet &mdash; posts, panels, and pickets calculated automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Works for wood, vinyl, chain link, aluminum, and ornamental fence</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Add gates, corners, end posts, and hardware as their own line items</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Material cost and customer total update as you build the bid</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Save fence types as templates so every bid starts from your pricing</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Apply discounts and sales tax automatically per jurisdiction</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts bid-writing time from 30 minutes to under 5</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Email the finished estimate and let the customer accept in one click</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Estimate Builder — Cedar Privacy Fence</div>
            <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', padding:'20px', marginBottom:'14px', position:'relative', minHeight:'130px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <div style={{position:'absolute', top:'14px', left:'18px', right:'18px', bottom:'14px', border:'2.5px dashed #2b6ca3', borderRadius:'10px', opacity:.7}}></div>
              <div style={{display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:1}}>
                {['p','p','p','p','g','p','p','p','p','p','g','p','p','p','p','p','p','g','p'].map((t,i) => (
                  <div key={i} style={{width:'11px', height:'11px', borderRadius:'2px', flexShrink:0, background: t==='p' ? '#2b6ca3' : 'rgba(255,255,255,.2)', boxShadow: t==='p' ? '0 0 0 3px rgba(43,108,163,.3)' : 'none'}}></div>
                ))}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>168</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Linear Feet</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>23</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Posts</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>336</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Pickets</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#2b6ca3', fontSize:'18px', fontWeight:800}}>2</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Gates</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Materials $3,840 &nbsp;|&nbsp; Labor $2,760 &nbsp;|&nbsp; Total $6,600</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Live Bid Breakdown</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Fence Billing Software Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. FenceBossPro is the exception. Every screen was designed by people who have built fence and chased down a final invoice &mdash; not UX designers who&apos;ve never set a post. Your team will be writing bids and sending invoices confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your fence types and material pricing, import your clients and properties, set up your automated alerts, and connect Stripe — most owners are writing bids the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Estimates, materials, scheduling, the job board, and invoicing are all connected. You\'re not jumping between five different modules or browser tabs. Pull up a job and the bid, the materials list, the deposit, and the balance owed are right there in one view.'},
            {n:'03', title:'Your Crew Learns It in Minutes', body:'The mobile app your installers use shows them exactly what they need and nothing they don\'t. Their jobs for the day, the property info, the materials, and job photos. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your SMS alerts, estimate follow-ups, and payment reminders once. After that, FenceBossPro handles every notification, every follow-up, and every review request automatically — whether you\'re on a job site, at the supply yard, or at home.'},
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
          <h2 className="section-title">Generic Invoicing Wasn&apos;t Built for Fence Work</h2>
          <p className="section-sub">A fence job isn&apos;t a flat-rate service call. You&apos;re pricing by the linear foot, ordering material per project, collecting a deposit to cover the posts and panels, and billing the balance on completion. Generic invoicing tools have no idea what a takeoff or a gate even is.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own fence crews, we tried every invoicing tool out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to bid <strong>168 linear feet of cedar privacy fence with two gates</strong> and need a deposit on file before the material order even went in.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t have that. Because they weren&apos;t built by someone who runs a fence company. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and FenceBossPro is the billing software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in FenceBossPro exists because we needed it on a real fence job &mdash; from the first bid to the final paid invoice. Not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Fence Contractors</span>
          <h2 className="section-title">Features Designed Around Your Operation</h2>
          <p className="section-sub">Every tool in FenceBossPro was built with fence workflows in mind &mdash; not adapted from a one-off service app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📐', title:'Linear-Foot Estimates', body:'Price wood, vinyl, chain link, aluminum, and ornamental fence by the linear foot. Posts, panels, pickets, rails, and gates calculate automatically so your bid is accurate every time.'},
            {icon:'📦', title:'Materials &amp; Parts Lists', body:'Every estimate ties to a materials list — posts, panels, pickets, rails, concrete, gates, and hardware. See your material cost on every job before you call the supplier.'},
            {icon:'📋', title:'Estimate Templates', body:'Save your standard fence types as templates. A 6-foot cedar privacy run, a 4-foot black aluminum, a chain link dog run — start every bid from your own pricing in seconds.'},
            {icon:'💵', title:'Deposits &amp; Progress Billing', body:'Collect a deposit before you order material, bill progress payments on big jobs, and invoice the balance on completion. FenceBossPro tracks every payment against the job total.'},
            {icon:'💬', title:'Automated Job Alerts', body:'Automatically text customers when the bid is accepted, when install is scheduled, when your crew is on the way, and when the job is done. Set it once — FenceBossPro handles it.'},
            {icon:'✅', title:'Estimates That Close', body:'Build a fence bid in minutes, email it directly from the platform, and let clients accept with one click. Auto-follow-ups go out if they don\'t respond.'},
            {icon:'💳', title:'Card-on-File Payments', body:'Store cards on file via Stripe. Charge the deposit, send invoices, and collect the balance without chasing anyone down. Every dollar tracked in one place.'},
            {icon:'📱', title:'Mobile App for Crews', body:'Your installers get a mobile-optimized view of their jobs for the day. Mark jobs complete, add photos, and capture a deposit on site — right from the truck.'},
            {icon:'🏠', title:'Property Profiles', body:'Every property has its own record — fence type, run lengths, gate locations, job history, notes, GPS coordinates, and photos. Everything tied to the address, not just the customer.'},
            {icon:'🗓️', title:'Job &amp; Install Scheduling', body:'Schedule installs and repairs onto a calendar, assign a crew and a truck, and see the whole week at a glance. Reschedule with a drag and the customer gets a text automatically.'},
            {icon:'📌', title:'The Job Board', body:'Every job in one board — bid sent, accepted, scheduled, in progress, and complete. See exactly what stage every fence project is in and what needs to happen next.'},
            {icon:'🚚', title:'Crew Dispatch &amp; Routing', body:'Dispatch crews to the right job in the right order. Build tight routes between job sites and supply runs so your trucks aren\'t crossing town twice in a day.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed install, FenceBossPro automatically sends a Google review request to the customer — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a client doesn\'t respond to your fence bid. Let FenceBossPro chase the deal so you don\'t have to.'},
            {icon:'💳', title:'Payment Follow-Up Sequences', body:'Unpaid balances trigger 3 automated payment reminder texts. Collect what you\'re owed on a finished fence without making uncomfortable calls.'},
            {icon:'👥', title:'Client &amp; Lead Management', body:'Manage existing clients and active prospects side by side. Track bids, job history, and notes all tied to each contact — with a full searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted estimates to invoices instantly. Filter by unpaid, deposit-paid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🏷️', title:'Discount Codes &amp; Sales Tax', body:'Apply percentage or fixed-dollar discounts to any bid. Set sales tax rates by jurisdiction and let FenceBossPro calculate and track tax on every invoice automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Crew Lead, and Mobile roles. Control exactly what each person on your team can see and do — from full access down to field-only.'},
            {icon:'🚛', title:'Truck Management', body:'Create truck profiles, assign vehicles to crews, and track which truck handled each install. Know exactly what\'s on every truck every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track crew hours per job and generate payroll-ready reports. Know exactly what you owe and what each install cost in labor before payday.'},
            {icon:'📊', title:'Dashboard &amp; Reports', body:'Custom stat cards on your dashboard show today\'s revenue, deposits collected, jobs completed, balances owed, and more — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Bid sent, bid accepted, install scheduled, on the way, job complete, deposit received, payment reminder, review request, inbound text — all automated, all customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every installer, office staff member, and crew lead at no extra cost. No per-seat fees. Unlimited users are included in the flat $129/month rate.'},
            {icon:'🏢', title:'Unlimited Clients &amp; Jobs', body:'No caps on clients, properties, bids, or jobs. Whether you run 50 fence jobs a year or 5,000 — FenceBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3 dangerouslySetInnerHTML={{__html: title}} />
              <p dangerouslySetInnerHTML={{__html: body}} />
            </div>
          ))}
        </div>
      </section>

      {/* INVOICING & DEPOSITS */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Invoicing &amp; Deposits</span>
            <h2>Collect the Deposit Up Front. Bill the Balance When the Last Picket Goes Up.</h2>
            <p>Fence jobs live and die on cash flow. FenceBossPro lets you collect a deposit the moment the bid is accepted &mdash; enough to cover your posts, panels, and gates &mdash; then bill progress payments on the big jobs and invoice the final balance on completion. Every payment is tracked against the job total so you always know exactly what&apos;s collected and what&apos;s still owed. For a full walkthrough of billing a fence business from bid to paid, read <a href="/blogs/fence-invoicing-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Fence Invoicing Software: The Complete Guide to Billing a Fence Business</a>.</p>
            <ul className="check-list">
              <li>Collect a deposit the moment a bid is accepted</li>
              <li>Bill progress payments on large multi-day installs</li>
              <li>Invoice the final balance the day the job is done</li>
              <li>Cards on file via Stripe — charge without chasing</li>
              <li>Every payment tracked against the job total</li>
              <li>Filter invoices by unpaid, deposit-paid, partial, or overdue</li>
              <li>Automated text reminders on unpaid balances</li>
              <li>Full payment history, method, and date on every job</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Job Billing — Cedar Privacy Fence</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Deposit — Materials</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Paid · card on file</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$2,640</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#2b6ca3', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Progress — Posts Set</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Paid · day 2</div></div>
              <div style={{marginLeft:'auto', background:'#2b6ca3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,980</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#94a3b8', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Final Balance</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Due on completion</div></div>
              <div style={{marginLeft:'auto', background:'#475569', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$1,980</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#2b6ca3', fontSize:'16px', fontWeight:700}}>Get paid before you order material.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Deposits, progress, and balance — all in one job.</div>
            </div>
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Materials &amp; Parts</span>
            <h2>Every Bid Knows Exactly What It Costs to Build</h2>
            <p>A fence bid is only as good as the material behind it. FenceBossPro builds a parts list under every estimate &mdash; posts, panels, pickets, rails, concrete, gates, and hardware &mdash; so the moment you finish a takeoff, you know your material cost and your margin. No more guessing, no more eating a bad bid.</p>
            <ul className="check-list">
              <li>Posts, panels, pickets, rails, concrete, gates, and hardware</li>
              <li>Material cost and margin shown on every bid</li>
              <li>Parts pull from your own price list and supplier costs</li>
              <li>Track material type: wood, vinyl, chain link, aluminum, ornamental</li>
              <li>Gate and hardware line items priced separately</li>
              <li>Generate a clean material order list per job</li>
              <li>Full parts catalog stored and reused across every estimate</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Materials List — 6&apos; Cedar Privacy</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>23</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>4x4 Posts</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>336</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Cedar Pickets</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#2b6ca3', fontSize:'20px', fontWeight:700}}>66</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Rails</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#2b6ca3', fontSize:'20px', fontWeight:700}}>46</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Concrete Bags</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Walk Gate · 4&apos; w/ hardware</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Latch, hinges, drop rod</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$285</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#2b6ca3', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Double Drive Gate · 10&apos;</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Cane bolt, heavy hinges</div></div>
              <div style={{background:'#2b6ca3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$640</div>
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
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited clients, properties, jobs, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Clients, Properties &amp; Leads</li>
              <li>Unlimited Crew Members &amp; Users</li>
              <li>Line-Item Estimates &amp; Material Takeoffs</li>
              <li>Job Board, Scheduling &amp; Crew Dispatch</li>
              <li>Deposits, Progress Billing &amp; Final Invoices</li>
              <li>Stripe Card-on-File Payments</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Materials &amp; Parts Catalog</li>
              <li>Mobile App for Crews</li>
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
          <h2 className="section-title" style={{marginBottom:'48px'}}>Fence Invoicing Software — Common Questions</h2>
          {[
            {q:'Is FenceBossPro built for fence contractors?', a:'Yes. FenceBossPro handles the full fence operation: linear-foot estimates, material takeoffs, job scheduling, crew dispatch, deposits, progress billing, automated customer SMS, and card-on-file payments. It\'s designed for companies installing and repairing fence and gates, not general service businesses.'},
            {q:'Can I bid wood, vinyl, chain link, and aluminum fence in one platform?', a:'Yes. FenceBossPro prices every common fence type by the linear foot — wood, vinyl, chain link, aluminum, and ornamental. Posts, panels, pickets, rails, gates, and hardware all drop in as line items, and you can save each fence type as a reusable template.'},
            {q:'How do deposits and progress billing work?', a:'When a customer accepts a bid, you collect a deposit on a card on file — enough to cover material. On larger installs you can bill progress payments, then invoice the final balance on completion. Every payment is tracked against the job total so you always know what\'s collected and what\'s owed.'},
            {q:'Does FenceBossPro do material takeoffs?', a:'Yes. Enter the run length and fence type and FenceBossPro calculates posts, panels, pickets, rails, concrete, gates, and hardware automatically. Every bid carries a materials list with your cost, so you know your margin before you ever order from the supplier.'},
            {q:'Does it replace spreadsheets and paper invoices?', a:'Yes. FenceBossPro replaces spreadsheet bidding, paper invoices, job tracking, and customer texting in one platform. Most owners are writing bids and sending invoices the same day they sign up — no onboarding consultant, no implementation timeline.'},
            {q:'How much does FenceBossPro cost?', a:'$129/month, all features included. No per-user fees, no add-ons for invoicing or material tools, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>FenceBossPro handles invoicing alongside estimates, material takeoffs, scheduling, dispatch, and payments &mdash; all from one platform &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>see the full FenceBossPro platform overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Fence Business<br />on Spreadsheets and Paper Invoices.</h2>
        <p>FenceBossPro is the only fence billing software built by someone who has actually set a post and chased a final invoice. Try it free for 14 days.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
      </div>

      <div id="sbp-backdrop" className="sbp-backdrop" onClick={() => closeAllModals()}></div>
      <SignupForm n={1} />
      <SignupForm n={2} />
      <SignupForm n={3} />
    </>
  );
}
