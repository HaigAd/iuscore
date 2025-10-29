"use client"

import { Droplet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { DiseaseProfile, SegmentData, SegmentUpdate } from "@/lib/segments"
import { cn } from "@/lib/utils"

interface QuickScoreDopplerSelectorProps {
  profile: DiseaseProfile
  segment: SegmentData
  onChange: (update: SegmentUpdate) => void
}

export function QuickScoreDopplerSelector({
  profile,
  segment,
  onChange,
}: QuickScoreDopplerSelectorProps) {
  if (profile === "uc") {
    return (
      <section className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">
          Doppler signal
        </Label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "absent", label: "Absent", grade: 0 },
            { key: "present", label: "Present", grade: 1 },
          ].map((option) => {
            const isActive =
              option.key === "present"
                ? (segment.dopplerGrade ?? 0) >= 1
                : (segment.dopplerGrade ?? 0) === 0

            return (
              <Button
                key={option.key}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="rounded-full"
                onClick={() =>
                  onChange({
                    dopplerGrade: option.grade as SegmentData["dopplerGrade"],
                    dopplerUncertain: undefined,
                  })
                }
              >
                <Droplet className="mr-2 h-3.5 w-3.5" />
                {option.label}
              </Button>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">
        Doppler signal (Modified Limberg Score)
      </Label>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((grade) => (
          <Button
            key={grade}
            type="button"
            size="sm"
            variant={segment.dopplerGrade === grade ? "default" : "outline"}
            className={cn(
              "gap-2 rounded-full px-4",
              segment.dopplerGrade === grade && "bg-primary text-primary-foreground",
            )}
            onClick={() =>
              onChange({
                dopplerGrade:
                  segment.dopplerGrade === grade
                    ? undefined
                    : (grade as SegmentData["dopplerGrade"]),
                dopplerUncertain: undefined,
              })
            }
          >
            <Droplet className="h-3.5 w-3.5" />
            {grade}
          </Button>
        ))}
      </div>
    </section>
  )
}
