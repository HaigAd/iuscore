"use client"

import { Info } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const PLACEHOLDER_BASE = "https://via.placeholder.com"

const stratificationEntries = [
  {
    key: "normal",
    label: "Normal",
    description: "Preserved concentric layering of the bowel wall.",
    thumbnail: `${PLACEHOLDER_BASE}/160x80?text=Normal`,
    full: `${PLACEHOLDER_BASE}/320x240?text=Normal+strat`,
  },
  {
    key: "focal",
    label: "Focal loss",
    description: "Segmental disruption of wall layers at the site of inflammation.",
    thumbnail: `${PLACEHOLDER_BASE}/160x80?text=Focal`,
    full: `${PLACEHOLDER_BASE}/320x240?text=Focal+loss`,
  },
  {
    key: "extensive",
    label: "Extensive loss",
    description: "Diffuse loss of wall stratification across the segment.",
    thumbnail: `${PLACEHOLDER_BASE}/160x80?text=Extensive`,
    full: `${PLACEHOLDER_BASE}/320x240?text=Extensive+loss`,
  },
] as const

export function BowelStratificationInfo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Bowel stratification reference"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[31rem] space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Bowel wall stratification</h3>
          <p className="text-xs text-muted-foreground">
            Loss of mural layering reflects progressive transmural inflammation.
          </p>
        </div>
        <ul className="space-y-3">
          {stratificationEntries.map((entry) => (
            <li key={entry.key} className="flex items-start gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-20 w-40 flex-none overflow-hidden rounded-md border border-border/40"
                    aria-label={`View example for ${entry.label.toLowerCase()}`}
                  >
                    <img
                      src={entry.thumbnail}
                      alt={`Bowel wall stratification ${entry.label.toLowerCase()} example`}
                      className="h-full w-full object-cover object-center"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-80">
                  <img
                    src={entry.full}
                    alt={`Bowel wall stratification ${entry.label.toLowerCase()} detailed example`}
                    className="h-auto w-full rounded-md border border-border/40 object-contain"
                  />
                </PopoverContent>
              </Popover>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {entry.label.charAt(0)}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {entry.label}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {entry.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
