"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: {
    name: string
    href?: string
  }[]
  separator?: React.ReactNode
  homeHref?: string
  showHome?: boolean
}

export function Breadcrumb({
  segments,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />,
  homeHref = "/",
  showHome = false, // Changed default to false
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumbs"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
      {...props}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {showHome && (
          <li className="inline-flex items-center">
            <Link
              href={homeHref}
              className="inline-flex items-center rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Home className="h-4 w-4" />
            </Link>
            <span aria-hidden="true" className="flex items-center">
              {separator}
            </span>
          </li>
        )}
        
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          
          return (
            <li key={`${segment.name}-${index}`} className="inline-flex items-center">
              {segment.href && !isLast ? (
                <>
                  <Link
                    href={segment.href}
                    className="truncate text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {segment.name}
                  </Link>
                  <span aria-hidden="true" className="flex items-center">
                    {separator}
                  </span>
                </>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "truncate",
                    isLast ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {segment.name}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
} 