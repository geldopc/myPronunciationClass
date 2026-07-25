import type { Phrase } from "@/lib/lessons";

type Props = {
	phrases: Phrase[];
	duration: number;
	currentTime: number;
	selectedPhraseId: string | null;
	pendingStart: number | null;
	pendingEnd: number | null;
	onSelectPhrase: (id: string) => void;
};

const COLORS = [
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f59e0b",
	"#10b981",
	"#06b6d4",
];

const TIME_LABEL_PCTS = [0, 0.2, 0.4, 0.6, 0.8, 1];

function timeToX(time: number, duration: number): number {
	if (duration <= 0) return 0;
	return Math.min((time / duration) * 1000, 1000);
}

function formatLabel(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60)
		.toString()
		.padStart(2, "0");
	return `${m}:${s}`;
}

export function Timeline({
	phrases,
	duration,
	currentTime,
	selectedPhraseId,
	pendingStart,
	pendingEnd,
	onSelectPhrase,
}: Props) {
	const sorted = [...phrases].sort((a, b) => a.startTime - b.startTime);

	function handleClick(e: React.MouseEvent<SVGSVGElement>) {
		if (duration <= 0) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const relX = (e.clientX - rect.left) / rect.width;
		const clickedTime = relX * duration;

		const hit = sorted.find(
			(p) => clickedTime >= p.startTime && clickedTime <= p.endTime
		);
		if (hit) onSelectPhrase(hit.id);
	}

	const hasPending =
		pendingStart !== null && pendingEnd !== null && pendingEnd > pendingStart;

	const playheadX = timeToX(currentTime, duration);

	return (
		<div id="clip-editor-timeline" className="space-y-1">
			<svg
				viewBox="0 0 1000 58"
				preserveAspectRatio="none"
				role="img"
				aria-label="Phrase timeline. Click a segment to select it."
				className="w-full cursor-pointer rounded-md border border-border"
				style={{ height: 58 }}
				onClick={handleClick}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
				}}
			>
				{/* Track background */}
				<rect
					x={0}
					y={4}
					width={1000}
					height={50}
					rx={4}
					fill="hsl(var(--muted))"
				/>

				{/* Phrase segments */}
				{sorted.map((phrase, i) => {
					const x = timeToX(phrase.startTime, duration);
					const w = Math.max(timeToX(phrase.endTime, duration) - x, 8);
					const isSelected = phrase.id === selectedPhraseId;
					const color = COLORS[i % COLORS.length];

					return (
						<g key={phrase.id}>
							<rect
								x={x}
								y={4}
								width={w}
								height={50}
								rx={3}
								fill={color}
								fillOpacity={isSelected ? 1 : 0.7}
								stroke={isSelected ? "white" : "none"}
								strokeWidth={isSelected ? 2 : 0}
							/>
							{w > 18 && (
								<text
									x={x + w / 2}
									y={32}
									textAnchor="middle"
									dominantBaseline="middle"
									fontSize={11}
									fill="white"
									fontWeight="600"
									style={{ pointerEvents: "none", userSelect: "none" }}
								>
									{phrase.order}
								</text>
							)}
						</g>
					);
				})}

				{/* Pending segment */}
				{hasPending && (
					<rect
						x={timeToX(pendingStart ?? 0, duration)}
						y={4}
						width={Math.max(
							timeToX(pendingEnd ?? 0, duration) -
								timeToX(pendingStart ?? 0, duration),
							4
						)}
						height={50}
						rx={3}
						fill="white"
						fillOpacity={0.35}
						stroke="white"
						strokeWidth={1.5}
						strokeDasharray="4 3"
						style={{ pointerEvents: "none" }}
					/>
				)}

				{/* Playhead */}
				{duration > 0 && (
					<line
						x1={playheadX}
						y1={4}
						x2={playheadX}
						y2={54}
						stroke="white"
						strokeWidth={1.5}
						strokeOpacity={0.85}
						style={{ pointerEvents: "none" }}
					/>
				)}
			</svg>

			{/* Time labels */}
			{duration > 0 && (
				<div className="flex justify-between font-mono text-xs text-muted-foreground/60">
					{TIME_LABEL_PCTS.map((pct) => (
						<span key={pct}>{formatLabel(pct * duration)}</span>
					))}
				</div>
			)}
		</div>
	);
}
