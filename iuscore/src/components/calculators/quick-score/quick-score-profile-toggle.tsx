"use client"

import { Button } from "@/components/ui/button"
import type { DiseaseProfile } from "@/lib/segments"
import { cn } from "@/lib/utils"

interface QuickScoreProfileToggleProps {
  activeProfile: DiseaseProfile
  onProfileChange: (profile: DiseaseProfile) => void
  className?: string
}

export function QuickScoreProfileToggle({
  activeProfile,
  onProfileChange,
  className,
}: QuickScoreProfileToggleProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {(["uc", "cd"] as const).map((profile) => (
        <Button
          key={profile}
          type="button"
          variant={activeProfile === profile ? "default" : "outline"}
          className={cn(
            "rounded-full px-6",
            activeProfile === profile &&
              (profile === "uc" ? "bg-emerald-500 text-white" : "bg-sky-600 text-white"),
          )}
          onClick={() => onProfileChange(profile)}
        >
          {profile === "uc" ? "Milan (UC)" : "IBUS-SAS (CD)"}
        </Button>
      ))}
    </div>
  )
}
