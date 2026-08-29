import { Info } from 'lucide-react'

import { Section } from '@/App'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DescriptionList, DescriptionItem, DescriptionTerm, DescriptionDetail } from '@/components/ui/description-list'
import { ComponentPreviewFrame } from '@/components/ui/component-preview-frame'
import { buildComponentPreviewHtml } from '@/lib/momeokji-preview-html'
import {
  MOMEOKJI_SNAPSHOT,
  FOUNDATION_COLORS,
  TYPE_SCALE,
  SPACING_SCALE,
  RADIUS_SCALE,
  SEMANTIC_TOKENS,
  TOKEN_USAGE,
  USAGE_HIGHLIGHTS,
  AUDIT_FINDINGS,
} from '@/lib/momeokji-tokens'

/*
 * 모먹지 앱(별도 저장소)의 디자인 시스템 현황을 이 어드민에서 조회하는
 * 화면. 데이터는 momeokji-tokens.ts(손으로 최신화하는 스냅샷)에서 오고,
 * '컴포넌트' 탭만 momeokji-preview-html.ts를 iframe으로 그려 실제 CSS로
 * 라이브 프리뷰를 보여준다.
 *
 * 이 파일이 하는 일은 애널리틱스 쪽 App.tsx의 각 <Section>과 똑같다 —
 * "이미 있는 데이터를 이미 있는 컴포넌트로 배치"만 한다. 데이터 자체는
 * momeokji-tokens.ts를, 프리뷰 그리는 방식은 component-preview-frame.tsx를
 * 고친다.
 *
 * [페이지 분리] 애널리틱스와 똑같이 activeId와 일치하는 탭 하나만
 * 렌더링한다 — 예전엔(1페이지 앵커 내비 시절) 5개를 전부 한 번에
 * 그려두고 nav 클릭 시 scrollIntoView만 했는데, 그러면 '컴포넌트' 탭의
 * iframe(minHeight 1400)이 다른 탭을 보는 동안에도 항상 마운트돼 있었다.
 * 지금은 실제로 그 탭에 있을 때만 그린다.
 */
