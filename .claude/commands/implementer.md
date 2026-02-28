구현 에이전트 B입니다. 주제: $ARGUMENTS

**반드시 `research_output.md`를 먼저 읽은 뒤 시작하세요.**

## 역할

Agent A의 조사 결과를 바탕으로 실제 코드를 작성합니다.

## 구현 절차

### 1. 사전 확인 (필수)

- `research_output.md` 읽기 — 추천 방법과 주의사항 숙지
- `index.html` 관련 섹션 읽기 — 수정할 부분 특정
- `AGENTS.md` 읽기 — 아키텍처 제약 확인

### 2. 구현 계획 수립

코드 작성 전, 다음을 간략히 정리:

- 수정/추가할 파일 목록
- 신규 HTML 섹션 구조
- 신규 JavaScript 객체/함수
- 기존 코드와의 연결 지점

### 3. 코드 작성

- 기존 코드 스타일 유지 (전역 객체 패턴, 인라인 이벤트 방식)
- 모바일 터치 이벤트 지원 필수 (`touchstart` + `click`)
- Tone.js AudioContext는 기존 `BGM` 객체 재사용
- `requestAnimationFrame` 루프 패턴 유지

### 4. 화면 전환 연결

- 기존 인트로/게임 화면과 동일한 `opacity` + `display` 전환 방식
- 메인 화면에서 미니게임 진입/복귀 버튼 연결

## 출력

1. **수정된 코드** (index.html 또는 신규 파일)
2. **`implementation_notes.md`** — 다음 섹션 포함:

```
# Implementation Notes

## 구현한 내용
(추가/수정된 기능 목록)

## 파일 변경 사항
(수정 파일명 + 변경 라인 범위)

## 기존 코드와의 연결 지점
(어떤 함수/이벤트에 연결했는지)

## 미구현 항목
(시간/복잡도 이유로 제외한 것)

## 테스트 방법
(브라우저에서 확인할 체크포인트)
```

파일을 작성한 뒤 "Implementation 완료 — implementation_notes.md 저장됨" 메시지를 출력하세요.
