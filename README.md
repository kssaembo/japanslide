# 한글학교 AI 웹 프레젠테이션

React·TypeScript·Vite. 콘텐츠 편집, 게시본 열람, 이미지/영상 팝업, 발표 리모컨 순차 제어를 지원합니다.

- 설치: npm ci
- 로컬 실행: npm run dev
- 빌드: npm run build
- UI 테스트: npm test
- 로컬 SQL 검증: npm run test:db

기존 Supabase 연결·Vercel 환경변수·이전 JSON 가져오기·리모컨 사용은 docs/SUPABASE_SETUP.md를 참고하세요. SQL은 supabase/migrations/001_slide_cloud.sql에 있습니다.

환경값이 없으면 브라우저 로컬 편집(IndexedDB)으로 실행합니다. 서버 연결 시 관리자 로그인 후 편집·저장·게시하며 청중은 게시본만 열람합니다. 기존 interview_* 데이터는 변경하지 않습니다.
