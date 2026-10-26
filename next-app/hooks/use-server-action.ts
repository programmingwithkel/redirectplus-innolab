"use client"

import { useTransition } from "react"
import { toast } from "@/components/ui/toast"

export type ServerActionResult =
  | { success: true; message: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

interface RunOptions<TResult> {
  onSuccess?: (result: Extract<TResult, { success: true }>) => void
  onError?: (result: Extract<TResult, { success: false }>) => void
}

/**
 * Runs a server action inside a transition, shows a toast with the outcome,
 * and exposes `pending` for disabling UI. Reusable by any feature whose
 * actions return a ServerActionResult.
 */
export function useServerAction<TInput, TResult extends ServerActionResult>(
  action: (input: TInput) => Promise<TResult>
) {
  const [pending, startTransition] = useTransition()

  function run(input: TInput, options: RunOptions<TResult> = {}) {
    startTransition(async () => {
      try {
        const result = await action(input)
        if (result.success) {
          toast.add({ title: result.message, type: "success" })
          options.onSuccess?.(result as Extract<TResult, { success: true }>)
        } else {
          toast.add({ title: "Action failed", description: result.error, type: "error" })
          options.onError?.(result as Extract<TResult, { success: false }>)
        }
      } catch {
        toast.add({
          title: "Network error",
          description: "Could not reach the server. Check your connection and try again.",
          type: "error",
        })
      }
    })
  }

  return { run, pending }
}
