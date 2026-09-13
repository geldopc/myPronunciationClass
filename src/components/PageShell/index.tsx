import { cn } from "@/lib/utils";

type Width = "form" | "full";

type Props = {
	id: string;
	width?: Width;
	className?: string;
	children: React.ReactNode;
};

const WIDTH_CLASS: Record<Width, string> = {
	form: "shell-form",
	full: "shell-full",
};

/**
 * Single source of truth for page layout: fluid, 8pt-snapped padding.
 *
 * `full` (default) fills the viewport — content ends at the screen edge
 * minus the page padding. `form` keeps a readability ceiling, since a
 * single-column form should never stretch across a wide display.
 */
export function PageShell({ id, width = "full", className, children }: Props) {
	return (
		<main id={id} className={cn("page-shell", WIDTH_CLASS[width], className)}>
			{children}
		</main>
	);
}
