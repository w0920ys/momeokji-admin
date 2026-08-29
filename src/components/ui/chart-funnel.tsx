import * as RechartsPrimitive from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatPercent } from '@/lib/format'

/*
 * 단계별 감소를 보여주는 퍼널 — Mixpanel 류 제품 애널리틱스 퍼널과 같은
 * 방식으로 읽는다. 핵심은 "전체 대비 몇 %가 남았나"가 아니라 "바로 직전
 * 단계에서 몇 %가 넘어왔나"다: 초반 단계는 원래 母수가 커서 %가 낮게
 * 나오는 게 당연하고, 정작 봐야 할 건 각 전환 지점에서 얼마나 새는가다.
 * 그래서 도형 안 라벨은 직전 단계 대비 전환율을 1차로 보여주고(첫 단계는
 * 기준이라 값만), 위에 처음→끝 전체 전환율을 한 줄로 따로 둔다 —
 * Mixpanel 퍼널 패널 상단의 "X% 전체 전환"과 같은 자리다.
 */
export interface FunnelStepDatum {
  step: string
  value: number
}

export function ChartFunnel({
  data,
  height = 240,
  valueFormatter = (v: number) => String(v),
}: {
  data: FunnelStepDatum[]
  height?: number
  valueFormatter?: (v: number) => string
}) {
  const first = data[0]?.value || 1
  const last = data[data.length - 1]?.value ?? 0
  const overallPct = first ? (last / first) * 100 : 0
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.step, { label: d.step, color: `var(--chart-${(i % 6) + 1})` }]),
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm">
        <span className="text-muted-foreground">전체 전환율 </span>
        <span className="text-foreground font-semibold tabular-nums">{formatPercent(overallPct, 1)}</span>
        <span className="text-muted-foreground">
          {' '}
          ({data[0]?.step} → {data[data.length - 1]?.step})
        </span>
      </div>
      <ChartContainer config={config} className="w-full" style={{ height }}>
        <RechartsPrimitive.FunnelChart>
          <ChartTooltip content={<ChartTooltipContent valueFormatter={valueFormatter} />} />
          <RechartsPrimitive.Funnel dataKey="value" data={data} nameKey="step" isAnimationActive={false}>
            {data.map((d, i) => (
              <RechartsPrimitive.Cell key={d.step} fill={`var(--chart-${(i % 6) + 1})`} />
            ))}
            <RechartsPrimitive.LabelList
              position="right"
              dataKey="step"
              className="fill-foreground text-xs font-medium"
            />
            {/*
             * dataKey 기반 formatter는 값만 받고 인덱스를 안 줘서 "직전 단계
             * 대비"를 계산할 수 없다 — content 렌더 함수로 바꿔 index를
             * 받아 data[index-1]과 직접 비교한다.
             */}
            <RechartsPrimitive.LabelList
              position="center"
              dataKey="value"
              content={(raw: unknown) => {
                // recharts의 LabelList content 타입은 value를 RenderableText(문자열도
                // 허용하는 넓은 유니온)로 잡아 여기서 다시 좁혀야 한다.
                const props = raw as {
                  x?: number | string
                  y?: number | string
                  width?: number | string
                  height?: number | string
                  value?: unknown
                  index?: number
                }
                const x = Number(props.x ?? 0)
                const y = Number(props.y ?? 0)
                const width = Number(props.width ?? 0)
                const h = Number(props.height ?? 0)
                const { value, index } = props
                if (typeof value !== 'number' || index == null) return null
                const prev = index === 0 ? null : data[index - 1]?.value
                const label =
                  prev == null
                    ? valueFormatter(value)
                    : `${valueFormatter(value)} · 이전 대비 ${formatPercent(prev ? (value / prev) * 100 : 0, 0)}`
                return (
                  <text
                    x={x + width / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-background text-xs font-semibold"
                  >
                    {label}
                  </text>
                )
              }}
            />
          </RechartsPrimitive.Funnel>
        </RechartsPrimitive.FunnelChart>
      </ChartContainer>
    </div>
  )
}
