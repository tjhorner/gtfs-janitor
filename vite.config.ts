import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import viteYaml from "@modyfi/vite-plugin-yaml"

export default defineConfig({
	plugins: [
		sveltekit(),
		nodePolyfills(),
		viteYaml()
	]
});
