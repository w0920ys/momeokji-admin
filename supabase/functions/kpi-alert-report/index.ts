// KPI 임계치 이메일 리포트 — 스캐폴드 전용, 아직 배포/스케줄링하지 않는다.
//
// 지금 단계(Phase 0): 설정 화면에서 규칙(kpi_alert_rules)을 만들고, 목업
// 데이터로 "몇 개가 발동 중인지"만 미리 보여준다(src/lib/alerts.ts의
// evaluateAlertRules). 진짜 발송은 PostHog 라이브 데이터가 들어온 뒤
// (Phase 0b 이후) 아래 TODO를 채우고 pg_cron으로 스케줄링한다.
//
// 배포 전 준비물:
//   1. Resend 계정 + API 키 → `supabase secrets set RESEND_API_KEY=...`
//   2. deploy: `supabase functions deploy kpi-alert-report`
//   3. 스케줄: `select cron.schedule('kpi-alert-report', '0 9 * * *',
//        $$ select net.http_post('https://<project>.functions.supabase.co/kpi-alert-report') $$)`
//      매일 아침 9시 기준 예시. 주기는 정하기 나름.

import { createClient } from 'jsr:@supabase/supabase-js@2'

// src/lib/alerts.ts의 AlertRule/TriggeredAlert와 같은 모양 — Edge Function은
// 별도 번들이라 프런트 코드를 import할 수 없어 타입만 여기 다시 적는다.
// (구조가 갈라지지 않도록, 프런트에서 이 타입을 바꾸면 여기도 같이 바꿀 것)
interface AlertRuleRow {
  id: string
  kpi_id: string
  kpi_label: string
  operator: 'gte' | 'lte'
  threshold: number
  recipient_email: string
  enabled: boolean
  user_id: string
}

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: rules, error } = await supabase
    .from('kpi_alert_rules')
    .select('*')
    .eq('enabled', true)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // TODO(Phase 0b 이후): 목업이 아니라 PostHog Query API로 각 kpi_id의
  // 현재값을 가져온다. src/lib/metrics/posthog.ts(PostHogSource)가 만들어지면
  // 그 계산 로직을 이 함수에서도 재사용할 수 있게 공용 패키지로 뺄 것.
  const currentValues: Record<string, number> = {}

  const triggered = (rules as AlertRuleRow[]).filter((rule) => {
    const value = currentValues[rule.kpi_id]
    if (value == null) return false
    return rule.operator === 'gte' ? value >= rule.threshold : value <= rule.threshold
  })

  if (triggered.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: '발동한 규칙 없음' }), { status: 200 })
  }

  // TODO(Phase 0b 이후): Resend로 실제 발송.
  // const resendApiKey = Deno.env.get('RESEND_API_KEY')!
  // for (const t of triggered) {
  //   await fetch('https://api.resend.com/emails', {
  //     method: 'POST',
  //     headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       from: '모먹지 애널리틱스 <alerts@example.com>',
  //       to: t.recipient_email,
  //       subject: `[모먹지] ${t.kpi_label} 임계치 도달`,
  //       html: `<p>${t.kpi_label}이(가) ${t.threshold} ${t.operator === 'gte' ? '이상' : '이하'}에 도달했습니다.</p>`,
  //     }),
  //   })
  // }

  return new Response(JSON.stringify({ sent: 0, wouldTrigger: triggered.length, note: 'STUB — Resend 미연동' }), {
    status: 200,
  })
})
