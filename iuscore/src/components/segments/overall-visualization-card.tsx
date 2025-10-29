import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { VisualizationQuality } from "@/lib/segments"
import { cn } from "@/lib/utils"

import { VisualizationImpairmentSelector } from "./visualization-impairment-selector"
import { QUALITY_OPTIONS } from "./visualization-quality-constants"

interface OverallVisualizationCardProps {
  quality?: VisualizationQuality
  reason: string
  onQualityChange: (quality: VisualizationQuality) => void
  onReasonChange: (reason: string) => void
  className?: string
}

export function OverallVisualizationCard({
  quality,
  reason,
  onQualityChange,
  onReasonChange,
  className,
}: OverallVisualizationCardProps) {
  return (
    <Card
      className={cn(
        "border-dashed border-border/60 bg-white/80 shadow-[0_10px_30px_rgba(148,163,184,0.15)] backdrop-blur-sm",
        className,
      )}
    >
      <CardHeader className="space-y-1.5 px-5 pb-2 pt-4">
        <CardTitle className="text-base font-semibold tracking-tight text-slate-900">
          Overall visualization quality (optional)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Apply a global imaging quality assessment to all segments.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-end gap-2 px-5 pb-5">
        <div className="flex flex-col items-end gap-1 text-[11px] font-medium text-muted-foreground">
          <span className="text-[11px] font-medium text-muted-foreground">
            Visualization quality
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {QUALITY_OPTIONS.map((option) => {
              const isActive = quality === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onQualityChange(option.value)}
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
        {(quality === "impaired" || quality === "notVisualized") && (
          <VisualizationImpairmentSelector
            value={reason}
            onChange={onReasonChange}
            className="w-full max-w-[320px]"
          />
        )}
      </CardContent>
    </Card>
  )
}
