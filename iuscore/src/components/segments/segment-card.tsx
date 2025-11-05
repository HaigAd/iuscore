"use client"

import { useEffect, useMemo, useRef } from "react"
import { Info, RotateCcw } from "lucide-react"

import { ContextPopover } from "@/components/context/context-popover"
import { SegmentDopplerControl } from "@/components/segments/segment-card/segment-doppler-control"
import { SegmentFatControl } from "@/components/segments/segment-card/segment-fat-control"
import { SegmentLymphNodesControl } from "@/components/segments/segment-card/segment-lymph-nodes-control"
import { SegmentNotesSection } from "@/components/segments/segment-card/segment-notes-section"
import { SegmentStratificationControl } from "@/components/segments/segment-card/segment-stratification-control"
import { SegmentStrictureControl } from "@/components/segments/segment-card/segment-stricture-control"
import { VisualizationQualityPanel } from "@/components/segments/visualization-quality-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type {
  DiseaseProfile,
  SegmentData,
  SegmentStatus,
  SegmentUpdate,
} from "@/lib/segments"
import {
  classifyIbusActivity,
  classifyRectalActivity,
  getIbusScore,
  getMilanScore,
  getSegmentStatus,
} from "@/lib/segments"
import { buildSegmentIndicatorContext } from "@/lib/context/segment-indicator-context"
import { spell } from "@/lib/localization"
import { cn } from "@/lib/utils"

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
  const rectalActivity =
    profile === "uc" && segment.id === "rectum"
      ? classifyRectalActivity(segment)
      : undefined
  useEffect(() => {
    if (segment.id !== "rectum") return
    const hasValidRectalBwt =
      !segment.notVisualised && !segment.bwtUncertain && segment.bowelWallThickness !== undefined
    if (hasValidRectalBwt) {
      if (!segment.rectalBwtApproach) {
        onChange({ rectalBwtApproach: "transabdominal" })
      }
      return
    }
    if (segment.rectalBwtApproach) {
      onChange({ rectalBwtApproach: undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    segment.id,
    segment.notVisualised,
    segment.bwtUncertain,
    segment.bowelWallThickness,
    segment.rectalBwtApproach,
  ])
  const showRectalApproach =
    segment.id === "rectum" &&
    !segment.notVisualised &&
    !segment.bwtUncertain &&
    segment.bowelWallThickness !== undefined
  const statusDescriptor = useMemo(() => {
    if (segment.notVisualised) {
      return `Segment not ${spell("visualized")}`
    }

    if (profile === "uc") {
      if (segment.id === "rectum") {
        if (segment.bwtUncertain) {
          return "Rectal BWT measurement uncertain."
        }
        const bwt = segment.bowelWallThickness
        if (bwt === undefined) {
          return "Enter BWT to assess rectal inflammation."
        }
        const interpretation =
          rectalActivity === "absent"
            ? "Inflammation unlikely."
            : rectalActivity === "possible"
              ? "Inflammation possible."
            : rectalActivity === "present"
              ? "Inflammation likely."
              : "Inflammation indeterminate."
        return `Rectal BWT ${bwt.toFixed(1)} mm · ${interpretation}`
      }
      if (milanScore !== undefined) {
        const likelihoodText =
          status === "uninvolved" ? "inflammation unlikely" : "inflammation likely"
        return `Milan score ${milanScore.toFixed(1)} · ${likelihoodText}`
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
  }, [
    segment.notVisualised,
    profile,
    milanScore,
    status,
    ibusScore,
    ibusClassification,
    segment.id,
    segment.bowelWallThickness,
    segment.bwtUncertain,
    segment.dopplerGrade,
    rectalActivity,
  ])

  const descriptorTone = useMemo(() => {
    if (segment.notVisualised) {
      return "text-slate-500"
    }
    if (profile === "uc" && segment.id === "rectum") {
      if (segment.bwtUncertain || segment.bowelWallThickness === undefined) {
        return "text-slate-500"
      }
      if (rectalActivity === "absent") {
        return "text-emerald-600"
      }
      if (rectalActivity === "present") {
        return "text-rose-700"
      }
      if (rectalActivity === "possible") {
        return "text-amber-600"
      }
      return "text-slate-500"
    }
    if (profile === "uc" && segment.id !== "rectum" && milanScore !== undefined) {
      return status === "uninvolved" ? "text-sky-600" : "text-rose-700"
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
  }, [
    segment.notVisualised,
    statusDescriptor,
    profile,
    segment.id,
    segment.bowelWallThickness,
    segment.bwtUncertain,
    milanScore,
    status,
    rectalActivity,
  ])

  const indicatorContext = useMemo(
    () =>
      buildSegmentIndicatorContext({
        segment,
        profile,
        indicatorText: statusDescriptor,
        milanScore,
        ibusScore,
        ibusState: ibusClassification?.state,
      }),
    [
      segment,
      profile,
      statusDescriptor,
      status,
      milanScore,
      ibusScore,
      ibusClassification?.state,
    ],
  )

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
        visualizationImpairmentReason: undefined,
        rectalBwtApproach: undefined,
      })
    } else {
      const updates: SegmentUpdate = {
        bowelWallThickness: value,
        bwtUncertain: undefined,
      }
      if (
        segment.id === "rectum" &&
        !segment.rectalBwtApproach &&
        !segment.notVisualised &&
        !segment.bwtUncertain
      ) {
        updates.rectalBwtApproach = "transabdominal"
      }
      onChange(updates)
    }
  }

  const resetSegment = () => {
    handleBwtChange(undefined)
    onChange({
      notVisualised: undefined,
      visualizationOverride: undefined,
      visualizationImpairmentReason: undefined,
    })
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
          <ContextPopover
            content={indicatorContext}
            trigger={
              <button
                type="button"
                className={cn(
                  "mt-1 inline-flex items-center gap-1 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  descriptorTone,
                )}
              >
                <span>{statusDescriptor}</span>
                <Info aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="sr-only">View indicator context</span>
              </button>
            }
          />
        </div>
        <VisualizationQualityPanel
          segment={segment}
          visualizationQuality={visualizationQuality}
          onChange={onChange}
          onRemove={onRemove}
        />
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
          {showRectalApproach && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {[
                { value: "transabdominal" as const, label: "Transabdominal" },
                { value: "transperineal" as const, label: "Transperineal" },
              ].map((option) => {
                const isSelected = segment.rectalBwtApproach === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange({ rectalBwtApproach: option.value })}
                    className={cn(
                      "h-7 rounded-full px-3 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isSelected
                        ? "border-transparent bg-sky-600 text-white shadow-sm"
                        : "border border-slate-200/80 bg-white/80 text-muted-foreground hover:border-slate-300 hover:bg-slate-100",
                    )}
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {expanded && !segment.notVisualised && (
          <div className="space-y-4">
            <SegmentDopplerControl segment={segment} onChange={onChange} />

            <section className="grid gap-3 md:grid-cols-3">
              <SegmentStratificationControl
                profile={profile}
                segment={segment}
                onChange={onChange}
              />
              <SegmentFatControl profile={profile} segment={segment} onChange={onChange} />
              <SegmentLymphNodesControl segment={segment} onChange={onChange} />
            </section>

            <SegmentStrictureControl profile={profile} segment={segment} onChange={onChange} />

            <SegmentNotesSection segment={segment} onChange={onChange} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
