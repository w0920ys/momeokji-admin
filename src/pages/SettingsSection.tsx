import * as React from 'react'
import { Bell, KeyRound, LogOut, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DescriptionList,
  DescriptionItem,
  DescriptionTerm,
  DescriptionDetail,
} from '@/components/ui/description-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@/components/ui/empty-state'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { DESIGN_SYSTEM } from '@/lib/design-system'
import { useAuth } from '@/lib/auth'
import type { KpiStat } from '@/lib/metrics/types'
import {
  type AlertOperator,
  type AlertRule,
  createAlertRule,
  deleteAlertRule,
  evaluateAlertRules,
  listAlertRules,
  operatorLabel,
  setAlertRuleEnabled,
} from '@/lib/alerts'
import { formatValue } from '@/lib/format'

const MIN_PASSWORD_LENGTH = 8

export function SettingsSection({
  overview,
  adminEmail,
  onSignOut,
}: {
  overview: KpiStat[]
  adminEmail: string
  onSignOut: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DesignSystemCard />
        <AccountCard email={adminEmail} onSignOut={onSignOut} />
      </div>
      <AlertRulesCard overview={overview} />
    </div>
  )
}

function DesignSystemCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">디자인 시스템</CardTitle>
        <CardDescription>이 대시보드에 적용된 adminds 버전 정보</CardDescription>
      </CardHeader>
      <CardContent>
        <DescriptionList layout="horizontal">
          <DescriptionItem>
            <DescriptionTerm>마지막 동기화</DescriptionTerm>
            <DescriptionDetail>{DESIGN_SYSTEM.vendoredAt}</DescriptionDetail>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>스타터 버전</DescriptionTerm>
            <DescriptionDetail>adminds-starter v{DESIGN_SYSTEM.starterVersion}</DescriptionDetail>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>로컬 확장 컴포넌트</DescriptionTerm>
            <DescriptionDetail>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="info">{DESIGN_SYSTEM.localExtensions}개 — 업스트림 미반영</Badge>
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                {DESIGN_SYSTEM.localExtensionNames.join(', ')}
              </p>
            </DescriptionDetail>
          </DescriptionItem>
        </DescriptionList>
      </CardContent>
    </Card>
  )
}

