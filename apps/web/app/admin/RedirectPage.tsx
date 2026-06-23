"use client";

import { useEffect } from "react";

type RedirectPageProps = {
  href: string;
  label: string;
};

export function RedirectPage({ href, label }: RedirectPageProps) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return <a href={href}>{label}</a>;
}
