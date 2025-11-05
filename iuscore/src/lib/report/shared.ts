import { spell } from "@/lib/localization"
import type { SegmentData } from "../segments"
import {
  ABSENT_VISUALIZATION_REASON,
  getVisualizationQuality,
} from "../segments"

const ABSENT_REASON_LOWER = ABSENT_VISUALIZATION_REASON.toLowerCase()

interface VisualizationAccumulator {
  good: number
  impaired: number
  notVisualized: number
  reasons: Set<string>
}

export function buildVisualizationStatement(segments: SegmentData[]) {
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

  const visualizationWord = spell("visualization")
  const capitalizedVisualization = spell("visualization", { casing: "capitalize" })
  if (!hasImpaired && !hasNotVisualized) {
    return `${capitalizedVisualization} was satisfactory.`
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
    base = `The assessment was limited by impaired ${visualizationWord} of the ${formatList(impairedLabels)} and no ${visualizationWord} of ${formatList(notVisualizedLabels)}.`
  } else if (impairedLabels.length) {
    base = `The assessment was limited by impaired ${visualizationWord} of the ${formatList(impairedLabels)}.`
  } else if (notVisualizedLabels.length) {
    base = `No ${visualizationWord} of ${formatList(notVisualizedLabels)}.`
  }

  if (qualityCounts.reasons.size) {
    const reasonList = formatList([...qualityCounts.reasons])
    const suffix = base.endsWith(".") ? base.slice(0, -1) : base
    return `${suffix} (Limitations: ${reasonList}).`
  }

  return base
}

export function composeImpression(primary: string, visualization: string) {
  if (!visualization) return primary
  if (!primary) return visualization
  return `${primary} ${visualization}`
}

export function summarizeImagingQuality(segments: SegmentData[]) {
  const relevantSegments = segments.filter((segment) => !hasAbsentVisualizationReason(segment))
  const impairedSegments: SegmentData[] = []
  const notVisualizedSegments: SegmentData[] = []
  const visualizationWord = spell("visualization")
  const capitalizedVisualization = spell("visualization", { casing: "capitalize" })

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
      ensurePeriod(
        withReasonSuffix(
          `No ${visualizationWord} of the entire colon`,
          colonNotVisualizedSegments,
        ),
      ),
    )
    colonNotVisualizedSegments.forEach((segment) => handled.add(segment))
  } else if (colonAllImpaired) {
    statements.push(
      ensurePeriod(
        withReasonSuffix(
          `${capitalizedVisualization} of the entire colon was impaired`,
          colonImpairedSegments,
        ),
      ),
    )
    colonImpairedSegments.forEach((segment) => handled.add(segment))
  } else if (colonAllLimited) {
    statements.push(
      ensurePeriod(
        withReasonSuffix(
          `${capitalizedVisualization} across the entire colon was limited`,
          colonSegments,
        ),
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
        ensurePeriod(`Impaired ${visualizationWord} of ${formatList(labels)} (${reason})`),
      )
    }
    if (group.notVisualized.length) {
      const labels = group.notVisualized.sort(compareLabels).map(labelFor)
      statements.push(
        ensurePeriod(`No ${visualizationWord} of ${formatList(labels)} (${reason})`),
      )
    }
  })

  if (impairedNoReason.length) {
    const labels = impairedNoReason.sort(compareLabels).map(labelFor)
    statements.push(ensurePeriod(`Impaired ${visualizationWord} of ${formatList(labels)}`))
  }

  if (notVisualizedNoReason.length) {
    const labels = notVisualizedNoReason.sort(compareLabels).map(labelFor)
    statements.push(ensurePeriod(`No ${visualizationWord} of ${formatList(labels)}`))
  }

  const combined = statements.join(" ").trim()
  return combined || `${capitalizedVisualization} was limited.`
}

export function formatList(items: string[]) {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  const head = items.slice(0, -1).join(", ")
  const tail = items[items.length - 1]
  return `${head}, and ${tail}`
}

function hasAbsentVisualizationReason(segment: SegmentData) {
  const reason = segment.visualizationImpairmentReason?.trim()
  if (!reason) return false
  return reason.toLowerCase() === ABSENT_REASON_LOWER
}
