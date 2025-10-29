"use client"

import { Droplet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { SegmentData, SegmentUpdate } from "@/lib/segments"
import { cn } from "@/lib/utils"

interface SegmentDopplerControlProps {
  segment: SegmentData
  onChange: (updates: SegmentUpdate) => void
}

export function SegmentDopplerControl({ segment, onChange }: SegmentDopplerControlProps) {
  const disabled = segment.dopplerUncertain || segment.notVisualised

  return (
    <section className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        <span className="flex items-center gap-1">Doppler signal (Modified Limberg Score)</span>
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
            disabled={disabled}
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
