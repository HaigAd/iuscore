"use client"

import { Info } from "lucide-react"

import limberg0 from "@/assets/images/LIM 0.jpg"
import limberg1 from "@/assets/images/LIM 1.jpg"
import limberg2 from "@/assets/images/LIM 2.jpg"
import limberg3 from "@/assets/images/LIM 3.jpg"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const limbergEntries = [
  {
    grade: 0,
    label: "Absent",
    description: "No detectable Doppler signal within the bowel wall.",
    image: limberg0,
  },
  {
    grade: 1,
    label: "Short signals",
    description: "Short Doppler flow signals limited to the bowel wall.",
    image: limberg1,
  },
  {
    grade: 2,
    label: "Long signals inside bowel",
    description: "Longitudinal signals extending within the bowel wall.",
    image: limberg2,
  },
  {
    grade: 3,
    label: "Long signals inside & outside bowel",
    description:
      "Longitudinal flow signals extending through the bowel wall and into surrounding tissues.",
    image: limberg3,
  },
]

export function ModifiedLimbergInfo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Modified Limberg score reference"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[31rem] space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Modified Limberg Score</h3>
          <p className="text-xs text-muted-foreground">
            Semi-quantitative Doppler grading for inflammatory hyperemia.
          </p>
        </div>
        <ul className="space-y-3">
          {limbergEntries.map((entry) => (
            <li key={entry.grade} className="flex items-start gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-20 w-40 flex-none overflow-hidden rounded-md border border-border/40"
                    aria-label={`View example for grade ${entry.grade}`}
                  >
                    <img
                      src={entry.image}
                      alt={`Modified Limberg grade ${entry.grade} example`}
                      className="h-full w-full object-cover object-center"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-80">
                  <img
                    src={entry.image}
                    alt={`Modified Limberg grade ${entry.grade} detailed example`}
                    className="h-auto w-full rounded-md border border-border/40 object-contain"
                  />
                </PopoverContent>
              </Popover>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {entry.grade}
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
