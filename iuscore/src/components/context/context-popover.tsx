"use client"

import * as React from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type ContextMedia = {
  type: "image"
  src: string
  alt?: string
  caption?: string
}

export type ContextListItem = {
  text: string
  detail?: string
  links?: ContextLink[]
}

export type ContextSection = {
  heading?: string
  body?: string
  items?: ContextListItem[]
  media?: ContextMedia[]
  links?: ContextLink[]
}

export type ContextContent = {
  title?: string
  summary?: string
  sections?: ContextSection[]
}

export type ContextLink = {
  label: string
  href: string
  external?: boolean
}

interface ContextPopoverProps {
  trigger: React.ReactNode
  content?: ContextContent | null
  disabled?: boolean
  className?: string
  align?: "start" | "center" | "end"
}

export function ContextPopover({
  trigger,
  content,
  disabled,
  className,
  align = "center",
}: ContextPopoverProps) {
  if (disabled || !content) {
    return <>{trigger}</>
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className={cn("w-[26rem]", className)}>
        <ContextContentView content={content} />
      </PopoverContent>
    </Popover>
  )
}

export function ContextContentView({
  content,
  className,
}: {
  content: ContextContent
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {content.title ? (
        <div className="space-y-1">
          <h3
            className="text-sm font-semibold leading-tight"
            dangerouslySetInnerHTML={{ __html: content.title }}
          />
          {content.summary ? (
            <p
              className="text-xs text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: content.summary }}
            />
          ) : null}
        </div>
      ) : null}

      {content.sections?.map((section, index) => (
        <ContextSectionContent key={index} section={section} />
      ))}
    </div>
  )
}

function ContextSectionContent({ section }: { section: ContextSection }) {
  const { heading, body, items, media } = section
  const renderLinks = (links?: ContextLink[], keyPrefix?: string) => {
    if (!links?.length) {
      return null
    }
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {links.map((link, index) => {
          const isExternal = link.external ?? /^https?:\/\//.test(link.href)
          return (
            <a
              key={`${keyPrefix ?? "link"}-${index}-${link.href}`}
              href={link.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="inline-flex items-center text-[11px] font-medium text-primary underline-offset-2 hover:underline"
            >
              {link.label}
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-md border border-border/40 bg-muted/30 p-3">
      {heading ? (
        <h4
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: heading }}
        />
      ) : null}
      {body ? (
        <p
          className="text-xs leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : null}
      {items?.length ? (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li key={index} className="text-xs text-muted-foreground">
              <span
                className="font-medium text-foreground"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
              {item.detail ? (
                <span
                  className="block whitespace-pre-line text-[11px] text-muted-foreground/80"
                  dangerouslySetInnerHTML={{ __html: item.detail }}
                />
              ) : null}
              {renderLinks(item.links, `item-link-${index}`)}
            </li>
          ))}
        </ul>
      ) : null}
      {renderLinks(section.links, "section-link")}
      {media?.length ? (
        <div className="grid gap-2">
          {media.map((entry, index) =>
            entry.type === "image" ? (
              <figure key={index} className="space-y-1">
                <div className="overflow-hidden rounded-md border border-border/40 bg-background">
                  <img
                    src={entry.src}
                    alt={entry.alt ?? ""}
                    className="h-32 w-full object-cover"
                  />
                </div>
                {entry.caption ? (
                  <figcaption className="text-[11px] text-muted-foreground/80">
                    {entry.caption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  )
}
