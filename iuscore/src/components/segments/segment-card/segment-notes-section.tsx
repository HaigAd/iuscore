"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SegmentData, SegmentUpdate } from "@/lib/segments"

interface SegmentNotesSectionProps {
  segment: SegmentData
  onChange: (updates: SegmentUpdate) => void
}

export function SegmentNotesSection({ segment, onChange }: SegmentNotesSectionProps) {
  return (
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
  )
}
