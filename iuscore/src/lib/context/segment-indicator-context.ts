import type { ContextContent } from "@/components/context/context-popover"
import type { DiseaseProfile, IbusActivityState, SegmentData } from "@/lib/segments"
import { MILAN_INFLAMMATION_THRESHOLD } from "@/lib/segments"

interface BuildSegmentIndicatorContextInput {
  segment: SegmentData
  profile: DiseaseProfile
  indicatorText: string
  milanScore?: number
  ibusScore?: number
  ibusState?: IbusActivityState
}

export function buildSegmentIndicatorContext({
  segment,
  profile,
  indicatorText,
  milanScore,
  ibusScore,
  ibusState,
}: BuildSegmentIndicatorContextInput): ContextContent {
  if (profile === "uc") {
    if (segment.id === "rectum") {
      return buildRectalBwtContext()
    }

    return buildMilanContext({ indicatorText, milanScore })
  }

  return buildIbusContext({ segment, indicatorText, ibusScore, ibusState })
}

function buildRectalBwtContext(): ContextContent {

  return {
    title: `Rectal Findings Iterpretation`,
    summary: "The Milan score is not validated for rectal assessment. BWT has been shown to correlate strongly with inflammatory activity.",
    sections: [
      {
        heading: "Reference threshold¹",
        items: [
          {
            text: "BWT ≥ 4 mm",
            detail: "Predicts endoscopic endoscopic activity with <b>high sensitivity</b> \n - Sensitivity 95% (TAUS), 100% (TPUS)\n - Specificity 17% (TAUS), 42% (TPUS)",
          },
          {
            text: "BWT > 6mm",
            detail: "Predicts histologic activity with <b>high specificity</b> (Robarts Histopathology Index > 6)\n - Sensitivity 52%\n - Specificity 89%"
          }
        ],
      },
      {
        heading: "Reference",
        links: [
          {
            external: true,
            label: "1. Sagami et al. Transperineal ultrasound predicts endoscopic and histological healing in ulcerative colitis",
            href: "https://doi.org/10.1111/apt.15767",
          },
        ],
      },
    ],
  }
}

function buildMilanContext({
  indicatorText,
  milanScore,
}: {
  indicatorText: string
  milanScore?: number
}): ContextContent {
  const defaultSummary =
    milanScore === undefined
      ? "Add bowel wall thickness and Doppler inputs to calculate the Milan score."
      : milanScore <= MILAN_INFLAMMATION_THRESHOLD
        ? `Score ${milanScore.toFixed(1)} (≤ ${MILAN_INFLAMMATION_THRESHOLD.toFixed(
            1,
          )}) — inflammation unlikely.`
        : `Score ${milanScore.toFixed(1)} (> ${MILAN_INFLAMMATION_THRESHOLD.toFixed(
            1,
          )}) — inflammation likely.`
  const summary = indicatorText || defaultSummary

  return {
    title: "Milan Ultrasound Criteria interpretation¹",
    summary,
    sections: [
      {
        heading: "Reference thresholds²",
        items: [
          {
            text: "> 6.2",
            detail:
              "Inflammation likely; predicts endoscopic activity (Mayo ≤ 1)\n - Sensitivity 85%\n - Specificity 94%",
          },
          {
            text: "> 8.2",
            detail:
              "Higher values (>8.2) correlate with greater disease severity and a 100% specificity for endoscopic activity in a validation cohort.²",
          },
        ],
      },
      {
        heading: "Reference",
        links: [
          {
            external: true,
            href: "https://doi.org/10.1093/ecco-jcc/jjy107",
            label:
              "1. Alloca et al. Accuracy of Humanitas Ultrasound Criteria in assessing disease activity and severity in ulcerative colitis: a prospective study. ",
          },
          {
            external: true,
            href: "https://doi.org/10.1177/2050640620980203",
            label:
              "2. Alloca et al. Milan ultrasound criteria are accurate in assessing disease activity in ulcerative colitis: external validation.",
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

  const defaultSummary =
    ibusScore === undefined
      ? "Add relevant variables to calculate the IBUS-SAS score."
      : `IBUS-SAS ${ibusScore.toFixed(1)} — ${activityLabel}.`
  const summary = indicatorText || defaultSummary

  return {
    title: `${segment.label} IBUS-SAS context¹`,
    summary,
    sections: [
      {
        heading: "Reference thresholds",
        items: [
          {
            text: "> 25.2",
            detail: "Predicts any endoscopic activity\n - Sensitivity 82%\n - Specificity 100%",
          },
          {
            text: "> 27.5",
            detail:
              "Predicts endoscopic activity in a separate validation cohort³\n - Sensitivity 93%\n - Specificity 94%",
          },
          {
            text: "> 65.5",
            detail: "Predicts severe endoscopic activity³\n - Sensitivity 95%\n - Specificity 88%",
          },
        ],
      },
      {
        heading: "References",
        links: [
          {
            external: true,
            href: "https://doi.org/10.1093/ecco-jcc/jjaa216",
            label: "1. Novak et al. Expert Consensus on Optimal Acquisition and Development of the International Bowel Ultrasound Segmental Activity Score [IBUS-SAS]: A Reliability and Inter-rater Variability Study on Intestinal Ultrasonography in Crohn’s Disease",
          },
          {
            external: true,
            href: "https://doi.org/10.1093/ecco-jcc/jjad068",
            label: "2. Dragoni et al. Correlation of Ultrasound Scores with Endoscopic Activity in Crohn's Disease: A Prospective Exploratory Study",
          },
          {
            external: true,
            href: "https://doi.org/10.21037/qims-24-742",
            label:
              "3. Zhao et al. Validation of intestinal ultrasound scores in assessing endoscopic activity of colonic and small intestinal Crohn’s disease in a southwest Chinese cohort: a retrospective cross-sectional study",
          },
        ],
      },
    ],
  }
}
