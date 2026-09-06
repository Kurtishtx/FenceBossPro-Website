'use client';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroDemo from '../components/HeroDemo';
import SignupModal from '../components/SignupModal';

/* FAQ copy lives in one array so the rendered FAQ block and the injected
   FAQPage JSON-LD can never drift apart. */
const faqs = [
  {
    q: 'Does FenceBossPro invoice my Canadian customers in Canadian dollars?',
    a: 'Yes — natively, not as a workaround. Set your country to Canada in Company Info and every invoice, card charge, and Pay Now link bills in CAD through your own Canadian Stripe account. Your customer sees a Canadian-dollar total, pays a Canadian-dollar amount, and the money settles into your Canadian Stripe account. There is no currency setting to fight with on each invoice.',
  },
  {
    q: 'Does the rest of the platform work in Canada today?',
    a: 'Yes. Estimates, install scheduling, crew dispatch and routing, client and property records, the crew app, and the customer app all work in Canada right now. You can sign up for the free trial from Canada, load your fence types and parts catalog, and send your first bid the same day.',
  },
  {
    q: 'Is the subscription itself billed in CAD?',
    a: "No — we're upfront about this one. The $129/month subscription is billed in US dollars, and your bank converts it at its exchange rate. Your customer-facing billing is fully CAD; the one USD charge is the software subscription itself.",
  },
  {
    q: 'Does automated texting work in Canada?',
    a: "Yes, with one honest caveat: Canadian carriers require your sending number to be a registered Canadian number, so texting is set up during onboarding rather than being instant the moment you sign up. We register a Canadian sending number with the carriers for you as part of getting started. Email alerts and customer-app notifications work on day one while the number registration completes.",
  },
  {
    q: 'Can I put GST/HST on my invoices?',
    a: 'FenceBossPro lets you set your own tax rates per jurisdiction and applies them to invoices automatically, with tax reports so you can see what you collected. You enter the GST/HST or provincial rate that applies to your business and it is calculated on every invoice from then on.',
  },
  {
    q: 'How does the free trial work?',
    a: "14 days, full access to every feature, no credit card required to start. If you decide it's not for you, your account simply stops — no charges and no cancellation call. If you keep it, it's $129/month flat with every feature included and unlimited users.",
  },
  {
    q: 'Is there a contract or a setup fee?',
    a: 'No contract, no setup fee, no per-user fees. Month to month, cancel anytime. One flat price includes the whole platform — estimating, scheduling, dispatch, CAD invoicing, the crew app, and the customer app.',
  },
];

