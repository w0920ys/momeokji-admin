import * as React from 'react'
import { Bell, ChevronDown, CloudCheck, Pencil, Search, Smartphone, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { StatCard } from '@/components/ui/stat-card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@/components/ui/empty-state'
import { FilterChipGroup } from '@/components/ui/filter-chip-group'
import { DescriptionList, DescriptionDetail, DescriptionItem, DescriptionTerm } from '@/components/ui/description-list'
import { InlineChartBarDaily } from '@/components/momeokji-charts'
import type { UserDirectoryRow } from '@/lib/user-directory'
import type { ManagedUser } from '@/lib/users'
import {
  type ActivityEvent,
  type ActivityKey,
  type DailyVisitPoint,
  getPersonProperties,
  getUserDailyVisits,
  getUserEventFeed,
  summarizeUserActivity,
  type UserActivitySummary,
} from '@/lib/metrics/user-activity'
import { PERSON_PROPERTY_CATEGORY_ORDER, categorizeProperty, type PersonPropertyCategory } from '@/lib/metrics/person-properties'
import { entryPathLabel, formatDate, formatPercent, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

function rowToActivityKey(row: UserDirectoryRow): ActivityKey {
  return row.kind === 'member' ? { distinctId: row.member.id } : { personId: row.guest.personId }
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/*
 * 마스터-디테일의 우측 열. 인물 카드 → 속성 리스트 → 28일 방문 막대 →
 * 스핀/확정 요약 → Activity Feed 순서로 쌓는다. 회원/비회원 둘 다 같은
 * 패널을 쓰되, row.kind로 갈라야 하는 지점(닉네임 수정/삭제, 속성 값의
 * 출처)만 안에서 분기한다 — 화면 두 벌을 따로 만들지 않는다.
 */
export function UserDetailPanel({
  row,
  onEdit,
  onDelete,
}: {
  row: UserDirectoryRow
  onEdit: (user: ManagedUser) => void
  onDelete: (user: ManagedUser) => void
}) {
  const key = React.useMemo(() => rowToActivityKey(row), [row])

  const [events, setEvents] = React.useState<ActivityEvent[] | null>(null)
  const [dailyVisits, setDailyVisits] = React.useState<DailyVisitPoint[] | null>(null)
  const [properties, setProperties] = React.useState<Record<string, unknown> | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setEvents(null)
    setDailyVisits(null)
    setProperties(null)
    setError(null)

    getUserEventFeed(key).then(
      (e) => {
        if (!cancelled) setEvents(e)
      },
      (e: unknown) => {
        if (!cancelled) setError(errorMessage(e))
      },
    )
    getUserDailyVisits(key).then(
      (d) => {
        if (!cancelled) setDailyVisits(d)
      },
      () => {
        if (!cancelled) setDailyVisits([])
      },
    )

    if (row.kind === 'member') {
      getPersonProperties(key).then(
        (p) => {
          if (!cancelled) setProperties(p.properties)
        },
        () => {
          if (!cancelled) setProperties({})
        },
      )
    } else {
      // 비회원은 목록 조회(anonymous-visitors.ts) 때 이미 properties를
      // 통째로 받아왔다 — 여기서 다시 PostHog에 쏘지 않는다.
      setProperties(row.guest.properties)
    }

    return () => {
      cancelled = true
    }
  }, [key, row])

  const summary = React.useMemo(() => (events ? summarizeUserActivity(events) : null), [events])

  return (
    <div className="flex flex-col gap-4">
      <PersonCard row={row} summary={summary} onEdit={onEdit} onDelete={onDelete} />

      {error && (
        <Alert variant="destructive">
          <div>
            <AlertTitle>행동 데이터를 불러오지 못했습니다</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}

      <PropertyList properties={properties} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">방문 패턴 · 최근 28일</CardTitle>
          <CardDescription>하루에 몇 번 들어왔는지 — app_opened / app_reengaged 발생 횟수</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyVisits ? (
            <InlineChartBarDaily data={dailyVisits.map((d) => ({ ...d }))} categoryKey="date" valueKey="visits" />
          ) : (
            <Skeleton shape="block" className="h-40" />
          )}
        </CardContent>
      </Card>

      {summary?.found && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="스핀" value={String(summary.spins)} />
          <StatCard label="확정" value={String(summary.confirms)} />
          <StatCard label="Spin → Confirm" value={formatPercent(summary.spinToConfirmRate)} hint="이 유저의 전환율" />
        </div>
      )}

      <ActivityFeed events={events} />
    </div>
  )
}

