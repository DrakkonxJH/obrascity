"use client";

import Link from "next/link";
import { useState } from "react";

export function AuthHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: all 0.3s;
          padding: 20px 0;
        }
        nav.scrolled {
          background: rgba(6, 8, 16, 0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          padding: 14px 0;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }
        .nav-logo-mark {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FF6B1A, #CC5200);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          box-shadow: 0 4px 16px rgba(255, 107, 26, 0.4);
        }
        .nav-logo-text {
          font-family: 'Barlow Condensed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #F0F4FF;
          letter-spacing: 0.5px;
        }
        .nav-logo-text em {
          color: #FF6B1A;
          font-style: normal;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          font-size: 0.88rem;
          font-weight: 500;
          color: #8896B3;
          transition: color 0.2s;
          text-decoration: none;
        }
        .nav-link:hover {
          color: #F0F4FF;
        }
        .nav-cta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-nav-ghost {
          padding: 8px 20px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #8896B3;
          transition: all 0.2s;
          cursor: pointer;
          background: transparent;
          font-family: 'Barlow', sans-serif;
          text-decoration: none;
        }
        .btn-nav-ghost:hover {
          border-color: #FF6B1A;
          color: #FF6B1A;
        }
        .btn-nav-fire {
          padding: 9px 22px;
          border-radius: 8px;
          background: #FF6B1A;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          font-family: 'Barlow', sans-serif;
          box-shadow: 0 4px 16px rgba(255, 107, 26, 0.35);
          text-decoration: none;
          display: inline-block;
        }
        .btn-nav-fire:hover {
          background: #FF9445;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255, 107, 26, 0.45);
        }
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
          background: none;
          border: none;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #F0F4FF;
          border-radius: 2px;
          transition: all 0.3s;
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0C1018;
          z-index: 999;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
        }
        .mobile-menu.open {
          display: flex;
        }
        .mobile-menu a {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #F0F4FF;
          text-decoration: none;
        }
        .mobile-menu-close {
          position: absolute;
          top: 24px;
          right: 24px;
          font-size: 1.5rem;
          cursor: pointer;
          color: #8896B3;
          background: none;
          border: none;
        }
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          .nav-cta {
            display: none;
          }
          .hamburger {
            display: flex;
          }
          .nav-inner {
            padding: 0 20px;
          }
        }
      `}</style>

      <nav id="navbar" className="scrolled">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark">🏗</div>
            <div className="nav-logo-text">
              OBRAS<em>CITY</em>
            </div>
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">
              Solução
            </Link>
            <Link href="/" className="nav-link">
              Resultados
            </Link>
            <Link href="/" className="nav-link">
              Módulos
            </Link>
            <Link href="/" className="nav-link">
              Clientes
            </Link>
            <Link href="/" className="nav-link">
              Planos
            </Link>
          </div>
          <div className="nav-cta">
            <Link href="/login" className="btn-nav-ghost">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-nav-fire">
              Começar grátis →
            </Link>
          </div>
          <button
            className="hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <button
          className="mobile-menu-close"
          onClick={() => setMobileMenuOpen(false)}
        >
          ✕
        </button>
        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
          Solução
        </Link>
        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
          Resultados
        </Link>
        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
          Módulos
        </Link>
        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
          Clientes
        </Link>
        <Link href="/" onClick={() => setMobileMenuOpen(false)}>
          Planos
        </Link>
        <a href="/cadastro" className="btn-nav-fire" onClick={() => setMobileMenuOpen(false)}>
          Começar grátis →
        </a>
      </div>
    </>
  );
}