export default function FenceContractorSoftwareCanada() {
  const openTrial = (el: HTMLElement) => { (window as any).__openSignup?.(1, el); };

  /* FAQPage structured data, injected from the same FAQ array rendered below. */
  useEffect(() => {
    const ID = 'canada-faq-ld';
    if (document.getElementById(ID)) return;
    const s = document.createElement('script');
    s.id = ID;
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(s);
    return () => { document.getElementById(ID)?.remove(); };
  }, []);

  return (
    <>
      <style>{`
        .btn-demo { display: inline-flex; align-items: center; gap: 9px; background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.32); color: #fff; font-size: 16px; font-weight: 700; padding: 15px 30px; border-radius: 8px; text-decoration: none; transition: background .18s, border-color .18s, transform .18s; }
        .btn-demo:hover { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.6); transform: translateY(-1px); }
        .btn-demo .btn-demo-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.22); }
        .price-desc { color: var(--muted); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
        .ca-hero-flag { display:inline-block; margin-right:8px; }
        .ca-shot { display:block; width:100%; max-width:520px; margin:0 auto; border-radius:14px; box-shadow:0 18px 60px rgba(15,23,32,.25); border:1.5px solid var(--border); }
        .ca-shot-cap { text-align:center; color:var(--muted); font-size:13px; line-height:1.6; max-width:520px; margin:14px auto 0; }
        .ca-faq-item { border-bottom:1.5px solid var(--border); padding:24px 0; }
        .ca-faq-item:last-child { border-bottom:none; }
        .ca-faq-q { font-size:17px; font-weight:700; color:var(--text); margin-bottom:8px; }
        .ca-faq-a { font-size:15px; color:var(--muted); line-height:1.7; }
        .ca-season-bar { display:flex; max-width:760px; margin:0 auto 52px; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,.14); }
        .ca-season-seg { padding:12px 6px; font-size:12px; font-weight:700; text-align:center; color:#fff; }
        @media (max-width:700px) { .ca-season-seg { font-size:10px; } }
      `}</style>

      <Navbar onTrialClick={openTrial} />

      {/* ═══ PRICE + LIVE DEMO ═══ */}
      <div style={{background:'linear-gradient(135deg, #0f1720 0%, #16202b 60%, #1f2d3d 100%)', padding:'clamp(76px,7vw,80px) clamp(14px,4vw,40px) 0', textAlign:'center'}}>
        <div style={{textAlign:'center', marginBottom:'clamp(22px,3vw,32px)'}}>
          <div style={{display:'inline-flex', alignItems:'baseline', gap:'12px', flexWrap:'wrap', justifyContent:'center', color:'#fff'}}>
            <span style={{fontSize:'clamp(30px,4.6vw,46px)', fontWeight:800, lineHeight:1}}>$129<span style={{fontSize:'.46em', fontWeight:700, color:'rgba(255,255,255,.6)'}}>/month</span></span>
            <span style={{fontSize:'clamp(16px,2.2vw,22px)', fontWeight:800, color:'var(--orange)'}}>&middot; 14-Day Free Trial</span>
          </div>
          <div style={{color:'rgba(255,255,255,.6)', fontSize:'13px', fontWeight:600, marginTop:'7px', letterSpacing:'.3px'}}>No credit card required &middot; Cancel anytime &middot; Your customers pay in CAD</div>
        </div>
        <HeroDemo />
      </div>

      {/* ═══ HERO ═══ */}
      <div className="hero" style={{paddingTop:'60px'}}>
        <div className="hero-badge"><span className="ca-hero-flag">🍁</span>Built for Canadian Fence &amp; Gate Contractors</div>
        <h1>Fence Contractor Software for Canada<br /><span>Your Customers Pay in Canadian Dollars</span></h1>
        <p>Every invoice, card charge, and Pay Now link bills in CAD through your own Canadian Stripe account &mdash; set your country to Canada in Company Info once and it&apos;s done. Line-item fence bids, deposits, install scheduling, crew dispatch, and a customer app, all built around a season that ends when the ground freezes.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openTrial(e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <a href="https://my.fencebosspro.com/demo.html" className="btn-demo"><span className="btn-demo-dot" />Try the Live Demo</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">CAD</div><div className="hero-stat-lbl">Native Customer Billing</div></div>
          <div><div className="hero-stat-val">$129</div><div className="hero-stat-lbl">Flat &mdash; Every Feature Included</div></div>
          <div><div className="hero-stat-val">0</div><div className="hero-stat-lbl">Per-User Fees</div></div>
          <div><div className="hero-stat-val">14</div><div className="hero-stat-lbl">Days Free, No Card</div></div>
        </div>
      </div>

      {/* ═══ THE CANADIAN SEASON ═══ */}
      <div className="premium-band">
        <h2>You Can&apos;t Set Posts in Frozen Ground.<br /><span>Your Software Should Know That.</span></h2>
        <p>Canadian fencing is a project business racing the calendar. Post holes have to go below the frost line, and there&apos;s no digging once the ground locks up &mdash; so a whole year of installs gets squeezed between spring thaw and freeze-up. The quoting you do in April and May decides what your season looks like, the backlog you carry in July decides whether you finish it, and every rain-out in between is a day you don&apos;t get back. FenceBossPro is built for exactly that shape of business: quote fast while the phone is ringing, take deposits in Canadian dollars before you order material, keep crews setting posts while the office keeps selling, and reshuffle the board when the weather turns without losing a single job.</p>
        <div className="ca-season-bar">
          <div className="ca-season-seg" style={{flex:2, background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.45)'}}>Frozen Ground</div>
          <div className="ca-season-seg" style={{flex:2, background:'rgba(43,108,163,.55)'}}>Thaw &mdash; Quote Rush</div>
          <div className="ca-season-seg" style={{flex:4, background:'var(--orange)'}}>Build Season &mdash; Every Day Counts</div>
          <div className="ca-season-seg" style={{flex:2, background:'rgba(43,108,163,.55)'}}>Race to Freeze-Up</div>
          <div className="ca-season-seg" style={{flex:2, background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.45)'}}>Frozen Ground</div>
        </div>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🌱</div><h4>Win the Spring Quote Rush</h4><p>When the thaw hits, everyone who stared at a sagging fence all winter calls the same week. Line-item bids built from your saved parts catalog go out the same day &mdash; while the contractor down the road is still promising to &ldquo;get you a number by Friday.&rdquo;</p></div>
          <div className="premium-card"><div className="premium-card-icon">💵</div><h4>Deposits in CAD, Up Front</h4><p>An accepted bid isn&apos;t a job until money moves. Collect the deposit in Canadian dollars through your own Canadian Stripe account before you order a single post &mdash; card on file or a Pay Now link, either way it&apos;s booked.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📋</div><h4>A Backlog You Can Actually See</h4><p>A short season means the backlog IS the business. Every sold job sits on one board &mdash; measured, bid, deposit paid, scheduled, in progress, done &mdash; so you always know how much work stands between today and freeze-up.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🌧️</div><h4>Weather Reshuffles, Not Dropped Jobs</h4><p>A washed-out Tuesday doesn&apos;t vanish into a group text. Reschedule the day, and every affected job keeps its materials list, its notes, and its place in the backlog &mdash; nothing quietly falls off the plan.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🚚</div><h4>Crews Build While the Office Quotes</h4><p>Your crews get their day on their phone &mdash; jobs, routes, materials, gate notes &mdash; so the office isn&apos;t playing dispatcher by text while trying to price the next three fences.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🧊</div><h4>Finish the Year Clean</h4><p>Final invoices go out the day the last section goes up, in CAD, with automated payment follow-ups &mdash; so you head into winter chasing plow work or time off, not receivables.</p></div>
        </div>
      </div>

      {/* ═══ COMPARISON BAND ═══ */}
      <div className="vs-band">
        <div className="vs-inner">
          <div className="centered">
            <span className="section-label">See It Before You Talk to Anyone</span>
            <h2 className="section-title">Most &ldquo;Demos&rdquo; Are a Phone Call.<br />Ours Is the Actual Software.</h2>
            <p className="section-sub">The big platforms make Canadian fence contractors book a sales call to find out the price, then quote CAD billing as a &ldquo;talk to sales&rdquo; question. We just put everything on the page.</p>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="vs-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="sbp-col">FenceBossPro</th>
                  <th className="other-col">The Big Platforms</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Try the software before talking to anyone</td><td className="sbp-col">Live demo, right on this page</td><td className="other-col">Book a sales call</td></tr>
                <tr><td>Price published on the website</td><td className="sbp-col">$129/mo, flat</td><td className="other-col">&ldquo;Request a quote&rdquo;</td></tr>
                <tr><td>Customer invoicing in Canadian dollars</td><td className="sbp-col">Native &mdash; set country once</td><td className="other-col">Varies / ask sales</td></tr>
                <tr><td>Per-user fees</td><td className="sbp-col">None &mdash; unlimited users</td><td className="other-col">Often per seat</td></tr>
                <tr><td>Features locked behind higher tiers</td><td className="sbp-col">None &mdash; one plan has it all</td><td className="other-col">Tiered plans</td></tr>
                <tr><td>Contract or setup fee</td><td className="sbp-col">Neither</td><td className="other-col">Common</td></tr>
                <tr><td>Free trial without a credit card</td><td className="sbp-col">14 days, no card</td><td className="other-col">Card usually required</td></tr>
              </tbody>
            </table>
          </div>
          <p className="vs-note">Scroll up and click through the live demo &mdash; the business dashboard, the crew app, and the customer app are all real, right now, no email required.</p>
        </div>
      </div>

      {/* ═══ ESTIMATES DEEP DIVE ═══ */}
      <section id="estimates">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Estimates That Win the Season</span>
            <h2>The Quote That Goes Out Today<br />Beats the Better Quote Next Week.</h2>
            <p>In a compressed season, quote speed is a competitive weapon. The homeowner who calls in April is calling three other companies too &mdash; and the first professional, line-item bid in their inbox usually wins. FenceBossPro builds fence bids from your saved parts catalog: drop in the run length, pick the fence type, and posts, panels, pickets, rails, concrete, gates, and hardware roll up into a priced bid with your real costs and margins behind every line.</p>
            <p style={{marginTop:'12px'}}>When the customer taps Accept, the job doesn&apos;t sit in an inbox &mdash; it lands on the job board with its full materials list, ready to take a deposit and a date. Estimate to scheduled install, without anything getting retyped.</p>
            <ul className="check-list">
              <li>Linear-foot takeoffs by fence type &mdash; wood, vinyl, chain link, aluminum, ornamental</li>
              <li>Post counts and concrete figured from the run length</li>
              <li>Good / Better / Best options on one bid so customers choose up</li>
              <li>Text or email the bid with a customer-facing Accept button</li>
              <li>3 automated follow-up texts if a bid sits unanswered</li>
              <li>Accepted bids convert straight to a scheduled, invoiceable job</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Bid &mdash; Cedar Privacy, 42 m Run</div>
            <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', marginBottom:'10px'}}>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}><span>4&times;4 Posts (19)</span><span>Line-item priced</span></div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}><span>Cedar Pickets + Rails</span><span>Line-item priced</span></div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.08)'}}><span>Concrete &mdash; below frost depth</span><span>Line-item priced</span></div>
              <div style={{display:'flex', justifyContent:'space-between', color:'rgba(255,255,255,.85)', fontSize:'13px', padding:'4px 0'}}><span>Walk Gate + Hardware</span><span>Line-item priced</span></div>
            </div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Bid sent &mdash; 9:40 AM</div><div className="mock-sub">Texted + emailed, same morning as the site visit</div></div><div className="mock-badge green-badge">Sent</div></div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">Customer accepted &mdash; 6:12 PM</div><div className="mock-sub">One tap on their phone</div></div><div className="mock-badge">Accepted</div></div>
            <div className="mock-item"><div className="mock-dot blue"></div><div><div className="mock-label">Dropped to job board</div><div className="mock-sub">Full materials list attached &mdash; ready to schedule</div></div><div className="mock-badge blue-badge">Job</div></div>
          </div>
        </div>
      </section>

      {/* ═══ CAD BILLING ═══ */}
      <section id="cad-billing" style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Canadian-Dollar Billing, Built In</span>
          <h2 className="section-title">Deposit to Final Invoice &mdash;<br />Every Dollar Your Customer Pays Is CAD.</h2>
          <p className="section-sub">This isn&apos;t a currency toggle bolted on for the brochure. Set your country to Canada in Company Info, connect your own Canadian Stripe account, and from then on every invoice, every card-on-file charge, and every Pay Now link bills your customers in Canadian dollars.</p>
        </div>
        <div className="highlight-row" style={{alignItems:'flex-start'}}>
          <div className="highlight-text">
            <ul className="check-list">
              <li>Collect the deposit in CAD the moment a bid is accepted &mdash; before you order material</li>
              <li>Progress billing in stages on big multi-day builds: posts set, panels hung, final walk</li>
              <li>Card-on-file through your own Canadian Stripe account &mdash; charge the balance when the job wraps</li>
              <li>Pay Now links your customers open on their phone and pay in Canadian dollars</li>
              <li>Set your GST/HST or provincial tax rate once &mdash; it&apos;s applied to invoices automatically, with tax reports</li>
              <li>Automated payment follow-up texts chase the balance so you don&apos;t have to</li>
              <li>Full payment history per client &mdash; deposits, progress payments, and finals in one place</li>
            </ul>
            <p style={{marginTop:'18px'}}>One honest note: the FenceBossPro subscription itself is billed in US dollars (your bank converts it). Everything your <em>customers</em> see and pay is CAD &mdash; details in the FAQ below.</p>
          </div>
          <div style={{flex:1, minWidth:'280px'}}>
            <img src="/cad-checkout.png" alt="Stripe payment page for Hamann Lawn Care Invoice #459 showing a CA$9.74 total paid in Canadian dollars" className="ca-shot" />
            <p className="ca-shot-cap">A real payment page from the platform &mdash; a company with its country set to Canada, and the customer paying in Canadian dollars (CA$9.74, Invoice #459). It&apos;s the founder&apos;s own company, on the same billing engine FenceBossPro runs on.</p>
          </div>
        </div>
      </section>

      {/* ═══ SCHEDULING THE SHORT SEASON ═══ */}
      <section id="scheduling">
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Scheduling &amp; Dispatch</span>
            <h2>A Frost-Shortened Season<br />Leaves No Room for Lost Days.</h2>
            <p>When the build window runs roughly thaw to freeze-up, an install that slips through the cracks isn&apos;t an inconvenience &mdash; it can be revenue that rolls to next year. FenceBossPro keeps every sold job on one board and every crew on a planned day, so the backlog burns down on purpose instead of by memory.</p>
            <p style={{marginTop:'12px'}}>And when the forecast wrecks a day &mdash; because it will &mdash; you reshuffle on the screen, not in a panic of phone calls. Rescheduled jobs keep their crew notes and materials lists, customers can be alerted automatically, and nothing silently disappears from the plan.</p>
            <ul className="check-list">
              <li>Job board from measured &rarr; bid &rarr; deposit paid &rarr; scheduled &rarr; in progress &rarr; done</li>
              <li>One-click scheduling with date picker and crew assignment</li>
              <li>Multi-day builds scheduled around material delivery &mdash; set posts one day, hang panels the next</li>
              <li>Drag-and-drop route ordering between jobs to cut windshield time</li>
              <li>Reschedule alerts text the customer automatically when a date moves</li>
              <li>Summary bar: booked jobs, revenue, and linear footage still in the backlog</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Thursday &mdash; Rained Out, Rebuilt in Minutes</div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">Cedar Privacy &mdash; 42 m</div><div className="mock-sub">Moved Thu &rarr; Sat &middot; customer auto-texted</div></div><div className="mock-badge">Moved</div></div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">Chain Link &mdash; 73 m</div><div className="mock-sub">Moved Thu &rarr; Mon &middot; materials list intact</div></div><div className="mock-badge">Moved</div></div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Gate Repair &mdash; double drive gate</div><div className="mock-sub">Kept &mdash; short indoor-adjacent job for the crew</div></div><div className="mock-badge green-badge">Kept</div></div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'16px', fontWeight:700}}>0 jobs dropped</div>
              <div style={{color:'rgba(255,255,255,.5)', fontSize:'12px', marginTop:'4px'}}>Every moved job keeps its notes, materials, and place in the backlog</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ JOB & PROPERTY RECORDS ═══ */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Job &amp; Property Records</span>
            <h2>The Property Remembers,<br />So Your Crew Doesn&apos;t Have to Ask.</h2>
            <p>Every address gets its own profile: the fence line, the linear footage, where the gates sit, how the crew gets into the yard, and every job you&apos;ve ever done there. When the same customer calls back in two years for a repair or a second run, you&apos;re quoting from a record &mdash; not from whoever&apos;s memory survived the winter.</p>
            <ul className="check-list">
              <li>Full job history per property &mdash; what was built, when, and for how much</li>
              <li>Materials on record: posts, panels, pickets, gates, and hardware used on the job</li>
              <li>Gate locations, line notes, and access instructions the crew sees before arriving</li>
              <li>Photos attached to the job &mdash; before, during, and the final walk</li>
              <li>Clients and open leads side by side, with a pipeline of who to follow up next</li>
              <li>Notes that stay with the property, not in a text thread that scrolls away</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Property Profile</div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>📏</span><div><div className="mock-label">Fence line on record</div><div className="mock-sub">Runs, linear footage, and fence types</div></div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>🚪</span><div><div className="mock-label">Gate &amp; access notes</div><div className="mock-sub">Where the gates are, how the crew gets in</div></div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>📷</span><div><div className="mock-label">Job photos</div><div className="mock-sub">Attached to the job, kept forever</div></div></div>
            <div className="mock-item"><span style={{fontSize:'20px'}}>🧾</span><div><div className="mock-label">Every invoice &amp; payment</div><div className="mock-sub">Deposit to final, all in CAD</div></div></div>
          </div>
        </div>
      </section>

      {/* ═══ CREW APP ═══ */}
      <section className="dark-section">
        <div className="highlight-row reverse" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <div className="highlight-text">
            <span className="section-label" style={{color:'var(--orange)'}}>The Crew App</span>
            <h2 style={{color:'#fff'}}>Your Crews Get Their Day on Their Phone.<br />The Office Gets Its Day Back.</h2>
            <p style={{color:'rgba(255,255,255,.7)'}}>The crew view is built for someone standing at the fence line with gloves on &mdash; big buttons, today&apos;s jobs, the route between them, and the materials list for each stop. Mark a phase complete, add a photo, drop a note, and the office sees it the moment it happens.</p>
            <p style={{color:'rgba(255,255,255,.7)', marginTop:'12px'}}>Role-based access means a crew lead sees their jobs and nothing else &mdash; not your books, not your margins, not the whole client list. Unlimited users are included, so every installer gets the app without a per-seat bill.</p>
            <ul className="check-list">
              <li style={{color:'rgba(255,255,255,.75)'}}>Today&apos;s job list with routes and drive order</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Materials list per job &mdash; what to load before rolling out</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Gate and access notes from the property profile</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Mark phases complete, attach photos, log notes from the field</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Hour tracking per job for payroll-ready reports</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Crew Lead &mdash; Today</div>
            <div className="mock-item"><div className="mock-dot green"></div><div><div className="mock-label">Stop 1 &mdash; Cedar Privacy</div><div className="mock-sub">Posts set &middot; photos added &middot; phase marked done</div></div><div className="mock-badge green-badge">Done</div></div>
            <div className="mock-item"><div className="mock-dot orange"></div><div><div className="mock-label">Stop 2 &mdash; Chain Link</div><div className="mock-sub">Materials list on screen &middot; gate code in notes</div></div><div className="mock-badge">On Site</div></div>
            <div className="mock-item"><div className="mock-dot blue"></div><div><div className="mock-label">Stop 3 &mdash; Gate Repair</div><div className="mock-sub">Route queued &middot; hardware on the truck</div></div><div className="mock-badge blue-badge">Up Next</div></div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'var(--orange)', fontSize:'16px', fontWeight:700}}>Try it in the live demo above</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>The crew app in the demo is the real thing</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CUSTOMER APP ═══ */}
      <section style={{background:'linear-gradient(135deg,#1c0a33,#12061f)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Your Customers Get an App, Too</span>
          <h2 className="section-title" style={{color:'#fff'}}>A $15,000 Fence Deserves a Better<br />Customer Experience Than a Group Text.</h2>
          <p className="section-sub" style={{color:'rgba(255,255,255,.7)'}}>A fence is one of the biggest cheques a homeowner writes all year, and for most contractors the entire customer experience is a phone call and an e-transfer request. FenceBossPro gives your customers their own branded app &mdash; no app store, no password, a secure link gets them in from their phone. You flip each feature on or off per customer.</p>
        </div>
        <div style={{maxWidth:'1000px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'14px 40px'}}>
          {[
            'See their project and full history — what was done, notes, and photos',
            'View and pay invoices from their phone in Canadian dollars — card on file, one-tap Pay Now',
            'Get alerts their way — email or app notification — and pick which ones they receive',
            'Update their card on file without calling your office',
            'Contact you or refer a neighbour who stopped to ask about the fence',
            'Leave a review when the final walk goes well',
          ].map((t, i) => (
            <div key={i} style={{display:'flex', gap:'10px', alignItems:'flex-start', color:'rgba(255,255,255,.82)', fontSize:'15px', lineHeight:1.6}}>
              <span style={{color:'var(--orange)', fontWeight:800, flexShrink:0}}>✓</span><span>{t}</span>
            </div>
          ))}
        </div>
        <p style={{maxWidth:'900px', margin:'34px auto 0', textAlign:'center', color:'#fff', fontSize:'19px', fontWeight:700, lineHeight:1.5}}>You choose exactly what each customer can see &mdash; flip any feature on or off with a single switch.</p>
      </section>

      {/* ═══ HOW A JOB FLOWS ═══ */}
      <section>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Quote to Final Walk</span>
          <h2 className="section-title">One Job, Start to Finish, in CAD</h2>
          <p className="section-sub">This is the whole arc of a Canadian fence job in FenceBossPro &mdash; nothing retyped, nothing chased by memory, and every dollar the customer pays in Canadian dollars.</p>
        </div>
        <div className="steps-grid">
          <div className="step-box"><div className="step-circle">1</div><h3>Quote Same-Day</h3><p>Measure the run, build the line-item bid from your parts catalog, and text it before you leave the driveway.</p></div>
          <div className="step-box"><div className="step-circle">2</div><h3>Deposit in CAD</h3><p>Customer accepts on their phone and pays the deposit in Canadian dollars &mdash; the job is booked before you order material.</p></div>
          <div className="step-box"><div className="step-circle">3</div><h3>Build on Schedule</h3><p>The install lands on the calendar, the crew gets the materials list and gate notes, and weather moves reshuffle instead of derail.</p></div>
          <div className="step-box"><div className="step-circle">4</div><h3>Final Invoice, Paid</h3><p>Invoice goes out at the final walk, the card on file or a Pay Now link settles it in CAD, and follow-ups chase any balance for you.</p></div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Simple Pricing</span>
          <h2 className="section-title">One Flat Price. Every Feature.<br />No &ldquo;Talk to Sales.&rdquo;</h2>
          <p className="section-sub">We&apos;ve been the customer paying $500&ndash;$700 a month for contractor software where every feature was an add-on and every user cost extra. FenceBossPro is one plan with everything in it &mdash; the same price whether you run one crew or five.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured" style={{width:'100%'}}>
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div className="silo-price-amount"><sup>$</sup>129</div>
            <div className="silo-price-period">per month &middot; 14-day free trial first</div>
            <div className="price-desc">Every feature. Unlimited clients, properties, crews, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Customer invoicing &amp; payments in CAD</li>
              <li>Line-Item Estimating &amp; Linear-Foot Takeoffs</li>
              <li>Materials &amp; Parts Catalog</li>
              <li>Job Board, Scheduling &amp; Crew Dispatch</li>
              <li>Deposits, Progress Billing &amp; Card-on-File</li>
              <li>Crew App &amp; Customer App</li>
              <li>Automated Alerts &amp; Two-Way Texting</li>
              <li>Unlimited Users &mdash; no per-seat fees</li>
              <li>500 Outbound SMS/month included, +$15 per extra 500</li>
            </ul>
            <a href="#" onClick={(e) => { e.preventDefault(); openTrial(e.currentTarget as HTMLElement); }} className="price-btn price-btn-primary" style={{display:'block'}}>Start Your 14-Day Free Trial</a>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. The subscription is billed in USD (your bank converts) &mdash; your customers always pay you in CAD. Canadian texting numbers are registered with carriers during onboarding.</p>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq">
        <div className="centered" style={{maxWidth:'800px', margin:'0 auto'}}>
          <span className="section-label">Straight Answers</span>
          <h2 className="section-title">Canadian Fence Contractor FAQ</h2>
          <p className="section-sub">The questions Canadian fence companies actually ask us &mdash; including the two things most software websites conveniently leave out.</p>
        </div>
        <div style={{maxWidth:'800px', margin:'0 auto'}}>
          {faqs.map((f, i) => (
            <div key={i} className="ca-faq-item">
              <div className="ca-faq-q">{f.q}</div>
              <div className="ca-faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <div className="cta-band">
        <h2>The Ground Thaws.<br />The Phone Rings. Be Ready.</h2>
        <p>Start the trial today, load your fence types and parts, and send your first CAD-billed estimate before the week is out. 14 days free, no credit card, no sales call.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openTrial(e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$129/mo</b> after</div>
        </div>
      </div>

      <SignupModal />
    </>
  );
}
