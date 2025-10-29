import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { ChevronDown, SquareSplitHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ABSENT_VISUALIZATION_REASON } from "@/lib/segments"

const VISUALIZATION_IMPAIRMENT_OPTIONS = [
  "Body habitus",
  ABSENT_VISUALIZATION_REASON,
  "Patient discomfort",
  "Deep pelvic loop",
] as const

const STORAGE_KEY = "iuscore:visualization-impairment-reasons"

interface VisualizationImpairmentSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function VisualizationImpairmentSelector({
  value,
  onChange,
  className,
}: VisualizationImpairmentSelectorProps) {
  const [history, setHistory] = useState<string[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number; width: number }>()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    if (value === VISUALIZATION_IMPAIRMENT_OPTIONS[0]) {
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
      const target = event.target as Node
      const isInsideField = fieldRef.current?.contains(target)
      const isInsideMenu = menuContainerRef.current?.contains(target)
      if (!isInsideField && !isInsideMenu) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => {
      document.removeEventListener("mousedown", handleClick)
    }
  }, [])

  const allOptions = useMemo(
    () =>
      [...VISUALIZATION_IMPAIRMENT_OPTIONS, ...history].filter(Boolean),
    [history],
  )

  const inlineMatch = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return ""
    const match = allOptions.find((option) =>
      option.toLowerCase().startsWith(query),
    )
    return match ?? ""
  }, [value, allOptions])

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

  const addToHistory = useCallback((entry: string) => {
    const trimmed = entry.trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    const inDefaults = VISUALIZATION_IMPAIRMENT_OPTIONS.some(
      (option) => option.toLowerCase() === lower,
    )
    if (inDefaults) return
    setHistory((prev) => {
      if (prev.some((item) => item.toLowerCase() === lower)) {
        return prev
      }
      return [trimmed, ...prev].slice(0, 10)
    })
  }, [])

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

  const updateMenuPosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMenuPosition({
      left: rect.left,
      top: rect.bottom,
      width: rect.width,
    })
  }, [])

  const openMenu = useCallback(() => {
    if (menuOpen) {
      updateMenuPosition()
      return
    }
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        updateMenuPosition()
        setMenuOpen(true)
      })
    } else {
      setMenuOpen(true)
    }
  }, [menuOpen, updateMenuPosition])

  useEffect(() => {
    if (!menuOpen) return
    updateMenuPosition()
    const handle = () => updateMenuPosition()
    window.addEventListener("resize", handle)
    window.addEventListener("scroll", handle, true)
    return () => {
      window.removeEventListener("resize", handle)
      window.removeEventListener("scroll", handle, true)
    }
  }, [menuOpen, updateMenuPosition])

  return (
    <div className={cn("space-y-1", className)} ref={fieldRef}>
      <p className="text-[11px] font-medium text-muted-foreground text-right">
        Impairment reason
      </p>
      <div className="relative" ref={containerRef}>
        <Input
          value={value}
          autoComplete="off"
          onChange={(event) => {
            onChange(event.target.value)
            openMenu()
          }}
          onFocus={() => openMenu()}
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
          placeholder="Start typing or pick a reason"
          className="h-8 w-full max-w-[320px] pr-24 text-sm"
        />
        {completionText && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-sm text-muted-foreground/50">
            <span className="whitespace-pre opacity-0">{value}</span>
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
          onClick={() =>
            setMenuOpen((prev) => {
              const next = !prev
              if (!prev) {
                if (typeof window !== "undefined") {
                  window.requestAnimationFrame(() => {
                    updateMenuPosition()
                  })
                }
              }
              return next
            })
          }
          aria-label="Toggle impairment reason suggestions"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              menuOpen && "rotate-180",
            )}
          />
        </Button>
        {menuOpen &&
          menuPosition &&
          createPortal(
            <div
              ref={menuContainerRef}
              className="fixed z-[2000] max-h-56 overflow-y-auto rounded-md border border-border bg-white shadow-lg"
              style={{
                left: menuPosition.left,
                top: menuPosition.top + 4,
                width: menuPosition.width,
              }}
            >
              <ul>
                {VISUALIZATION_IMPAIRMENT_OPTIONS.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      className="flex w-full items-start px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
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
                        Saved reasons
                      </div>
                    </li>
                    {history.map((option) => (
                      <li key={option}>
                        <div className="flex items-center justify-between px-3 py-2 hover:bg-muted">
                          <button
                            type="button"
                            className="flex-1 text-left text-sm"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                            }}
                            onClick={() => commitValue(option)}
                          >
                            {option}
                          </button>
                          <button
                            type="button"
                            className="ml-3 text-destructive hover:text-destructive"
                            aria-label={`Remove ${option}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              removeFromHistory(option)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>,
            document.body,
          )}
      </div>
    </div>
  )
}
