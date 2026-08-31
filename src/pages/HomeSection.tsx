import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { InlineChartLine } from '@/components/momeokji-charts'
import type { DashboardData } from '@/lib/metrics/types'
import { formatValue } from '@/lib/format'
import { METRIC_DEFINITIONS } from '@/lib/metrics/posthog-definitions'

/*
 * 로그인 후 가장 먼저 보는 화면 — "전체가 지금 어떻게 움직이는가"를
 * 한눈에. 새 차트를 만들지 않는다: 이미 만든 KPI 그리드·유입/재방문/
 * 바이럴 추이 차트(momeokji-charts의 InlineChartLine)를 그대로
 * 재사용한다. 미리보기 카드를 누르면 해당 섹션으로 점프한다.
 *
 * adminds 정식 chart-line.tsx(자체 Card 포함)를 안 쓰는 이유는
 * App.tsx와 같다 — Y축이 없으면 우리 실데이터(초기 단계라 대부분 0)의
 * 튐이 안 보이고, PreviewCard가 이미 자기 Card·제목을 갖고 있어 정식
 * 버전을 쓰면 Card 안에 Card가 겹친다.
 */
export function HomeSection({ data, onJump }: { data: DashboardData; onJump: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-14">북극성 추이 — 주간 반복 결정자(WRD)</CardTitle>
          <CardDescription>한 주 2일 이상 룰렛 결정을 확정한 사용자 수</CardDescription>
        </CardHeader>
        <CardContent>
          <InlineChartLine data={data.northStarTrend} config={{ wrd: { label: '북극성(WRD)', color: 'var(--chart-1)' } }} categoryKey="date" />
        </CardContent>
      </Card>

      {/* Container Grid System: Sixth — lg에서 곧장 6-up, xl 단계는 쓰지 않는다 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
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
          <InlineChartLine
            data={data.acquisition.newUsersTrend}
            config={{
              pwa: { label: 'PWA', color: 'var(--chart-1)' },
              toss: { label: '앱인토스', color: 'var(--chart-2)' },
            }}
            categoryKey="date"
          />
        </PreviewCard>
        <PreviewCard title="주간 리텐션" onClick={() => onJump('retention')}>
          <InlineChartLine
            data={data.retention.curve.map((p) => ({ week: `W${p.week}`, all: p.all }))}
            config={{ all: { label: '전체', color: 'var(--chart-1)' } }}
            categoryKey="week"
            yDomain={[0, 100]}
          />
        </PreviewCard>
        <PreviewCard title="바이럴 추이" onClick={() => onJump('virality')}>
          <InlineChartLine
            data={data.virality.trend}
            config={{
              created: { label: '생성', color: 'var(--chart-1)' },
              joined: { label: '입장', color: 'var(--chart-2)' },
            }}
            categoryKey="date"
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
          <CardTitle className="text-14">{title}</CardTitle>
          <CardDescription>자세히 보려면 클릭</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </button>
  )
}
