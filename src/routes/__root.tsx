import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/Auth";
import { ThemeProvider } from "@/providers/Theme";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "myPronunciationClass",
			},
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: `${import.meta.env.BASE_URL}favicon.svg`,
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	notFoundComponent: () => (
		<main className="w-full max-w-2xl p-4 pt-16">
			<h1>404</h1>
			<p>The requested page could not be found.</p>
		</main>
	),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem('mpc-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
					}}
				/>
				<HeadContent />
			</head>
			<body suppressHydrationWarning>
				<ThemeProvider>
					<AuthProvider>{children}</AuthProvider>
					<Toaster richColors position="bottom-right" />
				</ThemeProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
