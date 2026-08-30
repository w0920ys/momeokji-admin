import { useMemo, useState } from 'react'
import { Info, Search, X } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from '@/components/ui/empty-state'
import { ComponentPreviewFrame } from '@/components/ui/component-preview-frame'
import { buildEventScreenHtml } from '@/lib/momeokji-event-screens'
import {
  EVENT_CATALOG,
  EVENT_CATEGORIES,
  EVENT_DEPLOYMENT,
  PROPERTY_CATALOG,
  getMetricsForEvent,
  searchEventCatalog,
} from '@/lib/metrics/event-catalog'
import { cn } from '@/lib/utils'

/*
 * "이벤트가 몇 개 어디 심어져 있고, 클릭하면 실제로 어느 화면 요소에서
 * 발생하는지"에 답하는 화면. posthog-definitions.ts(지표 → 이벤트)의
 * 반대 방향이다 — 여기는 이벤트 → 화면 + 이벤트 → 지표(getMetricsForEvent로
 * 역참조)를 보여준다.
 *
 * 좌측 목록에서 이벤트를 고르면 우측이 그 이벤트 하나에 맞춰 통째로
 * 바뀐다(마스터-디테일) — 36개를 한 화면에 다 펼치면 스크롤이 너무
 * 길어지고, 정작 궁금한 건 대개 "이 이벤트 하나"이기 때문이다.
 */
export function EventCatalogSection() {
  const [selected, setSelected] = useState(EVENT_CATALOG[0].name)
  const [query, setQuery] = useState('')
  const entry = EVENT_CATALOG.find((e) => e.name === selected) ?? EVENT_CATALOG[0]
  const usedInMetrics = getMetricsForEvent(entry.name)

  const filtered = useMemo(() => searchEventCatalog(query), [query])
  const filteredCategories = useMemo(
    () => EVENT_CATEGORIES.filter((cat) => filtered.some((e) => e.category === cat)),
    [filtered],
  )

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-sm">
              총 <b className="font-semibold">{EVENT_CATALOG.length}개</b> 이벤트가 index.html {EVENT_CATEGORIES.length}개 영역에 심어져 있습니다.
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_CATEGORIES.map((cat) => (
                <Badge key={cat} variant="neutral">
                  {cat} {EVENT_CATALOG.filter((e) => e.category === cat).length}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">전체 프로퍼티 ({PROPERTY_CATALOG.length})</CardTitle>
          <CardDescription>
            프로퍼티 이름을 누르면 그 프로퍼티를 가진 이벤트만 아래 목록에 걸러 보여줍니다 — "이 값 어느 이벤트에 있더라"를 반대로 찾을 때.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">Event property</span>
            <div className="flex flex-wrap gap-1">
              {PROPERTY_CATALOG.filter((p) => p.kind === 'event').map((p) => (
                <button key={`event:${p.name}`} type="button" onClick={() => setQuery(p.name)}>
                  <Badge variant="neutral" className="cursor-pointer hover:opacity-70">
                    {p.name} <span className="text-muted-foreground">·{p.events.length}</span>
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase">Person property</span>
            <div className="flex flex-wrap gap-1">
              {PROPERTY_CATALOG.filter((p) => p.kind === 'person').map((p) => (
                <button key={`person:${p.name}`} type="button" onClick={() => setQuery(p.name)}>
                  <Badge variant="warning" className="cursor-pointer hover:opacity-70">
                    {p.name} <span className="text-muted-foreground">·{p.events.length}</span>
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card padding="none" className="h-fit lg:sticky lg:top-4">
          <div className="relative p-2 pb-0">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이벤트 · 프로퍼티 검색"
              className="h-8 pl-8 text-[12px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2"
                aria-label="검색어 지우기"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <CardContent className="max-h-[70vh] overflow-y-auto p-2">
            {filteredCategories.length ? (
              filteredCategories.map((cat) => (
                <div key={cat} className="mb-1">
                  <div className="text-muted-foreground px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase">{cat}</div>
                  {filtered
                    .filter((e) => e.category === cat)
                    .map((e) => (
                      <button
                        key={e.name}
                        type="button"
                        onClick={() => setSelected(e.name)}
                        className={cn(
                          'block w-full rounded-md px-2 py-1.5 text-left font-mono text-[12px] transition-colors',
                          e.name === selected
                            ? 'bg-accent text-accent-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        )}
                      >
                        {e.name}
                      </button>
                    ))}
                </div>
              ))
            ) : (
              <EmptyState variant="no-results" size="compact">
                <EmptyStateIcon>
                  <Search aria-hidden />
                </EmptyStateIcon>
                <EmptyStateTitle>일치하는 이벤트가 없습니다</EmptyStateTitle>
                <EmptyStateDescription>다른 이벤트 이름이나 프로퍼티로 검색해보세요.</EmptyStateDescription>
              </EmptyState>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-base">
                {entry.name}
                <Badge variant="info">{entry.category}</Badge>
              </CardTitle>
              <CardDescription>{entry.trigger}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-[11px] font-semibold uppercase">Event property (1회성)</span>
                  {entry.properties.length ? (
                    <div className="flex flex-wrap gap-1">
                      {entry.properties.map((p) => (
                        <Badge key={p} variant="neutral">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">없음 — 이벤트 발생 자체만 기록</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-[11px] font-semibold uppercase">Person property ($set)</span>
                  {entry.personProperties?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {entry.personProperties.map((p) => (
                        <Badge key={p} variant="warning">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">없음</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-[11px] font-semibold uppercase">사용되는 지표 ({usedInMetrics.length})</span>
                {usedInMetrics.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {usedInMetrics.map((m) => (
                      <Badge key={m.key} variant="success">
                        {m.title}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">아직 이 대시보드의 어떤 지표 계산에도 안 쓰입니다.</span>
                )}
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-[11px]">
                <span>
                  index.html:<span className="font-mono">{entry.sourceLine}</span>
                </span>
                <span>·</span>
                <span>
                  v{EVENT_DEPLOYMENT.appVersion} · <span className="font-mono">{EVENT_DEPLOYMENT.instrumented.commit}</span>
                </span>
                <span>·</span>
                <span>{EVENT_DEPLOYMENT.date} 계측</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">이 이벤트, 화면 어디서 발생하나요</CardTitle>
              <CardDescription>
                {entry.screenLabel
                  ? `모먹지 앱의 실제 CSS로 그린 미리보기 — 주황 점선 박스의 "${entry.screenLabel}" 라벨이 이 이벤트가 발생하는 지점입니다.`
                  : '특정 UI 요소가 아니라 화면 진입/상태 변화 자체에서 전역적으로 발생합니다. 아래는 그 화면의 맥락입니다.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComponentPreviewFrame html={buildEventScreenHtml(entry.screen)} title={`${entry.name} 발생 위치 미리보기`} minHeight={420} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Alert variant="info">
        <Info aria-hidden />
        <div>
          <AlertTitle>계측 히스토리</AlertTitle>
          <AlertDescription>
            {EVENT_DEPLOYMENT.note} 이후 실 트래픽 차단 관련 커밋: {EVENT_DEPLOYMENT.guarded.map((g) => g.commit).join(', ')}.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}
