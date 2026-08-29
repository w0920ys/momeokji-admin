import * as React from 'react'

/*
 * 다른 서비스(모먹지 앱)의 실제 CSS를 이 대시보드 안에서 안전하게 보여주기
 * 위한 iframe 래퍼. srcDoc으로 넣은 문서는 이 페이지와 같은 오리진으로
 * 취급되므로(about:srcdoc), 클래스 이름 충돌 걱정 없이 완전히 격리된
 * document 하나를 그대로 그릴 수 있고, load 이후 contentDocument에도
 * 문제없이 접근할 수 있다.
 *
 * 높이를 고정값으로 두면 내용이 넘치거나 아래가 허전하게 잘리므로,
 * 로드 후 내부 문서의 실제 높이를 읽어 iframe 높이를 맞춘다. 구글
 * 폰트가 load 이벤트 이후에 늦게 적용되며 높이가 다시 변할 수 있어
 * 약간의 지연을 두고 한 번 더 잰다 — 그 이상의 정교한 옵저버는
 * 이 정적 프리뷰에는 과하다(YAGNI).
 */
export function ComponentPreviewFrame({
  html,
  title,
  minHeight = 200,
}: {
  html: string
  title: string
  minHeight?: number
}) {
  const ref = React.useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = React.useState(minHeight)

  const measure = React.useCallback(() => {
    const doc = ref.current?.contentDocument
    if (!doc?.documentElement) return
    setHeight(Math.max(minHeight, doc.documentElement.scrollHeight))
  }, [minHeight])

  function handleLoad() {
    measure()
    const t1 = setTimeout(measure, 250)
    const t2 = setTimeout(measure, 800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      onLoad={handleLoad}
      className="w-full rounded-md border"
      style={{ height }}
      // allow-scripts는 주지 않는다 — 정적 프리뷰라 스크립트 실행이 필요
      // 없고, 이 프리뷰 안에서 실행될 수 있는 코드 표면을 최소로 유지한다.
      // allow-same-origin은 반드시 필요하다 — 이게 없으면 sandbox가 iframe을
      // 불투명(opaque) 오리진으로 만들어 버려서, 위 measure()가 읽는
      // contentDocument 접근 자체가 교차 출처로 취급돼 막힌다.
      sandbox="allow-same-origin"
    />
  )
}
