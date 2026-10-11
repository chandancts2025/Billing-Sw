import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'be-landing',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="landing-page">
      <!-- TOP NAVIGATION BAR -->
      <header class="landing-nav">
        <div class="nav-container">
          <a routerLink="/landing" class="brand-link">
            <span class="brand-logo">B</span>
            <div class="brand-text">
              <strong>BillEase Pro</strong>
              <small>Cloud & Offline POS</small>
            </div>
          </a>

          <nav class="nav-links">
            <a href="#features">Features</a>
            <a href="#receipts">Dual Receipts</a>
            <a href="#owner">Product Owner</a>
            <a href="#contact">Contact</a>
          </nav>

          <div class="nav-actions">
            @if (auth.isAuthenticated()) {
              <a routerLink="/billing/new" class="btn-nav-primary">
                <mat-icon>point_of_sale</mat-icon>
                <span>Billing Counter</span>
              </a>
              <a routerLink="/dashboard" class="btn-nav-secondary">
                <mat-icon>dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
            } @else {
              <a routerLink="/auth/login" class="btn-nav-secondary">
                <mat-icon>login</mat-icon>
                <span>Sign In</span>
              </a>
              <a routerLink="/billing/new" class="btn-nav-primary">
                <mat-icon>bolt</mat-icon>
                <span>Live POS Demo</span>
              </a>
            }
          </div>
        </div>
      </header>

      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>Enterprise Retail Solution · v2.4 Active</span>
          </div>

          <h1 class="hero-title">
            Next-Generation <span class="gradient-text">Billing & POS</span><br />
            Engineered for Modern Retail
          </h1>

          <p class="hero-subtitle">
            Lightning-fast counter checkout with instant barcode lookup, dual <strong>80mm Thermal</strong> & <strong>A4 GST Tax Invoices</strong>, offline durability, and automated stock reconciliation.
          </p>

          <div class="hero-cta-group">
            <a routerLink="/billing/new" class="cta-btn primary-cta">
              <mat-icon>point_of_sale</mat-icon>
              <span>Open POS Counter (F2-F7)</span>
            </a>
            <a routerLink="/auth/login" class="cta-btn secondary-cta">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Operator & Admin Login</span>
            </a>
            <a href="#owner" class="cta-btn ghost-cta">
              <mat-icon>verified</mat-icon>
              <span>Product Owner</span>
            </a>
          </div>

          <!-- HIGHLIGHT METRICS ROW -->
          <div class="hero-stats-grid">
            <div class="stat-card">
              <strong>&lt; 0.5s</strong>
              <span>Barcode & Item Lookup</span>
            </div>
            <div class="stat-card">
              <strong>80mm / A4</strong>
              <span>Dual Print Formats</span>
            </div>
            <div class="stat-card">
              <strong>100%</strong>
              <span>Offline Ready POS</span>
            </div>
            <div class="stat-card">
              <strong>GST & HSN</strong>
              <span>Tax Invoicing Ready</span>
            </div>
          </div>
        </div>
      </section>

      <!-- KEY FEATURES SECTION -->
      <section id="features" class="section-container">
        <div class="section-head text-center">
          <span class="section-eyebrow">Everything Your Counter Needs</span>
          <h2>Comprehensive Retail Capabilities</h2>
          <p>Designed for fast-paced retail checkout environments with keyboard ergonomics and zero clutter.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon emerald">
              <mat-icon>point_of_sale</mat-icon>
            </div>
            <h3>Keyboard-Driven POS</h3>
            <p>Full shortcut navigation with F2 (Search), F3 (Barcode), F4 (Custom Item), F5 (Hold Draft), F6 (Pay & Print), and F7 (Save).</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon blue">
              <mat-icon>receipt_long</mat-icon>
            </div>
            <h3>Dual Receipt Formats</h3>
            <p>Configurable 80mm thermal roll receipts for fast customer handover and formal A4 multi-copy invoices for B2B tax compliance.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon purple">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <h3>Real-Time Stock Sync</h3>
            <p>Automated stock deduction upon bill confirmation with low-stock warnings, expiry tracking, and movement logs.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon amber">
              <mat-icon>qr_code_2</mat-icon>
            </div>
            <h3>Dynamic UPI & Payments</h3>
            <p>Real-time UPI payment QR code generated per bill amount, cash change-due calculator, and split payment methods.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon rose">
              <mat-icon>groups</mat-icon>
            </div>
            <h3>Customer Loyalty & Ledger</h3>
            <p>Walk-in customer mode or registered member accounts with automated reward points accumulation and balance tracking.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon teal">
              <mat-icon>analytics</mat-icon>
            </div>
            <h3>Insights & Reports</h3>
            <p>Live sales summaries, tax slab breakups, category margin metrics, and user shift tracking with full audit trails.</p>
          </div>
        </div>
      </section>

      <!-- DUAL RECEIPT FORMAT SHOWCASE -->
      <section id="receipts" class="receipts-section">
        <div class="section-container">
          <div class="section-head text-center">
            <span class="section-eyebrow">Print Settings & Compatibility</span>
            <h2>Flexible Receipt & Invoice Formats</h2>
            <p>Easily toggle between 80mm Thermal paper and standard A4 sheets directly from POS Settings or before confirming.</p>
          </div>

          <div class="receipts-preview-grid">
            <div class="receipt-card thermal-showcase">
              <div class="card-badge">POS Standard</div>
              <div class="card-title-row">
                <mat-icon>receipt</mat-icon>
                <h4>80mm Thermal Receipt</h4>
              </div>
              <div class="mock-slip">
                <div class="slip-header">
                  <strong>BillEase Pro Store</strong>
                  <small>Newtown, 700135, WB</small>
                  <small>Tel: 9851632391</small>
                  <span class="slip-dash">--------------------------------</span>
                </div>
                <div class="slip-row"><span>Item A x 2</span><span>₹120.00</span></div>
                <div class="slip-row"><span>Item B x 1</span><span>₹350.00</span></div>
                <div class="slip-dash">--------------------------------</div>
                <div class="slip-total"><span>TOTAL</span><span>₹470.00</span></div>
                <div class="slip-footer">Scan UPI QR to Pay</div>
              </div>
              <p>Ideal for EPSON, TVS, Rugtek, and all ESC/POS thermal printer models.</p>
            </div>

            <div class="receipt-card a4-showcase">
              <div class="card-badge">B2B & Tax Invoice</div>
              <div class="card-title-row">
                <mat-icon>picture_as_pdf</mat-icon>
                <h4>A4 Full Tax Invoice</h4>
              </div>
              <div class="mock-a4">
                <div class="a4-header">
                  <div>
                    <strong>TAX INVOICE</strong>
                    <small>GSTIN: 29ABCDE1234F1Z5</small>
                  </div>
                  <div class="text-right">
                    <strong>BillEase Pro</strong>
                    <small>Kolkata, WB</small>
                  </div>
                </div>
                <table class="mock-table">
                  <thead><tr><th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
                  <tbody>
                    <tr><td>1</td><td>Paracetamol 500mg</td><td>3004</td><td>2</td><td>₹12.00</td><td>₹24.00</td></tr>
                    <tr><td>2</td><td>Digital Thermometer</td><td>9025</td><td>1</td><td>₹199.00</td><td>₹199.00</td></tr>
                  </tbody>
                </table>
                <div class="a4-totals">Grand Total: ₹223.00</div>
              </div>
              <p>Optimized for laser and inkjet printers with full tax breakup and bank details.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- PRODUCT OWNER SHOWCASE -->
      <section id="owner" class="owner-spotlight-section">
        <div class="section-container">
          <div class="owner-main-card">
            <div class="owner-left">
              <div class="owner-avatar">
                <mat-icon>person</mat-icon>
                <div class="verified-seal" title="Verified Owner">
                  <mat-icon>verified</mat-icon>
                </div>
              </div>
              <div class="owner-info">
                <span class="owner-pill">Product & Application Owner</span>
                <h2>Chandan Kr Mandal</h2>
                <p class="owner-role">Lead Architect & Solutions Stakeholder</p>
                <span class="owner-tagline">Managing design, product roadmap, retail integrations, and user experience for BillEase Pro.</span>
              </div>
            </div>

            <div class="owner-contact-grid">
              <div class="contact-item">
                <div class="contact-icon"><mat-icon>phone</mat-icon></div>
                <div>
                  <small>Direct Phone</small>
                  <a href="tel:9851632391">9851632391</a>
                </div>
              </div>

              <div class="contact-item">
                <div class="contact-icon"><mat-icon>email</mat-icon></div>
                <div>
                  <small>Official Email</small>
                  <a href="mailto:chandankr.mandal87@gmail.com">chandankr.mandal87@gmail.com</a>
                </div>
              </div>

              <div class="contact-item full-width">
                <div class="contact-icon"><mat-icon>place</mat-icon></div>
                <div>
                  <small>Registered Address</small>
                  <strong>3B8-2D, Sanhita Township, Newtown, Kolkata - 700135, WB</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer id="contact" class="landing-footer">
        <div class="footer-container">
          <div class="footer-brand">
            <div class="brand-link">
              <span class="brand-logo">B</span>
              <strong>BillEase Pro</strong>
            </div>
            <p>Cloud & Offline Hybrid Point of Sale and ERP Software.</p>
            <p class="owner-cred">Owned & Operated by <strong>Chandan Kr Mandal</strong></p>
          </div>

          <div class="footer-links">
            <div>
              <h4>Navigation</h4>
              <a routerLink="/billing/new">New Bill (POS)</a>
              <a routerLink="/dashboard">Dashboard</a>
              <a routerLink="/auth/login">Sign In</a>
              <a routerLink="/auth/register">Create Account</a>
            </div>
            <div>
              <h4>Support & Contact</h4>
              <a href="tel:9851632391">📞 9851632391</a>
              <a href="mailto:chandankr.mandal87@gmail.com">✉️ chandankr.mandal87&#64;gmail.com</a>
              <span>📍 Newtown, 700135, WB</span>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 BillEase Pro. All rights reserved. Application Owner: Chandan Kr Mandal.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    }

    /* TOP NAVBAR */
    .landing-nav {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      background: #0f766e;
      color: #ffffff;
      display: grid;
      place-items: center;
      font-size: 20px;
      font-weight: 800;
      box-shadow: 0 2px 8px rgba(15, 118, 110, 0.35);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-text strong {
      font-size: 17px;
      color: #0f172a;
      line-height: 1.2;
    }
    .brand-text small {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .nav-links a {
      text-decoration: none;
      color: #475569;
      font-size: 14px;
      font-weight: 600;
      transition: color 0.15s ease;
    }
    .nav-links a:hover {
      color: #0f766e;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-nav-primary, .btn-nav-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .btn-nav-primary {
      background: #0f766e;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(15, 118, 110, 0.3);
    }
    .btn-nav-primary:hover {
      background: #0d9488;
      transform: translateY(-1px);
    }
    .btn-nav-secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .btn-nav-secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    /* HERO SECTION */
    .hero-section {
      padding: 72px 24px 56px;
      background: linear-gradient(180deg, #f0fdfa 0%, #ffffff 100%);
      text-align: center;
    }
    .hero-container {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: #ffffff;
      border: 1px solid #99f6e4;
      color: #0f766e;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(15, 118, 110, 0.1);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
    }
    .hero-title {
      font-size: clamp(32px, 5vw, 52px);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin: 0;
      color: #0f172a;
    }
    .gradient-text {
      background: linear-gradient(135deg, #0f766e 0%, #0284c7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: clamp(16px, 2.5vw, 19px);
      color: #475569;
      line-height: 1.6;
      max-width: 760px;
      margin: 0;
    }
    .hero-cta-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .primary-cta {
      background: #0f766e;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(15, 118, 110, 0.35);
    }
    .primary-cta:hover {
      background: #0d9488;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(15, 118, 110, 0.45);
    }
    .secondary-cta {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #1e293b;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }
    .secondary-cta:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      transform: translateY(-2px);
    }
    .ghost-cta {
      background: #e6fffa;
      border: 1px solid #99f6e4;
      color: #0f766e;
    }
    .ghost-cta:hover {
      background: #ccfbf1;
    }

    /* STATS ROW */
    .hero-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      width: 100%;
      margin-top: 24px;
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .stat-card strong {
      font-size: 24px;
      color: #0f766e;
      font-weight: 800;
    }
    .stat-card span {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* SECTION CONTAINERS */
    .section-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 72px 24px;
    }
    .section-head {
      margin-bottom: 48px;
    }
    .text-center { text-align: center; }
    .section-eyebrow {
      font-size: 12px;
      font-weight: 700;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      display: block;
      margin-bottom: 6px;
    }
    .section-head h2 {
      font-size: clamp(26px, 4vw, 36px);
      font-weight: 800;
      margin: 0 0 10px;
      color: #0f172a;
    }
    .section-head p {
      font-size: 16px;
      color: #64748b;
      max-width: 600px;
      margin: 0 auto;
    }

    /* FEATURES GRID */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .feature-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    .feature-card:hover {
      border-color: #99f6e4;
      transform: translateY(-3px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
    }
    .feature-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: grid;
      place-items: center;
    }
    .feature-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .feature-icon.emerald { background: #ecfdf5; color: #059669; }
    .feature-icon.blue { background: #eff6ff; color: #2563eb; }
    .feature-icon.purple { background: #f5f3ff; color: #7c3aed; }
    .feature-icon.amber { background: #fffbeb; color: #d97706; }
    .feature-icon.rose { background: #fff1f2; color: #e11d48; }
    .feature-icon.teal { background: #f0fdfa; color: #0f766e; }

    .feature-card h3 {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      color: #0f172a;
    }
    .feature-card p {
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
      margin: 0;
    }

    /* RECEIPTS SHOWCASE */
    .receipts-section {
      background: #f1f5f9;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    .receipts-preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      align-items: stretch;
    }
    .receipt-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    .card-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      color: #0f766e;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
      text-transform: uppercase;
    }
    .card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-title-row mat-icon { color: #0f766e; }
    .card-title-row h4 { margin: 0; font-size: 18px; }

    /* MOCK THERMAL */
    .mock-slip {
      background: #fafaf9;
      border: 1px dashed #a8a29e;
      border-radius: 8px;
      padding: 14px;
      font-family: monospace;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 280px;
      margin: 0 auto;
      width: 100%;
    }
    .slip-header { text-align: center; display: flex; flex-direction: column; gap: 2px; }
    .slip-row { display: flex; justify-content: space-between; }
    .slip-total { display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; color: #0f766e; }
    .slip-dash { color: #78716c; text-align: center; }
    .slip-footer { text-align: center; font-size: 10px; color: #78716c; }

    /* MOCK A4 */
    .mock-a4 {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .a4-header { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .a4-header div { display: flex; flex-direction: column; gap: 2px; }
    .text-right { text-align: right; }
    .mock-table { width: 100%; border-collapse: collapse; }
    .mock-table th, .mock-table td { border-bottom: 1px solid #e2e8f0; padding: 4px; text-align: left; }
    .a4-totals { text-align: right; font-weight: 800; font-size: 13px; color: #0f766e; }

    /* OWNER SPOTLIGHT */
    .owner-spotlight-section {
      background: #ffffff;
    }
    .owner-main-card {
      background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #eff6ff 100%);
      border: 2px solid #99f6e4;
      border-radius: 20px;
      padding: 36px;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 32px;
      box-shadow: 0 10px 30px rgba(15, 118, 110, 0.08);
      align-items: center;
    }
    .owner-left {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    .owner-avatar {
      position: relative;
      width: 72px;
      height: 72px;
      border-radius: 18px;
      background: #0f766e;
      color: #ffffff;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(15, 118, 110, 0.35);
    }
    .owner-avatar mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .verified-seal {
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: #ffffff;
      border-radius: 50%;
      color: #0284c7;
      display: grid;
      place-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .verified-seal mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .owner-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .owner-pill {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .owner-info h2 {
      font-size: 26px;
      font-weight: 800;
      margin: 0;
      color: #0f172a;
    }
    .owner-role {
      font-size: 14px;
      font-weight: 600;
      color: #0284c7;
      margin: 0;
    }
    .owner-tagline {
      font-size: 13px;
      color: #64748b;
      line-height: 1.4;
      margin-top: 4px;
    }

    .owner-contact-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 20px;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .contact-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #f0fdfa;
      color: #0f766e;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .contact-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .contact-item small {
      display: block;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .contact-item strong {
      font-size: 13px;
      color: #0f172a;
    }
    .contact-item a {
      font-size: 14px;
      font-weight: 700;
      color: #0f766e;
      text-decoration: none;
    }
    .contact-item a:hover {
      text-decoration: underline;
    }

    /* FOOTER */
    .landing-footer {
      background: #0f172a;
      color: #cbd5e1;
      padding: 48px 24px 24px;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      gap: 32px;
      flex-wrap: wrap;
    }
    .footer-brand {
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .footer-brand .brand-logo {
      background: #0f766e;
    }
    .footer-brand strong {
      color: #ffffff;
      font-size: 18px;
    }
    .footer-brand p {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }
    .owner-cred {
      color: #38bdf8 !important;
      font-weight: 500;
    }
    .footer-links {
      display: flex;
      gap: 48px;
      flex-wrap: wrap;
    }
    .footer-links h4 {
      margin: 0 0 12px;
      color: #ffffff;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .footer-links div {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .footer-links a, .footer-links span {
      font-size: 13px;
      color: #94a3b8;
      text-decoration: none;
    }
    .footer-links a:hover {
      color: #ffffff;
    }
    .footer-bottom {
      max-width: 1200px;
      margin: 36px auto 0;
      padding-top: 20px;
      border-top: 1px solid #334155;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }

    /* RESPONSIVE */
    @media (max-width: 860px) {
      .nav-links { display: none; }
      .hero-stats-grid { grid-template-columns: repeat(2, 1fr); }
      .receipts-preview-grid { grid-template-columns: 1fr; }
      .owner-main-card { grid-template-columns: 1fr; }
      .owner-left { flex-direction: column; align-items: center; text-align: center; }
    }
    @media (max-width: 480px) {
      .hero-stats-grid { grid-template-columns: 1fr; }
      .hero-cta-group { flex-direction: column; width: 100%; }
      .cta-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class LandingComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
}
