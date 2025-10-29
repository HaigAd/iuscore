"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { SegmentData, SegmentUpdate } from "@/lib/segments"

const crohnsStratificationOptions = [
  { value: "normal" as SegmentData["stratification"], label: "Normal" },
  { value: "focal" as SegmentData["stratification"], label: "Focal loss" },
  { value: "extensive" as SegmentData["stratification"], label: "Extensive loss" },
  { value: "uncertain" as const, label: "Uncertain" },
]

interface QuickScoreCrohnsControlsProps {
  segment: SegmentData
  onChange: (update: SegmentUpdate) => void
}

export function QuickScoreCrohnsControls({
  segment,
  onChange,
}: QuickScoreCrohnsControlsProps) {
  return (
    <>
      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">
          Bowel wall stratification
        </Label>
        <div className="flex flex-wrap gap-2">
          {crohnsStratificationOptions.map((option) => {
            const isUncertain = option.value === "uncertain"
            const isActive = isUncertain
              ? segment.stratificationUncertain === true && !segment.stratification
              : segment.stratification === option.value && !segment.stratificationUncertain

            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="rounded-full"
                onClick={() =>
                  onChange(
                    isUncertain
                      ? { stratification: undefined, stratificationUncertain: true }
                      : { stratification: option.value, stratificationUncertain: undefined },
                  )
                }
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </section>

      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">
          Mesenteric fat
        </Label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "none", label: "Normal" },
            { key: "active", label: "Echogenic" },
            { key: "uncertain", label: "Uncertain" },
          ].map((option) => {
            const currentState = segment.fatWrapping
              ? "active"
              : segment.fatWrappingUncertain
                ? "uncertain"
                : "none"
            const isActive = option.key === currentState

            return (
              <Button
                key={option.key}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="rounded-full"
                onClick={() => {
                  if (option.key === "active") {
                    onChange({ fatWrapping: true, fatWrappingUncertain: undefined })
                  } else if (option.key === "none") {
                    onChange({ fatWrapping: false, fatWrappingUncertain: undefined })
                  } else {
                    onChange({ fatWrapping: undefined, fatWrappingUncertain: true })
                  }
                }}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </section>
    </>
  )
}
