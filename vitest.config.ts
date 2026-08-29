import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'node',
    // tokens.css?raw로 토큰 이름을 읽는 코드가 있다. 기본값이면 CSS가 빈 문자열로 대체된다
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
