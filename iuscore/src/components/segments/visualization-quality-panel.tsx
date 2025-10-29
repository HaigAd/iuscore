import { useCallback, useEffect } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SegmentData, SegmentUpdate } from "@/lib/segments"

import { VisualizationImpairmentSelector } from "./visualization-impairment-selector"
import { DEFAULT_IMPAIRMENT_REASON, QUALITY_OPTIONS } from "./visualization-quality-constants"

interface VisualizationQualityPanelProps {
  segment: SegmentData
  visualizationQuality: "good" | "impaired" | "notVisualized"
  onChange: (updates: SegmentUpdate) => void
  onRemove?: () => void
  className?: string
}

export function VisualizationQualityPanel({
  segment,
  visualizationQuality,
  onChange,
  onRemove,
  className,
}: VisualizationQualityPanelProps) {
  const handleVisualizationQualityChange = useCallback(
    (value: "good" | "impaired" | "notVisualized") => {
      const currentReason = segment.visualizationImpairmentReason?.trim()

      if (value === "notVisualized") {
        const togglingOff = segment.notVisualised === true
        onChange({
          notVisualised: togglingOff ? undefined : true,
          visualizationOverride: undefined,
          visualizationImpairmentReason: togglingOff
            ? undefined
            : currentReason && currentReason.length
              ? currentReason
              : DEFAULT_IMPAIRMENT_REASON,
        })
        return
      }

      const updates: SegmentUpdate = {
        notVisualised: undefined,
        visualizationOverride: value,
      }

      if (value !== "impaired") {
        updates.visualizationImpairmentReason = undefined
      } else if (!currentReason?.length) {
        updates.visualizationImpairmentReason = DEFAULT_IMPAIRMENT_REASON
      }

      onChange(updates)
    },
    [onChange, segment.notVisualised, segment.visualizationImpairmentReason],
  )

  useEffect(() => {
    if (visualizationQuality !== "impaired" && visualizationQuality !== "notVisualized") {
      return
    }
    const trimmed = segment.visualizationImpairmentReason?.trim()
    if (!trimmed) {
      onChange({ visualizationImpairmentReason: DEFAULT_IMPAIRMENT_REASON })
    }
    // Intentionally keep dependencies minimal to avoid re-triggering resets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualizationQuality])

  return (
    <div className={cn("flex flex-col items-end gap-1.5", className)}>
      <div className="flex flex-col items-end gap-1 text-[11px] font-medium text-muted-foreground">
        <span className="text-[11px] font-medium text-muted-foreground">
          Visualization quality
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {QUALITY_OPTIONS.map((option) => {
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
      {visualizationQuality !== "good" && (
        <VisualizationImpairmentSelector
          value={segment.visualizationImpairmentReason ?? ""}
          onChange={(next) =>
            onChange({
              visualizationImpairmentReason: next.trim().length ? next : undefined,
            })
          }
          className="w-full max-w-[320px]"
        />
      )}
      {segment.isDynamic && onRemove && (
        <div className="flex flex-wrap items-center justify-end gap-2 text-right">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
