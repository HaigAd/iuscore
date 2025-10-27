export type DiseaseProfile = "uc" | "cd"

export type SegmentId =
  | "terminalIleum"
  | "caecum"
  | "ascending"
  | "transverse"
  | "descending"
  | "sigmoid"
  | "rectum"
  | "ruqSmallBowel"
  | "rlqSmallBowel"
  | "suprapubicSmallBowel"
  | "periumbilicalSmallBowel"
  | "epigastricSmallBowel"
  | "leftFlankSmallBowel"
  | "rightFlankSmallBowel"

export type SegmentStatus = "uninvolved" | "mild" | "moderate" | "severe"
export type IbusActivityState = "remission" | "inactive" | "active"
export type VisualizationQuality = "good" | "impaired" | "notVisualized"

export interface SegmentTemplate {
  id: SegmentId
  label: string
  notVisualised?: boolean
  bowelWallThickness?: number
  bwtUncertain?: boolean
  dopplerGrade?: 0 | 1 | 2 | 3
  dopplerUncertain?: boolean
  stratification?: "normal" | "focal" | "extensive"
  stratificationUncertain?: boolean
  fatWrapping?: boolean
  fatWrappingUncertain?: boolean
  lymphNodes?: boolean
  notes?: string
  lengthCm?: number
  luminalNarrowing?: boolean
  prestenoticDilatation?: boolean
  prestenoticDiameterMm?: number
  isSmallBowel?: boolean
  isDynamic?: boolean
  visualizationOverride?: "good" | "impaired"
}

export interface SegmentData extends SegmentTemplate {
  instanceId: string
}

export type SegmentUpdate = Partial<Omit<SegmentData, "instanceId">>

export function getVisualizationQuality(segment: SegmentData): VisualizationQuality {
  if (segment.notVisualised) {
    return "notVisualized"
  }
  if (segment.visualizationOverride) {
    return segment.visualizationOverride
  }
  const hasImpairment =
    segment.bwtUncertain ||
    segment.dopplerUncertain ||
    segment.stratificationUncertain ||
    segment.fatWrappingUncertain

  return hasImpairment ? "impaired" : "good"
}

export const defaultSegments: SegmentTemplate[] = [
  { id: "rectum", label: "Rectum", isSmallBowel: false, notVisualised: false },
  { id: "sigmoid", label: "Sigmoid colon", isSmallBowel: false },
  { id: "descending", label: "Descending colon", isSmallBowel: false },
  { id: "transverse", label: "Transverse colon", isSmallBowel: false },
  { id: "ascending", label: "Ascending colon", isSmallBowel: false },
  { id: "caecum", label: "Caecum", isSmallBowel: false },
  { id: "terminalIleum", label: "Terminal ileum", isSmallBowel: true },
]

export const crohnsAdditionalSegments: SegmentTemplate[] = [
  { id: "ruqSmallBowel", label: "Right upper quadrant", isSmallBowel: true, isDynamic: true },
  { id: "rlqSmallBowel", label: "Right lower quadrant", isSmallBowel: true, isDynamic: true },
  { id: "suprapubicSmallBowel", label: "Suprapubic", isSmallBowel: true, isDynamic: true },
  { id: "periumbilicalSmallBowel", label: "Periumbilical", isSmallBowel: true, isDynamic: true },
  { id: "epigastricSmallBowel", label: "Epigastric", isSmallBowel: true, isDynamic: true },
  { id: "leftFlankSmallBowel", label: "Left flank", isSmallBowel: true, isDynamic: true },
  { id: "rightFlankSmallBowel", label: "Right flank", isSmallBowel: true, isDynamic: true },
]

let segmentInstanceCounter = 0

export function createSegmentInstance(template: SegmentTemplate): SegmentData {
  segmentInstanceCounter += 1
  return {
    ...template,
    instanceId: `${template.id}-${segmentInstanceCounter}`,
  }
}

const severitySchema = {
  uc: {
    mild: 3.5,
    moderate: 4.5,
    severe: 6,
  },
  cd: {
    mild: 3,
    moderate: 4,
    severe: 5.5,
  },
}

