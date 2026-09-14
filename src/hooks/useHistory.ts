import { useCallback, useRef, useState } from 'react'

const MAX_HISTORY = 40

export function useHistory<T>(initial: T) {
  const [state, setState] = useState(initial)
  const past = useRef<T[]>([])
  const future = useRef<T[]>([])

  const push = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      past.current = [...past.current.slice(-(MAX_HISTORY - 1)), prev]
      future.current = []
      return value
    })
  }, [])

  const undo = useCallback(() => {
    setState((prev) => {
      if (past.current.length === 0) return prev
      const previous = past.current[past.current.length - 1]
      past.current = past.current.slice(0, -1)
      future.current = [prev, ...future.current]
      return previous
    })
  }, [])

  const redo = useCallback(() => {
    setState((prev) => {
      if (future.current.length === 0) return prev
      const next = future.current[0]
      future.current = future.current.slice(1)
      past.current = [...past.current, prev]
      return next
    })
  }, [])

  const reset = useCallback((value: T) => {
    past.current = []
    future.current = []
    setState(value)
  }, [])

  const canUndo = past.current.length > 0
  const canRedo = future.current.length > 0

  return { state, setState: push, undo, redo, reset, canUndo, canRedo }
}
