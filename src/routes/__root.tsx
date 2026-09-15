import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ErrorScreen } from "@/components/ErrorScreen";
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
			/* Browser translation merges React's text nodes into <font>
			   wrappers and React then throws removeChild on nodes it no
			   longer owns. Wrapping dynamic text in spans (059e4f8) was not
			   enough — real Translate keeps rewriting through a
			   MutationObserver. Off until the app ships its own locales. */
			{
				name: "google",
				content: "notranslate",
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
		<main className="page-shell shell-form">
			<h1 className="text-page-title font-semibold">404</h1>
			<p>The requested page could not be found.</p>
		</main>
	),
	errorComponent: ErrorScreen,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" translate="no" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem('mpc-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
					}}
				/>
				{/* Settings ride on the tag rather than a pre-assigned
				    window.goatcounter, which collides with the script's own
				    initialisation. no_onload because the router counts every
				    navigation itself, including the first. */}
				<script
					async
					data-goatcounter="https://geldopc.goatcounter.com/count"
					data-goatcounter-settings='{"no_onload": true}'
					src="https://gc.zgo.at/count.js"
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
