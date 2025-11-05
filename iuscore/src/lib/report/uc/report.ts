import { spell } from "@/lib/localization"
import type { SegmentData, SegmentStatus } from "../../segments"
import {
  classifyRectalActivity,
  getMilanScore,
  getSegmentStatus,
  MILAN_INFLAMMATION_THRESHOLD,
} from "../../segments"
import { composeImpression, formatList } from "../shared"

const severityOrder: SegmentStatus[] = ["uninvolved", "mild", "moderate", "severe"]
const NORMAL_STATEMENT = "No sonographic evidence of active bowel inflammation."

interface BuildUcImpressionArgs {
  segments: SegmentData[]
  visualizationStatement: string
}

export function buildUcImpression({
  segments,
  visualizationStatement,
}: BuildUcImpressionArgs) {
  const { rectalSegment, colonSegments } = partitionSegments(segments)
  const rectalSentence = buildRectalActivitySentence(rectalSegment)
  const rectalActivity = rectalSegment ? classifyRectalActivity(rectalSegment) : undefined

  const colonHighestSeverity = getUcHighestSeverity(colonSegments)
  if (colonHighestSeverity === "uninvolved") {
    const sentences = rectalActivity === "absent" || !rectalSentence
      ? [NORMAL_STATEMENT, rectalSentence]
      : [rectalSentence]
    const primary = sentences.filter(Boolean).join(" ").trim()
    return composeImpression(primary, visualizationStatement)
  }

  const focusSegments = selectFocusSegments(colonSegments, colonHighestSeverity)
  const colonSentence = describeColonInflammation(colonSegments, focusSegments)
  const primary = [colonSentence, rectalSentence].filter(Boolean).join(" ")

  return composeImpression(primary, visualizationStatement)
}

export function getUcHighestSeverity(segments: SegmentData[]): SegmentStatus {
  if (!segments.length) {
    return "uninvolved"
  }
  return segments.reduce<SegmentStatus>((acc, segment) => {
    const status = getSegmentStatus(segment, "uc")
    return severityOrder.indexOf(status) > severityOrder.indexOf(acc) ? status : acc
  }, "uninvolved")
}

function partitionSegments(segments: SegmentData[]) {
  const rectalSegment = segments.find((segment) => segment.id === "rectum")
  const colonSegments = segments.filter((segment) => segment.id !== "rectum")
  return { rectalSegment, colonSegments }
}

function selectFocusSegments(
  segments: SegmentData[],
  severity: SegmentStatus,
) {
  return segments
    .filter((segment) => getSegmentStatus(segment, "uc") === severity)
    .map((segment) => segment.label.toLowerCase())
}

function describeColonInflammation(
  segments: SegmentData[],
  focusSegments: string[],
) {
  const focusText = formatList(focusSegments)
  if (!focusText) return ""

  const inflamedSegments = segments.filter(
    (segment) => getSegmentStatus(segment, "uc") !== "uninvolved",
  )

  const inflamedScores = getInflamedScores(inflamedSegments)
  const highestScore = getHighestScore(inflamedScores)
  const highestScoreLabels = getHighestScoreLabels(inflamedScores, highestScore)

  if (inflamedSegments.length > 1) {
    let sentence = `Milan score > ${MILAN_INFLAMMATION_THRESHOLD.toFixed(
      1,
    )} suggests inflammation involving the ${focusText}.`
    if (highestScore !== undefined && highestScoreLabels.length) {
      const worstLabel = highestScoreLabels[0]
      sentence = `${sentence} Inflammation is most severe in the ${worstLabel} (MUC = ${highestScore.toFixed(
        1,
      )}).`
    }
    return sentence
  }

  let sentence = `Milan score > ${MILAN_INFLAMMATION_THRESHOLD.toFixed(
    1,
  )} suggests inflammation involving the ${focusText}`
  if (highestScore !== undefined) {
    sentence = `${sentence} (MUC = ${highestScore.toFixed(1)}).`
  } else {
    sentence = `${sentence}.`
  }
  return sentence
}

function getInflamedScores(segments: SegmentData[]) {
  return segments
    .map((segment) => ({
      label: segment.label.toLowerCase(),
      score: getMilanScore(segment),
    }))
    .filter(
      (entry): entry is { label: string; score: number } =>
        typeof entry.score === "number",
    )
}

function getHighestScore(scores: { label: string; score: number }[]) {
  if (!scores.length) return undefined
  return scores.reduce((max, entry) => (entry.score > max ? entry.score : max), scores[0].score)
}

function getHighestScoreLabels(
  scores: { label: string; score: number }[],
  highestScore: number | undefined,
) {
  if (highestScore === undefined) {
    return []
  }
  return scores
    .filter((entry) => entry.score === highestScore)
    .map((entry) => entry.label)
}

function buildRectalActivitySentence(segment?: SegmentData) {
  if (!segment) return ""
  if (segment.notVisualised) {
    return `Rectum not ${spell("visualized")}.`
  }
  if (segment.bwtUncertain) {
    return "Rectal inflammation indeterminate (BWT uncertain)."
  }

  const bwt = segment.bowelWallThickness
  if (typeof bwt !== "number") return ""

  const activity = classifyRectalActivity(segment)
  if (!activity || activity === "absent") return ""

  const bwtText = `BWT ${bwt.toFixed(1)} mm`
  if (activity === "possible") {
    return `Rectal inflammation possible (${bwtText}).`
  }
  if (activity === "present") {
    return `Rectal inflammation likely (${bwtText}).`
  }
  return ""
}