function AccountCard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [changingPassword, setChangingPassword] = React.useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">관리자 계정</CardTitle>
        <CardDescription>이 대시보드는 아래 계정만 접근할 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{email}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setChangingPassword((v) => !v)}>
              <KeyRound className="size-4" aria-hidden />
              비밀번호 변경
            </Button>
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut className="size-4" aria-hidden />
              로그아웃
            </Button>
          </div>
        </div>
        {changingPassword && (
          <>
            <Separator />
            <ChangePasswordForm onDone={() => setChangingPassword(false)} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const { updatePassword } = useAuth()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`)
      return
    }
    if (password !== confirm) {
      setError('두 비밀번호가 서로 다릅니다.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(onDone, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Alert variant="success">
        <div>
          <AlertTitle>변경되었습니다</AlertTitle>
          <AlertDescription>새 비밀번호로 다음 로그인부터 사용할 수 있습니다.</AlertDescription>
        </div>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-new-password" className="text-xs font-medium">
          새 비밀번호
        </label>
        <PasswordInput
          id="settings-new-password"
          autoComplete="new-password"
          className="w-48"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-confirm-password" className="text-xs font-medium">
          확인
        </label>
        <PasswordInput
          id="settings-confirm-password"
          autoComplete="new-password"
          className="w-48"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={confirm.length > 0 && confirm !== password ? true : undefined}
        />
      </div>
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? '저장 중…' : '저장'}
      </Button>
      {error && <p className="text-destructive-on-tint w-full text-xs">{error}</p>}
    </form>
  )
}

function AlertRulesCard({ overview }: { overview: KpiStat[] }) {
  const [rules, setRules] = React.useState<AlertRule[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(() => {
    listAlertRules()
      .then(setRules)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  React.useEffect(() => {
    reload()
  }, [reload])

  const triggered = rules ? evaluateAlertRules(overview, rules) : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">KPI 임계치 알림 규칙</CardTitle>
        <CardDescription>
          지금은 규칙만 저장합니다. 실제 이메일 발송은 라이브 데이터 연동 이후(Phase 0b+)
          Resend + Supabase Edge Function으로 연결됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {error && <p className="text-destructive-on-tint text-sm">{error}</p>}

        <NewRuleForm overview={overview} onCreated={reload} />

        {rules && rules.length > 0 ? (
          <>
            {triggered.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-muted-foreground text-xs">지금 데이터 기준 발동 중:</span>
                {triggered.map((t) => (
                  <Badge key={t.rule.id} variant="warning">
                    {t.rule.kpiLabel} {formatValue(t.currentValue, overview.find((s) => s.id === t.rule.kpiId)?.unit ?? 'count')}
                  </Badge>
                ))}
              </div>
            )}
            <Table label="KPI 알림 규칙 목록">
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead>조건</TableHead>
                  <TableHead>수신 이메일</TableHead>
                  <TableHead>사용</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} onChanged={reload} />
                ))}
              </TableBody>
            </Table>
          </>
        ) : rules ? (
          <EmptyState variant="no-results" size="compact">
            <EmptyStateIcon>
              <Bell aria-hidden />
            </EmptyStateIcon>
            <EmptyStateTitle>등록된 알림 규칙이 없습니다</EmptyStateTitle>
            <EmptyStateDescription>위에서 KPI와 임계값을 지정해 규칙을 추가하세요.</EmptyStateDescription>
          </EmptyState>
        ) : null}
      </CardContent>
    </Card>
  )
}

function RuleRow({ rule, onChanged }: { rule: AlertRule; onChanged: () => void }) {
  const [busy, setBusy] = React.useState(false)

  async function toggle(enabled: boolean) {
    setBusy(true)
    try {
      await setAlertRuleEnabled(rule.id, enabled)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await deleteAlertRule(rule.id)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{rule.kpiLabel}</TableCell>
      <TableCell className="text-muted-foreground">
        {operatorLabel(rule.operator)} {rule.threshold}
      </TableCell>
      <TableCell className="text-muted-foreground">{rule.recipientEmail}</TableCell>
      <TableCell>
        <Switch checked={rule.enabled} onCheckedChange={toggle} pending={busy} aria-label={`${rule.kpiLabel} 알림 사용`} />
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" onClick={remove} disabled={busy} aria-label="규칙 삭제">
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </TableCell>
    </TableRow>
  )
}

function NewRuleForm({ overview, onCreated }: { overview: KpiStat[]; onCreated: () => void }) {
  const [kpiId, setKpiId] = React.useState(overview[0]?.id ?? '')
  const [operator, setOperator] = React.useState<AlertOperator>('gte')
  const [threshold, setThreshold] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const kpi = overview.find((s) => s.id === kpiId)
    const numeric = Number(threshold)
    if (!kpi || Number.isNaN(numeric) || !email) {
      setError('KPI·임계값·수신 이메일을 모두 채워주세요.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await createAlertRule({
        kpiId: kpi.id,
        kpiLabel: kpi.label,
        operator,
        threshold: numeric,
        recipientEmail: email,
        enabled: true,
      })
      setThreshold('')
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">KPI</label>
        <Select value={kpiId} onValueChange={setKpiId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="KPI 선택" />
          </SelectTrigger>
          <SelectContent>
            {overview.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">조건</label>
        <Select value={operator} onValueChange={(v) => setOperator(v as AlertOperator)}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gte">이상</SelectItem>
            <SelectItem value="lte">이하</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">임계값</label>
        <Input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="w-28"
          placeholder="예: 80"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">수신 이메일</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-56" required />
      </div>
      <Button type="submit" disabled={submitting}>
        <Plus className="size-4" aria-hidden />
        규칙 추가
      </Button>
      {error && <p className="text-destructive-on-tint w-full text-xs">{error}</p>}
    </form>
  )
}
