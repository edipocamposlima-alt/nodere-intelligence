import type { AnchorHTMLAttributes, ReactNode } from "react";

type NativeLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
};

/**
 * Same-origin navigation fallback for the ChatGPT Sites/Vinext runtime.
 *
 * Vinext beta currently throws inside the next/link RSC prefetch handler in
 * production. A native anchor preserves accessibility, browser history,
 * HttpOnly cookies and direct/reload semantics without depending on that
 * client-side interception layer.
 */
export default function NativeLink({ href, children, ...props }: NativeLinkProps) {
  return <a href={href} {...props}>{children}</a>;
}

