"use client"

import { useEffect, useMemo, useRef } from "react"
import { RotateCcw } from "lucide-react"

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
  getIbusScore,
  getMilanScore,
  getSegmentStatus,
} from "@/lib/segments"
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
      })
    } else {
      onChange({ bowelWallThickness: value, bwtUncertain: undefined })
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
          <p className={cn("mt-1 text-xs font-medium", descriptorTone)}>{statusDescriptor}</p>
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
