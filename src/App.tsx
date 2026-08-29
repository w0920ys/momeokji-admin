import { useEffect, useState } from 'react'
import {
  Activity,
  BarChart3,
  Blocks,
  Coins,
  Database,
  Dices,
  GitCompare,
  Home as HomeIcon,
  Inbox,
  Info,
  Layers,
  ListChecks,
  Moon,
  Palette,
  Repeat2,
  Settings as SettingsIcon,
  Share2,
  Sun,
  UserPlus,
  Users,
} from 'lucide-react'

import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { posthogSource } from '@/lib/metrics/posthog'
import type { DashboardData, DateRange } from '@/lib/metrics/types'
import { entryPathLabel, formatCompact, formatNumber, formatPercent, formatValue } from '@/lib/format'
import { METRIC_DEFINITIONS } from '@/lib/metrics/posthog-definitions'

import { AppShell, type AppShellNavItem } from '@/components/ui/app-shell'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { MetricInfoButton } from '@/components/ui/metric-info-button'
import { TrendBadge } from '@/components/ui/trend-badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartViewSelect } from '@/components/ui/chart-view-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@/components/ui/empty-state'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ChartLine } from '@/components/ui/chart-line'
import { ChartBarHorizontal } from '@/components/ui/chart-bar-horizontal'
import { ChartBarVertical } from '@/components/ui/chart-bar-vertical'
import { ChartFunnel } from '@/components/ui/chart-funnel'
import { ChartDonut } from '@/components/ui/chart-donut'
import { LoginPage } from '@/pages/LoginPage'
import { SetNewPasswordPage } from '@/pages/SetNewPasswordPage'
import { HomeSection } from '@/pages/HomeSection'
import { SettingsSection } from '@/pages/SettingsSection'
import { DesignSystemSection } from '@/pages/DesignSystemSection'
import { EventCatalogSection } from '@/pages/EventCatalogSection'
import { UsersSection } from '@/pages/UsersSection'

/*
 * 모먹지 어드민. 최상위를 두 모드로 나눈다 — ① 애널리틱스(이 파일이
 * 원래 갖고 있던 전부: 유입·재방문·룰렛 핵심 사용 등)와 ② 디자인시스템
 * (모먹지 앱 자체의 토큰·컴포넌트 현황, DesignSystemSection.tsx). 둘 다
 * "관리자가 모먹지에 대해 보는 화면"이라는 점에서 한 어드민 아래 있지만,
 * 서로 다른 데이터 소스(전자는 이벤트 지표, 후자는 손으로 관리하는
 * 코드 스냅샷)라 nav도 화면도 완전히 갈라 둔다 — AdminRoot의 mode
 * state가 그 경계다.
 *
 * 이 파일은 디자인 시스템 컴포넌트(components/ui/*)를 "조합"만 한다 —
 * 새 차트·타일 종류가 필요해지면 이 파일이 아니라 시스템 쪽에 더한다.
 * 애널리틱스 데이터는 지금 MockSource(src/lib/metrics/mock.ts)를 쓰고,
 * PostHog 계측 후 PostHogSource로 source.ts 인터페이스만 바꿔 낀다 —
 * 이 화면은 그 교체를 몰라도 된다.
 */

type AdminMode = 'analytics' | 'design-system'

const ANALYTICS_NAV: AppShellNavItem[] = [
  { id: 'home', label: '홈', icon: HomeIcon },
  { id: 'acquisition', label: '유입', icon: UserPlus },
  { id: 'retention', label: '재방문', icon: Repeat2 },
  { id: 'roulette', label: '룰렛 핵심 사용', icon: Dices },
  { id: 'engagement', label: '핵심 인게이지먼트', icon: Activity },
  { id: 'features', label: '기능 채택', icon: ListChecks },
  { id: 'virality', label: '바이럴', icon: Share2 },
  { id: 'channels', label: '채널 비교', icon: GitCompare },
  { id: 'monetization', label: '수익화', icon: Coins },
  { id: 'events', label: '이벤트 카탈로그', icon: Database },
  { id: 'users', label: '유저 관리', icon: Users },
  { id: 'settings', label: '설정', icon: SettingsIcon },
]

