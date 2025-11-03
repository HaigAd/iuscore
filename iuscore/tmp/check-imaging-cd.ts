import { createSegmentInstance, defaultSegments, crohnsAdditionalSegments } from "../src/lib/segments"
import { buildReportInsights } from "../src/lib/report-builder"

let segments = [...defaultSegments, ...crohnsAdditionalSegments].map((segment) => createSegmentInstance(segment))

const insights1 = buildReportInsights({ profile: "cd", segments })
console.log("initial", insights1.imagingQualitySummary)

segments = segments.map((segment) => ({
  ...segment,
  notVisualised: undefined,
  visualizationOverride: "impaired" as const,
  visualizationImpairmentReason: "Gas",
}))
console.log("impaired", buildReportInsights({ profile: "cd", segments }).imagingQualitySummary)

segments = segments.map((segment) => ({
  ...segment,
  notVisualised: true,
  visualizationOverride: undefined,
  visualizationImpairmentReason: "Gas",
}))
console.log("not visualized", buildReportInsights({ profile: "cd", segments }).imagingQualitySummary)
