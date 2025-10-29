"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { SegmentData, SegmentUpdate } from "@/lib/segments"

interface SegmentLymphNodesControlProps {
  segment: SegmentData
  onChange: (updates: SegmentUpdate) => void
}

export function SegmentLymphNodesControl({
  segment,
  onChange,
}: SegmentLymphNodesControlProps) {
  return (
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
  )
}
