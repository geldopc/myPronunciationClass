import { cn } from "@/lib/utils";

type Width = "form" | "content" | "wide";

type Props = {
	id: string;
	width?: Width;
	className?: string;
	children: React.ReactNode;
};

const WIDTH_CLASS: Record<Width, string> = {
	form: "shell-form",
	content: "shell-content",
	wide: "shell-wide",
};

/**
 * Single source of truth for page layout: fluid padding and a width ceiling
 * matched to the content type. Pages declare intent (`width`) instead of
 * repeating breakpoint class strings.
 */
export function PageShell({
	id,
	width = "content",
	className,
	children,
}: Props) {
	return (
		<main id={id} className={cn("page-shell", WIDTH_CLASS[width], className)}>
			{children}
		</main>
	);
}
