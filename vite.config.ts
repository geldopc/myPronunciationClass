import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig(({ command }) => ({
	base: command === "build" ? "/myPronunciationClass/" : "/",
	server: {
		port: 3000,
		warmup: {
			clientFiles: [
				"./src/routes/__root.tsx",
				"./src/routes/lessons/$lessonId.tsx",
				"./src/components/ListeningSpeakingApp/index.tsx",
			],
		},
	},
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart({ spa: { enabled: true } }),
		viteReact(),
	],
}));

export default config;
