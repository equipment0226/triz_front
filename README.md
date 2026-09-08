# TRIZ Studio Frontend

React 19 / Vite / Lucide. Backend: https://github.com/equipment0226/triz_backend

운영: https://trizfront-production.up.railway.app
Railway의 `triz_front` 서비스는 이 저장소의 main 브랜치에 연결되어 있다.

```sh
npm ci
npm run dev
```

개발 서버는 `/api`를 로컬 `127.0.0.1:8000`으로 전달한다.

## Production / Railway

저장소 루트의 Dockerfile로 빌드한다. Node 서버가 정적 화면과 `/api` 프록시를 제공한다.
`BACKEND_URL`에 Railway 백엔드 private URL을 설정한다. 브라우저 번들에는 키를 넣지 않는다.

| 서버 환경변수 | 설정 |
|---|---|
| PORT | 8080 |
| BACKEND_URL | http://triz-backend.railway.internal:8000 (실제 도메인으로 변경) |
| TRIZ_APP_TOKEN | 백엔드와 동일한 gateway token |
| PUBLIC_ORIGIN | https://trizfront-production.up.railway.app |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google Cloud 웹 애플리케이션 OAuth 클라이언트 |

```sh
npm run build
npm run test:server
npm start
```

`/healthz`는 배포 healthcheck다. 공개 사례·보고서는 `/api/public/`에서 비회원도 읽을 수 있고, 작업 API는 로그인 후 같은 프런트 도메인을 통해 접근한다.
보고서의 도식은 각 분석 항목에 배치한다. 작업 화면은 분석 현황/해결안/보고서/피드백으로 나누며 공개 Sample Case에는 다운로드 버튼과 별도 분석 도식 탭을 두지 않는다. 연결 근거와 유사 사례는 공통 참고자료 카드로 표시하고, 근거가 없으면 안내 문구를 생략한다. 추가 도출된 해결책의 순위 기본값 99는 ‘추가 도출’로 표시한다. 탭 아이콘은 로봇 SVG 파비콘을 사용한다.
내부 MCP와 n8n endpoint는 프록시하지 않는다. 무료 베타의 Sample Case에서는 모든 회원의 분석과 단일 HTML 보고서를 로그인 없이 열람한다. Problem Solving에서 실행·수정하는 작업과 내 관리 이력은 Google 로그인 후 사용한다.
Google Cloud의 승인된 리디렉션 URI에 `https://trizfront-production.up.railway.app/auth/google/callback`을 등록한다.
최초 로그인은 회원 계정을 자동 생성한다. HTTP-only 쿠키와 MySQL의 만료·철회 가능한 세션을 사용하며, 각 분석은 계정 소유자만 조회·수정·다운로드한다.
로컬 로그인 통합 확인은 `npm run build` 후 `PUBLIC_ORIGIN=http://localhost:8080`과 대응하는 OAuth 리디렉션 설정으로 `npm start`한다. Vite는 UI 개발용이며 인증 fixture는 브라우저 테스트에서만 제공한다.
