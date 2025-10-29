"use client"

import { CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface QuickScoreSummaryData {
  label: string
  value?: string
  description: string
  tone: "muted" | "positive" | "caution" | "negative"
}

const toneStyles = {
  muted: {
    container: "bg-white text-slate-600 border-slate-200",
    label: "text-slate-500",
    description: "text-slate-600",
    score: "text-slate-900",
  },
  positive: {
    container: "bg-emerald-600 text-white border-emerald-500",
    label: "text-emerald-100/80",
    description: "text-white",
    score: "text-white",
  },
  caution: {
    container: "bg-amber-500 text-white border-amber-500",
    label: "text-amber-100/80",
    description: "text-white",
    score: "text-white",
  },
  negative: {
    container: "bg-rose-600 text-white border-rose-500",
    label: "text-rose-100/80",
    description: "text-white",
    score: "text-white",
  },
} as const

interface QuickScoreSummaryProps {
  summary: QuickScoreSummaryData
}

export function QuickScoreSummary({ summary }: QuickScoreSummaryProps) {
  const toneStyle = toneStyles[summary.tone]

  return (
    <CardFooter className="border-t border-slate-200 bg-slate-50 p-0 items-stretch">
      <div
        className={cn(
          "flex w-full flex-col gap-2 border px-6 py-5 transition-colors rounded-bl-2xl rounded-br-2xl",
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
      </div>
    </CardFooter>
  )
}
