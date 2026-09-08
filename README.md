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
| DEMO_USERNAME / DEMO_PASSWORD | 공유 데모 접근 계정; 둘 다 설정 |

```sh
npm run build
npm run test:server
npm start
```

`/healthz`는 배포 healthcheck다. API와 보고서는 로그인 후 같은 프런트 도메인을 통해 접근한다.
내부 MCP와 n8n endpoint는 프록시하지 않는다. 데모 인증은 사용자별 데이터 격리가 아니다.
