"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { SOLUTIONS } from "./solutions";
import { Logo } from "@/components/brand/Logo";
import { getApiBaseUrl } from "@/lib/apiBase";
import type { CmsNavigation } from "@/lib/publicContent";

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [navigation, setNavigation] = useState<CmsNavigation[]>([]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${getApiBaseUrl()}/content/navigation?location=header`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { items: [] })
      .then((payload: { items?: CmsNavigation[] }) => setNavigation(payload.items || []))
      .catch(() => setNavigation([]));
    return () => controller.abort();
  }, []);

  return (
    <>
      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <div className="site-header__inner">
          <Link href="/" className="site-logo" aria-label="NODERE">
            <Logo variant="full" height={38} className="site-logo__image" />
          </Link>

          <nav className="site-nav desktop-nav" aria-label="Navegação principal">
            {navigation.length > 0 ? navigation.map((item) => <Link className="site-nav__link" href={item.href} key={item.id}>{item.label}</Link>) : <>
            <div className="site-nav__mega" onMouseEnter={() => setSolutionsOpen(true)} onMouseLeave={() => setSolutionsOpen(false)}>
              <button className="site-nav__link site-nav__button" type="button" onClick={() => setSolutionsOpen((current) => !current)} aria-expanded={solutionsOpen}>
                Soluções <ChevronDown className={solutionsOpen ? "site-chevron site-chevron--open" : "site-chevron"} size={14} />
              </button>
              {solutionsOpen && (
                <div className="site-mega">
                  <p className="site-eyebrow site-mega__eyebrow">8 conjuntos integrados</p>
                  <div className="site-mega__grid">
                    {SOLUTIONS.map((solution) => {
                      const Icon = solution.icon;
                      return (
                        <Link className="site-mega__item" href={solution.href} key={solution.code}>
                          <span className="site-mega__icon"><Icon size={18} /></span>
                          <span>
                            <strong>{solution.name}</strong>
                            <small>{solution.desc}</small>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <Link className="site-mega__all" href="/solucoes">Ver todas as soluções</Link>
                </div>
              )}
            </div>
            <Link className="site-nav__link" href="/precos">Preços</Link>
            <Link className="site-nav__link" href="/blog">Blog</Link>
            <Link className="site-nav__link" href="/contato">Contato</Link>
            </>}
          </nav>

          <div className="site-header__actions header-ctas">
            <Link className="site-login" href="/app/login">Entrar</Link>
            <Link className="site-primary" href="/app/register">Começar grátis</Link>
          </div>

          <button className="site-menu-button" type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="Abrir menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="site-mobile-menu">
            {navigation.length > 0 ? navigation.map((item) => <Link href={item.href} key={item.id} onClick={() => setMenuOpen(false)}>{item.label}</Link>) : <>
            <Link href="/solucoes" onClick={() => setMenuOpen(false)}>Soluções</Link>
            <Link href="/precos" onClick={() => setMenuOpen(false)}>Preços</Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)}>Blog</Link>
            <Link href="/contato" onClick={() => setMenuOpen(false)}>Contato</Link>
            </>}
            <Link href="/app/login" onClick={() => setMenuOpen(false)}>Entrar</Link>
            <Link href="/app/register" onClick={() => setMenuOpen(false)}>Começar grátis</Link>
          </div>
        )}
      </header>
      <div className="site-header-spacer" />
    </>
  );
}
