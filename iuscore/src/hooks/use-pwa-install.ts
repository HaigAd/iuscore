import { useCallback, useEffect, useMemo, useState } from "react"

const DISPLAY_MODE_MEDIA = "(display-mode: standalone)"

function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return false
  }

  const media = window.matchMedia?.(DISPLAY_MODE_MEDIA)
  const mediaMatch = media ? media.matches : false
  const navigatorStandalone =
    typeof navigator !== "undefined" &&
    typeof (navigator as unknown as { standalone?: boolean }).standalone !== "undefined" &&
    Boolean((navigator as unknown as { standalone?: boolean }).standalone)

  return mediaMatch || navigatorStandalone
}

function browserIsIosSafari() {
  if (typeof navigator === "undefined") {
    return false
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const isIos = /iphone|ipad|ipod/.test(userAgent)
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|chrome/.test(userAgent)

  return isIos && isSafari
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandaloneDisplay())
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setInstallPromptAvailable(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setInstallPromptAvailable(false)
      setIsStandalone(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    const media = window.matchMedia?.(DISPLAY_MODE_MEDIA)
    const handleDisplayModeChange = () => {
      setIsStandalone(isStandaloneDisplay())
    }

    if (media) {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handleDisplayModeChange)
      } else if (typeof media.addListener === "function") {
        media.addListener(handleDisplayModeChange)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      if (media) {
        if (typeof media.removeEventListener === "function") {
          media.removeEventListener("change", handleDisplayModeChange)
        } else if (typeof media.removeListener === "function") {
          media.removeListener(handleDisplayModeChange)
        }
      }
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { accepted: false, outcome: undefined as "accepted" | "dismissed" | undefined }
    }

    try {
      deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setInstallPromptAvailable(false)
      return { accepted: choice.outcome === "accepted", outcome: choice.outcome }
    } catch (error) {
      setDeferredPrompt(null)
      setInstallPromptAvailable(false)
      return { accepted: false, outcome: undefined as "accepted" | "dismissed" | undefined }
    }
  }, [deferredPrompt])

  const resetPrompt = useCallback(() => {
    setDeferredPrompt(null)
    setInstallPromptAvailable(false)
  }, [])

  const needsIosHint = useMemo(() => !isStandalone && browserIsIosSafari(), [isStandalone])

  return {
    canInstall: installPromptAvailable,
    isStandalone,
    needsIosHint,
    promptInstall,
    dismissPrompt: resetPrompt,
  }
}
