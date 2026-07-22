import { useEffect, useState } from "react"
import { fetchLessons } from "@/lib/lessons"
import type { Lesson } from "@/lib/lessons"

export function useLessons(): { lessons: Lesson[]; loading: boolean } {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLessons()
      .then(setLessons)
      .finally(() => setLoading(false))
  }, [])

  return { lessons, loading }
}
