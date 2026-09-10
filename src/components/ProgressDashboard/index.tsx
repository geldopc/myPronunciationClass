import { useMemo } from "react";
import { RadialBar, RadialBarChart } from "recharts";
import type { Lesson } from "@/lib/lessons";
import type {
	LessonRollup,
	PhraseInfo,
	PhraseStat,
	Rollups,
} from "@/lib/progress-model";

type Props = {
	rollups: Rollups;
	phraseStats: PhraseStat[];
	byLesson: LessonRollup[];
	lessons: Lesson[];
	phraseInfoById: Map<string, PhraseInfo>;
};

function DonutChart({ value, size = 128 }: { value: number; size?: number }) {
	const cx = size / 2;
	const innerRadius = size * 0.28;
	const outerRadius = size * 0.44;
	const donutEndAngle = 90 - (360 * value) / 100;

	return (
		<div className="relative shrink-0" style={{ width: size, height: size }}>
			<div className="absolute inset-0">
				<RadialBarChart
					width={size}
					height={size}
					cx={cx}
					cy={cx}
					innerRadius={innerRadius}
					outerRadius={outerRadius}
					startAngle={90}
					endAngle={-270}
					data={[{ value: 1 }]}
				>
					<RadialBar
						dataKey="value"
						fill="hsl(var(--muted))"
						isAnimationActive={false}
					/>
				</RadialBarChart>
			</div>
			{value > 0 && (
				<div className="absolute inset-0">
					<RadialBarChart
						width={size}
						height={size}
						cx={cx}
						cy={cx}
						innerRadius={innerRadius}
						outerRadius={outerRadius}
						startAngle={90}
						endAngle={donutEndAngle}
						data={[{ value: 1 }]}
					>
						<RadialBar dataKey="value" fill="#22c55e" />
					</RadialBarChart>
				</div>
			)}
			<div className="absolute inset-0 flex items-center justify-center">
				<span
					className={size >= 100 ? "text-xl font-bold" : "text-xs font-bold"}
				>
					{value}%
				</span>
			</div>
		</div>
	);
}

function PhraseRow({
	stat,
	phraseInfoById,
	lessons,
	tone,
}: {
	stat: PhraseStat;
	phraseInfoById: Map<string, PhraseInfo>;
	lessons: Lesson[];
	tone: "good" | "bad";
}) {
	const info = phraseInfoById.get(stat.phraseId);
	const lessonTitle = info
		? lessons.find((l) => l.id === info.lessonId)?.title
		: undefined;

	return (
		<li className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
			<div className="min-w-0">
				<p className="truncate">{info?.text ?? `Phrase ${stat.phraseId}`}</p>
				{lessonTitle && (
					<p className="truncate text-xs text-muted-foreground">
						{lessonTitle}
					</p>
				)}
			</div>
			<span
				className={
					tone === "good"
						? "shrink-0 font-medium text-green-500 dark:text-green-400"
						: "shrink-0 font-medium text-red-400 dark:text-red-300"
				}
			>
				{stat.bestScore}
			</span>
		</li>
	);
}

export function ProgressDashboard({
	rollups,
	phraseStats,
	byLesson,
	lessons,
	phraseInfoById,
}: Props) {
	const { top5, worst5 } = useMemo(() => {
		const attempted = phraseStats.filter((s) => s.attemptsCount > 0);
		const best5 = [...attempted]
			.sort((a, b) => b.bestScore - a.bestScore)
			.slice(0, 5);
		const bottom5 = [...attempted]
			.sort((a, b) => a.bestScore - b.bestScore)
			.filter((s) => !best5.some((t) => t.phraseId === s.phraseId))
			.slice(0, 5);
		return { top5: best5, worst5: bottom5 };
	}, [phraseStats]);

	const sortedByLesson = useMemo(
		() =>
			[...byLesson].sort(
				(a, b) => (b.lastPracticedAt ?? 0) - (a.lastPracticedAt ?? 0)
			),
		[byLesson]
	);

	return (
		<div id="progress-dashboard" className="space-y-8">
			{/* Metrics row: donut + stat tiles */}
			<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
				<div className="flex flex-col items-center gap-1 sm:shrink-0">
					<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Overall
					</span>
					<DonutChart value={rollups.completion} />
				</div>
				<dl className="grid flex-1 grid-cols-3 gap-3 text-center">
					<div className="flex flex-col-reverse rounded-lg border border-border bg-card p-4">
						<dt className="text-sm text-muted-foreground">Completion</dt>
						<dd className="text-2xl font-bold">{rollups.completion}%</dd>
					</div>
					<div className="flex flex-col-reverse rounded-lg border border-border bg-card p-4">
						<dt className="text-sm text-muted-foreground">Average</dt>
						<dd className="text-2xl font-bold">{rollups.average}</dd>
					</div>
					<div className="flex flex-col-reverse rounded-lg border border-border bg-card p-4">
						<dt className="text-sm text-muted-foreground">Streak</dt>
						<dd className="text-2xl font-bold">{rollups.streak}</dd>
					</div>
				</dl>
			</div>

			{/* Progress by lesson — the primary breakdown */}
			<section>
				<h2 className="mb-3 text-sm font-semibold">Progress by lesson</h2>
				{sortedByLesson.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Practice a lesson to see your progress here.
					</p>
				) : (
					<div className="auto-grid-wide">
						{sortedByLesson.map((row) => {
							const lesson = lessons.find((l) => l.id === row.lessonId);
							if (!lesson) return null;
							const lastDate = row.lastPracticedAt
								? new Date(row.lastPracticedAt).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
									})
								: null;
							return (
								<div
									key={row.lessonId}
									id={`lesson-progress-${row.lessonId}`}
									className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
								>
									<DonutChart value={row.completion} size={56} />
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold">
											{lesson.title}
										</p>
										<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
											<span>{lesson.phraseCount} phrases</span>
											{row.average > 0 && <span>Avg {row.average}</span>}
											{lastDate && <span>Last {lastDate}</span>}
										</div>
									</div>
									{lesson.thumbnailUrl && (
										<img
											src={lesson.thumbnailUrl}
											alt=""
											className="hidden h-14 w-24 shrink-0 rounded-md object-cover sm:block"
										/>
									)}
								</div>
							);
						})}
					</div>
				)}
			</section>

			{/* Top 5 / Worst 5 phrase lists — across every lesson */}
			<div className="split-grid">
				<div>
					<h2 className="mb-2 text-sm font-semibold">Top 5 phrases</h2>
					{top5.length === 0 ? (
						<p className="text-sm text-muted-foreground">No data yet</p>
					) : (
						<ol className="space-y-1.5">
							{top5.map((stat) => (
								<PhraseRow
									key={stat.phraseId}
									stat={stat}
									phraseInfoById={phraseInfoById}
									lessons={lessons}
									tone="good"
								/>
							))}
						</ol>
					)}
				</div>
				<div>
					<h2 className="mb-2 text-sm font-semibold">Needs practice</h2>
					{worst5.length === 0 ? (
						<p className="text-sm text-muted-foreground">No data yet</p>
					) : (
						<ol className="space-y-1.5">
							{worst5.map((stat) => (
								<PhraseRow
									key={stat.phraseId}
									stat={stat}
									phraseInfoById={phraseInfoById}
									lessons={lessons}
									tone="bad"
								/>
							))}
						</ol>
					)}
				</div>
			</div>
		</div>
	);
}
