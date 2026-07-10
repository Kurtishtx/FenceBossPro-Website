export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <a href="/" className="site-footer-brand">
            <span>🌿</span>
            <span>FenceBossPro</span>
          </a>
          <div className="site-footer-cols">
            <div className="site-footer-col">
              <h4>Product</h4>
              <a href="/features">Features</a>
              <a href="/pricing">Pricing</a>
              <a href="https://my.fencebosspro.com" target="_blank" rel="noreferrer">Log In</a>
            </div>
            <div className="site-footer-col">
              <h4>Solutions</h4>
              <a href="/fencing-software">Fencing Software</a>
              <a href="/fence-estimating-software">Fence Estimating</a>
              <a href="/fence-scheduling-software">Scheduling</a>
              <a href="/fence-dispatch-software">Crew & Dispatch</a>
              <a href="/fence-invoicing-software">Invoicing</a>
              <a href="/fence-business-software">Fence Business</a>
              <a href="/fence-contractor-software">Fence Contractor</a>
              <a href="/fence-installation-software">Installation</a>
            </div>
            <div className="site-footer-col">
              <h4>Compare</h4>
              <a href="/vs-jobber">vs. Jobber</a>
              <a href="/vs-servicetitan">vs. ServiceTitan</a>
              <a href="/vs-serviceautopilot">vs. Service Autopilot</a>
              <a href="/vs-housecallpro">vs. Housecall Pro</a>
            </div>
            <div className="site-footer-col">
              <h4>Resources</h4>
              <a href="/blogs">Blog</a>
            </div>
            <div className="site-footer-col">
              <h4>BossPro Family</h4>
              <a href="https://industrybosspro.com">IndustryBossPro — All-in-One Field Service Software</a>
            </div>
          </div>
        </div>
        <div className="site-footer-bottom">
          © {new Date().getFullYear()} FenceBossPro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
