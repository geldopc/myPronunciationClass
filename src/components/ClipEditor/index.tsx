import {
	ArrowLeftToLine,
	ArrowRightToLine,
	Download,
	ListVideo,
	Pause,
	Play,
	Plus,
	Save,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Timeline } from "@/components/ClipEditor/Timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import type { Phrase } from "@/lib/lessons";
import { deletePhrase, fetchPhrases, upsertPhrase } from "@/lib/lessons";
import { exportPhrases } from "@/lib/mock/store";

type CaptionCue = { start: number; end: number; text: string };

async function fetchCaptions(videoId: string): Promise<CaptionCue[]> {
	try {
		const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
		const res = await fetch(url);
		if (!res.ok) return [];
		const data: {
			events?: Array<{
				tStartMs?: number;
				dDurationMs?: number;
				segs?: Array<{ utf8?: string }>;
			}>;
		} = await res.json();
		return (data.events ?? [])
			.filter((e) => e.segs)
			.map((e) => ({
				start: (e.tStartMs ?? 0) / 1000,
				end: ((e.tStartMs ?? 0) + (e.dDurationMs ?? 0)) / 1000,
				text: (e.segs ?? [])
					.map((s) => s.utf8 ?? "")
					.join("")
					.replace(/\n/g, " ")
					.trim(),
			}))
			.filter((c) => c.text);
	} catch {
		return [];
	}
}

type FormData = {
	text: string;
	speaker: string;
	pronunciationHint: string;
	startTime: number;
	endTime: number;
	order: number;
};

const EMPTY_FORM: FormData = {
	text: "",
	speaker: "",
	pronunciationHint: "",
	startTime: 0,
	endTime: 0,
	order: 1,
};

const SEGMENT_COLORS = [
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f59e0b",
	"#10b981",
	"#06b6d4",
];

type Props = {
	lessonId: string;
	videoId: string;
};

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = (seconds % 60).toFixed(1).padStart(4, "0");
	return `${m}:${s}`;
}

function formatTimeShort(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60)
		.toString()
		.padStart(2, "0");
	return `${m}:${s}`;
}

