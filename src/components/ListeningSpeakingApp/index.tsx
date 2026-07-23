import { useCallback, useEffect, useRef, useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { Galaxy } from "@/components/Galaxy";
import { PhraseList } from "@/components/PhraseList";
import { ShapeGrid } from "@/components/ShapeGrid";
import { TopBar } from "@/components/TopBar";
import type { PlaybackRate } from "@/components/TopBar/SpeedControl";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useLesson } from "@/hooks/useLesson";
import { useProgress } from "@/hooks/useProgress";
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import type { Difficulty } from "@/lib/difficulty";
import type { Phrase } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/Auth";
import { useTheme } from "@/providers/Theme";

const HARDCODED_LESSON_ID = "friends-s5e14";

export function ListeningSpeakingApp() {
	const [difficulty, setDifficulty] = useState<Difficulty>("easy");
	const [focusMode, setFocusMode] = useState(true);
	const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
	const [currentPhraseId, setCurrentPhraseId] = useState<string>("");
	const [recordingPhraseId, setRecordingPhraseId] = useState<string | null>(
		null,
	);
	const [evaluations, setEvaluations] = useState<
		Record<string, SpeechEvaluation>
	>({});
	const [supportsSpeechRecognition, setSupportsSpeechRecognition] =
		useState(false);

	const { theme } = useTheme();
	const isDark = theme === "dark";

	const { user } = useAuth();
	const {
		lesson,
		phrases,
		loading: lessonLoading,
	} = useLesson(HARDCODED_LESSON_ID);
	const { recordEvaluation } = useProgress(HARDCODED_LESSON_ID, phrases.length);
	const adoptedRef = useRef(false);

	// Set first phrase once lesson phrases load
	useEffect(() => {
		if (phrases.length > 0 && currentPhraseId === "") {
			setCurrentPhraseId(phrases[0].id);
		}
	}, [phrases, currentPhraseId]);

	const [videoPlayingId, setVideoPlayingId] = useState<string | null>(null);
	const toggleRegistry = useRef(new Map<string, () => void>());

	const handleVideoError = useCallback((): void => {}, []);
	const handleVideoSegmentEnd = useCallback(() => setVideoPlayingId(null), []);
	const youtubeId = lesson?.youtubeId ?? "";
	const { playSegment, pause, setRate } = useYouTubePlayer(
		"yt-player",
		youtubeId,
		handleVideoError,
		handleVideoSegmentEnd,
	);

	const handleVideoPause = useCallback(() => {
		pause();
		setVideoPlayingId(null);
	}, [pause]);

	useEffect(() => {
		setRate(playbackRate);
	}, [playbackRate, setRate]);

	useEffect(() => {
		setSupportsSpeechRecognition(
			Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition),
		);
	}, []);

	const registerToggle = useCallback(
		(phraseId: string, toggle: (() => void) | null) => {
			if (toggle) {
				toggleRegistry.current.set(phraseId, toggle);
			} else {
				toggleRegistry.current.delete(phraseId);
			}
		},
		[],
	);

	const handlePlay = useCallback(
		(phrase: Phrase) => {
			if (recordingPhraseId !== null) return;
			setCurrentPhraseId(phrase.id);
			if (videoPlayingId === phrase.id) {
				handleVideoPause();
			} else {
				playSegment(phrase.startTime, phrase.endTime);
				setVideoPlayingId(phrase.id);
			}
		},
		[recordingPhraseId, videoPlayingId, playSegment, handleVideoPause],
	);

	function handleRecordingChange(phraseId: string | null) {
		setRecordingPhraseId(phraseId);
		if (phraseId !== null) setCurrentPhraseId(phraseId);
	}

	function saveEvaluation(phraseId: string, evaluation: SpeechEvaluation) {
		setEvaluations((current) => ({ ...current, [phraseId]: evaluation }));
		void recordEvaluation(
			phraseId,
			HARDCODED_LESSON_ID,
			difficulty,
			evaluation,
		);
	}

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === "INPUT" || target.tagName === "TEXTAREA")
			) {
				return;
			}

			const index = phrases.findIndex(
				(phrase) => phrase.id === currentPhraseId,
			);
			const currentPhrase = phrases[index];

			if (event.code === "Space") {
				event.preventDefault();
				handlePlay(currentPhrase);
			} else if (event.key.toLowerCase() === "r") {
				event.preventDefault();
				toggleRegistry.current.get(currentPhraseId)?.();
			} else if (event.key === "ArrowLeft" && index > 0) {
				setCurrentPhraseId(phrases[index - 1].id);
			} else if (event.key === "ArrowRight" && index < phrases.length - 1) {
				setCurrentPhraseId(phrases[index + 1].id);
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [currentPhraseId, handlePlay, phrases]);

	useEffect(() => {
		if (!user || adoptedRef.current) return;
		adoptedRef.current = true;
		for (const [phraseId, evaluation] of Object.entries(evaluations)) {
			void recordEvaluation(
				phraseId,
				HARDCODED_LESSON_ID,
				difficulty,
				evaluation,
			);
		}
	}, [user, evaluations, difficulty, recordEvaluation]);

	if (lessonLoading || phrases.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<span className="text-muted-foreground text-sm">Loading lesson…</span>
			</div>
		);
	}

	const completedCount = Object.keys(evaluations).length;
	const currentPhrase =
		phrases.find((p) => p.id === currentPhraseId) ?? phrases[0];
	const currentPhraseIndex = phrases.findIndex((p) => p.id === currentPhraseId);
	const effectivePlayingId = videoPlayingId;
	const isVideoMode = focusMode;

	return (
		<div id="listening-speaking-app" className="relative min-h-screen">
			{/* Background — fixed, behind all content */}
			<div
				className={`fixed inset-0 -z-10 ${isDark ? "bg-zinc-950" : "bg-white"}`}
			>
				{difficulty === "hard" &&
					(isDark ? (
						<Galaxy
							mouseInteraction
							mouseRepulsion
							saturation={0.25}
							hueShift={220}
							glowIntensity={0.4}
							twinkleIntensity={0.35}
							rotationSpeed={0.06}
							density={1.2}
						/>
					) : (
						<ShapeGrid
							direction="diagonal"
							speed={0.3}
							borderColor="#e2e8f0"
							hoverFillColor="#f1f5f9"
							squareSize={50}
							shape="square"
							hoverTrailAmount={4}
						/>
					))}
			</div>

			<TopBar />

			<main
				className="flex flex-col mx-auto px-4 pt-4 max-w-3xl overflow-hidden container"
				style={{
					height: "calc(100dvh - 60px)",
					paddingBottom: "max(96px, calc(56px + env(safe-area-inset-bottom)))",
				}}
			>
				{/* Unified wrapper: in video+focus mode this div becomes the card surface
            (rounded, shadow, bg-card) so VideoPlayer and PhraseCard share one panel.
            VideoPlayer is always mounted to keep #yt-player in the DOM. */}
				<div
					className={cn(
						"flex flex-col min-h-0",
						isVideoMode &&
							"flex-1 overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10",
					)}
				>
					{isVideoMode && (
						<div className="flex flex-row justify-between items-center px-4 py-2 h-1/12 text-sm">
							<div
								id="yt-player-top-left"
								className="flex flex-row items-center gap-2"
							>
								<span className="inline-flex justify-center items-center bg-muted rounded-full size-6 font-medium text-foreground text-xs">
									{currentPhrase.speaker.charAt(0)}
								</span>
								<span className="font-medium text-foreground">
									{currentPhrase.speaker}
								</span>
							</div>
							<span
								id="yt-player-top-right"
								className="tabular-nums text-muted-foreground text-xs"
							>
								{String(currentPhraseIndex + 1).padStart(2, "0")} /{" "}
								{phrases.length}
							</span>
						</div>
					)}
					<VideoPlayer
						phrase={currentPhrase}
						isActive={isVideoMode}
						unified={isVideoMode}
						onPause={handleVideoPause}
					/>
					<PhraseList
						phrases={phrases}
						difficulty={difficulty}
						focusMode={focusMode}
						currentPhraseId={currentPhraseId}
						onCurrentPhraseChange={setCurrentPhraseId}
						playingId={effectivePlayingId}
						recordingPhraseId={recordingPhraseId}
						supportsSpeechRecognition={supportsSpeechRecognition}
						evaluations={evaluations}
						videoMode={isVideoMode}
						onPlay={handlePlay}
						onRecordingChange={handleRecordingChange}
						onEvaluation={saveEvaluation}
						registerToggle={registerToggle}
					/>
				</div>
			</main>

			<BottomNav
				difficulty={difficulty}
				onDifficultyChange={setDifficulty}
				playbackRate={playbackRate}
				onPlaybackRateChange={setPlaybackRate}
				focusMode={focusMode}
				onFocusModeChange={setFocusMode}
				completedCount={completedCount}
				total={phrases.length}
			/>
		</div>
	);
}
