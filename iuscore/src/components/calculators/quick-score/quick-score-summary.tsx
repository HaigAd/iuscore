"use client"

import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"

import { ContextContentView } from "@/components/context/context-popover"
import { CardFooter } from "@/components/ui/card"
import type { ScoreSummary } from "@/lib/quick-calculator"
import { cn } from "@/lib/utils"

const toneStyles = {
  muted: {
    container: "bg-white text-slate-600 border-slate-200",
    label: "text-slate-500",
    description: "text-slate-600",
    score: "text-slate-900",
    contextWrapper: "bg-white border-slate-200 text-slate-700",
    toggle: "text-slate-600 hover:text-slate-800",
  },
  positive: {
    container: "bg-emerald-600 text-white border-emerald-500",
    label: "text-emerald-100/80",
    description: "text-white",
    score: "text-white",
    contextWrapper: "bg-white/90 border-white/70 text-slate-700",
    toggle: "text-emerald-100 hover:text-white",
  },
  caution: {
    container: "bg-amber-500 text-white border-amber-500",
    label: "text-amber-100/80",
    description: "text-white",
    score: "text-white",
    contextWrapper: "bg-white/90 border-white/70 text-slate-700",
    toggle: "text-amber-100 hover:text-white",
  },
  negative: {
    container: "bg-rose-600 text-white border-rose-500",
    label: "text-rose-100/80",
    description: "text-white",
    score: "text-white",
    contextWrapper: "bg-white/95 border-white/70 text-slate-700",
    toggle: "text-rose-100 hover:text-white",
  },
} as const

interface QuickScoreSummaryProps {
  summary: ScoreSummary
}

export function QuickScoreSummary({ summary }: QuickScoreSummaryProps) {
  const toneStyle = toneStyles[summary.tone]
  const [contextOpen, setContextOpen] = useState(false)
  const context = summary.context
  const contextId = useId()

  return (
    <CardFooter className="border-t border-slate-200 bg-slate-50 p-0 items-stretch">
      <div
        className={cn(
          "flex w-full flex-col gap-3 border px-6 py-5 transition-colors rounded-bl-2xl rounded-br-2xl",
          toneStyle.container,
        )}
      >
        <span className={cn("text-xs uppercase tracking-wide", toneStyle.label)}>
          {summary.label}
        </span>
        <span className={cn("text-3xl font-semibold leading-none", toneStyle.score)}>
          {summary.value ?? "—"}
        </span>
        <p className={cn("text-sm font-medium", toneStyle.description)}>
          {summary.description}
        </p>

        {context ? (
          <div className="mt-1 space-y-2">
            <button
              type="button"
              onClick={() => setContextOpen((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                toneStyle.toggle,
              )}
              aria-expanded={contextOpen}
              aria-controls={contextId}
            >
              <span>Score context</span>
              <ChevronDown
                aria-hidden
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  contextOpen ? "rotate-180" : "rotate-0",
                )}
              />
            </button>
            {contextOpen ? (
              <div
                id={contextId}
                className={cn(
                  "rounded-lg border p-4 text-left shadow-sm",
                  toneStyle.contextWrapper,
                )}
              >
                <ContextContentView
                  content={context}
                  className="space-y-3 [&_*]:text-left"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </CardFooter>
  )
}
