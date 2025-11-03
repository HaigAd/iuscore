import { createSegmentInstance, defaultSegments } from "../src/lib/segments"
import { buildReportInsights } from "../src/lib/report-builder"

let segments = defaultSegments.map((segment) => createSegmentInstance(segment))

const visibleSegments = segments.filter((segment) => !segment.isSmallBowel)

const insights1 = buildReportInsights({ profile: "uc", segments: visibleSegments })
console.log("initial quality", insights1.imagingQualitySummary)

segments = segments.map((segment) => {
  if (segment.notVisualised) {
    return segment
  }
  return {
    ...segment,
    notVisualised: undefined,
    visualizationOverride: "impaired" as const,
    visualizationImpairmentReason: "Body habitus",
  }
})

const visibleSegments2 = segments.filter((segment) => !segment.isSmallBowel)
const insights2 = buildReportInsights({ profile: "uc", segments: visibleSegments2 })
console.log("after impaired", insights2.imagingQualitySummary)

segments = segments.map((segment) => ({
  ...segment,
  notVisualised: true,
  visualizationOverride: undefined,
  visualizationImpairmentReason: "Body habitus",
}))
const visibleSegments3 = segments.filter((segment) => !segment.isSmallBowel)
const insights3 = buildReportInsights({ profile: "uc", segments: visibleSegments3 })
console.log("after not visualized", insights3.imagingQualitySummary)