export function ClipEditor({ lessonId, videoId }: Props) {
	const containerId = "clip-editor-player";

	const { playSegment, pause, getCurrentTime, getDuration, ready } =
		useYouTubePlayer(containerId, videoId);

	const [phrases, setPhrases] = useState<Phrase[]>([]);
	const [loadingPhrases, setLoadingPhrases] = useState(true);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [selectedPhraseId, setSelectedPhraseId] = useState<string | null>(null);
	const [form, setForm] = useState<FormData>(EMPTY_FORM);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [captions, setCaptions] = useState<CaptionCue[]>([]);

	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const loadPhrases = useCallback(async () => {
		setLoadingPhrases(true);
		try {
			const data = await fetchPhrases(lessonId);
			setPhrases([...data].sort((a, b) => a.startTime - b.startTime));
		} finally {
			setLoadingPhrases(false);
		}
	}, [lessonId]);

	useEffect(() => {
		loadPhrases();
	}, [loadPhrases]);

	useEffect(() => {
		fetchCaptions(videoId).then(setCaptions);
	}, [videoId]);

	useEffect(() => {
		if (ready) setDuration(getDuration());
	}, [ready, getDuration]);

	useEffect(() => {
		if (!ready) return;
		pollRef.current = setInterval(() => setCurrentTime(getCurrentTime()), 250);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [ready, getCurrentTime]);

	function selectPhrase(id: string) {
		const phrase = phrases.find((p) => p.id === id);
		if (!phrase) return;
		setSelectedPhraseId(id);
		setForm({
			text: phrase.text,
			speaker: phrase.speaker,
			pronunciationHint: phrase.pronunciationHint,
			startTime: phrase.startTime,
			endTime: phrase.endTime,
			order: phrase.order,
		});
		setError(null);
	}

	function newPhrase() {
		setSelectedPhraseId(null);
		setForm({ ...EMPTY_FORM, order: phrases.length + 1 });
		setError(null);
	}

	function handleMarkStart() {
		setForm((prev) => ({
			...prev,
			startTime: parseFloat(getCurrentTime().toFixed(3)),
		}));
	}

	function handleMarkEnd() {
		const end = parseFloat(getCurrentTime().toFixed(3));
		setForm((prev) => {
			if (!prev.text.trim() && captions.length > 0) {
				const autoText = captions
					.filter((c) => c.start < end && c.end > prev.startTime)
					.map((c) => c.text)
					.join(" ")
					.trim();
				if (autoText) {
					toast.info("Texto capturado da legenda");
					return { ...prev, endTime: end, text: autoText };
				}
			}
			return { ...prev, endTime: end };
		});
	}

	function handlePreview() {
		if (form.endTime > form.startTime) {
			playSegment(form.startTime, form.endTime);
			setIsPlaying(true);
		}
	}

	function handlePause() {
		pause();
		setIsPlaying(false);
	}

	async function handleSave() {
		if (!form.text.trim()) {
			setError("Text is required.");
			return;
		}
		if (form.endTime <= form.startTime) {
			setError("End time must be after start time.");
			return;
		}
		setError(null);
		const savedEndTime = form.endTime;
		const savedOrder = form.order;
		const wasNew = !selectedPhraseId;
		setSaving(true);
		const toastId = toast.loading("Salvando corte…");
		try {
			await upsertPhrase(lessonId, selectedPhraseId, {
				text: form.text,
				speaker: form.speaker,
				pronunciationHint: form.pronunciationHint,
				startTime: form.startTime,
				endTime: form.endTime,
				order: form.order,
			});
			await loadPhrases();
			toast.success("Corte salvo", { id: toastId });
			if (wasNew) {
				setSelectedPhraseId(null);
				setForm({
					text: "",
					speaker: "",
					pronunciationHint: "",
					startTime: savedEndTime,
					endTime: 0,
					order: savedOrder + 1,
				});
			}
		} catch {
			toast.error("Erro ao salvar. Tente novamente.", { id: toastId });
			setError("Failed to save. Try again.");
		} finally {
			setSaving(false);
		}
	}

	function handleExportJSON() {
		const data = exportPhrases(lessonId);
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${lessonId}-phrases.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleDelete() {
		if (!selectedPhraseId) return;
		if (!window.confirm("Delete this phrase?")) return;
		setDeleting(true);
		try {
			await deletePhrase(lessonId, selectedPhraseId);
			await loadPhrases();
			newPhrase();
		} catch {
			setError("Failed to delete. Try again.");
		} finally {
			setDeleting(false);
		}
	}

	const overlap = phrases.some(
		(p) =>
			p.id !== selectedPhraseId &&
			form.endTime > form.startTime &&
			form.startTime < p.endTime &&
			form.endTime > p.startTime
	);

	return (
		<div
			id="clip-editor"
			className="flex flex-col gap-4 lg:flex-row lg:items-start"
		>
			{/* Left column: video + controls + timeline */}
			<div className="min-w-0 flex-1 space-y-3">
				<div className="video-frame relative overflow-hidden rounded-lg border border-border bg-black">
					<div id={containerId} className="absolute inset-0" />
					{!ready && (
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="text-sm text-white/50">Loading player…</span>
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<span className="min-w-28 font-mono text-sm text-muted-foreground tabular-nums">
						{formatTime(currentTime)} / {formatTime(duration)}
					</span>
					<Button
						id="clip-editor-play"
						size="sm"
						variant="outline"
						disabled={!ready}
						onClick={
							isPlaying
								? handlePause
								: () => {
										playSegment(0, duration);
										setIsPlaying(true);
									}
						}
					>
						{isPlaying ? <Pause /> : <Play />}
						{isPlaying ? "Pause" : "Play"}
					</Button>
					<Button
						id="clip-editor-mark-start"
						size="sm"
						variant="secondary"
						disabled={!ready}
						onClick={handleMarkStart}
						title="Mark current time as start"
					>
						<ArrowLeftToLine />
						Mark start
					</Button>
					<Button
						id="clip-editor-mark-end"
						size="sm"
						variant="secondary"
						disabled={!ready}
						onClick={handleMarkEnd}
						title="Mark current time as end"
					>
						Mark end
						<ArrowRightToLine />
					</Button>
				</div>

				<div className="space-y-1">
					{loadingPhrases ? (
						<div className="h-24 animate-pulse rounded-md bg-muted" />
					) : (
						<Timeline
							phrases={phrases}
							duration={duration}
							currentTime={currentTime}
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
				</div>
			</div>

			{/* Right column: phrase list + form */}
			<div
				id="clip-editor-panel"
				className="w-full min-w-0 space-y-3 lg:editor-panel"
			>
				<div id="clip-editor-phrases" className="space-y-2">
					<div className="flex items-center justify-between">
						<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
							<ListVideo className="h-3.5 w-3.5" />
							{phrases.length} phrase{phrases.length !== 1 ? "s" : ""}
						</p>
						<div className="flex items-center gap-1">
							<Button
								id="clip-editor-export"
								size="sm"
								variant="ghost"
								className="h-7 gap-1 px-2 text-xs"
								onClick={handleExportJSON}
								title="Download phrases as JSON"
							>
								<Download className="h-3.5 w-3.5" />
								JSON
							</Button>
							<Button
								id="clip-editor-new"
								size="sm"
								variant="outline"
								className="h-7 gap-1 px-2 text-xs"
								onClick={newPhrase}
							>
								<Plus className="h-3.5 w-3.5" />
								New phrase
							</Button>
						</div>
					</div>

					<div className="max-h-56 overflow-y-auto rounded-md border border-border">
						{phrases.length === 0 && !loadingPhrases ? (
							<p className="py-6 text-center text-xs text-muted-foreground">
								No phrases yet — mark a segment and save
							</p>
						) : (
							phrases.map((phrase, i) => (
								<button
									key={phrase.id}
									id={`phrase-item-${phrase.id}`}
									type="button"
									onClick={() => selectPhrase(phrase.id)}
									className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${selectedPhraseId === phrase.id ? "bg-accent" : ""}`}
								>
									<div className="flex items-center gap-2">
										<span
											className="h-2 w-2 shrink-0 rounded-full"
											style={{
												background: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
											}}
										/>
										<span className="font-mono text-xs text-muted-foreground">
											{formatTimeShort(phrase.startTime)} →{" "}
											{formatTimeShort(phrase.endTime)}
										</span>
										{phrase.speaker && (
											<span className="shrink-0 text-xs text-muted-foreground">
												· {phrase.speaker}
											</span>
										)}
									</div>
									<p className="mt-0.5 truncate text-xs">
										{phrase.text || "—"}
									</p>
								</button>
							))
						)}
					</div>
				</div>

				<div
					id="clip-editor-form"
					className="space-y-3 rounded-lg border border-border p-3"
				>
					<p className="text-xs font-medium text-muted-foreground">
						{selectedPhraseId ? "Edit phrase" : "New phrase"}
					</p>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1">
							<Label htmlFor="ce-start" className="text-xs">
								Start (s)
							</Label>
							<Input
								id="ce-start"
								type="number"
								step="0.001"
								className="h-8 font-mono text-sm"
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
							<Label htmlFor="ce-end" className="text-xs">
								End (s)
							</Label>
							<Input
								id="ce-end"
								type="number"
								step="0.001"
								className="h-8 font-mono text-sm"
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
						<Label htmlFor="ce-text" className="text-xs">
							Text *
						</Label>
						<Input
							id="ce-text"
							className="h-8 text-sm"
							value={form.text}
							placeholder="Phrase text…"
							onChange={(e) =>
								setForm((prev) => ({ ...prev, text: e.target.value }))
							}
						/>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1">
							<Label htmlFor="ce-speaker" className="text-xs">
								Speaker
							</Label>
							<Input
								id="ce-speaker"
								className="h-8 text-sm"
								value={form.speaker}
								placeholder="e.g. Ross"
								onChange={(e) =>
									setForm((prev) => ({ ...prev, speaker: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="ce-order" className="text-xs">
								Order
							</Label>
							<Input
								id="ce-order"
								type="number"
								className="h-8 text-sm"
								value={form.order}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										order: parseInt(e.target.value, 10) || 1,
									}))
								}
							/>
						</div>
					</div>

					<div className="space-y-1">
						<Label htmlFor="ce-hint" className="text-xs">
							Pronunciation hint
						</Label>
						<Input
							id="ce-hint"
							className="h-8 text-sm"
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

					{error && <p className="text-xs text-destructive">{error}</p>}

					<div className="flex gap-2">
						<Button
							id="clip-editor-preview"
							size="sm"
							variant="outline"
							className="h-8"
							disabled={!ready}
							onClick={handlePreview}
						>
							<Play />
							Preview
						</Button>
						<Button
							id="clip-editor-save"
							size="sm"
							className="h-8 flex-1"
							disabled={saving}
							onClick={handleSave}
						>
							<Save />
							{saving ? "Salvando…" : "Salvar"}
						</Button>
						{selectedPhraseId && (
							<Button
								id="clip-editor-delete"
								size="sm"
								variant="destructive"
								className="h-8 px-2"
								disabled={deleting}
								onClick={handleDelete}
							>
								<Trash2 />
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
