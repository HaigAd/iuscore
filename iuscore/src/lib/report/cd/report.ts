import type { SegmentData } from "../../segments"
import { composeImpression, formatList } from "../shared"
import type { IbusClassificationEntry } from "../types"

interface BuildCdImpressionArgs {
  segments: SegmentData[]
  ibusClassifications: IbusClassificationEntry[]
  visualizationStatement: string
}

const ACTIVE_SCORE_THRESHOLD = 25.2

export function buildCdImpression({
  segments,
  ibusClassifications,
  visualizationStatement,
}: BuildCdImpressionArgs) {
  if (!ibusClassifications.length) {
    return composeImpression(
      "IBUS-SAS inputs are incomplete for activity classification.",
      visualizationStatement,
    )
  }

  const activity = analyzeActivity(ibusClassifications)
  const activitySentence = buildActivitySentence(activity)
  const interpretiveNote =
    "(An IBUS-SAS score ≥25.2 suggests active transmural disease.)"

  const sentences = [activitySentence, interpretiveNote]
  const strictureSentence = describeStrictureDisease(segments)
  if (strictureSentence) {
    sentences.push(strictureSentence)
  }

  const primary = sentences.join(" ")
  return composeImpression(primary, visualizationStatement)
}

export function deriveCrohnsStatusLabel(entries: IbusClassificationEntry[]) {
  if (!entries.length) return "inactive disease"
  const hasActive = entries.some((entry) => entry.classification?.state === "active")
  if (hasActive) return "active disease"
  const allRemission =
    entries.length > 0 &&
    entries.every((entry) => entry.classification?.state === "remission")
  if (allRemission) return "transmural remission"
  return "inactive disease"
}

function analyzeActivity(ibusClassifications: IbusClassificationEntry[]) {
  const activeSegments = ibusClassifications
    .filter((entry) => entry.classification?.state === "active")
    .map((entry) => entry.label.toLowerCase())

  const highestScore = ibusClassifications.reduce((max, entry) => {
    const score = entry.classification?.score ?? 0
    return score > max ? score : max
  }, 0)

  const highestScoreSegments = ibusClassifications
    .filter(
      (entry) =>
        (entry.classification?.score ?? 0) === highestScore && highestScore > 0,
    )
    .map((entry) => entry.label.toLowerCase())

  const activitySegments =
    activeSegments.length > 0
      ? activeSegments
      : highestScoreSegments.length > 0
        ? highestScoreSegments
        : ["the surveyed segments"]

  const hasLikelyActiveDisease =
    highestScore >= ACTIVE_SCORE_THRESHOLD || activeSegments.length > 0

  return {
    activitySegments,
    highestScore,
    hasLikelyActiveDisease,
  }
}

function buildActivitySentence({
  activitySegments,
  highestScore,
  hasLikelyActiveDisease,
}: {
  activitySegments: string[]
  highestScore: number
  hasLikelyActiveDisease: boolean
}) {
  const segmentList = formatList(activitySegments)
  if (hasLikelyActiveDisease) {
    return `There is likely active inflammation in ${segmentList}, with the highest IBUS-SAS score ${highestScore.toFixed(1)}.`
  }
  return `Active inflammation is unlikely based on IBUS-SAS, with the highest score ${highestScore.toFixed(1)} among the surveyed segments.`
}

function describeStrictureDisease(segments: SegmentData[]) {
  const strictureSegments = segments.filter(
    (segment) => segment.luminalNarrowing || segment.prestenoticDilatation,
  )
  if (!strictureSegments.length) return ""

  const details = strictureSegments.map((segment) => {
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

  return `There is stricturing disease involving the ${details.join("; ")}.`
}
