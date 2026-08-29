import { supabase } from '@/lib/supabase'
import type { KpiStat } from '@/lib/metrics/types'

/*
 * KPI 임계치 알림 규칙 — 저장은 Supabase(kpi_alert_rules, RLS로 본인 것만)에
 * 하지만, "지금 몇 개가 발동 중인가" 계산은 순수 함수로 분리해 목업
 * 데이터로도 미리 결과를 보여줄 수 있게 한다. 실제 발송(Resend 연동 +
 * 스케줄링)은 라이브 데이터(Phase 0b) 이후 supabase/functions/kpi-alert-report
 * 에서 이 evaluateAlertRules와 같은 로직을 재사용한다.
 */

export type AlertOperator = 'gte' | 'lte'

export interface AlertRule {
  id: string
  kpiId: string
  kpiLabel: string
  operator: AlertOperator
  threshold: number
  recipientEmail: string
  enabled: boolean
}

export interface TriggeredAlert {
  rule: AlertRule
  currentValue: number
}

const OPERATOR_LABEL: Record<AlertOperator, string> = { gte: '이상', lte: '이하' }
export function operatorLabel(op: AlertOperator): string {
  return OPERATOR_LABEL[op]
}

/** 지금 KPI 값들 기준으로 어떤 규칙이 발동 중인지 계산한다. 순수 함수 — 부작용 없음. */
export function evaluateAlertRules(overview: KpiStat[], rules: AlertRule[]): TriggeredAlert[] {
  const byId = new Map(overview.map((s) => [s.id, s]))
  const triggered: TriggeredAlert[] = []
  for (const rule of rules) {
    if (!rule.enabled) continue
    const kpi = byId.get(rule.kpiId)
    if (!kpi) continue
    const hit = rule.operator === 'gte' ? kpi.value >= rule.threshold : kpi.value <= rule.threshold
    if (hit) triggered.push({ rule, currentValue: kpi.value })
  }
  return triggered
}

interface AlertRuleRow {
  id: string
  kpi_id: string
  kpi_label: string
  operator: AlertOperator
  threshold: number
  recipient_email: string
  enabled: boolean
}

function fromRow(row: AlertRuleRow): AlertRule {
  return {
    id: row.id,
    kpiId: row.kpi_id,
    kpiLabel: row.kpi_label,
    operator: row.operator,
    threshold: row.threshold,
    recipientEmail: row.recipient_email,
    enabled: row.enabled,
  }
}

export async function listAlertRules(): Promise<AlertRule[]> {
  const { data, error } = await supabase
    .from('kpi_alert_rules')
    .select('id, kpi_id, kpi_label, operator, threshold, recipient_email, enabled')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as AlertRuleRow[]).map(fromRow)
}

export async function createAlertRule(input: Omit<AlertRule, 'id'>): Promise<AlertRule> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('로그인 상태가 아닙니다.')
  const { data, error } = await supabase
    .from('kpi_alert_rules')
    .insert({
      user_id: userId,
      kpi_id: input.kpiId,
      kpi_label: input.kpiLabel,
      operator: input.operator,
      threshold: input.threshold,
      recipient_email: input.recipientEmail,
      enabled: input.enabled,
    })
    .select('id, kpi_id, kpi_label, operator, threshold, recipient_email, enabled')
    .single()
  if (error) throw error
  return fromRow(data as AlertRuleRow)
}

export async function deleteAlertRule(id: string): Promise<void> {
  const { error } = await supabase.from('kpi_alert_rules').delete().eq('id', id)
  if (error) throw error
}

export async function setAlertRuleEnabled(id: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.from('kpi_alert_rules').update({ enabled }).eq('id', id)
  if (error) throw error
}
