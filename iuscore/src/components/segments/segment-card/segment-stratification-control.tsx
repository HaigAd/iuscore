"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { DiseaseProfile, SegmentData, SegmentUpdate } from "@/lib/segments"

type StratificationValue = Exclude<SegmentData["stratification"], undefined>

const stratificationOptions: Record<
  DiseaseProfile,
  { value: StratificationValue | "uncertain"; label: string }[]
> = {
  uc: [
    { value: "normal", label: "Normal" },
    { value: "focal", label: "Focal loss" },
    { value: "extensive", label: "Extensive loss" },
  ],
  cd: [
    { value: "normal", label: "Normal" },
    { value: "focal", label: "Focal loss" },
    { value: "extensive", label: "Extensive loss" },
    { value: "uncertain", label: "Uncertain" },
  ],
}

interface SegmentStratificationControlProps {
  profile: DiseaseProfile
  segment: SegmentData
  onChange: (updates: SegmentUpdate) => void
}

export function SegmentStratificationControl({
  profile,
  segment,
  onChange,
}: SegmentStratificationControlProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-background/70 p-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        Bowel wall stratification
      </Label>
      <div className="flex flex-wrap gap-2">
        {stratificationOptions[profile].map((option) => {
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
              className="flex-1 rounded-full"
              onClick={() =>
                onChange(
                  isUncertain
                    ? { stratification: undefined, stratificationUncertain: true }
                    : {
                        stratification: option.value as StratificationValue,
                        stratificationUncertain: undefined,
                      },
                )
              }
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
