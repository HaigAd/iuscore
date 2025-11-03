import type { ContextContent } from "@/components/context/context-popover"
import type {
  DiseaseProfile,
  IbusActivityState,
  RectalActivityState,
  SegmentData,
  SegmentStatus,
} from "@/lib/segments"

interface BuildSegmentIndicatorContextInput {
  segment: SegmentData
  profile: DiseaseProfile
  indicatorText: string
  status: SegmentStatus
  milanScore?: number
  rectalActivity?: RectalActivityState
  ibusScore?: number
  ibusState?: IbusActivityState
}

export function buildSegmentIndicatorContext({
  segment,
  profile,
  indicatorText,
  status,
  milanScore,
  rectalActivity,
  ibusScore,
  ibusState,
}: BuildSegmentIndicatorContextInput): ContextContent {
  if (profile === "uc") {
    if (segment.id === "rectum") {
      return buildRectalBwtContext({ segment, indicatorText, rectalActivity })
    }

    return buildMilanContext({ segment, indicatorText, status, milanScore })
  }

  return buildIbusContext({ segment, indicatorText, ibusScore, ibusState })
}

function buildRectalBwtContext({
  segment,
  indicatorText,
  rectalActivity,
}: {
  segment: SegmentData
  indicatorText: string
  rectalActivity?: RectalActivityState
}): ContextContent {
  const activityLabel =
    rectalActivity === "absent"
      ? "absent inflammation"
      : rectalActivity === "present"
        ? "present inflammation"
        : rectalActivity === "possible"
          ? "possible inflammation"
          : "indeterminate activity"

  return {
    title: `${segment.label} assessment`,
    summary:
      "Placeholder guidance for rectal bowel wall thickness interpretation. Tailor this content with study references and decision aids as needed.",
    sections: [
      {
        heading: "Current interpretation",
        body: indicatorText,
        items: [
          {
            text: "Activity classification",
            detail: `Current placeholder: ${activityLabel}.`,
          },
          {
            text: "Future enhancements",
            detail: "Add reference values, confidence annotations, and supporting imagery here.",
          },
        ],
      },
      {
        heading: "Suggested cutoffs",
        items: [
          {
            text: "< 4 mm",
            detail: "Placeholder: consistent with endoscopic remission.",
          },
          {
            text: "4–6 mm",
            detail: "Placeholder: indeterminate activity range.",
          },
          {
            text: "≥ 6 mm",
            detail: "Placeholder: suggests active inflammation.",
          },
        ],
      },
    ],
  }
}

function buildMilanContext({
  segment,
  indicatorText,
  status,
  milanScore,
}: {
  segment: SegmentData
  indicatorText: string
  status: SegmentStatus
  milanScore?: number
}): ContextContent {
  const severity =
    status === "uninvolved"
      ? "remission"
      : status === "mild"
        ? "mild inflammation"
        : status === "moderate"
          ? "moderate inflammation"
          : "severe inflammation"

  return {
    title: `${segment.label} Milan overview`,
    summary:
      "Placeholder Milan score guidance. Populate with study-backed thresholds, sensitivity/specificity notes, and clinical decision prompts.",
    sections: [
      {
        heading: "Current interpretation",
        body: indicatorText,
        items: [
          {
            text: "Aligned severity",
            detail: `Placeholder: ${severity}.`,
          },
          {
            text: "Reported score",
            detail:
              milanScore !== undefined
                ? `Placeholder: ${milanScore.toFixed(1)} (add confidence intervals or study references).`
                : "Placeholder: score pending inputs.",
          },
        ],
      },
      {
        heading: "Reference cutoffs",
        items: [
          {
            text: "≤ 6.2",
            detail: "Placeholder: suggests inactive disease (per validation studies).",
          },
          {
            text: "6.3 – 7.4",
            detail: "Placeholder: mild activity band.",
          },
          {
            text: "≥ 7.5",
            detail: "Placeholder: consider active inflammation.",
          },
        ],
      },
    ],
  }
}

function buildIbusContext({
  segment,
  indicatorText,
  ibusScore,
  ibusState,
}: {
  segment: SegmentData
  indicatorText: string
  ibusScore?: number
  ibusState?: IbusActivityState
}): ContextContent {
  const activityLabel =
    ibusState === "remission"
      ? "transmural remission"
      : ibusState === "inactive"
        ? "inactive disease"
        : ibusState === "active"
          ? "active inflammation"
          : "activity pending inputs"

  return {
    title: `${segment.label} IBUS-SAS overview`,
    summary:
      "Placeholder IBUS-SAS context. Include score composition, workflow tips, and literature references to support interpretations.",
    sections: [
      {
        heading: "Current interpretation",
        body: indicatorText,
        items: [
          {
            text: "Activity classification",
            detail: `Placeholder: ${activityLabel}.`,
          },
          {
            text: "Reported score",
            detail:
              ibusScore !== undefined
                ? `Placeholder: ${ibusScore.toFixed(1)} (breakdown by domains can be added here).`
                : "Placeholder: awaiting calculation.",
          },
        ],
      },
      {
        heading: "Reference cutoffs",
        items: [
          {
            text: "< 25.2",
            detail: "Placeholder: likely transmural remission.",
          },
          {
            text: "25.2 – 32",
            detail: "Placeholder: indeterminate activity band.",
          },
          {
            text: "> 32",
            detail: "Placeholder: suggests active transmural disease.",
          },
        ],
      },
    ],
  }
}

