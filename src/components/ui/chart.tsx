import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

/*
 * 차트 5종(chart-line·chart-bar-*·chart-funnel·chart-donut)이 공유하는 기반.
 * shadcn/ui의 chart 레지스트리 컴포넌트와 같은 골격이다 — Table이 density를
 * Context로 내려보내는 것처럼, ChartContainer가 정한 config(어떤 데이터 키가
 * 어떤 라벨·색을 갖는지)를 ChartTooltipContent·ChartLegendContent가 그대로
 * 읽는다. 색은 여기서 문자열로 박지 않고 CSS 변수로 주입한다 — 그래야
 * 다크모드 전환이 각 차트가 아니라 이 컴포넌트 하나에서 해결된다.
 *
 * 기본 색은 각 chart-*.tsx 가 `var(--chart-1)`~`var(--chart-6)`
 * (chart-tokens.css, dataviz 스킬로 검증된 범주형 6색)를 고정 순서로 채워
 * config를 만든다 — 그래서 소비자는 보통 color를 직접 지정할 일이 없다.
 */

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<'light' | 'dark', string> })
}

type ChartContextProps = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error('Chart 하위 컴포넌트는 ChartContainer 안에서만 쓸 수 있다')
  return ctx
}

/*
 * config의 색을 실제 CSS로 내보낸다. 인라인 style이 아니라 <style> 태그로
 * 넣는 이유: recharts 내부 SVG 요소(Line·Bar·Cell 등)가 style prop 없이도
 * `var(--color-${key})`를 그대로 참조할 수 있게 하기 위해서다 — 그래야
 * chart-*.tsx 쪽 코드가 "이 시리즈는 --color-pwa다" 정도만 알면 되고,
 * light/dark 갈라치기를 신경 쓰지 않는다.
 */
function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.color || cfg.theme)
  if (!colorConfig.length) return null

  const css = (mode: 'light' | 'dark') =>
    colorConfig
      .map(([key, cfg]) => {
        const color = cfg.theme?.[mode] ?? cfg.color
        return color ? `  --color-${key}: ${color};` : null
      })
      .filter(Boolean)
      .join('\n')

  return (
    <style>
      {`[data-chart="${id}"] {\n${css('light')}\n}\n.dark [data-chart="${id}"] {\n${css('dark')}\n}`}
    </style>
  )
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-auto justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

/*
 * popover 토큰으로 그린 말풍선. indicator="dot"|"line" 은 시리즈 색을
 * 점으로 보여줄지, 라인차트처럼 선분으로 보여줄지를 고른다 — Badge가
 * 클릭 불가 표시라 hover가 없듯, 이 말풍선도 순수 정보 표시라 상호작용을
 * 갖지 않는다.
 */
function ChartTooltipContent({
  active,
  payload,
  label,
  indicator = 'dot',
  hideLabel = false,
  className,
  valueFormatter = (v: number) => String(v),
}: {
  active?: boolean
  payload?: Array<{ dataKey?: string; name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }>
  label?: React.ReactNode
  indicator?: 'dot' | 'line'
  hideLabel?: boolean
  className?: string
  valueFormatter?: (value: number) => string
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null

  return (
    <div
      className={cn(
        'bg-popover text-popover-foreground z-popover min-w-36 rounded-md border px-3 py-2 text-xs shadow-md',
        className,
      )}
    >
      {!hideLabel && label != null && <div className="text-muted-foreground mb-1 font-medium">{label}</div>}
      <ul className="flex flex-col gap-1">
        {payload.map((item, i) => {
          const key = item.dataKey ?? item.name ?? String(i)
          const itemConfig = config[key as string]
          const displayLabel = itemConfig?.label ?? item.name ?? key
          const color = item.color
          return (
            <li key={i} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  'shrink-0 rounded-[2px]',
                  indicator === 'dot' ? 'size-2.5 rounded-full' : 'h-0.5 w-3',
                )}
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{displayLabel}</span>
              <span className="text-foreground ml-auto font-semibold tabular-nums">
                {typeof item.value === 'number' ? valueFormatter(item.value) : item.value}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

/*
 * dataviz 원칙: 2개 이상 시리즈에는 항상 범례를 붙이고, 색만으로 식별하게
 * 두지 않는다. recharts Legend 의 payload 를 그대로 받아 config의 라벨로
 * 바꿔 그린다.
 */
function ChartLegendContent({
  payload,
  className,
}: {
  payload?: Array<{ value?: string; color?: string; dataKey?: string }>
  className?: string
}) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <ul className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5', className)}>
      {payload.map((item, i) => {
        const key = item.dataKey ?? item.value ?? String(i)
        const itemConfig = config[key as string]
        return (
          <li key={i} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span aria-hidden className="size-2.5 rounded-[3px]" style={{ backgroundColor: item.color }} />
            {itemConfig?.label ?? item.value}
          </li>
        )
      })}
    </ul>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  useChart,
}
