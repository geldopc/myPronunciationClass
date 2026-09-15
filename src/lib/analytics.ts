declare global {
	interface Window {
		goatcounter?: {
			count?: (vars: { path: string }) => void;
			no_onload?: boolean;
		};
	}
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* Recorded paths drop the deploy prefix: every page would otherwise start
   with /myPronunciationClass, which is constant and tells you nothing. */
function normalizePath(pathname: string): string {
	if (!BASE || !pathname.startsWith(BASE)) return pathname || "/";
	return pathname.slice(BASE.length) || "/";
}

/**
 * Counts one page view. Safe to call before the script has loaded, when it
 * was blocked, or during SSR — a missed count must never break navigation,
 * which is the only thing the caller actually cares about.
 *
 * GoatCounter skips localhost on its own, so development does not pollute
 * the numbers.
 */
export function countPageView(pathname?: string): void {
	if (typeof window === "undefined") return;
	const count = window.goatcounter?.count;
	if (typeof count !== "function") return;
	try {
		count({
			path: normalizePath(pathname ?? window.location.pathname),
		});
	} catch {
		/* Analytics is not worth an exception in the navigation path. */
	}
}
