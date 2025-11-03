import type { ContextContent } from "@/components/context/context-popover"
import { buildSegmentIndicatorContext } from "@/lib/context/segment-indicator-context"
import { spell } from "@/lib/localization"
import type { DiseaseProfile, SegmentData } from "@/lib/segments"
import {
  classifyIbusActivity,
  classifyRectalActivity,
  getIbusScore,
  getMilanScore,
  getSegmentStatus,
} from "@/lib/segments"

export type ScoreSummary = {
  label: string
  value?: string
  description: string
  tone: "muted" | "positive" | "caution" | "negative"
  context?: ContextContent
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
  const status = getSegmentStatus(segment, profile)
  const milanScore = profile === "uc" ? getMilanScore(segment) : undefined
  const ibusScore = profile === "cd" ? getIbusScore(segment) : undefined
  const ibusClassification = profile === "cd" ? classifyIbusActivity(segment) : undefined
  const rectalActivity =
    profile === "uc" && segment.id === "rectum"
      ? classifyRectalActivity(segment)
      : undefined

  const withContext = (summary: ScoreSummary, indicatorText: string): ScoreSummary => ({
    ...summary,
    context: buildSegmentIndicatorContext({
      segment,
      profile,
      indicatorText,
      status,
      milanScore,
      rectalActivity,
      ibusScore,
      ibusState: ibusClassification?.state,
    }),
  })

  if (segment.notVisualised) {
    const summary: ScoreSummary = {
      label: profile === "uc" ? "Milan score" : "IBUS-SAS score",
      description: `Segment not ${spell("visualized")}`,
      tone: "muted",
    }
    return withContext(summary, summary.description)
  }

  if (profile === "uc") {
    if (segment.id === "rectum") {
      if (segment.bwtUncertain) {
        const summary: ScoreSummary = {
          label: "Rectal BWT (mm)",
          description: "Rectal BWT measurement uncertain.",
          tone: "muted",
        }
        return withContext(summary, summary.description)
      }

      const bwt = segment.bowelWallThickness
      if (bwt === undefined) {
        const summary: ScoreSummary = {
          label: "Rectal BWT (mm)",
          description: "Enter BWT to assess rectal inflammation.",
          tone: "muted",
        }
        return withContext(summary, summary.description)
      }

      const interpretation =
        rectalActivity === "absent"
          ? "Inflammation absent."
          : rectalActivity === "possible"
            ? "Inflammation possible."
            : rectalActivity === "present"
              ? "Inflammation present."
              : "Inflammation indeterminate."

      const summary: ScoreSummary = {
        label: "Rectal BWT (mm)",
        value: bwt.toFixed(1),
        description: interpretation,
        tone:
          rectalActivity === "absent"
            ? "positive"
            : rectalActivity === "possible"
              ? "caution"
              : rectalActivity === "present"
                ? "negative"
                : "muted",
      }

      const indicatorText = `Rectal BWT ${bwt.toFixed(1)} mm · ${interpretation}`
      return withContext(summary, indicatorText)
    }

    if (milanScore === undefined) {
      const summary: ScoreSummary = {
        label: "Milan score",
        description: "Enter BWT and Doppler activity to calculate the Milan score.",
        tone: "muted",
      }
      return withContext(summary, summary.description)
    }

    const context =
      status === "uninvolved"
        ? "Consistent with inactive disease."
        : "Suggestive of active inflammation."

    const summary: ScoreSummary = {
      label: "Milan score",
      value: milanScore.toFixed(1),
      description: context,
      tone: status === "uninvolved" ? "positive" : "negative",
    }
    const indicatorText =
      status === "uninvolved"
        ? `Milan score ${milanScore.toFixed(1)} · likely remission`
        : `Milan score ${milanScore.toFixed(1)} · likely active inflammation`

    return withContext(summary, indicatorText)
  }

  if (ibusScore === undefined || !ibusClassification) {
    const summary: ScoreSummary = {
      label: "IBUS-SAS score",
      description: "Enter relevant variables to calculate the IBUS-SAS score.",
      tone: "muted",
    }
    return withContext(summary, summary.description)
  }

  const description =
    ibusClassification.state === "remission"
      ? "Consistent with transmural remission."
      : ibusClassification.state === "inactive"
        ? "Consistent with inactive disease."
        : "Suggestive of active inflammation."

  const summary: ScoreSummary = {
    label: "IBUS-SAS score",
    value: ibusScore.toFixed(1),
    description,
    tone:
      ibusClassification.state === "remission"
        ? "positive"
        : ibusClassification.state === "inactive"
          ? "caution"
          : "negative",
  }

  const ibusText =
    ibusClassification.state === "remission"
      ? "transmural remission"
      : ibusClassification.state === "inactive"
        ? "consistent with inactive disease"
        : "active inflammation"

  const indicatorText = `IBUS-SAS ${ibusScore.toFixed(1)} · ${ibusText}`

  return withContext(summary, indicatorText)
}
