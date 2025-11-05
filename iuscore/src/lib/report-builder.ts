import type { DiseaseProfile, SegmentData, SegmentStatus } from "./segments"
import { classifyIbusActivity, segmentSummary } from "./segments"
import { buildVisualizationStatement, summarizeImagingQuality } from "./report/shared"
import { buildCdImpression, deriveCrohnsStatusLabel } from "./report/cd/report"
import { buildUcImpression, getUcHighestSeverity } from "./report/uc/report"
import type { IbusClassificationEntry } from "./report/types"

const DEFAULT_FINDINGS_TEXT = "Normal Intestinal Ultrasound"

export interface ReportInsights {
  ucHighestSeverity: SegmentStatus
  ibusClassifications: IbusClassificationEntry[]
  highestStatusLabel: string
  autoImpression: string
  segmentSummaries: string[]
  findingsText: string
  imagingQualitySummary: string
}

interface BuildReportInsightsArgs {
  profile: DiseaseProfile
  segments: SegmentData[]
}

interface BuildReportTextArgs {
  date: string
  indication: string
  imagingQuality: string
  findingsText: string
  impression: string
}

export function buildReportInsights({
  profile,
  segments,
}: BuildReportInsightsArgs): ReportInsights {
  const ucHighestSeverity: SegmentStatus =
    profile === "uc" ? getUcHighestSeverity(segments) : "uninvolved"

  const ibusClassifications: IbusClassificationEntry[] =
    profile === "cd"
      ? segments.map((segment) => ({
          label: segment.label,
          classification: classifyIbusActivity(segment),
        }))
      : []

  const highestStatusLabel =
    profile === "uc"
      ? ucHighestSeverity === "uninvolved"
        ? "inflammation unlikely"
        : "inflammation likely"
      : deriveCrohnsStatusLabel(ibusClassifications)

  const autoImpression = buildAutoImpression({
    profile,
    segments,
    ibusClassifications,
  })

  const { segmentSummaries, findingsText } = buildFindingsSummary({
    profile,
    segments,
  })

  const imagingQualitySummary = summarizeImagingQuality(segments)

  return {
    ucHighestSeverity,
    ibusClassifications,
    highestStatusLabel,
    autoImpression,
    segmentSummaries,
    findingsText,
    imagingQualitySummary,
  }
}

export function buildReportText({
  date,
  indication,
  imagingQuality,
  findingsText,
  impression,
}: BuildReportTextArgs) {
  return `Date: ${date}\nIndication: ${indication}\nImaging quality: ${imagingQuality}\n\nFindings\n${findingsText}\n\nImpression\n${impression}`
}

export function buildFindingsSummary({
  profile,
  segments,
}: BuildReportInsightsArgs) {
  const segmentSummaries = segments.map(
    (segment) => `• ${segmentSummary(segment, profile)}`,
  )

  return {
    segmentSummaries,
    findingsText: segmentSummaries.length
      ? segmentSummaries.join("\n")
      : DEFAULT_FINDINGS_TEXT,
  }
}

interface BuildAutoImpressionArgs {
  profile: DiseaseProfile
  segments: SegmentData[]
  ibusClassifications: IbusClassificationEntry[]
}

function buildAutoImpression({
  profile,
  segments,
  ibusClassifications,
}: BuildAutoImpressionArgs) {
  const visualizationStatement = buildVisualizationStatement(segments)
  if (profile === "uc") {
    return buildUcImpression({
      segments,
      visualizationStatement,
    })
  }

  return buildCdImpression({
    segments,
    ibusClassifications,
    visualizationStatement,
  })
}

export { DEFAULT_FINDINGS_TEXT }
