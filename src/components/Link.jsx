'use client'

import NextLink from 'next/link'
import React from 'react'
import PropTypes from 'prop-types'

const Link = React.forwardRef(({ to, href, children, className, ...props }, ref) => {
  const linkHref = to || href

  // Filter out Next.js specific props
  const {
    replace,
    scroll,
    shallow,
    passHref,
    prefetch,
    locale,
    ...restProps
  } = props

  if (!linkHref) {
    // Fallback: render a span if no href/to is provided
    return (
      <span ref={ref} className={className} {...restProps}>
        {children}
      </span>
    )
  }

  // Prepare Next.js specific props
  // Prepare Next.js specific props
  const nextLinkProps = {
    href: typeof linkHref === 'string' || typeof linkHref === 'object' ? linkHref : undefined,
    replace,
    scroll,
    shallow: shallow !== undefined ? shallow : undefined,
    prefetch,
    locale,
    passHref,
    ...(className && { className }),
    ...(ref && { ref })
  }
  Object.keys(nextLinkProps).forEach(key => {
    if (nextLinkProps[key] === undefined) {
      delete nextLinkProps[key]
    }
  })

  return (
    <NextLink {...nextLinkProps}>
      <span {...restProps}>
        {children}
      </span>
    </NextLink>
  )
})

Link.displayName = 'Link'

Link.propTypes = {
  to: PropTypes.string,
  href: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  replace: PropTypes.bool,
  scroll: PropTypes.bool,
  shallow: PropTypes.bool,
  prefetch: PropTypes.bool,
  locale: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  passHref: PropTypes.bool,
}

export default Link
