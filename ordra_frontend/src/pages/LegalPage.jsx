import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './LegalPage.css';

export default function LegalPage({ type = 'privacy' }) {
  useEffect(() => {
    // Ensure document is scrolled to top on page navigation
    window.scrollTo(0, 0);
  }, [type]);

  const isPrivacy = type === 'privacy';

  return (
    <div className="legal-page">
      <header className="legal-nav">
        <Link to="/" className="nav-brand">
          <img src={logo} alt="Ordra Logo" className="nav-logo-img" />
          <span>Ordra</span>
        </Link>
        <Link to="/" className="legal-back-btn">
          ← Back to Homepage
        </Link>
      </header>

      <main className="legal-container">
        <div className="legal-header">
          <h1 className="legal-title">
            {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
          </h1>
          <p className="legal-last-updated">
            Last Updated: May 12, 2026
          </p>
        </div>

        <div className="legal-content">
          {isPrivacy ? (
            <>
              <p>
                Welcome to Ordra ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy informs you about how we handle, collect, and protect your data when you visit our website (ordra.netlify.app) and use our order management dashboard.
              </p>

              <h2>1. Information We Collect</h2>
              <p>
                We only collect data necessary to provide and improve our services:
              </p>
              <ul>
                <li><strong>Account Information:</strong> Full name, email address, and profile avatars provided during Google OAuth Authentication.</li>
                <li><strong>Business Metadata:</strong> Business names, inventory catalogs, and customer order ledgers created within your workspace.</li>
                <li><strong>Usage Data:</strong> Application settings, preferred theme models, and synchronization metrics.</li>
              </ul>

              <h2>2. How We Use Your Data</h2>
              <p>
                The information we gather is used exclusively for operational execution:
              </p>
              <ul>
                <li>To authenticate your secure login requests using Convex serverless infrastructure.</li>
                <li>To persist your product inventories and order ledgers securely across devices.</li>
                <li>To send transactional summaries or updates directly to your customers via integrated notification channels upon your direct authorization.</li>
              </ul>

              <h2>3. Data Sharing and Protection</h2>
              <p>
                We do not sell, rent, or lease your private customer ledgers or metadata to third-party data brokers. Your application information is processed strictly within our secure isolated database layers. Third-party authentication integrations (such as Google Sign-In) enforce robust encrypted data verification routines.
              </p>

              <h2>4. Your Data Rights</h2>
              <p>
                You retain complete autonomy over your operational database. You may export summaries, duplicate entries, or entirely erase customer profile components directly within your authenticated Ordra workspace controls at any time.
              </p>

              <h2>5. Contact Support</h2>
              <p>
                If you have inquiries regarding these privacy practices or require direct assistance with your account data, please contact our support desk directly at: <strong>erioluwamole12@gmail.com</strong>.
              </p>
            </>
          ) : (
            <>
              <p>
                Welcome to Ordra. By accessing or using our website and digital tools (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from using the dashboard application.
              </p>

              <h2>1. Account Usage & Integrity</h2>
              <p>
                To access full platform capabilities, you must authenticate using a verified Google account credentials. You are responsible for maintaining the general confidentiality of your access workflows and hardware environments.
              </p>

              <h2>2. Vendor Responsibilities</h2>
              <p>
                Ordra provides internal organizational infrastructure for independent vendors. You retain absolute legal liability for any items, custom wares, or commercial agreements conducted between your enterprise and your external customers. Ordra does not handle direct peer-to-peer consumer financial escrow transactions.
              </p>

              <h2>3. Intellectual Property</h2>
              <p>
                The visual design system, frontend layouts, logos, and custom code architecture of the Ordra web interface remain exclusive proprietary assets. You may not decompile, sub-license, or impersonate platform assets.
              </p>

              <h2>4. Service Reliability & Offline Queuing</h2>
              <p>
                Our offline caching architecture temporarily preserves un-synced operations local to your machine runtime. We strive for maximal server uptime; however, we cannot guarantee zero-loss network synchronization under severe hardware connectivity disruptions.
              </p>

              <h2>5. Amendments</h2>
              <p>
                We reserve the right to modify these operational terms at our discretion. Continued usage of the dashboard interface following programmatic publication of updated terms constitutes binding acceptance.
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="legal-footer">
        © {new Date().getFullYear()} Ordra. Fully functional and secured.
      </footer>
    </div>
  );
}
