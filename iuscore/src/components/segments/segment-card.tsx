"use client"

import { useEffect, useMemo, useRef } from "react"
import { Droplet, RotateCcw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  DiseaseProfile,
  SegmentData,
  SegmentStatus,
  SegmentUpdate,
} from "@/lib/segments"
import {
  classifyIbusActivity,
  getIbusScore,
  getMilanScore,
  getSegmentStatus,
} from "@/lib/segments"
import { cn } from "@/lib/utils"

type StratificationValue = Exclude<SegmentData["stratification"], undefined>

const stratificationOptions: Record<DiseaseProfile, { value: StratificationValue | "uncertain"; label: string }[]> = {
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

interface SegmentCardProps {
  segment: SegmentData
  profile: DiseaseProfile
  tabOrder: number
  onChange: (updates: SegmentUpdate) => void
  onRemove?: () => void
}

export function SegmentCard({ segment, profile, tabOrder, onChange, onRemove }: SegmentCardProps) {
  const status: SegmentStatus = useMemo(
    () => getSegmentStatus(segment, profile),
    [segment, profile],
  )
  const expanded =
    (!segment.notVisualised &&
      (segment.bowelWallThickness !== undefined || segment.bwtUncertain)) ||
    segment.notVisualised === true
  const milanScore = profile === "uc" ? getMilanScore(segment) : undefined
  const ibusScore = profile === "cd" ? getIbusScore(segment) : undefined
  const ibusClassification = profile === "cd" ? classifyIbusActivity(segment) : undefined
  const lengthInputRef = useRef<HTMLInputElement | null>(null)
  const statusDescriptor = useMemo(() => {
    if (segment.notVisualised) {
      return "Segment not visualized"
    }

    if (profile === "uc") {
      if (milanScore !== undefined) {
        const severityText = status === "uninvolved" ? "likely remission" : "likely active inflammation"
        return `Milan score ${milanScore.toFixed(1)} · ${severityText}`
      }
      return status === "uninvolved" ? "Segment normal" : "Awaiting Milan inputs"
    }

    if (ibusScore !== undefined && ibusClassification?.state) {
      const ibusText =
        ibusClassification.state === "remission"
          ? "transmural remission"
          : ibusClassification.state === "inactive"
            ? "consistent with inactive disease"
            : "active inflammation"
      return `IBUS-SAS ${ibusScore.toFixed(1)} · ${ibusText}`
    }

    if (ibusScore !== undefined) {
      return `IBUS-SAS ${ibusScore.toFixed(1)}`
    }

    return status === "uninvolved" ? "Segment normal" : "Awaiting IBUS-SAS inputs"
  }, [segment.notVisualised, profile, milanScore, status, ibusScore, ibusClassification])

  const descriptorTone = useMemo(() => {
    if (segment.notVisualised) {
      return "text-slate-500"
    }
    if (
      statusDescriptor.toLowerCase().includes("segment normal") ||
      statusDescriptor.toLowerCase().includes("remission")
    ) {
      return "text-sky-600"
    }
    if (
      statusDescriptor.toLowerCase().includes("inactive") ||
      statusDescriptor.toLowerCase().includes("consistent with inactive")
    ) {
      return "text-emerald-600"
    }
    return "text-rose-700"
  }, [segment.notVisualised, statusDescriptor])

  const visualizationQuality = useMemo(() => {
    if (segment.notVisualised) {
      return "notVisualized" as const
    }

    const override = segment.visualizationOverride
    const derivedImpairment =
      segment.bwtUncertain ||
      segment.dopplerUncertain ||
      segment.stratificationUncertain ||
      segment.fatWrappingUncertain

    return (override ?? (derivedImpairment ? "impaired" : "good")) as
      | "good"
      | "impaired"
      | "notVisualized"
  }, [
    segment.notVisualised,
    segment.visualizationOverride,
    segment.bwtUncertain,
    segment.dopplerUncertain,
    segment.stratificationUncertain,
    segment.fatWrappingUncertain,
  ])

  const handleVisualizationQualityChange = (
    value: "good" | "impaired" | "notVisualized",
  ) => {
    if (value === "notVisualized") {
      onChange({
        notVisualised: segment.notVisualised ? undefined : true,
      })
      return
    }

    onChange({
      notVisualised: undefined,
      visualizationOverride: value,
    })
  }

  const handleBwtChange = (value?: number) => {
    if (segment.notVisualised) {
      onChange({ notVisualised: undefined })
    }
    if (value === undefined) {
      onChange({
        bowelWallThickness: undefined,
        bwtUncertain: undefined,
        dopplerGrade: undefined,
        dopplerUncertain: undefined,
        stratification: undefined,
        stratificationUncertain: undefined,
        fatWrapping: undefined,
        fatWrappingUncertain: undefined,
        lymphNodes: undefined,
        notes: undefined,
        lengthCm: undefined,
        luminalNarrowing: undefined,
        prestenoticDilatation: undefined,
        prestenoticDiameterMm: undefined,
        visualizationOverride: undefined,
      })
    } else {
      onChange({ bowelWallThickness: value, bwtUncertain: undefined })
    }
  }

  const resetSegment = () => {
    handleBwtChange(undefined)
    onChange({ notVisualised: undefined, visualizationOverride: undefined })
  }

  useEffect(() => {
    if (!expanded) {
      return
    }

    if (segment.dopplerGrade === undefined && !segment.dopplerUncertain) {
      onChange({ dopplerGrade: 0 })
    }
    if (!segment.stratification && !segment.stratificationUncertain) {
      onChange({ stratification: "normal" })
    }
    if (segment.fatWrapping === undefined && !segment.fatWrappingUncertain) {
      onChange({ fatWrapping: false })
    }
    if (segment.lymphNodes === undefined) {
      onChange({ lymphNodes: false })
    }
    // Intentionally ignore onChange to avoid reset loops; parent recreates handler every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expanded,
    segment.dopplerGrade,
    segment.dopplerUncertain,
    segment.stratification,
    segment.stratificationUncertain,
    segment.fatWrapping,
    segment.fatWrappingUncertain,
    segment.lymphNodes,
  ])

  return (
    <Card
      className={cn(
        "transition-colors",
        segment.notVisualised
          ? "border-dashed border-zinc-400 bg-zinc-100 text-zinc-500"
          : expanded
            ? "border-success/60 bg-success-muted/70 shadow-[0_10px_40px_rgba(34,197,94,0.15)]"
            : "border-border/60 bg-white",
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-start justify-between space-y-0",
          expanded ? "px-6 pt-6 pb-2" : "px-4 pt-4 pb-1",
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold tracking-tight">
              {segment.label}
            </CardTitle>
            {expanded && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={resetSegment}
                aria-label="Reset segment"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className={cn("mt-1 text-xs font-medium", descriptorTone)}>{statusDescriptor}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col items-end gap-1 rounded-xl bg-white/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            <span className="text-[11px] font-medium text-muted-foreground/80">
              Visualization quality
            </span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {(
                [
                  {
                    value: "good" as const,
                    label: "Good",
                    activeClass: "bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50",
                  },
                  {
                    value: "impaired" as const,
                    label: "Impaired",
                    activeClass: "bg-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-400/50",
                  },
                  {
                    value: "notVisualized" as const,
                    label: "Not visualized",
                    activeClass: "bg-rose-500 text-white shadow-sm ring-1 ring-rose-500/50",
                  },
                ] satisfies {
                  value: "good" | "impaired" | "notVisualized"
                  label: string
                  activeClass: string
                }[]
              ).map((option) => {
                const isActive = visualizationQuality === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleVisualizationQualityChange(option.value)}
                    className={cn(
                      "h-7 rounded-full px-3 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive
                        ? option.activeClass
                        : "border border-slate-200/80 bg-white/80 text-muted-foreground hover:border-slate-300 hover:bg-slate-100",
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-right">
            {segment.isDynamic && onRemove && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          segment.notVisualised ? "space-y-3 px-4 py-3" : expanded ? "space-y-4 px-6 pt-3 pb-5" : "px-4 pt-0 pb-2",
        )}
      >
        <section className={cn("space-y-1", !expanded && "pt-0", segment.notVisualised && "hidden")}>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/80">
              BWT (mm)
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step=".1"
                placeholder="Enter measurement"
                disabled={segment.bwtUncertain || segment.notVisualised}
                value={segment.bowelWallThickness ?? ""}
              onChange={(event) => {
                const val = event.target.value
                handleBwtChange(val === "" ? undefined : Number(val))
              }}
              className="h-8 w-full max-w-[200px] px-2 text-sm"
              tabIndex={tabOrder}
              onKeyDown={(event) => {
                if (
                  event.key === "Tab" &&
                  !event.shiftKey &&
                  profile === "cd" &&
                  segment.isSmallBowel &&
                  !!segment.bowelWallThickness &&
                  lengthInputRef.current
                ) {
                  event.preventDefault()
                  lengthInputRef.current.focus()
                }
              }}
            />
            {profile === "cd" && segment.isSmallBowel && (
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step=".1"
                placeholder="Length (cm)"
                value={segment.lengthCm ?? ""}
                onChange={(event) =>
                  onChange({
                    lengthCm: event.target.value === "" ? undefined : Number(event.target.value),
                  })
                }
                className="h-8 w-full max-w-[160px] px-2 text-sm"
                tabIndex={segment.bowelWallThickness ? tabOrder + 100 : -1}
                ref={lengthInputRef}
              />
            )}
          </div>
        </section>

        {expanded && !segment.notVisualised && (
          <div className="space-y-4">
            <section className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                <span className="flex items-center gap-1">
                  Doppler signal (Modified Limberg Score)
                </span>
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
                    disabled={segment.dopplerUncertain || segment.notVisualised}
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

            <section className="grid gap-3 md:grid-cols-3">
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
              <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Mesenteric fat
                </Label>
                <div className="flex flex-wrap gap-2">
                  {(
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
                  ).map((option) => {
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
              <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Mesenteric lymph nodes
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: false, label: "Absent" },
                    { value: true, label: "Present" },
                  ].map((option) => {
                    const isActive = segment.lymphNodes === option.value
                    return (
                      <Button
                        key={option.label}
                        type="button"
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        className="flex-1 rounded-full"
                        disabled={segment.notVisualised}
                        onClick={() =>
                          onChange({
                            lymphNodes: isActive ? undefined : option.value,
                          })
                        }
                      >
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </section>

            {segment.isSmallBowel && profile === "cd" && (
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
                      <p className="text-sm font-medium text-muted-foreground">
                        Prestenotic dilatation
                      </p>
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
            )}

            <section className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Notes (optional)
              </Label>
              <Textarea
                placeholder="Luminal distension, targeted comments, etc."
                value={segment.notes ?? ""}
                onChange={(event) =>
                  onChange({
                    notes: event.target.value.trim().length ? event.target.value : undefined,
                  })
                }
                className="min-h-[64px]"
              />
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
