import { describe, expect, it } from 'vitest'
import { summarizeUserActivity, zeroFillDailyVisits, type ActivityEvent } from './user-activity'

describe('zeroFillDailyVisits', () => {
  it('이벤트가 있는 날짜만 오는 결과를 요청한 일수만큼 0으로 채운다', () => {
    const today = new Date('2026-08-30T00:00:00.000Z')
    const points = zeroFillDailyVisits([['2026-08-30', 3], ['2026-08-28', 1]], 3, today)
    expect(points).toEqual([
      { date: '2026-08-28', visits: 1 },
      { date: '2026-08-29', visits: 0 },
      { date: '2026-08-30', visits: 3 },
    ])
  })

  it('빈 결과면 전부 0으로 채운다', () => {
    const today = new Date('2026-08-30T00:00:00.000Z')
    const points = zeroFillDailyVisits([], 2, today)
    expect(points).toEqual([
      { date: '2026-08-29', visits: 0 },
      { date: '2026-08-30', visits: 0 },
    ])
  })
})

describe('summarizeUserActivity', () => {
  it('이벤트가 없으면 found:false를 돌려준다', () => {
    expect(summarizeUserActivity([]).found).toBe(false)
  })

  it('스핀/확정 횟수와 전환율을 센다', () => {
    const events: ActivityEvent[] = [
      { event: 'menu_confirmed', timestamp: '2026-08-30T10:00:00.000Z', properties: { entry: 'direct' } },
      { event: 'menu_spun', timestamp: '2026-08-30T09:59:00.000Z', properties: {} },
      { event: 'menu_spun', timestamp: '2026-08-29T09:00:00.000Z', properties: {} },
    ]
    const summary = summarizeUserActivity(events)
    expect(summary.found).toBe(true)
    expect(summary.spins).toBe(2)
    expect(summary.confirms).toBe(1)
    expect(summary.spinToConfirmRate).toBe(50)
    expect(summary.entry).toBe('direct')
  })
})
