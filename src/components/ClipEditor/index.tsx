import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, Save, Scissors, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Timeline } from "@/components/ClipEditor/Timeline"
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer"
import { deletePhrase, fetchPhrases, upsertPhrase } from "@/lib/lessons"
import type { Phrase } from "@/lib/lessons"

type FormData = {
  text: string
  speaker: string
  pronunciationHint: string
  startTime: number
  endTime: number
  order: number
}

const EMPTY_FORM: FormData = {
  text: "",
  speaker: "",
  pronunciationHint: "",
  startTime: 0,
  endTime: 0,
  order: 1,
}

type Props = {
  lessonId: string
  videoId: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(1).padStart(4, "0")
  return `${m}:${s}`
}

export function ClipEditor({ lessonId, videoId }: Props) {
  const containerId = "clip-editor-player"

  const { playSegment, pause, getCurrentTime, getDuration, ready } =
    useYouTubePlayer(containerId, videoId)

  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loadingPhrases, setLoadingPhrases] = useState(true)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPhraseId, setSelectedPhraseId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadPhrases = useCallback(async () => {
    setLoadingPhrases(true)
    try {
      const data = await fetchPhrases(lessonId)
      setPhrases([...data].sort((a, b) => a.startTime - b.startTime))
    } finally {
      setLoadingPhrases(false)
    }
  }, [lessonId])

  useEffect(() => {
    loadPhrases()
  }, [loadPhrases])

  useEffect(() => {
    if (ready) setDuration(getDuration())
  }, [ready, getDuration])

  useEffect(() => {
    pollRef.current = setInterval(() => setCurrentTime(getCurrentTime()), 250)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [getCurrentTime])

  function selectPhrase(id: string) {
    const phrase = phrases.find((p) => p.id === id)
    if (!phrase) return
    setSelectedPhraseId(id)
    setForm({
      text: phrase.text,
      speaker: phrase.speaker,
      pronunciationHint: phrase.pronunciationHint,
      startTime: phrase.startTime,
      endTime: phrase.endTime,
      order: phrase.order,
    })
    setError(null)
  }

  function newPhrase() {
    setSelectedPhraseId(null)
    setForm({ ...EMPTY_FORM, order: phrases.length + 1 })
    setError(null)
  }

  function handleMarkStart() {
    setForm((prev) => ({
      ...prev,
      startTime: parseFloat(getCurrentTime().toFixed(3)),
    }))
  }

  function handleMarkEnd() {
    setForm((prev) => ({
      ...prev,
      endTime: parseFloat(getCurrentTime().toFixed(3)),
    }))
  }

  function handlePreview() {
    if (form.endTime > form.startTime) {
      playSegment(form.startTime, form.endTime)
      setIsPlaying(true)
    }
  }

  function handlePause() {
    pause()
    setIsPlaying(false)
  }

  async function handleSave() {
    if (!form.text.trim()) {
      setError("Text is required.")
      return
    }
    if (form.endTime <= form.startTime) {
      setError("End time must be after start time.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await upsertPhrase(lessonId, selectedPhraseId, {
        text: form.text,
        speaker: form.speaker,
        pronunciationHint: form.pronunciationHint,
        startTime: form.startTime,
        endTime: form.endTime,
        order: form.order,
      })
      await loadPhrases()
    } catch {
      setError("Failed to save. Try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedPhraseId) return
    if (!window.confirm("Delete this phrase?")) return
    setDeleting(true)
    try {
      await deletePhrase(lessonId, selectedPhraseId)
      await loadPhrases()
      newPhrase()
    } catch {
      setError("Failed to delete. Try again.")
    } finally {
      setDeleting(false)
    }
  }

  const overlap = phrases.some(
    (p) =>
      p.id !== selectedPhraseId &&
      form.endTime > form.startTime &&
      form.startTime < p.endTime &&
      form.endTime > p.startTime
  )

  return (
    <div id="clip-editor" className="space-y-4">
      {/* 16:9 player */}
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
        style={{ paddingBottom: "56.25%" }}
      >
        <div id={containerId} className="absolute inset-0" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-white/50">Loading player…</span>
          </div>
        )}
      </div>

      {/* Player controls row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex gap-2">
          {isPlaying ? (
            <Button size="sm" variant="outline" onClick={handlePause}>
              <Pause />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={!ready}
              onClick={() => {
                playSegment(0, duration)
                setIsPlaying(true)
              }}
            >
              <Play />
              Play
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!ready}
            onClick={handleMarkStart}
          >
            <Scissors />
            Mark start
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!ready}
            onClick={handleMarkEnd}
          >
            <Scissors />
            Mark end
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={newPhrase}
        >
          + New phrase
        </Button>
      </div>

      {/* Timeline + Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Timeline
          </p>
          {loadingPhrases ? (
            <div className="h-15 animate-pulse rounded-md bg-muted" />
          ) : (
            <Timeline
              phrases={phrases}
              duration={duration}
              selectedPhraseId={selectedPhraseId}
              pendingStart={form.startTime || null}
              pendingEnd={form.endTime || null}
              onSelectPhrase={selectPhrase}
            />
          )}
          {overlap && (
            <p className="text-xs text-destructive">
              Warning: segment overlaps an existing clip.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {phrases.length} phrase{phrases.length !== 1 ? "s" : ""} · click a
            segment to edit
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {selectedPhraseId ? "Edit phrase" : "New phrase"}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ce-start">Start (s)</Label>
              <Input
                id="ce-start"
                type="number"
                step="0.001"
                value={form.startTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    startTime: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ce-end">End (s)</Label>
              <Input
                id="ce-end"
                type="number"
                step="0.001"
                value={form.endTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    endTime: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ce-text">Text</Label>
            <Input
              id="ce-text"
              value={form.text}
              placeholder="Phrase text…"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, text: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ce-speaker">Speaker</Label>
            <Input
              id="ce-speaker"
              value={form.speaker}
              placeholder="e.g. Ross"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, speaker: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ce-hint">Pronunciation hint</Label>
            <Input
              id="ce-hint"
              value={form.pronunciationHint}
              placeholder="Optional…"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  pronunciationHint: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ce-order">Order</Label>
            <Input
              id="ce-order"
              type="number"
              value={form.order}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  order: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              disabled={!ready}
              onClick={handlePreview}
            >
              <Play />
              Preview
            </Button>
            <Button size="sm" disabled={saving} onClick={handleSave}>
              <Save />
              {saving ? "Saving…" : "Save"}
            </Button>
            {selectedPhraseId && (
              <Button
                size="sm"
                variant="destructive"
                disabled={deleting}
                onClick={handleDelete}
              >
                <Trash2 />
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