const dopplerWeights = {
  mild: 1,
  moderate: 2,
  severe: 3,
} as const

const MILAN_INACTIVE_THRESHOLD = 6.2

export function getSegmentStatus(
  segment: SegmentData,
  profile: DiseaseProfile,
): SegmentStatus {
  if (segment.notVisualised) {
    return "uninvolved"
  }
  if (!segmentHasData(segment)) {
    return "uninvolved"
  }

  const thresholds = severitySchema[profile]
  const bwt = segment.bwtUncertain ? undefined : segment.bowelWallThickness
  const doppler = segment.dopplerUncertain ? undefined : segment.dopplerGrade
  if (profile === "uc") {
    const milanScore = getMilanScore(segment)
    if (milanScore !== undefined && milanScore < MILAN_INACTIVE_THRESHOLD) {
      return "uninvolved"
    }
  }

  if (
    (bwt !== undefined && bwt >= thresholds.severe) ||
    (doppler !== undefined && doppler >= dopplerWeights.severe)
  ) {
    return "severe"
  }
  if (
    (bwt !== undefined && bwt >= thresholds.moderate) ||
    (doppler !== undefined && doppler >= dopplerWeights.moderate)
  ) {
    return "moderate"
  }
  if (
    (bwt !== undefined && bwt >= thresholds.mild) ||
    (doppler !== undefined && doppler >= dopplerWeights.mild)
  ) {
    return "mild"
  }

  if (
    segment.stratification === "focal" ||
    segment.stratification === "extensive" ||
    segment.fatWrapping
  ) {
    return "mild"
  }

  return "uninvolved"
}

export function segmentSummary(segment: SegmentData, profile: DiseaseProfile) {
  const pieces: string[] = []
  if (segment.notVisualised) {
    return `${segment.label}: not visualized`
  }
  const milanScore = profile === "uc" ? getMilanScore(segment) : undefined
  const ibusScore = profile === "cd" ? getIbusScore(segment) : undefined

  if (segment.bwtUncertain) {
    pieces.push("BWT uncertain")
  } else if (segment.bowelWallThickness !== undefined) {
    pieces.push(`BWT ${segment.bowelWallThickness.toFixed(1)}mm`)
  }
  if (segment.dopplerUncertain) {
    pieces.push("m-Limberg uncertain")
  } else if (segment.dopplerGrade !== undefined) {
    pieces.push(`Doppler grade ${segment.dopplerGrade}`)
  }
  if (segment.stratificationUncertain) {
    pieces.push("Stratification uncertain")
  } else if (segment.stratification) {
    const stratText =
      segment.stratification === "normal"
        ? "Layering preserved"
        : segment.stratification === "focal"
          ? "Focal stratification loss"
          : "Extensive stratification loss"
    pieces.push(stratText)
  }
  if (segment.fatWrappingUncertain) {
    pieces.push("Mesenteric fat uncertain")
  } else if (segment.fatWrapping !== undefined) {
    pieces.push(segment.fatWrapping ? "Mesenteric fat active" : "No pre-mesenteric fat signal")
  }
  if (segment.lymphNodes !== undefined) {
    pieces.push(
      segment.lymphNodes ? "Mesenteric lymph nodes present" : "Mesenteric lymph nodes absent",
    )
  }
  if (segment.notes) {
    pieces.push(segment.notes)
  }
  if (segment.lengthCm !== undefined) {
    pieces.push(`Segment length ${segment.lengthCm.toFixed(1)}cm`)
  }
  if (segment.luminalNarrowing) {
    pieces.push("Luminal narrowing")
  }
  if (segment.prestenoticDilatation) {
    if (segment.prestenoticDiameterMm) {
      pieces.push(`Prestenotic dilatation ${segment.prestenoticDiameterMm.toFixed(1)}mm`)
    } else {
      pieces.push("Prestenotic dilatation")
    }
  }

  const status = getSegmentStatus(segment, profile)
  if (profile === "uc") {
    if (status !== "uninvolved") {
      pieces.unshift(`Milan ${status}`)
    }
    if (milanScore !== undefined) {
      pieces.unshift(`Milan score ${milanScore.toFixed(1)}`)
    }
  } else if (profile === "cd" && ibusScore !== undefined) {
    pieces.unshift(`IBUS-SAS score ${ibusScore.toFixed(1)}`)
  }

  if (!pieces.length) {
    return `${segment.label}: normal`
  }

  return `${segment.label}: ${pieces.join("; ")}`
}

