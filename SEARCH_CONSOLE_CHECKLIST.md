# Search Console Checklist

## 1) 속성 등록
1. Google Search Console에서 `URL 접두어` 속성으로 아래 URL 등록
2. `https://hain-z.github.io/hainz-project/`

## 2) 소유권 확인
1. 가장 쉬운 방법: HTML 태그 방식
2. Search Console이 주는 메타 태그를 `index.html`의 `<head>`에 추가
3. 배포 후 `확인` 클릭

## 3) 사이트맵 제출
1. Search Console > `Sitemaps` 메뉴 이동
2. `sitemap.xml` 제출
3. 상태가 `성공`인지 확인

## 4) 색인 점검
1. 주요 페이지 URL 검사 실행
2. `색인 생성 요청` 제출
3. 커버리지 리포트에서 `제외됨` 사유 확인

## 5) 광고 심사 전 점검
1. `robots.txt` 접근 확인: `/robots.txt`
2. `ads.txt` 접근 확인: `/ads.txt`
3. 404 페이지 동작 확인: 존재하지 않는 URL 접속
4. 모바일 렌더링 확인 (텍스트 잘림/레이아웃 깨짐 여부)
