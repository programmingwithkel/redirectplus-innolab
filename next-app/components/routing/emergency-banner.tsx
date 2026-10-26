import { AlertTriangle, PhoneCall } from "lucide-react"

export function EmergencyBanner({
  message = "If the patient presents with life-threatening symptoms, immediately contact emergency services or proceed to the nearest emergency department.",
}: {
  message?: string
}) {
  return (
    <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-red-900">
              Immediate Emergency Protocol
            </h4>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
              <PhoneCall className="h-3 w-3" /> Dial 911 / Local Rescue
            </span>
          </div>
          <p className="text-xs text-red-800 leading-relaxed">{message}</p>
          <p className="text-[11px] text-red-700 font-medium">
            ⚠ Clinical safety rule: Redirect+ recommendations support triage and routing coordination, but never override a clinician's professional judgment or delay urgent resuscitation.
          </p>
        </div>
      </div>
    </div>
  )
}
