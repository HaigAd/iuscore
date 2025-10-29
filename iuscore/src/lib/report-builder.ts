import type { DiseaseProfile, SegmentData, SegmentStatus } from "./segments"
import {
  ABSENT_VISUALIZATION_REASON,
  classifyIbusActivity,
  getSegmentStatus,
  getVisualizationQuality,
  segmentSummary,
} from "./segments"

const severityOrder: SegmentStatus[] = ["uninvolved", "mild", "moderate", "severe"]
const ABSENT_REASON_LOWER = ABSENT_VISUALIZATION_REASON.toLowerCase()

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
  const visualizationStatement = buildVisualizationStatement(segments)
  if (profile === "uc") {
    if (ucHighestSeverity === "uninvolved") {
      return composeImpression(
        "No sonographic evidence of active bowel inflammation.",
        visualizationStatement,
      )
    }

    const descriptorMap: Record<Exclude<SegmentStatus, "uninvolved">, string> = {
      mild: "mild inflammation",
      moderate: "moderate inflammation",
      severe: "severe inflammation",
    }

    const focusSegments = segments
      .filter((segment) => getSegmentStatus(segment, "uc") === ucHighestSeverity)
      .map((segment) => segment.label.toLowerCase())

    const focusText = formatList(focusSegments)

    return composeImpression(
      `There is ${descriptorMap[ucHighestSeverity]} involving ${focusText}.`,
      visualizationStatement,
    )
  }

  if (!ibusClassifications.length) {
    return composeImpression(
      "IBUS-SAS inputs are incomplete for activity classification.",
      visualizationStatement,
    )
  }

  const activeSegments = ibusClassifications
    .filter((entry) => entry.classification?.state === "active")
    .map((entry) => entry.label.toLowerCase())
  const highestScore = ibusClassifications.reduce((max, entry) => {
    const score = entry.classification?.score ?? 0
    return score > max ? score : max
  }, 0)
  const highestLabeledSegments = ibusClassifications
    .filter((entry) => (entry.classification?.score ?? 0) === highestScore && highestScore > 0)
    .map((entry) => entry.label.toLowerCase())

  const activitySegments =
    activeSegments.length > 0
      ? activeSegments
      : highestLabeledSegments.length > 0
        ? highestLabeledSegments
        : ["the surveyed segments"]

  const hasLikelyActiveDisease = highestScore >= 25.2 || activeSegments.length > 0
  const activitySentence = hasLikelyActiveDisease
    ? `There is likely active inflammation in ${formatList(activitySegments)}, with the highest IBUS-SAS score ${highestScore.toFixed(1)}.`
    : `Active inflammation is unlikely based on IBUS-SAS, with the highest score ${highestScore.toFixed(1)} among the surveyed segments.`
  const interpretiveNote =
    "(An IBUS-SAS score ≥25.2 suggests active transmural disease.)"

  const sentences: string[] = [activitySentence, interpretiveNote]

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
      return `${segment.label.toLowerCase()} (${parts.join(", ")})`
    })
    sentences.push(`There is stricturing disease involving the ${strictureDetails.join("; ")}.`)
  }

  return composeImpression(sentences.join(" "), visualizationStatement)
}

interface VisualizationAccumulator {
  good: number
  impaired: number
  notVisualized: number
  reasons: Set<string>
}

function hasAbsentVisualizationReason(segment: SegmentData) {
  const reason = segment.visualizationImpairmentReason?.trim()
  if (!reason) return false
  return reason.toLowerCase() === ABSENT_REASON_LOWER
}

function buildVisualizationStatement(segments: SegmentData[]) {
  const qualityCounts = segments.reduce<VisualizationAccumulator>(
    (acc, segment) => {
      if (hasAbsentVisualizationReason(segment)) {
        return acc
      }
      const quality = getVisualizationQuality(segment)
      acc[quality] += 1
      const reason = segment.visualizationImpairmentReason?.trim()
      if (quality !== "good" && reason) {
        acc.reasons.add(reason)
      }
      return acc
    },
    {
      good: 0,
      impaired: 0,
      notVisualized: 0,
      reasons: new Set<string>(),
    },
  )

  const hasImpaired = qualityCounts.impaired > 0
  const hasNotVisualized = qualityCounts.notVisualized > 0

  if (!hasImpaired && !hasNotVisualized) {
    return "Visualization was satisfactory."
  }

  const impairedLabels = segments
    .filter(
      (segment) =>
        !hasAbsentVisualizationReason(segment) &&
        getVisualizationQuality(segment) === "impaired",
    )
    .map((segment) => `the ${segment.label.toLowerCase()}`)
  const notVisualizedLabels = segments
    .filter(
      (segment) =>
        !hasAbsentVisualizationReason(segment) &&
        getVisualizationQuality(segment) === "notVisualized",
    )
    .map((segment) => `the ${segment.label.toLowerCase()}`)

  let base = ""
  if (impairedLabels.length && notVisualizedLabels.length) {
    base = `The assessment was limited by impaired visualization of the ${formatList(impairedLabels)} and no visualization of ${formatList(notVisualizedLabels)}.`
  } else if (impairedLabels.length) {
    base = `The assessment was limited by impaired visualization of the ${formatList(impairedLabels)}.`
  } else if (notVisualizedLabels.length) {
    base = `No visualization of ${formatList(notVisualizedLabels)}.`
  }

  if (qualityCounts.reasons.size) {
    const reasonList = formatList([...qualityCounts.reasons])
    const suffix = base.endsWith(".") ? base.slice(0, -1) : base
    return `${suffix} (Limitations: ${reasonList}).`
  }

  return base
}