export function segmentHasData(segment: SegmentData) {
  return (
    segment.bowelWallThickness !== undefined ||
    segment.dopplerGrade !== undefined ||
    segment.stratification !== undefined ||
    segment.fatWrapping !== undefined ||
    !!segment.notes ||
    segment.bwtUncertain === true ||
    segment.dopplerUncertain === true ||
    segment.stratificationUncertain === true ||
    segment.fatWrappingUncertain === true ||
    segment.lengthCm !== undefined ||
    segment.luminalNarrowing === true ||
    segment.prestenoticDilatation === true ||
    segment.prestenoticDiameterMm !== undefined ||
    segment.lymphNodes !== undefined
  )
}

/**
 * Simplified Milan ultrasound criteria: weighted BWT + Doppler + stratification.
 * These weights follow the published regression-derived coefficients.
 */
export function getMilanScore(segment: SegmentData) {
  if (segment.notVisualised) {
    return undefined
  }
  if (segment.bwtUncertain || segment.bowelWallThickness === undefined) {
    return undefined
  }

  const bwt = segment.bowelWallThickness
  const doppler =
    segment.dopplerUncertain || segment.dopplerGrade === undefined
      ? undefined
      : segment.dopplerGrade
  const stratDisrupted =
    segment.stratification === "focal" || segment.stratification === "extensive"

  const score = 1.5 * bwt + 3.5 * (doppler ?? 0) + (stratDisrupted ? 6 : 0)
  return Number(score.toFixed(1))
}

/**
 * Simplified IBUS-SAS implementation based on component bands described in the consensus paper.
 * BWT is bucketed (0-3), Limberg Doppler already 0-3, stratification loss adds 2 points,
 * hyper-vascular mesentery adds 1, and stricturing features contribute up to 2 additional points.
 */
export function getIbusScore(segment: SegmentData) {
  if (segment.notVisualised) {
    return undefined
  }
  if (segment.bwtUncertain || segment.dopplerUncertain) {
    return undefined
  }

  if (
    segment.bowelWallThickness === undefined ||
    segment.dopplerGrade === undefined
  ) {
    return undefined
  }

  const iFat = segment.fatWrapping ? 2 : segment.fatWrappingUncertain ? 1 : 0
  const bws = segment.stratificationUncertain
    ? 1
    : segment.stratification === "focal"
      ? 2
      : segment.stratification === "extensive"
        ? 3
        : 0

  const score =
    4 * segment.bowelWallThickness +
    15 * iFat +
    7 * segment.dopplerGrade +
    4 * bws

  return Number(score.toFixed(1))
}

export function isTransmuralRemission(segment: SegmentData) {
  if (segment.notVisualised) return false
  if (segment.bwtUncertain) return false
  if (segment.bowelWallThickness === undefined || segment.bowelWallThickness >= 3) {
    return false
  }
  const doppler = segment.dopplerGrade ?? 0
  const stratNormal =
    !segment.stratification || segment.stratification === "normal"
  const noStricture = !segment.luminalNarrowing && !segment.prestenoticDilatation
  const noMesentericFat = !segment.fatWrapping && !segment.fatWrappingUncertain

  return (
    doppler === 0 &&
    stratNormal &&
    !segment.stratificationUncertain &&
    noMesentericFat &&
    noStricture
  )
}

export function classifyIbusActivity(segment: SegmentData) {
  if (segment.notVisualised) {
    return undefined
  }
  if (isTransmuralRemission(segment)) {
    return { state: "remission" as IbusActivityState, score: getIbusScore(segment) }
  }

  const score = getIbusScore(segment)
  if (score === undefined) return undefined

  return {
    state: score >= 25.2 ? "active" : "inactive",
    score,
  }
}
