import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, CheckCircle2, MessageSquare, ClipboardList,
  Wallet, Truck, Menu, X, ChevronUp, Package, Users, Zap,
  AlertCircle, CreditCard, MapPin, HelpCircle, Star, Play
} from 'lucide-react';
import logo from '../assets/logo.png';
import './LandingPage.css';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

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
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link to="/auth/signup" className="mobile-cta-link" onClick={() => setMenuOpen(false)}>Get Started</Link>
          </div>

          <div className="nav-right">
            <Link to="/auth/signup" className="nav-button">Get Started</Link>
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

      {/* ── HERO SECTION (unchanged) ─────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
            STOP LOSING ORDERS ON WHATSAPP
          </div>
          <h1 className="hero-title">Track Your Instagram Orders in Ordra</h1>
          <p className="hero-subtitle">
            Turn chaotic DMs into a smooth, professional process. Manage inventory,
            track payments, and keep your customers happy—all from your phone.
          </p>
          <div className="hero-buttons">
            <Link to="/app" className="btn btn-primary">
              Get Started <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              View Demo
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', marginLeft: '10px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: '#e5e7eb', border: '2px solid white',
                  marginLeft: '-10px', zIndex: 4 - i
                }} />
              ))}
            </div>
            Trusted by 1,000+ Nigerian creators
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
        <div className="section-label-wrapper">
          <span className="section-label">THE PROBLEM</span>
        </div>
        <h2 className="pain-title">Still Managing Orders in WhatsApp?</h2>
        <p className="pain-subtitle">The chaos of DMs is holding your business back.</p>

        <div className="pain-grid">
          {[
            {
              icon: <AlertCircle size={28} />,
              color: '#fee2e2', iconColor: '#ef4444',
              title: 'Losing Orders',
              desc: 'Important orders get buried under hundreds of chat messages.'
            },
            {
              icon: <CreditCard size={28} />,
              color: '#fef3c7', iconColor: '#d97706',
              title: 'Forgetting Payments',
              desc: 'Manually matching bank transfers to DM screenshots is a nightmare.'
            },
            {
              icon: <MapPin size={28} />,
              color: '#dbeafe', iconColor: '#2563eb',
              title: 'Delivery Confusion',
              desc: 'Copy-pasting addresses leads to shipping errors and angry customers.'
            },
            {
              icon: <HelpCircle size={28} />,
              color: '#f3e8ff', iconColor: '#9333ea',
              title: 'Repeating Questions',
              desc: 'Answering "where is my order?" takes up half your day.'
            }
          ].map(({ icon, color, iconColor, title, desc }) => (
            <div key={title} className="pain-card">
              <div className="pain-icon" style={{ backgroundColor: color, color: iconColor }}>
                {icon}
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOLUTION SPLIT ──────────────────────────── */}
      <section className="solution-section">
        <div className="solution-inner">
          <div className="solution-text">
            <span className="solution-pill">The Solution</span>
            <h2>A Simple Way to Stay Organized</h2>
            <p>
              Ordra replaces the chaos with a curated helper. We beautifully track your orders,
              payments, and deliveries in one centralized dashboard. Automatically save customer
              info for future sales and never drop a conversation again.
            </p>
            <Link to="/app" className="btn btn-primary">
              Experience the Workflow <ArrowRight size={18} />
            </Link>
          </div>
          <div className="solution-visual">
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
                <div className="sol-item-row">
                  <span>Custom Tote Bag × 2</span>
                  <strong>₦18,000</strong>
                </div>
                <div className="sol-item-row">
                  <span>Delivery — Lagos</span>
                  <strong>₦2,000</strong>
                </div>
                <div className="sol-divider" />
                <div className="sol-item-row total">
                  <span>Total</span>
                  <strong>₦20,000</strong>
                </div>
              </div>
              <div className="solution-float-badge">
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Payment Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CURATED FEATURES ──────────────────────────── */}
      <section id="features" className="features-section">
        <div className="features-header">
          <h2>Curated Features</h2>
          <p>Every tool you need to run your business beautifully.</p>
        </div>
        <div className="features-bento">
          <div className="bento-card wide purple">
            <div className="bento-icon"><Package size={22} /></div>
            <h3>Order tracking board</h3>
            <p>Visualize your entire fulfillment pipeline at a glance. Move orders smoothly from pending to shipped with elegant, per‑profile status chips.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Users size={22} /></div>
            <h3>Multi‑product orders</h3>
            <p>Seamlessly bundle several items into a single customer record.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Wallet size={22} /></div>
            <h3>Payment tracking</h3>
            <p>Log deposits, partial payments, and full clearances with precision.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Users size={22} /></div>
            <h3>Customer management</h3>
            <p>Build a persistent database of your VIPs automatically.</p>
          </div>
          <div className="bento-card wide dark-purple">
            <div className="bento-icon"><Zap size={22} /></div>
            <h3>WhatsApp quick message</h3>
            <p>Generate pre‑formatted status updates and dispatch them directly to your customer's WhatsApp with a single tap.</p>
          </div>
        </div>
      </section>

      {/* ── THE PROCESS ──────────────────────────────── */}
      <section id="how-it-works" className="process-section">
        <div className="process-header">
          <h2>The Process</h2>
          <p>Three steps to organisational clarity.</p>
        </div>
        <div className="process-steps">
          {[
            { num: 1, title: 'Add Order', desc: 'A customer messages you. Your Ordra dashboard awaits — enter name, item, and payment status.', icon: <ClipboardList size={16} /> },
            { num: 2, title: 'Track Status', desc: 'Move the order through your curated pipeline from Processing to Dispatched to complete.', icon: <Truck size={16} />, active: true },
            { num: 3, title: 'Get Paid', desc: 'Reconcile final balance and notify the customer on WhatsApp, so the transaction wraps cleanly.', icon: <Wallet size={16} /> },
          ].map(({ num, title, desc, icon, active }) => (
            <div key={num} className="process-step">
              <div className={`process-num${active ? ' active' : ''}`}>
                {num}
                <span className="process-step-icon">{icon}</span>
              </div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SEE IT IN ACTION (Live Mock UI) ─────────── */}
      <section className="demo-section">
        <div className="demo-header">
          <h2>See Ordra in Action</h2>
          <p>A glimpse into how you'll manage your business effortlessly. No more scattered messages, just organised ledgers.</p>
        </div>
        <div className="demo-ui">
          {/* Left panel – Add Order form */}
          <div className="demo-panel form-panel">
            <h4>Add New Order</h4>
            <label>Customer Name</label>
            <div className="demo-input">e.g. Sarah Jenkins</div>
            <label>Item Details</label>
            <div className="demo-textarea">Product description, quantity…</div>
            <div className="demo-row">
              <div>
                <label>Total Amount</label>
                <div className="demo-input">₦0.00</div>
              </div>
              <div>
                <label>Status</label>
                <div className="demo-select">Pending ▾</div>
              </div>
            </div>
            <div className="demo-save-btn">Save Order</div>
          </div>

          {/* Right panel – Recent Orders */}
          <div className="demo-panel orders-panel">
            <div className="orders-header-row">
              <div>
                <h4>Recent Orders</h4>
                <span className="orders-sub">Your latest transactions</span>
              </div>
              <div className="filter-btn">⬡ Filter</div>
            </div>
            {[
              { initials: 'SJ', name: 'Sarah Jenkins', item: 'Custom Ceramic Vase × 2', amount: '₦120,000', date: 'Oct 24, 2025', status: 'Pending', statusColor: '#f59e0b', statusBg: '#fef3c7' },
              { initials: 'MC', name: 'Marcus Chen', item: 'Artisan Coffee Blend', amount: '₦45,000', date: 'Oct 23, 2025', status: 'Paid', statusColor: '#16a34a', statusBg: '#dcfce7' },
              { initials: 'ER', name: 'Elena Rodriguez', item: 'Handwoven Scarf', amount: '₦85,000', date: 'Oct 22, 2025', status: 'Shipped', statusColor: '#2563eb', statusBg: '#dbeafe' },
            ].map(({ initials, name, item, amount, date, status, statusColor, statusBg }) => (
              <div key={name} className="order-row">
                <div className="order-avatar">{initials}</div>
                <div className="order-info">
                  <strong>{name}</strong>
                  <span>{item}</span>
                </div>
                <div className="order-meta">
                  <strong>{amount}</strong>
                  <span>{date}</span>
                </div>
                <span className="order-badge" style={{ color: statusColor, backgroundColor: statusBg }}>{status}</span>
              </div>
            ))}
            <div className="view-all-link">View All Orders →</div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section id="pricing" className="pricing-section">
        <div className="pricing-header text-center">
          <h2>Simple pricing for growing businesses</h2>
          <p>Start free. Upgrade when you're ready to scale.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card starter">
            <h3>Starter</h3>
            <p>Perfect for new sellers getting organised.</p>
            <div className="price-row">
              <span className="price-val">Free</span>
            </div>
            <ul className="pricing-features">
              <li><Check size={16} color="#9333ea" /> Up to 50 orders/month</li>
              <li><Check size={16} color="#9333ea" /> Basic customer list</li>
              <li><Check size={16} color="#9333ea" /> Order status tracking</li>
            </ul>
            <Link to="/auth/signup" className="btn pricing-btn">Start for Free</Link>
          </div>
          <div className="pricing-card pro">
            <div className="popular-badge">Most Popular</div>
            <h3>Pro</h3>
            <p>For the serious boutique owner.</p>
            <div className="price-row">
              <span className="price-val">₦5,000</span>
              <span className="price-period">/mo</span>
            </div>
            <ul className="pricing-features">
              <li><Check size={16} color="#ffffff" /> Unlimited orders</li>
              <li><Check size={16} color="#ffffff" /> WhatsApp Integration</li>
              <li><Check size={16} color="#ffffff" /> Advanced sales analytics</li>
              <li><Check size={16} color="#ffffff" /> Priority support</li>
            </ul>
            <Link to="/auth/signup" className="btn pricing-btn pro-btn">Get Pro</Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section id="testimonials" className="testimonials-section">
        <div className="testimonials-header text-center">
          <h2>Trusted by Curators</h2>
          <p>See how small businesses are streamlining their operations with Ordra.</p>
        </div>
        <div className="testimonials-grid">
          {[
            {
              quote: '"Ordra has completely transformed how I track my custom jewelry orders. I used to rely on messy spreadsheets and lost track of WhatsApp messages. Now, everything is in one beautiful, organised place."',
              name: 'Mia Thompson',
              role: 'Founder, Thompson Atelier',
              initials: 'MT',
              color: '#9333ea'
            },
            {
              quote: '"The interface is so clean and easy to use. It feels like a premium product, not a clunky admin tool. It saves me hours every week, allowing me to focus more on baking and less on paperwork."',
              name: 'David Lee',
              role: 'Owner, Crumb & Co. Bakery',
              initials: 'DL',
              color: '#1f2937'
            }
          ].map(({ quote, name, role, initials, color }) => (
            <div key={name} className="testimonial-card">
              <div className="quote-marks">"</div>
              <p className="testimonial-quote">{quote}</p>
              <div className="testimonial-author">
                <div className="t-avatar" style={{ backgroundColor: color }}>{initials}</div>
                <div>
                  <div className="t-name">{name}</div>
                  <div className="t-role">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-box">
          <div className="cta-inner">
            <h2>Ready to clear the chaos?</h2>
            <p>Join hundreds of sellers who have upgraded their business from WhatsApp chats to a professional dashboard.</p>
            <Link to="/auth/signup" className="btn cta-btn">
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
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
            <p className="footer-copy">© 2026 Ordra Curation. All rights reserved.</p>
          </div>
          <div className="footer-links-col">
            <div className="footer-link-group">
              <span className="footer-link-heading">Product</span>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="footer-link-group">
              <span className="footer-link-heading">Legal</span>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Support</a>
              <a href="#">Vendor Guide</a>
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
