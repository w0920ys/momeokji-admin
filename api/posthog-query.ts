import type { VercelRequest, VercelResponse } from '@vercel/node'

/*
 * PostHog HogQL 쿼리 프록시.
 *
 * 왜 프록시가 필요한가: HogQL Query API를 부르려면 PostHog Personal API Key가
 * 있어야 하는데, 이 키는 (query:read로 최소 권한을 줬어도) 프로젝트의 원시
 * 이벤트 데이터를 전부 읽을 수 있다 — 브라우저 번들에 절대 넣으면 안 된다.
 * 그래서 이 서버 함수 안에서만 키를 쥐고, 화면은 이 함수를 통해서만 쿼리한다.
 *
 * 이 함수 자체도 지켜야 한다 — 그냥 열어두면 누구나 이 URL로 우리 PostHog
 * 데이터를 읽을 수 있다. momeokji-admin은 "오로지 나만 볼 수 있어야" 하므로,
 * 호출자가 Supabase 세션을 들고 있고 그 이메일이 ADMIN_EMAIL과 일치하는지
 * 매 요청마다 검증한다(화면 쪽 로그인 게이트만 믿지 않음 — 그건 UI일 뿐, API는
 * API 스스로 지켜야 한다).
 */

const POSTHOG_HOST = 'https://us.posthog.com'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 허용됩니다.' })
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const adminEmail = process.env.VITE_ADMIN_EMAIL
  const posthogKey = process.env.POSTHOG_PERSONAL_API_KEY
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID

  if (!supabaseUrl || !supabaseAnonKey || !adminEmail || !posthogKey || !posthogProjectId) {
    res.status(500).json({ error: '서버 환경변수가 설정되지 않았습니다.' })
    return
  }

  // ---- 1) 호출자가 관리자 본인인지 확인 ----
  const authHeader = req.headers.authorization
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) {
    res.status(401).json({ error: '로그인이 필요합니다.' })
    return
  }
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey },
  })
  if (!userRes.ok) {
    res.status(401).json({ error: '세션이 유효하지 않습니다.' })
    return
  }
  const user = (await userRes.json()) as { email?: string }
  if (user.email !== adminEmail) {
    res.status(403).json({ error: '관리자만 접근할 수 있습니다.' })
    return
  }

  // ---- 2) 쿼리 자체도 최소한으로 검증 (읽기 전용 쿼리만) ----
  const query = (req.body as { query?: unknown } | undefined)?.query
  if (typeof query !== 'string' || !/^\s*select\b/i.test(query)) {
    res.status(400).json({ error: 'SELECT 쿼리만 허용됩니다.' })
    return
  }

  // ---- 3) PostHog로 전달 ----
  const phRes = await fetch(`${POSTHOG_HOST}/api/projects/${posthogProjectId}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${posthogKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  })
  const data = await phRes.json()
  res.status(phRes.ok ? 200 : 502).json(data)
}
