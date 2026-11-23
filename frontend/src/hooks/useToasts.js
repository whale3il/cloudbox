import { useCallback, useMemo, useState } from 'react'

let nextId = 1

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (type, message) => {
      const id = nextId++
      setToasts((current) => [...current, { id, type, message }])
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500)
    },
    [dismiss]
  )

  const toast = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
    }),
    [push]
  )

  return { toasts, toast, dismiss }
}
