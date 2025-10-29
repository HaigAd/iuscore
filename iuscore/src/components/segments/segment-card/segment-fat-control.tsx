"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { DiseaseProfile, SegmentData, SegmentUpdate } from "@/lib/segments"

interface SegmentFatControlProps {
  profile: DiseaseProfile
  segment: SegmentData
  onChange: (updates: SegmentUpdate) => void
}

export function SegmentFatControl({ profile, segment, onChange }: SegmentFatControlProps) {
  const options =
    profile === "uc"
      ? [
          { key: "none", label: "Normal" },
          { key: "active", label: "Echogenic" },
        ]
      : [
          { key: "none", label: "Normal" },
          { key: "active", label: "Echogenic" },
          { key: "uncertain", label: "Uncertain" },
        ]

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mesenteric fat</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const currentState = segment.fatWrapping
            ? "active"
            : segment.fatWrappingUncertain
              ? "uncertain"
              : segment.fatWrapping === false
                ? "none"
                : undefined
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
    </div>
  )
}