function composeImpression(primary: string, visualization: string) {
  if (!visualization) return primary
  if (!primary) return visualization
  return `${primary} ${visualization}`
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
  const relevantSegments = segments.filter((segment) => !hasAbsentVisualizationReason(segment))
  const impairedSegments: SegmentData[] = []
  const notVisualizedSegments: SegmentData[] = []

  relevantSegments.forEach((segment) => {
    const quality = getVisualizationQuality(segment)
    if (quality === "impaired") {
      impairedSegments.push(segment)
    } else if (quality === "notVisualized") {
      notVisualizedSegments.push(segment)
    }
  })

  if (!impairedSegments.length && !notVisualizedSegments.length) {
    return "Good"
  }

  const isColon = (segment: SegmentData) => segment.isSmallBowel !== true

  const colonSegments = relevantSegments.filter(isColon)
  const colonImpairedSegments = impairedSegments.filter(isColon)
  const colonNotVisualizedSegments = notVisualizedSegments.filter(isColon)

  const colonAllNotVisualized =
    colonSegments.length > 0 && colonNotVisualizedSegments.length === colonSegments.length
  const colonAllImpaired =
    colonSegments.length > 0 && colonImpairedSegments.length === colonSegments.length
  const colonAllLimited =
    colonSegments.length > 0 &&
    colonSegments.every((segment) => {
      const quality = getVisualizationQuality(segment)
      return quality !== "good"
    })

  const statements: string[] = []
  const ensurePeriod = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`)
  const handled = new Set<SegmentData>()
  const collectReasonList = (source: SegmentData[]) => {
    const seen = new Set<string>()
    const list: string[] = []
    source.forEach((segment) => {
      const reason = segment.visualizationImpairmentReason?.trim()
      if (!reason) return
      const key = reason.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      list.push(reason)
    })
    return list
  }
  const withReasonSuffix = (text: string, source: SegmentData[]) => {
    const reasons = collectReasonList(source)
    if (!reasons.length) {
      return text
    }
    return `${text} (${formatList(reasons)})`
  }

  if (colonAllNotVisualized) {
    statements.push(
      ensurePeriod(withReasonSuffix("No visualization of the entire colon", colonNotVisualizedSegments)),
    )
    colonNotVisualizedSegments.forEach((segment) => handled.add(segment))
  } else if (colonAllImpaired) {
    statements.push(
      ensurePeriod(
        withReasonSuffix(
          "Visualization of the entire colon was impaired",
          colonImpairedSegments,
        ),
      ),
    )
    colonImpairedSegments.forEach((segment) => handled.add(segment))
  } else if (colonAllLimited) {
    statements.push(
      ensurePeriod(
        withReasonSuffix("Visualization across the entire colon was limited", colonSegments),
      ),
    )
    colonSegments.forEach((segment) => handled.add(segment))
  }

  const reasonGroups = new Map<string, { impaired: SegmentData[]; notVisualized: SegmentData[] }>()
  const impairedNoReason: SegmentData[] = []
  const notVisualizedNoReason: SegmentData[] = []

  relevantSegments.forEach((segment) => {
    const quality = getVisualizationQuality(segment)
    if (quality === "good") return
    if (handled.has(segment)) return

    const reason = segment.visualizationImpairmentReason?.trim()
    if (reason) {
      if (!reasonGroups.has(reason)) {
        reasonGroups.set(reason, { impaired: [], notVisualized: [] })
      }
      const bucket = reasonGroups.get(reason)!
      if (quality === "impaired") {
        bucket.impaired.push(segment)
      } else if (quality === "notVisualized") {
        bucket.notVisualized.push(segment)
      }
    } else if (quality === "impaired") {
      impairedNoReason.push(segment)
    } else if (quality === "notVisualized") {
      notVisualizedNoReason.push(segment)
    }
  })

  const labelFor = (segment: SegmentData) => `the ${segment.label.toLowerCase()}`
  const compareLabels = (a: SegmentData, b: SegmentData) =>
    a.label.toLowerCase().localeCompare(b.label.toLowerCase())

  const sortedReasons = Array.from(reasonGroups.keys()).sort((a, b) => a.localeCompare(b))
  sortedReasons.forEach((reason) => {
    const group = reasonGroups.get(reason)!
    if (group.impaired.length) {
      const labels = group.impaired.sort(compareLabels).map(labelFor)
      statements.push(
        ensurePeriod(`Impaired visualization of ${formatList(labels)} (${reason})`),
      )
    }
    if (group.notVisualized.length) {
      const labels = group.notVisualized.sort(compareLabels).map(labelFor)
      statements.push(
        ensurePeriod(`No visualization of ${formatList(labels)} (${reason})`),
      )
    }
  })

  if (impairedNoReason.length) {
    const labels = impairedNoReason.sort(compareLabels).map(labelFor)
    statements.push(ensurePeriod(`Impaired visualization of ${formatList(labels)}`))
  }

  if (notVisualizedNoReason.length) {
    const labels = notVisualizedNoReason.sort(compareLabels).map(labelFor)
    statements.push(ensurePeriod(`No visualization of ${formatList(labels)}`))
  }

  const combined = statements.join(" ").trim()
  return combined || "Visualization was limited."
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
