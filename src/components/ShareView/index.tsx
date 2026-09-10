import { useEffect, useState } from "react";

import { PageShell } from "@/components/PageShell";
import { ProgressStats } from "@/components/ProgressStats";
import type { Share } from "@/lib/progress-model";
import { readShare } from "@/lib/shares";

type LoadState =
	| { status: "loading" }
	| { status: "found"; share: Share }
	| { status: "missing" };

export function ShareView({ slug }: { slug: string }) {
	const [state, setState] = useState<LoadState>({ status: "loading" });

	useEffect(() => {
		let active = true;
		void readShare(slug)
			.then((share) => {
				if (!active) return;
				setState(share ? { status: "found", share } : { status: "missing" });
			})
			.catch(() => {
				if (active) setState({ status: "missing" });
			});
		return () => {
			active = false;
		};
	}, [slug]);

	if (state.status === "loading") {
		return <PageShell id="share-view" width="form" />;
	}

	if (state.status === "missing") {
		return (
			<PageShell id="share-view" width="form" className="text-center">
				<p className="text-muted-foreground">
					Link não encontrado ou revogado.
				</p>
			</PageShell>
		);
	}

	return (
		<PageShell id="share-view" width="form">
			<ProgressStats
				rollups={state.share.snapshot}
				displayName={state.share.displayName}
				avatarUrl={state.share.avatarUrl}
				phrases={[]}
			/>
		</PageShell>
	);
}
