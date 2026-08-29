import { describe, expect, it } from 'vitest'
import { resolveInitialTheme } from '@/lib/theme'

describe('resolveInitialTheme', () => {
  it('저장된 값이 있으면 그것을 쓴다', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark')
    expect(resolveInitialTheme('light', true)).toBe('light')
  })

  it('저장된 값이 없으면 OS 설정을 따른다', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark')
    expect(resolveInitialTheme(null, false)).toBe('light')
  })

  it('저장된 값이 알 수 없는 문자열이면 OS 설정을 따른다', () => {
    expect(resolveInitialTheme('purple', true)).toBe('dark')
  })
})
