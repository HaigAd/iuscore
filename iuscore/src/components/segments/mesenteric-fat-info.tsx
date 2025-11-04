"use client"

import { Info } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const PLACEHOLDER_BASE = "https://via.placeholder.com"

const fatEntries = [
  {
    key: "normal",
    label: "Normal",
    description: "Mesenteric fat with baseline echogenicity and no creeping pattern.",
    thumbnail: `${PLACEHOLDER_BASE}/160x80?text=Normal`,
    full: `${PLACEHOLDER_BASE}/320x240?text=Normal+fat`,
  },
  {
    key: "echogenic",
    label: "Echogenic",
    description: "Hyperechoic mesenteric fat enveloping the affected segment (creeping fat).",
    thumbnail: `${PLACEHOLDER_BASE}/160x80?text=Echogenic`,
    full: `${PLACEHOLDER_BASE}/320x240?text=Echogenic+fat`,
  },
] as const

export function MesentericFatInfo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Mesenteric fat reference"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[31rem] space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Mesenteric fat appearance</h3>
          <p className="text-xs text-muted-foreground">
            Increased echogenicity and encasement signal chronic inflammatory remodeling.
          </p>
        </div>
        <ul className="space-y-3">
          {fatEntries.map((entry) => (
            <li key={entry.key} className="flex items-start gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-20 w-40 flex-none overflow-hidden rounded-md border border-border/40"
                    aria-label={`View example for ${entry.label.toLowerCase()} mesenteric fat`}
                  >
                    <img
                      src={entry.thumbnail}
                      alt={`${entry.label} mesenteric fat example`}
                      className="h-full w-full object-cover object-center"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-80">
                  <img
                    src={entry.full}
                    alt={`${entry.label} mesenteric fat detailed example`}
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