function PersonCard({
  row,
  summary,
  onEdit,
  onDelete,
}: {
  row: UserDirectoryRow
  summary: UserActivitySummary | null
  onEdit: (user: ManagedUser) => void
  onDelete: (user: ManagedUser) => void
}) {
  const isMember = row.kind === 'member'
  const name = isMember ? row.member.nickname || row.member.email || '(이메일 없음)' : '익명 방문자'
  const email = isMember ? row.member.email : null
  const initial = name.slice(0, 1)
  const distinctId = isMember ? row.member.id : (row.guest.distinctId ?? row.guest.personId)
  const location = isMember
    ? null // properties 로드 전엔 모름 — PropertyList가 같은 데이터를 따로 보여주므로 여기선 로딩 상태를 또 만들지 않는다.
    : [row.guest.city, row.guest.region, row.guest.country].filter(Boolean).join(', ') || null
  const joinedAt = isMember ? row.member.createdAt : row.guest.createdAt

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-16 font-semibold">{name}</span>
                <Badge variant={isMember ? 'info' : 'neutral'}>{isMember ? '회원' : '비회원'}</Badge>
                {isMember && row.member.cloudSyncedAt && (
                  <Badge variant="success">
                    <CloudCheck className="size-3" aria-hidden />
                    동기화됨
                  </Badge>
                )}
                {isMember && row.member.notifyEnabled && (
                  <Badge variant="warning">
                    <Bell className="size-3" aria-hidden />
                    알림 켬
                  </Badge>
                )}
              </div>
              {email && <span className="text-muted-foreground text-12">{email}</span>}
            </div>
          </div>
          {isMember && (
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(row.member)} aria-label="닉네임 수정">
                <Pencil className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(row.member)} aria-label="계정 삭제">
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </div>

        <DescriptionList layout="stacked" columns="two">
          <DescriptionItem>
            <DescriptionTerm>위치</DescriptionTerm>
            <DescriptionDetail>{location ?? '위치 정보 없음'}</DescriptionDetail>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>최근 활동</DescriptionTerm>
            <DescriptionDetail>{summary?.lastActive ? formatRelativeTime(summary.lastActive) : summary ? '기록 없음' : '불러오는 중…'}</DescriptionDetail>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>{isMember ? '가입일' : '최초 방문'}</DescriptionTerm>
            <DescriptionDetail>{formatDate(joinedAt)}</DescriptionDetail>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>유입 경로</DescriptionTerm>
            <DescriptionDetail>{summary?.entry ? entryPathLabel(summary.entry) : '알 수 없음'}</DescriptionDetail>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>
              <Smartphone className="mr-1 inline size-3.5" aria-hidden />
              기기 · 브라우저
            </DescriptionTerm>
            <DescriptionDetail>{summary?.device ?? '알 수 없음'}</DescriptionDetail>
          </DescriptionItem>
        </DescriptionList>

        {/* distinct_id는 UUID라 한눈에 볼 필요가 없어 접어둔다(Mixpanel 참고). */}
        <Accordion type="single" collapsible>
          <AccordionItem value="distinct-id" variant="plain">
            <AccordionTrigger className="py-0 text-12 font-medium">
              <span className="text-muted-foreground">Distinct ID</span>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-0 text-12">
              <span className="font-mono break-all">{distinctId}</span>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

function PropertyList({ properties }: { properties: Record<string, unknown> | null }) {
  const [selectedCategories, setSelectedCategories] = React.useState<Set<PersonPropertyCategory>>(
    () => new Set(PERSON_PROPERTY_CATEGORY_ORDER),
  )
  const [query, setQuery] = React.useState('')

  const entries = React.useMemo(() => {
    if (!properties) return null
    return Object.entries(properties).map(([key, value]) => ({ key, value, category: categorizeProperty(key) }))
  }, [properties])

  const filtered = React.useMemo(() => {
    if (!entries) return null
    const q = query.trim().toLowerCase()
    return entries.filter(
      (e) => selectedCategories.has(e.category) && (!q || e.key.toLowerCase().includes(q) || String(e.value).toLowerCase().includes(q)),
    )
  }, [entries, selectedCategories, query])

  const presentCategories = PERSON_PROPERTY_CATEGORY_ORDER.filter((cat) => (filtered ?? []).some((e) => e.category === cat))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">유저 프로필 속성</CardTitle>
        <CardDescription>{entries ? `${entries.length}개 — 카테고리 · 검색으로 좁혀보세요.` : '불러오는 중…'}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* 필터 칩이 먼저, 검색창이 그 아래 — 요청받은 순서. */}
        <FilterChipGroup
          groupLabel="속성 카테고리"
          options={PERSON_PROPERTY_CATEGORY_ORDER.map((c) => ({ value: c, label: c }))}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="속성 이름 · 값 검색"
            className="h-8 pl-8 text-[12px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
              aria-label="검색어 지우기"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {!entries ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} shape="block" className="h-6" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          presentCategories.map((cat) => (
            <div key={cat}>
              <div className="text-muted-foreground pb-1 text-[11px] font-semibold tracking-wide uppercase">{cat}</div>
              {filtered
                .filter((e) => e.category === cat)
                .map((e) => (
                  <div key={e.key} className="flex items-center gap-3 border-b py-1.5 text-12 last:border-b-0">
                    <span className="text-muted-foreground w-[42%] shrink-0 truncate font-mono text-[11px]">{e.key}</span>
                    <span className="truncate">{String(e.value)}</span>
                  </div>
                ))}
            </div>
          ))
        ) : (
          <EmptyState variant="no-results" size="compact">
            <EmptyStateIcon>
              <Search aria-hidden />
            </EmptyStateIcon>
            <EmptyStateTitle>{entries.length === 0 ? '속성 값이 없습니다' : '일치하는 속성이 없습니다'}</EmptyStateTitle>
          </EmptyState>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityFeed({ events }: { events: ActivityEvent[] | null }) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  const groups = React.useMemo(() => {
    if (!events) return null
    const map = new Map<string, ActivityEvent[]>()
    for (const e of events) {
      const label = new Date(e.timestamp).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      const bucket = map.get(label)
      if (bucket) bucket.push(e)
      else map.set(label, [e])
    }
    return Array.from(map.entries())
  }, [events])

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Activity Feed</CardTitle>
        <CardDescription>{events ? `최근 이벤트 ${events.length}건(최대 500건까지 조회)` : '불러오는 중…'}</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[480px] overflow-y-auto">
        {!groups ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} shape="block" className="h-8" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState variant="no-results" size="compact">
            <EmptyStateIcon>
              <Smartphone aria-hidden />
            </EmptyStateIcon>
            <EmptyStateTitle>계측 데이터가 없습니다</EmptyStateTitle>
            <EmptyStateDescription>
              아직 이 사람 이름으로 잡힌 PostHog 이벤트가 없어요 — 로그인 전이거나, 테스트 모드(?ph_test=1)로만 써봤을 수 있습니다.
            </EmptyStateDescription>
          </EmptyState>
        ) : (
          groups.map(([date, evs], gi) => (
            <div key={date}>
              <div className="text-muted-foreground bg-card sticky top-0 py-1.5 text-[11px] font-semibold tracking-wide uppercase">{date}</div>
              {evs.map((e, i) => {
                const id = `${gi}-${i}`
                const isOpen = expanded.has(id)
                const hasProps = Object.keys(e.properties).length > 0
                return (
                  <div key={id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => hasProps && toggle(id)}
                      disabled={!hasProps}
                      className="flex w-full items-center gap-2 py-1.5 text-left text-12 disabled:cursor-default"
                    >
                      <span className="text-muted-foreground w-12 shrink-0 font-mono text-[11px]">
                        {new Date(e.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex-1 truncate font-medium">{e.event}</span>
                      {hasProps && (
                        <ChevronDown className={cn('text-muted-foreground size-3.5 shrink-0 transition-transform', isOpen && 'rotate-180')} aria-hidden />
                      )}
                    </button>
                    {isOpen && (
                      <pre className="bg-muted mb-2 overflow-x-auto rounded-md p-2 text-[11px]">{JSON.stringify(e.properties, null, 2)}</pre>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
