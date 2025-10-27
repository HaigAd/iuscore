import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { ChevronDown, SquareSplitHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const INDICATION_OPTIONS = [
  "Disease activity assessment",
  "Symptoms - exclude active inflammation",
  "Assess response to therapy",
  "New patient - baseline investigation",
  "Exclude active inflammatory bowel disease",
] as const

const STORAGE_KEY = "iuscore:indications"

interface IndicationSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function IndicationSelector({
  value,
  onChange,
  className,
}: IndicationSelectorProps) {
  const [history, setHistory] = useState<string[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    if (value === INDICATION_OPTIONS[0]) {
      onChange("")
    }
  }, [value, onChange])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
      // ignore
    }
    setHistoryLoaded(true)
  }, [])

  useEffect(() => {
    if (!historyLoaded) return
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }, [history, historyLoaded])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        fieldRef.current &&
        !fieldRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => {
      document.removeEventListener("mousedown", handleClick)
    }
  }, [])

  const inlineMatch = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return ""
    const allOptions = [
      ...INDICATION_OPTIONS,
      ...history,
    ].filter(Boolean)
    const match = allOptions.find((option) =>
      option.toLowerCase().startsWith(query),
    )
    return match ?? ""
  }, [value, history])

  const completionText = useMemo(() => {
    if (!inlineMatch) return ""
    const normalizedInput = value
    if (!normalizedInput) return ""
    const matchLower = inlineMatch.toLowerCase()
    const inputLower = normalizedInput.toLowerCase()
    if (!matchLower.startsWith(inputLower)) return ""
    if (matchLower === inputLower) return ""
    return inlineMatch.slice(normalizedInput.length)
  }, [inlineMatch, value])

  const addToHistory = useCallback(
    (entry: string) => {
      const trimmed = entry.trim()
      if (!trimmed) return
      const lower = trimmed.toLowerCase()
      const inDefaults = INDICATION_OPTIONS.some(
        (option) => option.toLowerCase() === lower,
      )
      if (inDefaults) return
      setHistory((prev) => {
        if (prev.some((item) => item.toLowerCase() === lower)) {
          return prev
        }
        return [trimmed, ...prev].slice(0, 10)
      })
    },
    [setHistory],
  )

  const removeFromHistory = useCallback((entry: string) => {
    setHistory((prev) => prev.filter((item) => item !== entry))
  }, [])

  const commitValue = useCallback(
    (next: string) => {
      onChange(next)
      addToHistory(next)
      setMenuOpen(false)
    },
    [addToHistory, onChange],
  )

  return (
    <div className={cn("space-y-2", className)} ref={fieldRef}>
      <p className="text-sm font-medium text-muted-foreground">Indication</p>
      <div className="relative">
        <Input
          value={value}
          autoComplete="off"
          onChange={(event) => {
            onChange(event.target.value)
            setMenuOpen(true)
          }}
          onFocus={() => setMenuOpen(true)}
          onBlur={(event) => addToHistory(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Tab" && completionText) {
              event.preventDefault()
              commitValue(inlineMatch)
            } else if (event.key === "Enter") {
              event.preventDefault()
              const nextValue = completionText ? inlineMatch : event.currentTarget.value
              commitValue(nextValue)
            }
          }}
          placeholder="Start typing or pick a saved indication"
          className="w-full pr-24"
        />
        {completionText && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-sm text-muted-foreground/50">
            <span className="opacity-0 whitespace-pre">{value}</span>
            <span>{completionText}</span>
          </div>
        )}
        {completionText && (
          <div className="pointer-events-none absolute inset-y-0 right-12 hidden items-center gap-1 pr-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:flex">
            <SquareSplitHorizontal className="h-3 w-3" />
            Tab
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          className="absolute inset-y-0 right-0 h-full rounded-l-none border-l px-3 text-muted-foreground"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle indication suggestions"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              menuOpen && "rotate-180",
            )}
          />
        </Button>
        {menuOpen && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg">
            <ul>
              {INDICATION_OPTIONS.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className="flex w-full items-start px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => commitValue(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
              {history.length > 0 && (
                <>
                  <li>
                    <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      Saved indications
                    </div>
                  </li>
                  {history.map((option) => (
                    <li key={option}>
                      <div className="flex items-center justify-between px-3 py-2 hover:bg-muted">
                        <button
                          type="button"
                          className="flex-1 text-left text-sm"
                          onClick={() => commitValue(option)}
                        >
                          {option}
                        </button>
                        <button
                          type="button"
                          className="ml-3 text-xs text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${option}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            removeFromHistory(option)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
