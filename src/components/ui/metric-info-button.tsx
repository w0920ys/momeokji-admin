import { Database } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { MetricDefinition } from '@/lib/metrics/posthog-definitions'

/*
 * 지표 하나에 붙는 작은 "이 값 어떻게 나온 거예요?" 버튼. StatCard의
 * 기존 hint(Info 아이콘 + Tooltip)는 지표의 "비즈니스 의미"를 한 줄로
 * 설명하는 자리이고, 이 버튼은 그와 별개로 "PostHog 이벤트로 실제 어떻게
 * 집계되는지"를 다이얼로그로 펼쳐 보여준다 — 그래서 아이콘도 Info가
 * 아닌 Database(원본 이벤트 데이터로 들어간다는 뜻)를 쓴다.
 *
 * definition이 없으면(아직 이 지표에 정의를 안 붙였으면) 버튼 자체를
 * 렌더링하지 않는다 — 텅 빈 다이얼로그를 여는 것보다 조용히 숨기는
 * 편이 낫다.
 */
export function MetricInfoButton({ definition }: { definition?: MetricDefinition }) {
  if (!definition) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground/70 hover:text-foreground focus-visible:ring-ring/50 -m-1 inline-flex shrink-0 rounded p-1 outline-none focus-visible:ring-2"
          aria-label={`${definition.title} — PostHog 집계 방식 보기`}
          onClick={(e) => e.stopPropagation()}
        >
          <Database className="size-3.5" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{definition.title}</DialogTitle>
          <DialogDescription>{definition.aggregation}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-12 font-semibold">PostHog 이벤트</span>
            {definition.events.map((ev) => (
              <div key={ev.name} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="bg-muted rounded px-1.5 py-0.5 text-12 font-semibold">{ev.name}</code>
                </div>
                <p className="text-muted-foreground mt-1.5 text-12 leading-relaxed">{ev.trigger}</p>
                {ev.properties && ev.properties.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ev.properties.map((p) => (
                      <Badge key={p} variant="neutral">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {definition.personProperties && definition.personProperties.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-12 font-semibold">Person property ($set)</span>
              <div className="flex flex-wrap gap-1">
                {definition.personProperties.map((p) => (
                  <Badge key={p} variant="info">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {definition.notes && (
            <p className="border-t pt-3 text-12 leading-relaxed">{definition.notes}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
