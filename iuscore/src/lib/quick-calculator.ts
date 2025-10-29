import type { DiseaseProfile, SegmentData } from "@/lib/segments"
import {
  classifyIbusActivity,
  getIbusScore,
  getMilanScore,
  getSegmentStatus,
} from "@/lib/segments"

type ScoreSummary = {
  label: string
  value?: string
  description: string
  tone: "muted" | "positive" | "caution" | "negative"
}

export function createQuickCalculatorSegment(profile: DiseaseProfile): SegmentData {
  const isCrohns = profile === "cd"

  return {
    id: isCrohns ? "terminalIleum" : "sigmoid",
    label: isCrohns ? "Quick IBUS-SAS segment" : "Quick Milan segment",
    instanceId: `quick-${profile}`,
    isSmallBowel: isCrohns,
    dopplerGrade: 0,
    stratification: isCrohns ? "normal" : undefined,
    fatWrapping: isCrohns ? false : undefined,
  }
}

export function buildScoreSummary(
  segment: SegmentData,
  profile: DiseaseProfile,
): ScoreSummary {
  if (segment.notVisualised) {
    return {
      label: profile === "uc" ? "Milan score" : "IBUS-SAS score",
      description: "Segment not visualized",
      tone: "muted",
    }
  }

  if (profile === "uc") {
    const score = getMilanScore(segment)
    if (score === undefined) {
      return {
        label: "Milan score",
        description: "Enter BWT and Doppler inputs to calculate the Milan score.",
        tone: "muted",
      }
    }

    const status = getSegmentStatus(segment, "uc")
    const context =
      status === "uninvolved"
        ? "Consistent with inactive disease."
        : "Suggestive of active inflammation."

    return {
      label: "Milan score",
      value: score.toFixed(1),
      description: context,
      tone: status === "uninvolved" ? "positive" : "negative",
    }
  }

  const score = getIbusScore(segment)
  const classification = classifyIbusActivity(segment)
  if (score === undefined || !classification) {
    return {
      label: "IBUS-SAS score",
      description: "Enter transmural activity inputs to calculate the IBUS-SAS score.",
      tone: "muted",
    }
  }

  const description =
    classification.state === "remission"
      ? "Consistent with transmural remission."
      : classification.state === "inactive"
        ? "Consistent with inactive disease."
        : "Suggestive of active inflammation."

  return {
    label: "IBUS-SAS score",
    value: score.toFixed(1),
    description,
    tone:
      classification.state === "remission"
        ? "positive"
        : classification.state === "inactive"
          ? "caution"
          : "negative",
  }
}
