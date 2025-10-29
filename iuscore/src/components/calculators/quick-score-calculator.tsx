"use client"

import { useMemo, useState } from "react"
import { Droplet, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DiseaseProfile, SegmentData, SegmentUpdate } from "@/lib/segments"
import { cn } from "@/lib/utils"
import {
  buildScoreSummary,
  createQuickCalculatorSegment,
} from "@/lib/quick-calculator"

const crohnsStratificationOptions = [
  { value: "normal" as SegmentData["stratification"], label: "Normal" },
  { value: "focal" as SegmentData["stratification"], label: "Focal loss" },
  { value: "extensive" as SegmentData["stratification"], label: "Extensive loss" },
  { value: "uncertain" as const, label: "Uncertain" },
]

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

  const toneStyles = {
    muted: {
      container: "bg-white text-slate-600 border-slate-200",
      label: "text-slate-500",
      description: "text-slate-600",
      score: "text-slate-900",
    },
    positive: {
      container: "bg-emerald-600 text-white border-emerald-500",
      label: "text-emerald-100/80",
      description: "text-white",
      score: "text-white",
    },
    caution: {
      container: "bg-amber-500 text-white border-amber-500",
      label: "text-amber-100/80",
      description: "text-white",
      score: "text-white",
    },
    negative: {
      container: "bg-rose-600 text-white border-rose-500",
      label: "text-rose-100/80",
      description: "text-white",
      score: "text-white",
    },
  } as const

  const toneStyle = toneStyles[scoreSummary.tone]

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
        <div className="flex flex-wrap gap-3">
          {(["uc", "cd"] as const).map((profile) => (
            <Button
              key={profile}
              type="button"
              variant={activeProfile === profile ? "default" : "outline"}
              className={cn(
                "rounded-full px-6",
                activeProfile === profile &&
                  (profile === "uc" ? "bg-emerald-500 text-white" : "bg-sky-600 text-white"),
              )}
              onClick={() => setActiveProfile(profile)}
            >
              {profile === "uc" ? "Milan (UC)" : "IBUS-SAS (CD)"}
            </Button>
          ))}
        </div>
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

        {activeProfile === "uc" ? (
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
                    ? (activeSegment.dopplerGrade ?? 0) >= 1
                    : (activeSegment.dopplerGrade ?? 0) === 0
                return (
                  <Button
                    key={option.key}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() =>
                      updateSegment({
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
        ) : (
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
                  variant={activeSegment.dopplerGrade === grade ? "default" : "outline"}
                  className={cn(
                    "gap-2 rounded-full px-4",
                    activeSegment.dopplerGrade === grade && "bg-primary text-primary-foreground",
                  )}
                  onClick={() =>
                    updateSegment({
                      dopplerGrade:
                        activeSegment.dopplerGrade === grade
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
        )}

        {activeProfile === "cd" && (
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">
              Bowel wall stratification
            </Label>
            <div className="flex flex-wrap gap-2">
              {crohnsStratificationOptions.map((option) => {
                const isUncertain = option.value === "uncertain"
                const isActive = isUncertain
                  ? activeSegment.stratificationUncertain === true && !activeSegment.stratification
                  : activeSegment.stratification === option.value &&
                    !activeSegment.stratificationUncertain
                return (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() =>
                      updateSegment(
                        isUncertain
                          ? { stratification: undefined, stratificationUncertain: true }
                          : {
                              stratification: option.value,
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
          </section>
        )}

        {activeProfile === "cd" && (
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
                const currentState = activeSegment.fatWrapping
                  ? "active"
                  : activeSegment.fatWrappingUncertain
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
                        updateSegment({ fatWrapping: true, fatWrappingUncertain: undefined })
                      } else if (option.key === "none") {
                        updateSegment({ fatWrapping: false, fatWrappingUncertain: undefined })
                      } else {
                        updateSegment({ fatWrapping: undefined, fatWrappingUncertain: true })
                      }
                    }}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </section>
        )}
      </CardContent>
      <CardFooter className="border-t border-slate-200 bg-slate-50 p-0 items-stretch">
        <div
          className={cn(
            "flex w-full flex-col gap-2 border px-6 py-5 transition-colors rounded-bl-2xl rounded-br-2xl",
            toneStyle.container,
          )}
        >
          <span className={cn("text-xs uppercase tracking-wide", toneStyle.label)}>
            {scoreSummary.label}
          </span>
          <span className={cn("text-3xl font-semibold leading-none", toneStyle.score)}>
            {scoreSummary.value ?? "—"}
          </span>
          <p className={cn("text-sm font-medium", toneStyle.description)}>
            {scoreSummary.description}
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
