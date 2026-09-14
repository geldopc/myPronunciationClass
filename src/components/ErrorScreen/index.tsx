import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

type Props = {
	error: Error;
	reset: () => void;
};

/* Without this the router falls back to printing the raw exception, which is
   how a guest came to read "Failed to execute 'removeChild' on 'Node'" off the
   screen. A person can act on "try again"; they cannot act on a stack trace. */
export function ErrorScreen({ error, reset }: Props) {
	return (
		<main
			id="error-screen"
			className="page-shell shell-form flex min-h-screen flex-col justify-center gap-6"
		>
			<div className="space-y-2">
				<h1 className="text-page-title font-semibold">Something broke here</h1>
				<p className="text-sm text-muted-foreground">
					Not your fault, and nothing you did was lost. Try again — if it keeps
					happening, reload the page.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button id="error-screen-retry" size="sm" onClick={reset}>
					Try again
				</Button>
				<Button id="error-screen-lessons" asChild size="sm" variant="outline">
					<Link to="/lessons">Back to lessons</Link>
				</Button>
			</div>

			{/* Kept reachable but out of the way: useless to a learner, and the
			    first thing worth pasting when someone reports the problem. */}
			<details className="text-xs text-muted-foreground">
				<summary className="cursor-pointer">Technical details</summary>
				<p className="mt-2 font-mono break-words">{error.message}</p>
			</details>
		</main>
	);
}
