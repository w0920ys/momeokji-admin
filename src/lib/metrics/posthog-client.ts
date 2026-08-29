import { supabase } from '../supabase'

/*
 * PostHog HogQL 쿼리를 우리 서버리스 프록시(api/posthog-query.ts)에 보내는
 * 얇은 클라이언트. posthog.ts(대시보드 전체 집계)와 user-activity.ts(유저
 * 1인 상세)가 둘 다 이걸 쓴다 — 세션 토큰을 실어 보내는 로직을 두 곳에
 * 중복시키지 않으려고 뺐다.
 */
export async function runPostHogQuery(query: string): Promise<unknown[][]> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const res = await fetch('/api/posthog-query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`PostHog 쿼리 실패: HTTP ${res.status}`)
  const json = (await res.json()) as { results?: unknown[][] }
  return json.results ?? []
}
