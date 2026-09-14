import { useCallback, useEffect, useRef, useState } from "react";

let apiScriptAdded = false;

function loadYouTubeApi() {
	if (apiScriptAdded) return;
	apiScriptAdded = true;
	const tag = document.createElement("script");
	tag.src = "https://www.youtube.com/iframe_api";
	document.head.appendChild(tag);
}

export function useYouTubePlayer(
	containerId: string,
	videoId: string,
	onError?: () => void,
	onSegmentEnd?: () => void
): {
	playSegment: (start: number, end: number) => void;
	pause: () => void;
	setRate: (rate: number) => void;
	seekTo: (time: number) => void;
	getCurrentTime: () => number;
	getDuration: () => number;
	ready: boolean;
} {
	const playerRef = useRef<YT.Player | null>(null);
	const rafRef = useRef<number>(0);
	const endTimeRef = useRef<number>(0);
	const readyRef = useRef(false);
	const pendingRateRef = useRef<number>(1);
	const [ready, setReady] = useState(false);
	const onSegmentEndRef = useRef(onSegmentEnd);
	useEffect(() => {
		onSegmentEndRef.current = onSegmentEnd;
	}, [onSegmentEnd]);

	useEffect(() => {
		/* No video yet means no player. The id arrives empty on the first render
		   while the lesson loads, and building a player for it only to tear it
		   down when the real id lands is what put React and the YouTube API in
		   conflict over the same nodes. */
		if (!videoId) return;

		let active = true;
		/* Everything YouTube touches lives inside a host this hook creates and
		   removes itself. React's container then keeps exactly the children
		   React gave it, so destroy() can never pull a node out from under it. */
		let host: HTMLDivElement | null = null;

		function initPlayer() {
			if (!active) return;
			const container = document.getElementById(containerId);
			if (!container) return;
			host = document.createElement("div");
			host.style.cssText = "position:absolute;inset:0";
			container.appendChild(host);
			const inner = document.createElement("div");
			host.appendChild(inner);
			playerRef.current = new window.YT.Player(inner, {
				videoId: videoId,
				playerVars: { rel: 0, modestbranding: 1, controls: 1 },
				events: {
					onReady: () => {
						if (active) {
							readyRef.current = true;
							// Make the generated iframe fill its absolute-positioned container
							const iframe = playerRef.current?.getIframe();
							if (iframe) {
								iframe.style.cssText =
									"position:absolute;inset:0;width:100%;height:100%";
							}
							if (typeof playerRef.current?.setPlaybackRate === "function") {
								playerRef.current.setPlaybackRate(pendingRateRef.current);
							}
							setReady(true);
						}
					},
					onError: () => {
						if (active) onError?.();
					},
				},
			});
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (typeof window.YT !== "undefined" && window.YT.Player) {
			initPlayer();
		} else {
			const prev = window.onYouTubeIframeAPIReady;
			window.onYouTubeIframeAPIReady = () => {
				prev?.();
				initPlayer();
			};
			loadYouTubeApi();
		}

		return () => {
			active = false;
			readyRef.current = false;
			setReady(false);
			cancelAnimationFrame(rafRef.current);
			try {
				playerRef.current?.destroy();
			} catch {
				/* The API detaches its own iframe on teardown and can throw doing
				   it; that must not surface as an error inside React's unmount. */
			}
			playerRef.current = null;
			host?.remove();
			host = null;
		};
	}, [containerId, videoId, onError]);

	const playSegment = useCallback((startTime: number, endTime: number) => {
		if (!playerRef.current || !readyRef.current) return;
		cancelAnimationFrame(rafRef.current);
		endTimeRef.current = endTime;
		playerRef.current.seekTo(startTime, true);
		playerRef.current.playVideo();

		function poll() {
			if (!playerRef.current) return;
			if (playerRef.current.getCurrentTime() >= endTimeRef.current) {
				playerRef.current.pauseVideo();
				onSegmentEndRef.current?.();
				return;
			}
			rafRef.current = requestAnimationFrame(poll);
		}
		rafRef.current = requestAnimationFrame(poll);
	}, []);

	/* Guards check readyRef, not just a null ref: YT.Player returns an object
	   immediately but only attaches its API methods once onReady fires, so
	   optional chaining alone still calls an undefined method. */
	const pause = useCallback(() => {
		cancelAnimationFrame(rafRef.current);
		if (!readyRef.current) return;
		playerRef.current?.pauseVideo();
	}, []);

	const setRate = useCallback((rate: number) => {
		pendingRateRef.current = rate;
		if (typeof playerRef.current?.setPlaybackRate === "function") {
			playerRef.current.setPlaybackRate(rate);
		}
	}, []);

	const seekTo = useCallback((time: number) => {
		cancelAnimationFrame(rafRef.current);
		if (!readyRef.current) return;
		playerRef.current?.seekTo(time, true);
	}, []);

	const getCurrentTime = useCallback((): number => {
		if (!readyRef.current) return 0;
		return playerRef.current?.getCurrentTime() ?? 0;
	}, []);

	const getDuration = useCallback((): number => {
		if (!readyRef.current) return 0;
		return playerRef.current?.getDuration() ?? 0;
	}, []);

	return {
		playSegment,
		pause,
		setRate,
		seekTo,
		getCurrentTime,
		getDuration,
		ready,
	};
}
