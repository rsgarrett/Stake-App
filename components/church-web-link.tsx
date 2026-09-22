import type { AnchorHTMLAttributes } from "react"
import { churchWebBounceHref } from "@/lib/church-web-link"

type ChurchWebLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
}

/**
 * Church handbook/media links stay in the browser. Direct https://churchofjesuschrist.org
 * hrefs are Universal Links and hand off to Gospel Library.
 */
export function ChurchWebLink({ href, children, className, ...rest }: ChurchWebLinkProps) {
  const bounce = churchWebBounceHref(href)
  return (
    <a
      {...rest}
      href={bounce ?? href}
      target={bounce ? "_self" : "_blank"}
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  )
}
