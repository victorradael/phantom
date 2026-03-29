import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()]
    },
    preload: {
        // @electron-toolkit/preload is bundled (not externalized) so that it works
        // correctly when sandbox: true is set in webPreferences. Sandboxed preloads
        // can only require('electron') and Node built-ins — npm packages must be
        // inlined into the compiled preload output.
        plugins: [externalizeDepsPlugin({ exclude: ['@electron-toolkit/preload'] })]
    },
    renderer: {
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src')
            }
        },
        plugins: [react()]
    }
})
