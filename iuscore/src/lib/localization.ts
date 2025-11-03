type SpellingVariants = Record<string, string> & { default: string }

const SPELLINGS: Record<string, SpellingVariants> = {
  visualize: {
    default: "visualize",
    "en-au": "visualise",
    "en-gb": "visualise",
    "en-ie": "visualise",
    "en-nz": "visualise",
    "en-za": "visualise",
  },
  visualized: {
    default: "visualized",
    "en-au": "visualised",
    "en-gb": "visualised",
    "en-ie": "visualised",
    "en-nz": "visualised",
    "en-za": "visualised",
  },
  visualization: {
    default: "visualization",
    "en-au": "visualisation",
    "en-gb": "visualisation",
    "en-ie": "visualisation",
    "en-nz": "visualisation",
    "en-za": "visualisation",
  },
}

type Casing = "lower" | "upper" | "capitalize"

let cachedLocale: string | undefined

function detectLocale(): string {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language
  }

  if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
    const resolved = Intl.DateTimeFormat().resolvedOptions().locale
    if (resolved) {
      return resolved
    }
  }

  const processEnv =
    typeof globalThis !== "undefined"
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      : undefined

  if (processEnv) {
    const envLocale =
      processEnv.LOCALE ||
      processEnv.LC_ALL ||
      processEnv.LC_MESSAGES ||
      processEnv.LANG ||
      processEnv.VITE_DEFAULT_LOCALE
    if (envLocale) {
      return envLocale
    }
  }

  return "en-US"
}

export function getDetectedLocale(): string {
  if (!cachedLocale) {
    cachedLocale = detectLocale()
  }
  return cachedLocale
}

function normalizeLocale(locale: string): string {
  return locale.toLowerCase()
}

function resolveVariant(key: keyof typeof SPELLINGS, locale: string): string {
  const variants = SPELLINGS[key]
  const normalized = normalizeLocale(locale)

  if (variants[normalized]) {
    return variants[normalized]
  }

  const languageCode = normalized.split("-")[0]
  if (languageCode && variants[languageCode]) {
    return variants[languageCode]
  }

  return variants.default
}

function applyCasing(value: string, casing: Casing = "lower"): string {
  switch (casing) {
    case "upper":
      return value.toUpperCase()
    case "capitalize":
      return value.charAt(0).toUpperCase() + value.slice(1)
    default:
      return value
  }
}

export type SpellingKey = keyof typeof SPELLINGS | (string & {})

export interface SpellOptions {
  locale?: string
  casing?: Casing
}

export function spell(key: SpellingKey, options: SpellOptions = {}): string {
  const locale = options.locale ?? getDetectedLocale()
  const variants = SPELLINGS[key as string]

  if (!variants) {
    return applyCasing(String(key), options.casing ?? "lower")
  }

  const resolved = resolveVariant(key as keyof typeof SPELLINGS, locale)
  return applyCasing(resolved, options.casing ?? "lower")
}

/**
 * Merge additional spelling variants into the dictionary at runtime.
 * Helpful for feature-specific vocabulary without touching the shared constants.
 */
export function registerSpellings(entries: Record<string, SpellingVariants>): void {
  Object.entries(entries).forEach(([key, variants]) => {
    if (!variants) return
    SPELLINGS[key] = variants
  })
}
