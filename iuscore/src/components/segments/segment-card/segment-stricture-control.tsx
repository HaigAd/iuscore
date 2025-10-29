"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DiseaseProfile, SegmentData, SegmentUpdate } from "@/lib/segments"

interface SegmentStrictureControlProps {
  profile: DiseaseProfile
  segment: SegmentData
  onChange: (updates: SegmentUpdate) => void
}

export function SegmentStrictureControl({
  profile,
  segment,
  onChange,
}: SegmentStrictureControlProps) {
  if (!(segment.isSmallBowel && profile === "cd")) {
    return null
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        Stricture assessment
      </Label>
      <div className="space-y-3 rounded-xl border border-dashed border-border/70 p-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Luminal narrowing</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: false, label: "Absent" },
              { value: true, label: "Present" },
            ].map((option) => {
              const current = !!segment.luminalNarrowing
              const isActive = option.value ? current : !current
              return (
                <Button
                  key={option.label}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  className="flex-1 rounded-full"
                  onClick={() => {
                    if (option.value) {
                      onChange({ luminalNarrowing: true })
                    } else {
                      onChange({
                        luminalNarrowing: undefined,
                        prestenoticDilatation: undefined,
                        prestenoticDiameterMm: undefined,
                      })
                    }
                  }}
                >
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>
        {segment.luminalNarrowing && (
          <div className="space-y-2 rounded-lg border border-border/70 p-3">
            <p className="text-sm font-medium text-muted-foreground">Prestenotic dilatation</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: false, label: "Absent" },
                { value: true, label: "Present" },
              ].map((option) => {
                const current = !!segment.prestenoticDilatation
                const isActive = option.value ? current : !current
                return (
                  <Button
                    key={option.label}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className="flex-1 rounded-full"
                    onClick={() => {
                      if (option.value) {
                        onChange({ prestenoticDilatation: true })
                      } else {
                        onChange({
                          prestenoticDilatation: undefined,
                          prestenoticDiameterMm: undefined,
                        })
                      }
                    }}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
            {segment.prestenoticDilatation && (
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step=".1"
                placeholder="Diameter (mm)"
                value={segment.prestenoticDiameterMm ?? ""}
                onChange={(event) =>
                  onChange({
                    prestenoticDiameterMm:
                      event.target.value === "" ? undefined : Number(event.target.value),
                  })
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
