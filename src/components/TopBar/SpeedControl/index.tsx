import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const playbackRates = [0.5, 0.75, 1, 1.25, 1.5] as const
export type PlaybackRate = (typeof playbackRates)[number]

type SpeedControlProps = {
  value: PlaybackRate
  onChange: (value: PlaybackRate) => void
  className?: string
}

export function SpeedControl({
  value,
  onChange,
  className,
}: SpeedControlProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(Number(next) as PlaybackRate)}
    >
      <SelectTrigger
        id="speed-control"
        aria-label="Playback speed"
        className={className}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {playbackRates.map((rate) => (
          <SelectItem key={rate} value={String(rate)}>
            {rate.toFixed(rate % 1 === 0 ? 1 : 2)}x
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
