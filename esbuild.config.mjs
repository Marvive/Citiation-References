/**
 * Logos References - Build Configuration
 * Custom esbuild setup for Logos References Plugin
 */

import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const banner = `/*
 * Logos References Plugin (Bundled)
 * Source: https://github.com/Marvive/Logos-References
 * Maintained by Michael Marvive
 */
`;

const isProd = process.argv.includes("production");

const buildSettings = {
	banner: { js: banner },
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins
	],
	format: "cjs",
	target: "es2020",
	logLevel: "info",
	sourcemap: isProd ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
	minify: isProd,
};

async function runBuild() {
	try {
		const context = await esbuild.context(buildSettings);
		if (isProd) {
			console.log("Building for production...");
			await context.rebuild();
			await context.dispose();
			console.log("Production build complete.");
		} else {
			console.log("Starting development watch mode...");
			await context.watch();
		}
	} catch (error) {
		console.error("Build failed:", error);
		process.exit(1);
	}
}

runBuild();
