import type { VisualizationQuality } from "@/lib/segments"

export const DEFAULT_IMPAIRMENT_REASON = "Body habitus"

export const QUALITY_OPTIONS: {
  value: VisualizationQuality
  label: string
  activeClass: string
}[] = [
  {
    value: "good",
    label: "Good",
    activeClass: "bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50",
  },
  {
    value: "impaired",
    label: "Impaired",
    activeClass: "bg-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-400/50",
  },
  {
    value: "notVisualized",
    label: "Not visualized",
    activeClass: "bg-rose-500 text-white shadow-sm ring-1 ring-rose-500/50",
  },
]
