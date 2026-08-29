import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

/*
 * 이 대시보드가 실제로 쓰는 차트 3종 — adminds 정식 chart-line.tsx/
 * chart-bar.tsx/chart-pie.tsx와 똑같은 recharts 구성(리마운트 키, 모서리
 * radius, 툴팁/범례 붙이는 법)을 그대로 따르지만, 그 정식 컴포넌트를
 * 직접 쓰지 않는다 — 정식 버전은 title이 문자열 하나라 CardTitle 안에
 * MetricInfoButton(이 지표가 PostHog에서 어떻게 집계되는지 보여주는
 * 버튼)을 같이 못 넣는다. 이 대시보드 거의 모든 차트 카드가 그 버튼을
 * 쓰므로, Card·제목은 호출부(App.tsx)가 직접 감싸고 차트 몸통만
 * chart.tsx 기반으로 여기서 그린다.
 *
 * components/ui가 아니라 여기 있는 이유: 이건 범용 디자인 시스템
 * 컴포넌트가 아니라 이 대시보드의 데이터 모양(라벨/값 쌍, entry path
 * 등)에 맞춘 조합이다 — adminds에 반영할 대상이 아니라 앱 레벨 코드다.
 */
export function InlineChartLine({
  data,
  config,
  categoryKey,
  yDomain,
}: {
  data: Array<Record<string, string | number>>
  config: ChartConfig
  categoryKey: string
  yDomain?: [number | 'auto', number | 'auto']
}) {
  const seriesKeys = Object.keys(config).filter((key) => key !== categoryKey)
  const showLegend = seriesKeys.length > 1
  return (
    <ChartContainer config={config}>
      <LineChart key={String(showLegend)} accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={categoryKey} tickLine={false} axisLine={false} tickMargin={8} />
        {/* adminds 정식 chart-line.tsx는 Y축을 아예 안 그린다(데모 데이터가
            매끈해서 축 없이도 읽힌다) — 우리 실데이터는 초기 단계라 대부분
            0이다가 어쩌다 한 번 튀는 식이라, 기준선 없이는 그 튐이 안
            보인다(축 없이 렌더해보니 실제로 선이 바닥에 붙어 안 보였다).
            그래서 Y축만 우리 쪽에서 추가로 켠다 — 나머지 구성은 원본 그대로. */}
        <YAxis domain={yDomain ?? ['auto', 'auto']} tickLine={false} axisLine={false} tickMargin={8} width={32} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={seriesKeys.length === 1} />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {seriesKeys.map((key) => (
          <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ChartContainer>
  )
}

/** 항목(카테고리)마다 다른 색을 쓰는 가로 막대 — entryShares·byEntry처럼 "이름 있는 항목들을
 * 나란히 비교"하는 자리용. colorful=false면 히스토그램처럼 전부 한 색(스핀 깊이 분포). */
export function InlineChartBarCategorical({
  data,
  colorful = true,
}: {
  data: Array<{ label: string; value: number }>
  colorful?: boolean
}) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.label, { label: d.label, color: `var(--chart-${(i % 6) + 1})` }]),
  )
  return (
    <ChartContainer config={config}>
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 12, right: 44 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} tickMargin={8} width={110} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="label" />} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={colorful ? undefined : 'var(--chart-1)'}>
          {colorful && data.map((d, i) => <Cell key={d.label} fill={`var(--chart-${(i % 6) + 1})`} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** 도넛 — 구성비(전체 대비 항목별 비중)를 보여주는 자리용. */
export function InlineChartDonut({ data }: { data: Array<{ label: string; value: number }> }) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.label, { label: d.label, color: `var(--chart-${(i % 6) + 1})` }]),
  )
  const pieData = data.map((d, i) => ({ ...d, fill: `var(--chart-${(i % 6) + 1})` }))
  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-52">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="label" />} />
        <Pie data={pieData} dataKey="value" nameKey="label" innerRadius="55%" />
        <ChartLegend
          content={<ChartLegendContent nameKey="label" />}
          {...{ className: 'flex-wrap gap-2 *:basis-1/3 *:justify-center' }}
        />
      </PieChart>
    </ChartContainer>
  )
}
