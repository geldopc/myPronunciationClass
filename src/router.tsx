import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { countPageView } from "@/lib/analytics";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const base = import.meta.env.BASE_URL;
	const router = createTanStackRouter({
		routeTree,
		basepath: base === "/" ? undefined : base.replace(/\/$/, ""),
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	/* Counted here rather than from a component: this is a single-page app, so
	   the analytics script's own load-time count fires once and never again.
	   Subscribing to the router catches every navigation, including the first,
	   and needs no router context of its own. */
	if (typeof window !== "undefined") {
		router.subscribe("onResolved", ({ toLocation }) => {
			countPageView(toLocation.pathname);
		});
	}

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