const DESIGN_SYSTEM_NAV: AppShellNavItem[] = [
  { id: 'ds-overview', label: '개요', icon: Info },
  { id: 'ds-foundation', label: '파운데이션', icon: Palette },
  { id: 'ds-semantic', label: '시맨틱 토큰', icon: Layers },
  { id: 'ds-components', label: '컴포넌트', icon: Blocks },
  { id: 'ds-usage', label: '활용 현황', icon: BarChart3 },
]

const RANGE_LABEL: Record<DateRange, string> = { '7d': '최근 7일', '28d': '최근 28일', '90d': '최근 90일' }

/**
 * 섹션 하나의 뼈대 — 제목 + 설명 + 내용. 애널리틱스·디자인시스템 두 모드가
 * 똑같은 "옆 nav 클릭 → 앵커로 스크롤" 패턴을 쓰므로 이 파일 밖(DesignSystemSection)
 * 에서도 그대로 재사용한다. 배치용 컴포넌트라 components/ui까지는 올리지 않는다.
 */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-18 font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-muted-foreground text-14">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function AnalyticsDashboard({
  adminEmail,
  onSignOut,
  topNav,
}: {
  adminEmail: string
  onSignOut: () => void
  topNav: React.ReactNode
}) {
  const { theme, toggle } = useTheme()
  const [range, setRange] = useState<DateRange>('28d')
  const [data, setData] = useState<DashboardData | null>(null)
  const [activeId, setActiveId] = useState('home')

  // 같은 데이터를 다른 모양으로도 보여줄 수 있는 차트 카드 4개의 "지금
  // 어떤 모양으로 보는가" — ChartViewSelect 참고. 카드마다 독립된
  // state라 하나를 바꿔도 다른 카드에 영향이 없다.
  const [entryShareView, setEntryShareView] = useState<'donut' | 'bar'>('donut')
  const [byEntryView, setByEntryView] = useState<'bar-h' | 'bar-v'>('bar-h')
  const [funnelView, setFunnelView] = useState<'funnel' | 'bar'>('funnel')
  const [spinDepthView, setSpinDepthView] = useState<'bar' | 'donut'>('bar')

  useEffect(() => {
    let cancelled = false
    posthogSource.getDashboard(range).then(
      (d) => {
        if (!cancelled) setData(d)
      },
      (err) => {
        if (!cancelled) console.error('대시보드 데이터 로드 실패:', err)
      },
    )
    return () => {
      cancelled = true
    }
  }, [range])

  const handleNavigate = (id: string) => {
    setActiveId(id)
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }

  const themeToggle = (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-label={theme === 'dark' ? '라이트 테마로 전환' : '다크 테마로 전환'}
    >
      {theme === 'dark' ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
    </Button>
  )

  const rangeSwitch = (
    <Tabs value={range} onValueChange={(v) => setRange(v as DateRange)}>
      <TabsList variant="enclosed">
        {(['7d', '28d', '90d'] as const).map((r) => (
          <TabsTrigger key={r} value={r} variant="enclosed">
            {RANGE_LABEL[r]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )

  return (
    <TooltipProvider>
      <AppShell
        brand={
          <span className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md text-12 font-bold">
              모
            </span>
            모먹지 어드민
          </span>
        }
        topNav={topNav}
        nav={ANALYTICS_NAV}
        activeId={activeId}
        onNavigate={handleNavigate}
        actions={themeToggle}
      >
        <PageHeader
          title="사용자 대시보드"
          description={data ? `기준 시각 ${data.updatedAt} · 목업 데이터 — PostHog 계측 후 라이브로 전환됩니다.` : undefined}
          actions={rangeSwitch}
        />

        <div className="flex flex-col gap-10 px-6 py-8">
          {!data ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} shape="block" className="h-24" />
              ))}
            </div>
          ) : (
            // [페이지 분리] 예전에는 모든 섹션을 한 번에 렌더링해 두고 nav 클릭 시
            // scrollIntoView로 그 위치까지 스크롤하는 "1페이지 앵커 내비"였다. 지금은
            // activeId와 일치하는 섹션 하나만 렌더링한다 — 진짜 페이지 전환처럼
            // 동작하고, 안 보는 섹션의 차트를 매번 그리지 않아도 된다.
            // handleNavigate의 scrollIntoView 호출은 그대로 둬도 무해하다(이제
            // "이 페이지의 유일한 섹션 맨 위로 스크롤"이 될 뿐이라 페이지 전환 시
            // 스크롤 위치가 항상 상단으로 리셋되는 효과를 그대로 낸다).
            <>
              {/* 홈 — 로그인 후 처음 보는 화면, 전체 추이 요약 */}
              {activeId === 'home' && (
                <Section id="home" title="홈" description="지금 전체가 어떻게 움직이는지 한눈에.">
                  <HomeSection data={data} onJump={handleNavigate} />
                </Section>
              )}

              {/* ★1 유입 */}
              {activeId === 'acquisition' && (
                <Section id="acquisition" title="유입 (획득)" description="어디서, 어떤 경로로 새 사용자가 들어오는가.">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-1.5 text-14">
                          채널별 신규 유입 추세
                          <MetricInfoButton definition={METRIC_DEFINITIONS.newUsersTrend} />
                        </CardTitle>
                        <CardDescription>PWA vs 앱인토스</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartLine
                          data={data.acquisition.newUsersTrend}
                          series={[
                            { key: 'pwa', label: 'PWA' },
                            { key: 'toss', label: '앱인토스' },
                          ]}
                          valueFormatter={formatCompact}
                        />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-1.5 text-14">
                          유입 경로 구성
                          <MetricInfoButton definition={METRIC_DEFINITIONS.entryShares} />
                        </CardTitle>
                        <CardDescription>direct / utm / push / room / install</CardDescription>
                        <CardAction>
                          <ChartViewSelect
                            label="유입 경로 구성"
                            value={entryShareView}
                            onValueChange={(v) => setEntryShareView(v as typeof entryShareView)}
                            options={[
                              { value: 'donut', label: '도넛' },
                              { value: 'bar', label: '막대' },
                            ]}
                          />
                        </CardAction>
                      </CardHeader>
                      <CardContent>
                        {entryShareView === 'donut' ? (
                          <ChartDonut
                            data={data.acquisition.entryShares.map((e) => ({ label: entryPathLabel(e.path), value: e.users }))}
                            height={180}
                          />
                        ) : (
                          <ChartBarHorizontal
                            data={data.acquisition.entryShares.map((e) => ({ label: entryPathLabel(e.path), value: e.users }))}
                            height={180}
                            perItemColor
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card padding="none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1.5 text-14">
                        유입 소스 (UTM)
                        <MetricInfoButton definition={METRIC_DEFINITIONS.sources} />
                      </CardTitle>
                      <CardDescription>utm_source / medium / campaign 브레이크다운</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table label="유입 소스별 신규 유입·활성화율">
                        <TableHeader>
                          <TableRow>
                            <TableHead>source</TableHead>
                            <TableHead>medium</TableHead>
                            <TableHead>campaign</TableHead>
                            <TableHead numeric>신규 유입</TableHead>
                            <TableHead numeric>활성화율</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.acquisition.sources.map((row) => (
                            <TableRow key={`${row.source}-${row.medium}-${row.campaign}`}>
                              <TableCell className="font-medium">{row.source}</TableCell>
                              <TableCell className="text-muted-foreground">{row.medium}</TableCell>
                              <TableCell className="text-muted-foreground">{row.campaign}</TableCell>
                              <TableCell numeric>{formatNumber(row.newUsers)}</TableCell>
                              <TableCell numeric>{formatPercent(row.activationRate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Section>
              )}

              {/* ★2 재방문 */}
              {activeId === 'retention' && (
                <Section id="retention" title="재방문 (재참여)" description="한 번 온 사용자가 다시 돌아오는가 — 특히 알림을 통해.">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-1.5 text-14">
                          주간 리텐션 곡선
                          <MetricInfoButton definition={METRIC_DEFINITIONS.retentionCurve} />
                        </CardTitle>
                        <CardDescription>활성화 여부별 코호트 비교</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartLine
                          data={data.retention.curve.map((p) => ({ x: `W${p.week}`, all: p.all, activated: p.activated, notActivated: p.notActivated }))}
                          xKey="x"
                          series={[
                            { key: 'all', label: '전체' },
                            { key: 'activated', label: '활성화 유저' },
                            { key: 'notActivated', label: '비활성화 유저' },
                          ]}
                          valueFormatter={(v) => formatPercent(v, 0)}
                          yDomain={[0, 100]}
                        />
                      </CardContent>
                    </Card>
                    <div className="flex flex-col gap-4">
                      <StatCard
                        label="알림 유입 재방문율"
                        value={formatPercent(data.retention.pushReengagementRate)}
                        hint="알림 클릭으로 재유입된 세션 비율"
                        definition={METRIC_DEFINITIONS.push}
                      />
                      <StatCard
                        label="부활 사용자(30일+)"
                        value={formatNumber(data.retention.resurrectedUsers)}
                        definition={METRIC_DEFINITIONS.resurrectedUsers}
                      />
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1.5 text-14">
                        유입 경로별 D7 리텐션
                        <MetricInfoButton definition={METRIC_DEFINITIONS.byEntryRetention} />
                      </CardTitle>
                      <CardAction>
                        <ChartViewSelect
                          label="유입 경로별 D7 리텐션"
                          value={byEntryView}
                          onValueChange={(v) => setByEntryView(v as typeof byEntryView)}
                          options={[
                            { value: 'bar-h', label: '가로 막대' },
                            { value: 'bar-v', label: '세로 막대' },
                          ]}
                        />
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      {byEntryView === 'bar-h' ? (
                        <ChartBarHorizontal
                          data={data.retention.byEntry.map((r) => ({ label: entryPathLabel(r.path), value: r.d7 }))}
                          valueFormatter={(v) => formatPercent(v)}
                          perItemColor
                        />
                      ) : (
                        <ChartBarVertical
                          data={data.retention.byEntry.map((r) => ({ label: entryPathLabel(r.path), value: r.d7 }))}
                          valueFormatter={(v) => formatPercent(v)}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Section>
              )}

              {/* ★3 룰렛 핵심 사용 */}
              {activeId === 'roulette' && (
                <Section id="roulette" title="룰렛 핵심 사용" description="돌리고, 확정하는 핵심 행동 — 모먹지의 존재 이유.">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-1.5 text-14">
                          세션 → 스핀 → 확정 퍼널
                          <MetricInfoButton definition={METRIC_DEFINITIONS.funnel} />
                        </CardTitle>
                        <CardAction>
                          <ChartViewSelect
                            label="세션 → 스핀 → 확정 퍼널"
                            value={funnelView}
                            onValueChange={(v) => setFunnelView(v as typeof funnelView)}
                            options={[
                              { value: 'funnel', label: '퍼널' },
                              { value: 'bar', label: '막대' },
                            ]}
                          />
                        </CardAction>
                      </CardHeader>
                      <CardContent>
                        {funnelView === 'funnel' ? (
                          <ChartFunnel
                            data={data.roulette.funnel.map((f) => ({ step: f.step, value: f.users }))}
                            valueFormatter={formatNumber}
                          />
                        ) : (
                          <ChartBarHorizontal
                            data={data.roulette.funnel.map((f) => ({ label: f.step, value: f.users }))}
                            valueFormatter={formatNumber}
                          />
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-1.5 text-14">
                          스핀 깊이 분포
                          <MetricInfoButton definition={METRIC_DEFINITIONS.spinDepth} />
                        </CardTitle>
                        <CardDescription>한 세션에서 몇 번 돌리고 확정했는가</CardDescription>
                        <CardAction>
                          <ChartViewSelect
                            label="스핀 깊이 분포"
                            value={spinDepthView}
                            onValueChange={(v) => setSpinDepthView(v as typeof spinDepthView)}
                            options={[
                              { value: 'bar', label: '막대' },
                              { value: 'donut', label: '도넛' },
                            ]}
                          />
                        </CardAction>
                      </CardHeader>
                      <CardContent>
                        {spinDepthView === 'bar' ? (
                          <ChartBarVertical
                            data={data.roulette.spinDepth.map((d) => ({ label: d.spins, value: d.sessions }))}
                            valueFormatter={formatCompact}
                          />
                        ) : (
                          <ChartDonut
                            data={data.roulette.spinDepth.map((d) => ({ label: d.spins, value: d.sessions }))}
                            height={200}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard
                      label="Spin→Confirm 전환율"
                      value={formatPercent(data.roulette.spinToConfirmRate)}
                      definition={METRIC_DEFINITIONS.s2c}
                    />
                    <StatCard
                      label="재돌림율"
                      value={formatPercent(data.roulette.respinRate)}
                      hint="2회 이상 스핀한 세션 비율"
                      higherIsBetter={false}
                      definition={METRIC_DEFINITIONS.respinRate}
                    />
                  </div>
                </Section>
              )}

              {/* 핵심 인게이지먼트 */}
              {activeId === 'engagement' && (
                <Section id="engagement" title="핵심 인게이지먼트" description="주당 결정 빈도 · 점착도 · 북극성(WRD) 깊은 확인.">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard
                      label="주간 반복 결정자 (북극성)"
                      value={formatNumber(data.overview.find((s) => s.id === 'wrd')!.value)}
                      deltaPct={data.overview.find((s) => s.id === 'wrd')!.deltaPct}
                      hint="한 주 2일+ 룰렛 결정 확정 사용자"
                      definition={METRIC_DEFINITIONS.wrd}
                    />
                    <StatCard
                      label="DAU/WAU 점착도"
                      value={formatPercent(data.overview.find((s) => s.id === 'stickiness')!.value)}
                      deltaPct={data.overview.find((s) => s.id === 'stickiness')!.deltaPct}
                      hint="일간활성/주간활성 — 습관 강도"
                      definition={METRIC_DEFINITIONS.stickiness}
                    />
                    <StatCard
                      label="주당 결정 빈도"
                      value={`${data.roulette.weeklyDecisionFreq.toFixed(1)}회/주`}
                      definition={METRIC_DEFINITIONS.weeklyDecisionFreq}
                    />
                  </div>
                </Section>
              )}

              {/* 기능 채택 */}
              {activeId === 'features' && (
                <Section id="features" title="기능 채택 매트릭스" description="부가 기능 하나하나가 얼마나 쓰이고, 리텐션에 얼마나 기여하는가.">
                  <Card padding="none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1.5 text-14">
                        기능별 채택률과 리텐션 리프트
                        <MetricInfoButton definition={METRIC_DEFINITIONS.featureAdoption} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table label="기능별 채택률과 리텐션 리프트">
                        <TableHeader>
                          <TableRow>
                            <TableHead>기능</TableHead>
                            <TableHead>채택률</TableHead>
                            <TableHead numeric>W2 리텐션 리프트</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.featureAdoption.features.map((f) => (
                            <TableRow key={f.key}>
                              <TableCell className="font-medium">{f.label}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={f.adoptionRate} size="sm" className="w-28" />
                                  <span className="text-muted-foreground w-10 shrink-0 text-12 tabular-nums">
                                    {formatPercent(f.adoptionRate, 0)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell numeric>
                                <TrendBadge deltaPct={f.retentionLift} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Section>
              )}

              {/* 바이럴 */}
              {activeId === 'virality' && (
                <Section id="virality" title="바이럴" description="'함께 정하기' 룸이 만드는 초대 루프.">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-1.5 text-14">
                          룸 생성 → 입장 추세
                          <MetricInfoButton definition={METRIC_DEFINITIONS.viralityTrend} />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartLine
                          data={data.virality.trend}
                          series={[
                            { key: 'created', label: '생성' },
                            { key: 'joined', label: '입장' },
                          ]}
                          valueFormatter={formatCompact}
                        />
                      </CardContent>
                    </Card>
                    <div className="flex flex-col gap-4">
                      <StatCard
                        label="K-factor"
                        value={data.virality.kFactor.toFixed(2)}
                        hint="생성자 1인당 신규 입장 수"
                        definition={METRIC_DEFINITIONS.kFactor}
                      />
                      <StatCard
                        label="초대 전환율"
                        value={formatPercent(data.virality.inviteConversion)}
                        definition={METRIC_DEFINITIONS.inviteConversion}
                      />
                      <StatCard
                        label="룸 코호트 리텐션 리프트"
                        value={formatPercent(data.virality.roomCohortRetentionLift)}
                        definition={METRIC_DEFINITIONS.roomCohortRetentionLift}
                      />
                    </div>
                  </div>
                </Section>
              )}

              {/* 채널 비교 */}
              {activeId === 'channels' && (
                <Section id="channels" title="채널 비교" description="PWA vs 앱인토스 — 두 배포 경로의 성과 차이.">
                  <Card padding="none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-1.5 text-14">
                        채널별 핵심 지표 비교
                        <MetricInfoButton definition={METRIC_DEFINITIONS.channelsCompare} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table label="채널별 핵심 지표 비교">
                        <TableHeader>
                          <TableRow>
                            <TableHead>지표</TableHead>
                            <TableHead numeric>PWA</TableHead>
                            <TableHead numeric>앱인토스</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.channels.rows.map((row) => (
                            <TableRow key={row.metric}>
                              <TableCell className="font-medium">{row.metric}</TableCell>
                              <TableCell numeric>{formatValue(row.pwa, row.unit)}</TableCell>
                              <TableCell numeric>{formatValue(row.toss, row.unit)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Section>
              )}

              {/* 수익화 (2단계) */}
              {activeId === 'monetization' && (
                <Section id="monetization" title="수익화" description="Phase 2 — 앱인토스 광고 도입 이후 채워지는 자리.">
                  <Card>
                    <CardContent>
                      <EmptyState variant="no-results" size="compact">
                        <EmptyStateIcon>
                          <Inbox aria-hidden />
                        </EmptyStateIcon>
                        <EmptyStateTitle>아직 광고가 켜지지 않았습니다</EmptyStateTitle>
                        <EmptyStateDescription>
                          ARPDAU · 광고 노출/eCPM · 리워드 옵트인율 · 광고량↔리텐션 트레이드오프가 Phase 2에서 여기 표시됩니다.
                        </EmptyStateDescription>
                      </EmptyState>
                    </CardContent>
                  </Card>
                </Section>
              )}

              {/* 이벤트 카탈로그 */}
              {activeId === 'events' && (
                <Section
                  id="events"
                  title="이벤트 카탈로그"
                  description="PostHog 이벤트 36개가 index.html 어디에, 어떻게 심어져 있는지 — 이벤트명·trigger·property부터 발생 화면, 사용되는 지표까지."
                >
                  <EventCatalogSection />
                </Section>
              )}

              {/* 유저 관리 */}
              {activeId === 'users' && (
                <Section id="users" title="유저 관리" description="가입한 모먹지 사용자 — 언제 가입했는지, 닉네임 수정, 계정 삭제.">
                  <UsersSection />
                </Section>
              )}

              {/* 설정 */}
              {activeId === 'settings' && (
                <Section id="settings" title="설정" description="디자인 시스템 버전, 관리자 계정, KPI 알림 규칙.">
                  <SettingsSection overview={data.overview} adminEmail={adminEmail} onSignOut={onSignOut} />
                </Section>
              )}
            </>
          )}
        </div>
      </AppShell>
    </TooltipProvider>
  )
}

/*
 * 디자인시스템 모드 — 모먹지 앱(별도 저장소) 자체의 토큰·컴포넌트 현황.
 * 애널리틱스와 달리 이벤트 데이터가 없어 useEffect로 뭔가를 fetch할 필요가
 * 없다(momeokji-tokens.ts의 손으로 관리하는 스냅샷을 그대로 그린다) —
 * 그래서 로딩 스켈레톤도, 기간 스위치도 없다. activeId/스크롤 내비만
 * AnalyticsDashboard와 같은 패턴을 그대로 따른다.
 */
function DesignSystemDashboard({ topNav }: { topNav: React.ReactNode }) {
  const { theme, toggle } = useTheme()
  const [activeId, setActiveId] = useState('ds-overview')

  const handleNavigate = (id: string) => {
    setActiveId(id)
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }

  const themeToggle = (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-label={theme === 'dark' ? '라이트 테마로 전환' : '다크 테마로 전환'}
    >
      {theme === 'dark' ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
    </Button>
  )

  return (
    <TooltipProvider>
      <AppShell
        brand={
          <span className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md text-12 font-bold">
              모
            </span>
            모먹지 어드민
          </span>
        }
        topNav={topNav}
        nav={DESIGN_SYSTEM_NAV}
        activeId={activeId}
        onNavigate={handleNavigate}
        actions={themeToggle}
      >
        <PageHeader title="디자인 시스템" description="모먹지 앱에 적용된 파운데이션·시맨틱 토큰과 공통 컴포넌트를 조회합니다." />
        <div className="flex flex-col gap-10 px-6 py-8">
          <DesignSystemSection />
        </div>
      </AppShell>
    </TooltipProvider>
  )
}

/*
 * 관리자 1인 전용 게이트. Supabase 세션을 확인하는 동안(loading)은 빈
 * 배경만 보여준다 — 그 짧은 순간에 로그인 화면이 번쩍였다 사라지면
 * "지금 로그인된 건가 아닌가" 헷갈린다. signed-out이면 화이트리스트에
 * 걸렸든 아예 로그인 전이든 같은 LoginPage로 보낸다(둘을 구분하는 안내
 * 문구는 useAuth().error에 이미 담겨 있다). password-recovery는 재설정
 * 메일 링크를 눌러 들어온 경우 — 새 비밀번호를 설정해야만 대시보드로
 * 넘어간다(auth.tsx 주석 참고).
 */
export function App() {
  const auth = useAuth()

  if (auth.status === 'loading') {
    return <div className="bg-background min-h-svh" />
  }
  if (auth.status === 'password-recovery') {
    return <SetNewPasswordPage />
  }
  if (auth.status !== 'signed-in') {
    return <LoginPage />
  }
  return <AdminRoot adminEmail={auth.user.email ?? ''} onSignOut={auth.signOut} />
}

/*
 * 최상위 모드 스위처. 라우터를 새로 들이지 않고 이 파일 전체가 이미 쓰던
 * "state + 앵커 스크롤" 방식을 그대로 한 단계 위로 확장했다 — 관리자
 * 1인 전용 내부 도구라 URL 공유 가치가 낮고, 지금 있는 어떤 패턴과도
 * 다른 라우팅 라이브러리를 새로 들이는 비용이 더 크다고 판단했다(YAGNI).
 */
function AdminRoot({ adminEmail, onSignOut }: { adminEmail: string; onSignOut: () => void }) {
  const [mode, setMode] = useState<AdminMode>('analytics')

  const modeSwitch = (
    <Tabs value={mode} onValueChange={(v) => setMode(v as AdminMode)}>
      <TabsList variant="enclosed" className="w-full">
        <TabsTrigger value="analytics" variant="enclosed" className="flex-1">
          애널리틱스
        </TabsTrigger>
        <TabsTrigger value="design-system" variant="enclosed" className="flex-1">
          디자인시스템
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )

  if (mode === 'design-system') {
    return <DesignSystemDashboard topNav={modeSwitch} />
  }
  return <AnalyticsDashboard adminEmail={adminEmail} onSignOut={onSignOut} topNav={modeSwitch} />
}