export function DesignSystemSection({ activeId }: { activeId: string }) {
  return (
    <>
      {activeId === 'ds-overview' && (
        <Section
          id="ds-overview"
          title="개요"
          description="이 화면은 모먹지 앱(w0920ys/food-rollet)의 index.html에 실제로 존재하는 토큰·컴포넌트를 손으로 옮겨 온 스냅샷입니다."
        >
          <Card>
            <CardContent>
              <DescriptionList layout="horizontal">
                <DescriptionItem>
                  <DescriptionTerm>대상 서비스</DescriptionTerm>
                  <DescriptionDetail>모먹지 ({MOMEOKJI_SNAPSHOT.sourceRepo})</DescriptionDetail>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>기준 버전</DescriptionTerm>
                  <DescriptionDetail>v{MOMEOKJI_SNAPSHOT.appVersion}</DescriptionDetail>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>기반 디자인 언어</DescriptionTerm>
                  <DescriptionDetail>{MOMEOKJI_SNAPSHOT.designLanguage}</DescriptionDetail>
                </DescriptionItem>
                <DescriptionItem>
                  <DescriptionTerm>스냅샷 기준일</DescriptionTerm>
                  <DescriptionDetail>{MOMEOKJI_SNAPSHOT.asOf}</DescriptionDetail>
                </DescriptionItem>
              </DescriptionList>
            </CardContent>
          </Card>
        </Section>
      )}

      {activeId === 'ds-foundation' && (
        <Section id="ds-foundation" title="파운데이션 토큰" description="색·타이포·간격·라운드 — 다른 모든 토큰이 참조하는 가장 아래 레이어.">
        <div className="flex flex-col gap-4">
          {FOUNDATION_COLORS.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-14">색 — {group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.colors.map((c) => (
                    <div key={c.token} className="overflow-hidden rounded-md border">
                      <div className="h-12" style={{ background: c.hex, borderBottom: '1px solid rgba(0,0,0,0.08)' }} />
                      <div className="flex flex-col gap-0.5 p-2.5">
                        <span className="font-mono text-12 font-semibold">{c.token}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">{c.hex}</span>
                        <span className="text-muted-foreground text-[11px] leading-snug">{c.usage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-14">타이포 스케일</CardTitle>
              <CardDescription>Pretendard, 굵기 주도 위계</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col">
              {TYPE_SCALE.map((t) => (
                <div key={t.token} className="flex items-baseline gap-4 border-b py-2.5 last:border-b-0">
                  <span className="text-muted-foreground w-28 shrink-0 font-mono text-[11px]">{t.token}</span>
                  <span className="flex-1" style={{ fontSize: t.size, fontWeight: t.weight }}>
                    {t.sample}
                  </span>
                  <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
                    {t.size} / {t.weight}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-14">간격 스케일</CardTitle>
                <CardDescription>4px 기반</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                {SPACING_SCALE.map((s) => (
                  <div key={s.token} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-20 shrink-0 font-mono text-12">{s.token}</span>
                    <span className="bg-primary h-3.5 rounded-[3px]" style={{ width: s.px }} />
                    <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">{s.px}px</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-14">라운드 스케일</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {RADIUS_SCALE.map((r) => (
                  <div key={r.token} className="flex flex-col items-center gap-2">
                    <div className="bg-muted h-12 w-12 border" style={{ borderRadius: r.px }} />
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {r.token} · {r.label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Alert variant="info">
            <Info aria-hidden />
            <div>
              <AlertTitle>엘리베이션</AlertTitle>
              <AlertDescription>
                --shadow-none: none — 그림자를 쓰지 않는 게 원칙입니다. 위계는 그림자 대신 틴트(면 색 차이)와 헤어라인(테두리)으로만 표현합니다.
              </AlertDescription>
            </div>
          </Alert>
        </div>
        </Section>
      )}

      {activeId === 'ds-semantic' && (
        <Section
          id="ds-semantic"
          title="시맨틱 토큰"
          description="역할 기반 토큰 17개. 컴포넌트는 파운데이션 값을 직접 참조하지 않고 이 역할 이름만 참조합니다 — 참조하는 primitive만 바꾸면 그 역할을 쓰는 모든 곳이 한 번에 바뀝니다."
        >
        <Card padding="none">
          <CardContent>
            <Table label="시맨틱 토큰과 참조하는 파운데이션 값">
              <TableHeader>
                <TableRow>
                  <TableHead>역할 토큰</TableHead>
                  <TableHead>참조</TableHead>
                  <TableHead>값</TableHead>
                  <TableHead>설명</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SEMANTIC_TOKENS.map((t) => (
                  <TableRow key={t.token}>
                    <TableCell className="font-mono text-12 font-semibold">{t.token}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-12">{t.refPrimitive}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block size-3.5 rounded border"
                          style={{ background: t.hex, borderColor: 'rgba(0,0,0,0.1)' }}
                        />
                        <span className="font-mono text-12">{t.hex}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </Section>
      )}

      {activeId === 'ds-components' && (
        <Section id="ds-components" title="공통 컴포넌트" description="모먹지 앱의 실제 CSS로 그린 라이브 프리뷰입니다(iframe으로 격리해서 이 대시보드 스타일과 섞이지 않습니다).">
          <ComponentPreviewFrame html={buildComponentPreviewHtml()} title="모먹지 컴포넌트 라이브 프리뷰" minHeight={1400} />
        </Section>
      )}

      {activeId === 'ds-usage' && (
        <Section
          id="ds-usage"
          title="디자인 시스템 활용 현황"
          description="시맨틱 토큰이 실제 index.html에서 var(--token)으로 몇 번 참조되는지 grep으로 직접 센 값입니다."
        >
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3">
              {TOKEN_USAGE.map((u) => {
                const max = TOKEN_USAGE[0].count
                const pct = Math.round((u.count / max) * 100)
                return (
                  <div key={u.token} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 font-mono text-12 font-semibold">{u.token}</span>
                    <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-muted-foreground w-14 shrink-0 text-right text-12 font-semibold tabular-nums">
                      {u.count}곳
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {USAGE_HIGHLIGHTS.map((h) => (
              <Card key={h.title}>
                <CardHeader>
                  <CardTitle className="text-14">{h.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-12 leading-relaxed">{h.body}</p>
                  {h.where && (
                    <div className="flex flex-wrap gap-1.5">
                      {h.where.map((w) => (
                        <Badge key={w} variant="info">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {AUDIT_FINDINGS.map((f) => (
            <Alert key={f.summary} variant="warning">
              <Info aria-hidden />
              <div>
                <AlertTitle>{f.summary}</AlertTitle>
                <AlertDescription>{f.detail}</AlertDescription>
              </div>
            </Alert>
          ))}
        </div>
        </Section>
      )}
    </>
  )
}
