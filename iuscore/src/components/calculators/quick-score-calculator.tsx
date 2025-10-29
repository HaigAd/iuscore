"use client"

import { useMemo, useState } from "react"
import { RotateCcw } from "lucide-react"

import { QuickScoreCrohnsControls } from "@/components/calculators/quick-score/quick-score-crohns-controls"
import { QuickScoreDopplerSelector } from "@/components/calculators/quick-score/quick-score-doppler-selector"
import { QuickScoreProfileToggle } from "@/components/calculators/quick-score/quick-score-profile-toggle"
import { QuickScoreSummary } from "@/components/calculators/quick-score/quick-score-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DiseaseProfile, SegmentData, SegmentUpdate } from "@/lib/segments"
import { cn } from "@/lib/utils"
import {
  buildScoreSummary,
  createQuickCalculatorSegment,
} from "@/lib/quick-calculator"

export interface QuickScoreCalculatorProps {
  className?: string
}

export function QuickScoreCalculator({ className }: QuickScoreCalculatorProps) {
  const [activeProfile, setActiveProfile] = useState<DiseaseProfile>("uc")
  const [segments, setSegments] = useState<Record<DiseaseProfile, SegmentData>>({
    uc: createQuickCalculatorSegment("uc"),
    cd: createQuickCalculatorSegment("cd"),
  })

  const activeSegment = segments[activeProfile]

  const updateSegment = (updates: SegmentUpdate) => {
    setSegments((current) => ({
      ...current,
      [activeProfile]: {
        ...current[activeProfile],
        ...updates,
      },
    }))
  }

  const resetActiveSegment = () => {
    setSegments((current) => ({
      ...current,
      [activeProfile]: createQuickCalculatorSegment(activeProfile),
    }))
  }

  const scoreSummary = useMemo(
    () => buildScoreSummary(activeSegment, activeProfile),
    [activeSegment, activeProfile],
  )

  return (
    <Card
      className={cn(
        "border-success/60 bg-white shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-colors",
        className,
      )}
    >
      <CardHeader className="space-y-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Quick score calculator
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Lightweight calculator for Milan or IBUS-SAS scoring.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={resetActiveSegment}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <QuickScoreProfileToggle
          activeProfile={activeProfile}
          onProfileChange={setActiveProfile}
        />
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <section className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">
            BWT (mm)
          </Label>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step=".1"
            placeholder="Enter measurement"
            value={activeSegment.bowelWallThickness ?? ""}
            onChange={(event) =>
              updateSegment({
                bowelWallThickness:
                  event.target.value === "" ? undefined : Number(event.target.value),
                bwtUncertain: undefined,
              })
            }
            className="h-10 max-w-[200px]"
          />
        </section>

        <QuickScoreDopplerSelector
          profile={activeProfile}
          segment={activeSegment}
          onChange={updateSegment}
        />

        {activeProfile === "cd" && (
          <QuickScoreCrohnsControls segment={activeSegment} onChange={updateSegment} />
        )}
      </CardContent>
      <QuickScoreSummary summary={scoreSummary} />
    </Card>
  )
}
