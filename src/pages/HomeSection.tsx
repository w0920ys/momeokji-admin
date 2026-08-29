import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { ChartLine } from '@/components/ui/chart-line'
import type { DashboardData } from '@/lib/metrics/types'
import { formatCompact, formatPercent, formatValue } from '@/lib/format'
import { METRIC_DEFINITIONS } from '@/lib/metrics/posthog-definitions'

/*
 * 로그인 후 가장 먼저 보는 화면 — "전체가 지금 어떻게 움직이는가"를
 * 한눈에. 새 차트를 만들지 않는다: 북극성 히스토리(신규 데이터 1개)만
 * 빼고는 이미 만든 KPI 그리드·유입/재방문/바이럴 추이 차트를 축소
 * 재사용한다. 미리보기 카드를 누르면 해당 섹션으로 점프한다.
 */
export function HomeSection({ data, onJump }: { data: DashboardData; onJump: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">북극성 추이 — 주간 반복 결정자(WRD)</CardTitle>
          <CardDescription>한 주 2일 이상 룰렛 결정을 확정한 사용자 수</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartLine
            data={data.northStarTrend}
            series={[{ key: 'wrd', label: '북극성(WRD)' }]}
            height={220}
            valueFormatter={formatCompact}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {data.overview.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={formatValue(stat.value, stat.unit)}
            deltaPct={stat.deltaPct}
            higherIsBetter={stat.higherIsBetter}
            hint={stat.hint}
            definition={METRIC_DEFINITIONS[stat.id]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PreviewCard title="유입 추이" onClick={() => onJump('acquisition')}>
          <ChartLine
            data={data.acquisition.newUsersTrend}
            series={[
              { key: 'pwa', label: 'PWA' },
              { key: 'toss', label: '앱인토스' },
            ]}
            height={140}
            valueFormatter={formatCompact}
          />
        </PreviewCard>
        <PreviewCard title="주간 리텐션" onClick={() => onJump('retention')}>
          <ChartLine
            data={data.retention.curve.map((p) => ({ x: `W${p.week}`, all: p.all }))}
            xKey="x"
            series={[{ key: 'all', label: '전체' }]}
            height={140}
            valueFormatter={(v) => formatPercent(v, 0)}
            yDomain={[0, 100]}
          />
        </PreviewCard>
        <PreviewCard title="바이럴 추이" onClick={() => onJump('virality')}>
          <ChartLine
            data={data.virality.trend}
            series={[
              { key: 'created', label: '생성' },
              { key: 'joined', label: '입장' },
            ]}
            height={140}
            valueFormatter={formatCompact}
          />
        </PreviewCard>
      </div>
    </div>
  )
}

function PreviewCard({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-visible:ring-ring/50 rounded-lg text-left outline-none focus-visible:ring-2"
    >
      <Card className="hover:border-ring/50 transition-colors">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>자세히 보려면 클릭</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </button>
  )
}
