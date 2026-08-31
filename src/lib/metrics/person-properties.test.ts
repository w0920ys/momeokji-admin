import { describe, expect, it } from 'vitest'
import { categorizeProperty } from './person-properties'

describe('categorizeProperty', () => {
  it('알려진 person property는 지정된 카테고리로 분류한다', () => {
    expect(categorizeProperty('uses_favorites')).toBe('핵심 행동')
    expect(categorizeProperty('has_account')).toBe('기본 정보')
    expect(categorizeProperty('notify_enabled')).toBe('기능 채택')
    expect(categorizeProperty('uses_rooms')).toBe('그룹 · 바이럴')
  })

  it('맵에 없는 속성은 기타로 묶는다', () => {
    expect(categorizeProperty('$geoip_city_name')).toBe('기타')
    expect(categorizeProperty('아직_안_옮긴_속성')).toBe('기타')
  })
})
