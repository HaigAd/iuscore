import { useState } from "react"
import { DownloadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePwaInstall } from "@/hooks/use-pwa-install"

export function InstallPromptBanner({ className }: { className?: string }) {
  const { canInstall, isStandalone, needsIosHint, promptInstall, dismissPrompt } =
    usePwaInstall()
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)

  if (dismissed || isStandalone || (!canInstall && !needsIosHint)) {
    return null
  }

  const handleInstallClick = async () => {
    setBusy(true)
    const result = await promptInstall()
    setBusy(false)
    if (result.accepted) {
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    dismissPrompt()
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-slate-950/90 p-5 text-sm text-slate-100 shadow-[0_12px_40px_rgba(15,23,42,0.2)] backdrop-blur transition-opacity",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-base font-semibold text-white">
            <DownloadCloud className="h-4 w-4" />
            Install IUScore
          </p>
          <p className="max-w-2xl text-slate-200/90">
            Add IUScore to your dock or home screen for a full-screen, offline-friendly reporting experience.
          </p>
          {needsIosHint && (
            <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-100/80">
              Using Safari on iOS? Tap the share icon <span aria-hidden>⬆︎</span> then choose{" "}
              <strong>Add to Home Screen</strong>.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {canInstall && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleInstallClick}
            disabled={busy}
            className="rounded-full bg-white text-slate-900 hover:bg-white/90"
          >
            {busy ? "Requesting..." : "Install app"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full text-slate-200 hover:bg-white/10 hover:text-white"
            onClick={handleDismiss}
          >
            Maybe later
          </Button>
        </div>
      )}
    </div>
  )
}
