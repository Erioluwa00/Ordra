import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, CheckCircle2, MessageSquare, ClipboardList,
  Wallet, Truck, Menu, X, ChevronUp, ChevronDown, Package, Users, Zap,
  AlertCircle, CreditCard, MapPin, HelpCircle, BarChart3, ShieldCheck, Sparkles
} from 'lucide-react';
import { RevealWrapper } from '../hooks/useScrollReveal';
import logo from '../assets/logo.png';
import './LandingPage.css';

const FAQ_DATA = [
  { q: 'Is Ordra free to use?', a: 'Yes! You can start using Ordra completely free with up to 50 orders per month. When your business grows and you need unlimited orders plus advanced analytics, you can upgrade to Pro.' },
  { q: 'Can I manage orders from my phone?', a: 'Absolutely. Ordra is fully responsive and works beautifully on any device — phone, tablet, or desktop. Your dashboard is always in your pocket.' },
  { q: 'How does the WhatsApp integration work?', a: 'When you need to message a customer, Ordra generates a pre-formatted message with their order details and opens WhatsApp directly. No copy-pasting needed — just tap and send.' },
  { q: 'Is my data secure?', a: 'Your data is stored securely on Convex cloud infrastructure with encryption. Only you can access your business data through your authenticated account.' },
  { q: 'Can I track customer debts and partial payments?', a: 'Yes! Ordra has a built-in debt tracker that shows outstanding balances at a glance. You can log partial payments and send payment reminders directly via WhatsApp.' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="landing-page">

      {/* ── NAVBAR ──────────────────────────────────── */}
      <div className={`navbar-wrapper${scrolled ? ' scrolled' : ''}`}>
        <nav className="navbar">
          <div className="nav-brand">
            <img src={logo} alt="Ordra Logo" className="nav-logo-img" />
            <span>Ordra</span>
          </div>

          <div className={`nav-links${menuOpen ? ' mobile-open' : ''}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link to="/auth/signup" className="mobile-cta-link" onClick={() => { setMenuOpen(false); localStorage.removeItem('ordra_pending_upgrade'); }}>Get Started</Link>
          </div>

          <div className="nav-right">
            <Link to="/auth/login" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginRight: '0.5rem' }}>Log In</Link>
            <Link to="/auth/signup" className="nav-button" onClick={() => localStorage.removeItem('ordra_pending_upgrade')}>Get Started</Link>
            <button
              className="hamburger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </div>

      {/* ── HERO SECTION ─────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
            STOP LOSING ORDERS ON WHATSAPP
          </div>
          <h1 className="hero-title">An easy-to-use dashboard to manage all your business orders</h1>
          <p className="hero-subtitle">
            Turn chaotic DMs into a smooth, professional process. Manage orders,
            track payments, monitor inventory, and keep your customers happy — all from one dashboard.
          </p>
          <div className="hero-buttons">
            <Link to="/auth/signup" className="btn btn-primary" onClick={() => localStorage.removeItem('ordra_pending_upgrade')}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              See How It Works
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', marginLeft: '10px' }}>
              {['#9333ea', '#7c3aed', '#6d28d9'].map((c, i) => (
                <div key={i} style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: c, border: '2px solid white',
                  marginLeft: '-10px', zIndex: 4 - i,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.6rem', fontWeight: 700
                }}>
                  {['AO', 'NK', 'TI'][i]}
                </div>
              ))}
            </div>
            Trusted by growing Nigerian businesses
          </div>
        </div>

        <div className="hero-image-wrapper">
          <div className="hero-mockup-bg">
            <div className="hero-mockup">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ backgroundColor: '#ef4444' }} />
                <div className="mockup-dot" style={{ backgroundColor: '#eab308' }} />
                <div className="mockup-dot" style={{ backgroundColor: '#22c55e' }} />
              </div>
              <div className="mockup-body">
                <div className="mockup-line long" />
                <div className="mockup-line short" />
                <br />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ flex: 1, backgroundColor: '#374151', height: '100px', borderRadius: '8px' }} />
                  <div style={{ flex: 1, backgroundColor: '#374151', height: '100px', borderRadius: '8px' }} />
                  <div style={{ flex: 1, backgroundColor: '#374151', height: '100px', borderRadius: '8px' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="notification-badge">
            <div className="badge-icon"><CheckCircle2 size={20} /></div>
            <div>
              <div className="badge-text">New Order Added</div>
              <div className="badge-subtext">From @stylebyamira</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ─────────────────────────────── */}
      <section className="pain-section">
        <RevealWrapper direction="up">
          <div className="section-label-wrapper">
            <span className="section-label">THE PROBLEM</span>
          </div>
          <h2 className="pain-title">Still Managing Orders in WhatsApp?</h2>
          <p className="pain-subtitle">The chaos of DMs is holding your business back.</p>
        </RevealWrapper>

        <div className="pain-grid">
          {[
            { icon: <AlertCircle size={28} />, color: '#fee2e2', iconColor: '#ef4444', title: 'Losing Orders', desc: 'Important orders get buried under hundreds of chat messages.' },
            { icon: <CreditCard size={28} />, color: '#fef3c7', iconColor: '#d97706', title: 'Forgetting Payments', desc: 'Manually matching bank transfers to DM screenshots is a nightmare.' },
            { icon: <MapPin size={28} />, color: '#dbeafe', iconColor: '#2563eb', title: 'Delivery Confusion', desc: 'Copy-pasting addresses leads to shipping errors and angry customers.' },
            { icon: <HelpCircle size={28} />, color: '#f3e8ff', iconColor: '#9333ea', title: 'Repeating Questions', desc: 'Answering "where is my order?" takes up half your day.' }
          ].map(({ icon, color, iconColor, title, desc }, i) => (
            <RevealWrapper key={title} direction="up" delay={i * 0.1}>
              <div className="pain-card">
                <div className="pain-icon" style={{ backgroundColor: color, color: iconColor }}>{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* ── SOLUTION SPLIT ──────────────────────────── */}
      <section className="solution-section">
        <div className="solution-inner">
          <RevealWrapper direction="left" className="solution-text">
            <span className="solution-pill">The Solution</span>
            <h2>A Simple Way to Stay Organized</h2>
            <p>
              Ordra replaces the chaos with a curated dashboard. Track your orders,
              payments, and deliveries in one centralized place. Automatically save customer
              info for future sales and never drop a conversation again.
            </p>
            <Link to="/auth/signup" className="btn btn-primary" onClick={() => localStorage.removeItem('ordra_pending_upgrade')}>
              Experience the Workflow <ArrowRight size={18} />
            </Link>
          </RevealWrapper>
          <RevealWrapper direction="right" className="solution-visual">
            <div className="solution-card-outer">
              <div className="solution-card-inner">
                <div className="sol-card-header">
                  <div className="sol-avatar">MO</div>
                  <div>
                    <div className="sol-name">@madebyola</div>
                    <div className="sol-sub">New order · just now</div>
                  </div>
                  <span className="sol-badge pending">Pending</span>
                </div>
                <div className="sol-divider" />
                <div className="sol-item-row"><span>Custom Tote Bag × 2</span><strong>₦18,000</strong></div>
                <div className="sol-item-row"><span>Delivery — Lagos</span><strong>₦2,000</strong></div>
                <div className="sol-divider" />
                <div className="sol-item-row total"><span>Total</span><strong>₦20,000</strong></div>
              </div>
              <div className="solution-float-badge">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Payment Confirmed</span>
              </div>
            </div>
          </RevealWrapper>
        </div>
      </section>

      {/* ── CURATED FEATURES ──────────────────────────── */}
      <section id="features" className="features-section">
        <RevealWrapper direction="up">
          <div className="features-header">
            <h2>Everything You Need to Run Your Business</h2>
            <p>Powerful tools designed for Nigerian small business owners.</p>
          </div>
        </RevealWrapper>
        <div className="features-bento">
          {[
            { icon: <Package size={22} />, title: 'Order Tracking', desc: 'Visualize your entire fulfillment pipeline. Move orders from pending to shipped with elegant status chips.', wide: true, variant: 'purple' },
            { icon: <Wallet size={22} />, title: 'Payment & Debt Tracking', desc: 'Log deposits, partial payments, and track outstanding balances at a glance.' },
            { icon: <Users size={22} />, title: 'Customer Management', desc: 'Build a persistent database of your customers. Auto-suggest returning buyers.' },
            { icon: <BarChart3 size={22} />, title: 'Sales Analytics', desc: 'Revenue trends, top customers, and product performance — all in beautiful charts.' },
            { icon: <Zap size={22} />, title: 'WhatsApp Quick Message', desc: 'Generate pre-formatted status updates and dispatch them directly to your customer\'s WhatsApp with a single tap.', wide: true, variant: 'dark-purple' },
          ].map(({ icon, title, desc, wide, variant }, i) => (
            <RevealWrapper key={title} direction="up" delay={i * 0.08}>
              <div className={`bento-card${wide ? ' wide' : ''}${variant ? ` ${variant}` : ''}`}>
                <div className="bento-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* ── THE PROCESS ──────────────────────────────── */}
      <section id="how-it-works" className="process-section">
        <RevealWrapper direction="up">
          <div className="process-header">
            <h2>The Process</h2>
            <p>Three steps to organisational clarity.</p>
          </div>
        </RevealWrapper>
        <div className="process-steps">
          {[
            { num: 1, title: 'Create Order', desc: 'A customer messages you. Open Ordra, enter their details, items, and payment status in seconds.', icon: <ClipboardList size={16} /> },
            { num: 2, title: 'Track & Manage', desc: 'Move orders through your pipeline — Processing, Ready, Dispatched. Track payments and stock automatically.', icon: <Truck size={16} />, active: true },
            { num: 3, title: 'Get Paid', desc: 'Reconcile balances and send professional WhatsApp updates. Close the deal cleanly.', icon: <Wallet size={16} /> },
          ].map(({ num, title, desc, icon, active }, i) => (
            <RevealWrapper key={num} direction="up" delay={i * 0.15}>
              <div className="process-step">
                <div className={`process-num${active ? ' active' : ''}`}>
                  {num}
                  <span className="process-step-icon">{icon}</span>
                </div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* ── SEE IT IN ACTION ─────────────────────────── */}
      <section className="demo-section">
        <RevealWrapper direction="up">
          <div className="demo-header">
            <h2>See Ordra in Action</h2>
            <p>A glimpse into how you'll manage your business effortlessly.</p>
          </div>
        </RevealWrapper>
        <RevealWrapper direction="scale">
          <div className="demo-ui">
            <div className="demo-panel form-panel">
              <h4>Add New Order</h4>
              <label>Customer Name</label>
              <div className="demo-input">e.g. Amina Bello</div>
              <label>Item Details</label>
              <div className="demo-textarea">Custom ankara bag × 2</div>
              <div className="demo-row">
                <div><label>Total Amount</label><div className="demo-input">₦25,000</div></div>
                <div><label>Status</label><div className="demo-select">New ▾</div></div>
              </div>
              <div className="demo-save-btn">Save Order</div>
            </div>
            <div className="demo-panel orders-panel">
              <div className="orders-header-row">
                <div><h4>Recent Orders</h4><span className="orders-sub">Your latest transactions</span></div>
                <div className="filter-btn">⬡ Filter</div>
              </div>
              {[
                { initials: 'AB', name: 'Amina Bello', item: 'Custom Ankara Bag × 2', amount: '₦25,000', date: 'May 5, 2026', status: 'New', statusColor: '#6366f1', statusBg: '#e0e7ff' },
                { initials: 'KO', name: 'Kunle Ogundimu', item: 'Leather Wallet', amount: '₦15,000', date: 'May 4, 2026', status: 'Paid', statusColor: '#16a34a', statusBg: '#dcfce7' },
                { initials: 'TN', name: 'Tolu Nwosu', item: 'Beaded Necklace Set', amount: '₦42,000', date: 'May 3, 2026', status: 'Shipped', statusColor: '#2563eb', statusBg: '#dbeafe' },
              ].map(({ initials, name, item, amount, date, status, statusColor, statusBg }) => (
                <div key={name} className="order-row">
                  <div className="order-avatar">{initials}</div>
                  <div className="order-info"><strong>{name}</strong><span>{item}</span></div>
                  <div className="order-meta"><strong>{amount}</strong><span>{date}</span></div>
                  <span className="order-badge" style={{ color: statusColor, backgroundColor: statusBg }}>{status}</span>
                </div>
              ))}
              <div className="view-all-link">View All Orders →</div>
            </div>
          </div>
        </RevealWrapper>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section id="pricing" className="pricing-section">
        <RevealWrapper direction="up">
          <div className="pricing-header text-center">
            <h2>Simple pricing for growing businesses</h2>
            <p>Start free. Upgrade when you're ready to scale.</p>
          </div>
        </RevealWrapper>
        <div className="pricing-grid">
          <RevealWrapper direction="up" delay={0}>
            <div className="pricing-card starter">
              <h3>Starter</h3>
              <p>Perfect for new sellers getting organised.</p>
              <div className="price-row"><span className="price-val">Free</span></div>
              <ul className="pricing-features">
                <li><Check size={16} color="#9333ea" /> Up to 50 orders/month</li>
                <li><Check size={16} color="#9333ea" /> Basic customer list</li>
                <li><Check size={16} color="#9333ea" /> Order status tracking</li>
              </ul>
              <Link to="/auth/signup" className="btn pricing-btn" onClick={() => localStorage.removeItem('ordra_pending_upgrade')}>Start for Free</Link>
            </div>
          </RevealWrapper>
          <RevealWrapper direction="up" delay={0.12}>
            <div className="pricing-card pro">
              <div className="popular-badge">Most Popular</div>
              <h3>Pro</h3>
              <p>For the serious boutique owner.</p>
              <div className="price-row"><span className="price-val">₦5,000</span><span className="price-period">/mo</span></div>
              <ul className="pricing-features">
                <li><Check size={16} color="#ffffff" /> Unlimited orders</li>
                <li><Check size={16} color="#ffffff" /> WhatsApp Integration</li>
                <li><Check size={16} color="#ffffff" /> Advanced sales analytics</li>
                <li><Check size={16} color="#ffffff" /> Priority support</li>
              </ul>
              <div className="pricing-trial-notice">
                <Sparkles size={14} fill="currentColor" />
                <span>14-day free trial included</span>
              </div>
              <Link
                to="/auth/signup"
                className="btn pricing-btn pro-btn"
                onClick={() => localStorage.setItem('ordra_pending_upgrade', 'true')}
              >
                Try Pro for Free
              </Link>
            </div>
          </RevealWrapper>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section id="testimonials" className="testimonials-section">
        <RevealWrapper direction="up">
          <div className="testimonials-header text-center">
            <h2>Trusted by Curators</h2>
            <p>See how small businesses are streamlining their operations with Ordra.</p>
          </div>
        </RevealWrapper>
        <div className="testimonials-grid">
          {[
            { quote: '"Ordra has completely transformed how I track my custom jewelry orders. I used to rely on messy spreadsheets and lost WhatsApp messages. Now, everything is in one beautiful, organised place."', name: 'Mia Thompson', role: 'Founder, Thompson Atelier', initials: 'MT', color: '#9333ea' },
            { quote: '"The interface is so clean and easy to use. It feels like a premium product, not a clunky admin tool. It saves me hours every week, letting me focus on baking instead of paperwork."', name: 'David Lee', role: 'Owner, Crumb & Co. Bakery', initials: 'DL', color: '#1f2937' }
          ].map(({ quote, name, role, initials, color }, i) => (
            <RevealWrapper key={name} direction="up" delay={i * 0.12}>
              <div className="testimonial-card">
                <div className="quote-marks">"</div>
                <p className="testimonial-quote">{quote}</p>
                <div className="testimonial-author">
                  <div className="t-avatar" style={{ backgroundColor: color }}>{initials}</div>
                  <div><div className="t-name">{name}</div><div className="t-role">{role}</div></div>
                </div>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section id="faq" className="faq-section">
        <RevealWrapper direction="up">
          <div className="faq-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about Ordra.</p>
          </div>
        </RevealWrapper>
        <div className="faq-list">
          {FAQ_DATA.map(({ q, a }, i) => (
            <RevealWrapper key={i} direction="up" delay={i * 0.08}>
              <div className={`faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{q}</span>
                  <ChevronDown size={18} className="faq-chevron" />
                </button>
                <div className="faq-answer"><p>{a}</p></div>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="cta-section">
        <RevealWrapper direction="scale">
          <div className="cta-box">
            <div className="cta-inner">
              <h2>Ready to clear the chaos?</h2>
              <p>Join hundreds of sellers who have upgraded their business from WhatsApp chats to a professional dashboard.</p>
              <Link to="/auth/signup" className="btn cta-btn" onClick={() => localStorage.removeItem('ordra_pending_upgrade')}>
                Get Started Free <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </RevealWrapper>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="nav-brand">
              <img src={logo} alt="Ordra Logo" className="nav-logo-img" />
              <span>Ordra</span>
            </div>
            <p>Elevating order management for curated businesses.<br />Simple, beautiful, and secure.</p>
            <p className="footer-copy">© {new Date().getFullYear()} Ordra. All rights reserved.</p>
          </div>
          <div className="footer-links-col">
            <div className="footer-link-group">
              <span className="footer-link-heading">Product</span>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#pricing">Pricing</a>
              <Link to="/auth/login">Log In</Link>
            </div>
            <div className="footer-link-group">
              <span className="footer-link-heading">Legal</span>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Support</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── BACK TO TOP ────────────────────────────── */}
      <button
        className={`back-to-top${showBackToTop ? ' visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <ChevronUp size={22} />
      </button>

    </div>
  );
}
