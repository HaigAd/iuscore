import type { DiseaseProfile, SegmentData, SegmentStatus } from "./segments"
import {
  classifyIbusActivity,
  getSegmentStatus,
  getVisualizationQuality,
  segmentSummary,
} from "./segments"

const severityOrder: SegmentStatus[] = ["uninvolved", "mild", "moderate", "severe"]

const DEFAULT_FINDINGS_TEXT =
  "Normal Intestinal Ultrasound"

type IbusClassificationResult = ReturnType<typeof classifyIbusActivity>

export interface IbusClassificationEntry {
  label: string
  classification: IbusClassificationResult
}

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
  const ucHighestSeverity =
    profile === "uc"
      ? segments.reduce<SegmentStatus>((acc, segment) => {
          const status = getSegmentStatus(segment, "uc")
          return severityOrder.indexOf(status) > severityOrder.indexOf(acc) ? status : acc
        }, "uninvolved")
      : "uninvolved"

  const ibusClassifications =
    profile === "cd"
      ? segments.map((segment) => ({
          label: segment.label,
          classification: classifyIbusActivity(segment),
        }))
      : []

  const highestStatusLabel =
    profile === "uc"
      ? ucHighestSeverity
      : deriveCrohnsStatusLabel(ibusClassifications)

  const autoImpression = buildAutoImpression({
    profile,
    ucHighestSeverity,
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

interface BuildAutoImpressionArgs extends BuildReportInsightsArgs {
  ucHighestSeverity: SegmentStatus
  ibusClassifications: IbusClassificationEntry[]
}

function buildAutoImpression({
  profile,
  ucHighestSeverity,
  segments,
  ibusClassifications,
}: BuildAutoImpressionArgs) {
  if (profile === "uc") {
    if (ucHighestSeverity === "uninvolved") {
      return "No sonographic evidence of active bowel inflammation."
    }

    const descriptorMap: Record<Exclude<SegmentStatus, "uninvolved">, string> = {
      mild: "mild inflammation",
      moderate: "moderate inflammation",
      severe: "severe inflammation",
    }

    const focusSegments = segments
      .filter((segment) => getSegmentStatus(segment, "uc") === ucHighestSeverity)
      .map((segment) => segment.label)

    const focusText = formatList(focusSegments)

    return `There is ${descriptorMap[ucHighestSeverity]} involving ${focusText}.`
  }

  if (!ibusClassifications.length) {
    return "IBUS-SAS inputs are incomplete for activity classification."
  }

  const sentences: string[] = []
  const activeSegments = ibusClassifications.filter(
    (entry) => entry.classification?.state === "active",
  )
  const remissionSegments = ibusClassifications.filter(
    (entry) => entry.classification?.state === "remission",
  )

  if (activeSegments.length) {
    sentences.push(
      `IBUS-SAS ≥25.2 identifies active disease in ${formatList(
        activeSegments.map((entry) => entry.label),
      )}.`,
    )
  } else if (remissionSegments.length === ibusClassifications.length) {
    sentences.push(
      "All assessed segments meet IBUS-SAS transmural remission criteria (BWT < 3 mm without ancillary findings).",
    )
  } else {
    sentences.push("IBUS-SAS findings align with inactive disease in the surveyed segments.")
  }

  const strictureSegments = segments.filter(
    (segment) => segment.luminalNarrowing || segment.prestenoticDilatation,
  )

  if (strictureSegments.length) {
    const strictureDetails = strictureSegments.map((segment) => {
      const parts: string[] = []
      if (segment.luminalNarrowing) parts.push("luminal narrowing")
      if (segment.prestenoticDilatation) {
        parts.push(
          segment.prestenoticDiameterMm
            ? `prestenotic dilatation ${segment.prestenoticDiameterMm.toFixed(1)} mm`
            : "prestenotic dilatation",
        )
      }
      return `${segment.label} (${parts.join(", ")})`
    })
    sentences.push(`There is stricturing disease involving the ${strictureDetails.join("; ")}.`)
  }

  return sentences.join(" ")
}

function deriveCrohnsStatusLabel(entries: IbusClassificationEntry[]) {
  if (!entries.length) return "inactive disease"
  const hasActive = entries.some((entry) => entry.classification?.state === "active")
  if (hasActive) return "active disease"
  const allRemission =
    entries.length > 0 &&
    entries.every((entry) => entry.classification?.state === "remission")
  if (allRemission) return "transmural remission"
  return "inactive disease"
}

function summarizeImagingQuality(segments: SegmentData[]) {
  const impairedSegments: string[] = []
  const notVisualizedSegments: string[] = []

  segments.forEach((segment) => {
    const quality = getVisualizationQuality(segment)
    if (quality === "impaired") {
      impairedSegments.push(segment.label)
    } else if (quality === "notVisualized") {
      notVisualizedSegments.push(segment.label)
    }
  })

  if (!impairedSegments.length && !notVisualizedSegments.length) {
    return "Good"
  }

  const notVisualizedText = notVisualizedSegments.length
    ? `${formatList(notVisualizedSegments.map((name) => `the ${name}`))} ${
        notVisualizedSegments.length === 1 ? "was" : "were"
      } not visualized`
    : ""

  if (impairedSegments.length) {
    const base = `Impaired in ${formatList(impairedSegments.map((name) => `the ${name}`))}`
    return notVisualizedText ? `${base}; ${notVisualizedText}` : base
  }

  return `Good but ${notVisualizedText}`
}

function formatList(items: string[]) {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  const head = items.slice(0, -1).join(", ")
  const tail = items[items.length - 1]
  return `${head}, and ${tail}`
}

export { DEFAULT_FINDINGS_TEXT }
