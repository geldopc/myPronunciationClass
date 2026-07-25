import { useEffect, useRef, useState } from "react";

import { getSimilarityPercentage } from "@/lib/text-similarity";

export type SpeechEvaluation = {
	transcript: string;
	score: number;
};

const recognitionErrorMessages: Record<string, string> = {
	"audio-capture": "No microphone found.",
	"not-allowed": "Allow microphone access in your browser.",
	"service-not-allowed": "Speech recognition service is not available.",
	network: "Could not reach the speech recognition service.",
	"no-speech": "No speech detected. Please try again.",
};

type UseSpeechRecognitionOptions = {
	supported: boolean;
	onEvaluation: (evaluation: SpeechEvaluation) => void;
	onRecordingChange: (recording: boolean) => void;
};

export function useSpeechRecognition({
	supported,
	onEvaluation,
	onRecordingChange,
}: UseSpeechRecognitionOptions) {
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		return () => {
			recognitionRef.current?.abort();
		};
	}, []);

	function finish() {
		setIsRecording(false);
		onRecordingChange(false);
	}

	function start(targetText: string) {
		if (!supported) return;

		const SpeechRecognitionApi =
			window.SpeechRecognition ?? window.webkitSpeechRecognition;
		if (!SpeechRecognitionApi) return;

		setError(null);
		const recognition = new SpeechRecognitionApi();
		recognitionRef.current = recognition;
		recognition.lang = "en-US";
		recognition.continuous = false;
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;

		recognition.onstart = () => {
			setIsRecording(true);
			onRecordingChange(true);
		};

		recognition.onresult = (event) => {
			const lastResult = event.results[event.results.length - 1];
			const transcript = lastResult[0].transcript.trim();

			onEvaluation({
				transcript,
				score: getSimilarityPercentage(targetText, transcript),
			});
		};

		recognition.onerror = (event) => {
			setError(
				recognitionErrorMessages[event.error] ?? "Could not recognize speech."
			);
			finish();
		};

		recognition.onend = finish;

		try {
			setIsRecording(true);
			onRecordingChange(true);
			recognition.start();
		} catch {
			setError("Recording is already starting. Please try again.");
			finish();
		}
	}

	function stop() {
		recognitionRef.current?.stop();
	}

	return { isRecording, error, start, stop };
}
