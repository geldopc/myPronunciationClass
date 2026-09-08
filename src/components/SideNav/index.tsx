import { Link } from "@tanstack/react-router";
import {
	BookOpenIcon,
	LayoutDashboardIcon,
	ListVideoIcon,
	TrendingUpIcon,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { AuthControl } from "@/components/TopBar/AuthControl";
import { ThemeToggle } from "@/components/TopBar/ThemeToggle";
import { useAdmin } from "@/hooks/useAdmin";

const NAV_ITEMS = [
	{
		to: "/lessons" as const,
		label: "Lessons",
		icon: BookOpenIcon,
		exact: false,
		adminOnly: false,
	},
	{
		to: "/admin/lessons" as const,
		label: "Clips",
		icon: ListVideoIcon,
		exact: false,
		adminOnly: true,
	},
	{
		to: "/admin" as const,
		label: "Admin",
		icon: LayoutDashboardIcon,
		exact: true,
		adminOnly: true,
	},
	{
		to: "/progress" as const,
		label: "My progress",
		icon: TrendingUpIcon,
		exact: false,
		adminOnly: false,
	},
];

export function SideNav() {
	const { isAdmin } = useAdmin();
	const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

	return (
		<nav
			id="side-nav"
			className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/30 bg-background/50 px-4 backdrop-blur-xl lg:h-screen lg:w-64 lg:flex-col lg:items-stretch lg:justify-start lg:border-r lg:border-b-0 lg:px-0 lg:py-4"
		>
			<Link
				to="/lessons"
				aria-label="myPronunciationClass — go to lessons"
				className="flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:px-4"
			>
				<Logo className="h-8 w-auto shrink-0" />
				<span className="hidden whitespace-nowrap font-brand text-lg tracking-tight sm:inline">
					My Pronunciation Class
				</span>
			</Link>

			<div className="hidden lg:mt-6 lg:flex lg:flex-1 lg:flex-col lg:gap-1 lg:px-3">
				{items.map(({ to, label, icon: Icon, exact }) => (
					<Link
						key={to}
						to={to}
						activeOptions={{ exact }}
						activeProps={{ className: "bg-accent text-foreground" }}
						className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						<Icon className="h-4 w-4" />
						{label}
					</Link>
				))}
			</div>

			<div className="flex shrink-0 items-center gap-2 lg:mt-auto lg:px-3 lg:pt-4">
				<ThemeToggle />
				<AuthControl />
			</div>
		</nav>
	);
}
