import { useMemo, useState } from "react"
import { CalendarDays, ClipboardCheck, RotateCcw } from "lucide-react"

import { SegmentCard } from "@/components/segments/segment-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { DiseaseProfile, SegmentData, SegmentUpdate } from "@/lib/segments"
import {
  createSegmentInstance,
  crohnsAdditionalSegments,
  defaultSegments,
} from "@/lib/segments"
import { buildReportInsights, buildReportText } from "@/lib/report-builder"
import { cn } from "@/lib/utils"
import { IndicationSelector } from "@/components/indication/indication-selector"

const profileMeta: Record<
  DiseaseProfile,
  { label: string; accent: string; description: string }
> = {
  uc: {
    label: "Ulcerative colitis",
    accent: "bg-emerald-500/10 text-emerald-700",
    description: "Segmental disease activity per Milan ultrasound criteria",
  },
  cd: {
    label: "Crohn's disease",
    accent: "bg-sky-500/10 text-sky-700",
    description: "IBUS standard activity scoring for Crohn's disease",
  },
}

export default function App() {
  const [profile, setProfile] = useState<DiseaseProfile>("uc")
  const [segments, setSegments] = useState<SegmentData[]>(() =>
    defaultSegments.map((segment) => createSegmentInstance(segment)),
  )
  const [indication, setIndication] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const examDate = useMemo(() => new Date(), [])
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(examDate),
    [examDate],
  )

  const visibleSegments = useMemo(
    () =>
      segments.filter((segment) =>
        profile === "uc" ? !segment.isSmallBowel : true,
      ),
    [segments, profile],
  )

  const reportInsights = useMemo(
    () => buildReportInsights({ profile, segments: visibleSegments }),
    [profile, visibleSegments],
  )
  const { autoImpression, findingsText, imagingQualitySummary } = reportInsights

  const reportText = buildReportText({
    date: formattedDate,
    indication,
    imagingQuality: imagingQualitySummary,
    findingsText,
    impression: autoImpression,
  })

  const handleSegmentChange = (
    instanceId: SegmentData["instanceId"],
    updates: SegmentUpdate,
  ) => {
    setSegments((current) =>
      current.map((segment) =>
        segment.instanceId === instanceId ? { ...segment, ...updates } : segment,
      ),
    )
  }

  const handleRemoveSegment = (instanceId: SegmentData["instanceId"]) => {
    setSegments((current) => current.filter((segment) => segment.instanceId !== instanceId))
  }

  const handleAddSegment = (segmentId: SegmentData["id"]) => {
    const template = crohnsAdditionalSegments.find((segment) => segment.id === segmentId)
    if (!template) return
    setSegments((current) => [...current, createSegmentInstance(template)])
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  const resetReport = () => {
    setSegments(defaultSegments.map((segment) => createSegmentInstance(segment)))
    setIndication("")
    setCopied(false)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-white">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:px-10">
        <header className="grid gap-6 rounded-3xl border border-border/70 bg-white/90 p-8 shadow-[0_25px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
                IUScore
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Structured Intestinal Ultrasound Reporting
              </h1>
            </div>
            <Badge className="gap-2 bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
              {formattedDate}
            </Badge>
          </div>
          <p className="max-w-3xl text-base text-muted-foreground">
            Structured report generator with easy, evidence-based score reporting. Utilizes the 
            IBUS-SAS for Crohn's disease and Milan Ultrasound Criteria for Ulcerative Colitis.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {(
              [
                { id: "uc", label: profileMeta.uc.label },
                { id: "cd", label: profileMeta.cd.label },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={profile === item.id ? "default" : "outline"}
                className={cn(
                  "rounded-full px-6",
                  profile === item.id &&
                    (item.id === "uc" ? "bg-emerald-500 text-white" : "bg-sky-600 text-white"),
                )}
                onClick={() => {
                  setProfile(item.id)
                }}
              >
                {item.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-dashed"
              onClick={resetReport}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset report
            </Button>
          </div>
          <div className="space-y-4">
            <IndicationSelector value={indication} onChange={setIndication} />
            
          </div>
        </header>

        <section className="grid gap-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Segment review
          </h2>
          <div className="space-y-5">
            {visibleSegments.map((segment, index) => (
              <SegmentCard
                key={segment.instanceId}
                segment={segment}
                profile={profile}
                tabOrder={index + 1}
                onChange={(updates) => handleSegmentChange(segment.instanceId, updates)}
                onRemove={
                  profile === "cd" && segment.isDynamic
                    ? () => handleRemoveSegment(segment.instanceId)
                    : undefined
                }
              />
            ))}
            {profile === "cd" && (
              <Card className="border-dashed border-border/70 bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Add segment</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Drop in additional small bowel targets for Crohn&apos;s assessments.
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {crohnsAdditionalSegments.map((segment) => {
                    const existingCount = segments.filter(
                      (existing) => existing.id === segment.id,
                    ).length
                    return (
                      <Button
                        key={segment.id}
                        type="button"
                        variant={existingCount ? "outline" : "secondary"}
                        className="rounded-full"
                        onClick={() => handleAddSegment(segment.id)}
                      >
                        {existingCount ? `${segment.label} (${existingCount})` : segment.label}
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="grid gap-6">
          <Card className="border-border/70 bg-slate-950 text-white">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg font-semibold">One-click report</CardTitle>
              </div>
              <Badge className="bg-white/10 text-white">
                {profile === "uc" ? "Milan" : "IBUS-SAS"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={reportText}
                readOnly
                tabIndex={visibleSegments.length + 1}
                className="min-h-[260px] resize-none border-white/20 bg-transparent text-white placeholder:text-white/60"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={handleCopy}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                {copied ? "Copied" : "Copy report"}
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
