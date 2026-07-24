import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import changelogRaw from "../../../CHANGELOG.md?raw";

type ChangelogSection = {
	heading: string;
	bullets: string[];
};

function parseChangelog(raw: string): ChangelogSection[] {
	return raw
		.split("\n## ")
		.filter(Boolean)
		.map((block) => {
			const lines = block.trim().split("\n");
			const heading = lines[0].replace(/^## /, "").trim();
			const bullets = lines
				.slice(1)
				.filter((l) => l.startsWith("- "))
				.map((l) => l.slice(2).trim());
			return { heading, bullets };
		});
}

const sections = parseChangelog(changelogRaw);

export function AboutDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const currentVersion = sections[0]?.heading ?? "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent id="about-dialog" className="max-w-md">
				<DialogHeader>
					<div className="mb-2 flex items-center gap-3">
						<Logo className="h-8 w-auto" />
						<div>
							<DialogTitle className="text-base font-semibold">
								myPronunciationClass
							</DialogTitle>
							<p className="text-xs text-muted-foreground">{currentVersion}</p>
						</div>
					</div>
					<p className="text-sm text-muted-foreground">
						Practice English pronunciation with real TV scenes — listen, repeat,
						and get scored on each phrase.
					</p>
				</DialogHeader>

				<div className="max-h-72 space-y-4 overflow-y-auto py-2">
					{sections.map((section) => (
						<div key={section.heading}>
							<p className="mb-1 text-xs font-semibold text-foreground">
								{section.heading}
							</p>
							<ul className="space-y-1">
								{section.bullets.map((bullet) => (
									<li
										key={bullet}
										className="flex gap-2 text-sm text-muted-foreground"
									>
										<span aria-hidden="true">·</span>
										<span>{bullet}</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
