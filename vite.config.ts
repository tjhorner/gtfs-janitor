import { defineConfig } from "vitest/config"
import { sveltekit } from "@sveltejs/kit/vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import viteYaml from "@modyfi/vite-plugin-yaml"

export default defineConfig({
    plugins: [
		sveltekit(),
		nodePolyfills(),
		viteYaml()
	],

    test: {
        include: ['src/**/*.{test,spec}.{js,ts}']
    }
});
