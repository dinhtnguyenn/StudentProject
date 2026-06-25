import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator'
import fs from 'fs'

function getSwVersion() {
  try {
    return fs.readFileSync('.sw-version', 'utf8').trim()
  } catch {
    return 'dev'
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: '/',
  define: {
    __SW_VERSION__: JSON.stringify(getSwVersion()),
  },
  plugins: [
    react(),
    command === 'build' ? obfuscatorPlugin({
      include: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
      exclude: [/node_modules/],
      options: {
        domainLock: ['unifolio.io.vn', 'www.unifolio.io.vn'],
        domainLockRedirectUrl: 'about:blank',
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        selfDefending: false,
        simplify: true,
        splitStrings: false,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.3,
        transformObjectKeys: false,
        unicodeEscapeSequence: false
      }
    }) : undefined
  ],
}))
