# AGENTS.md — Sea Otter Rhythm (조개 깨기)

## 프로젝트 개요

수달이 리듬에 맞춰 조개를 깨는 미니 리듬 게임입니다.
조개가 오른쪽에서 왼쪽으로 날아오고, 히트존 타이밍에 맞춰 탭/클릭하면 성공입니다.

**실행 방법**: `index.html`을 브라우저에서 열기 (서버 불필요, 순수 정적 파일)

---

## 파일 구조

```
shell-cracker/
├── index.html          # 메인 게임 파일 (인트로 + 게임 화면 + 모든 게임 로직)
├── game-bgm-1.html     # BGM 프로토타입/실험용 파일
├── js/
│   └── bgm.js          # BGM 시스템 (Tone.js 기반 절차적 음악 생성)
├── images/
│   ├── game_bg.png         # 게임 배경
│   ├── main_otter.png      # 인트로 수달 이미지
│   ├── shell_types.png     # 조개 스프라이트 시트 (3프레임: 기본/열림/깨짐, 100×140px each)
│   ├── sprite_success.png  # 성공 수달 스프라이트 (2×2 그리드, 프레임 320×167px)
│   └── sprite_miss.png     # 실패 수달 스프라이트 (2×1 그리드, 프레임 320×335px)
└── sound/
    ├── hit_1~4.mp3     # 조개 깨기 성공 효과음
    └── miss_1~2.mp3    # 미스 효과음
```

---

## 핵심 시스템 (index.html 내 JavaScript)

### BGM (`js/bgm.js`)

- **Tone.js** 사용, 절차적으로 멜로디/베이스/아르페지오/드럼 생성
- `BGM.start()` / `BGM.pause()` / `BGM.stop()` API
- `Tone.Transport`로 BPM 관리 — LevelSystem이 BPM을 직접 변경함

### ShellGame (조개 게임 로직)

- 조개 스폰: `Tone.Transport.scheduleRepeat`으로 2비트마다 생성
- 조개 이동: `requestAnimationFrame` 루프 + tick 기반 위치 계산 (BPM 변경에도 음악과 동기화)
- 히트 판정: 수달 중심 X ± 60px 범위 (`hitZoneSize`)
- **레벨업 시 주의**: `freezeSpawnFor(4)`로 1마디 동안 스폰 중단 (BPM 급변 구간 보호)

### LevelSystem

- 8마디(`barsPerLevel`)마다 레벨 업
- 레벨당 BPM +4 (`bpmIncrement`), 시작 BPM 80
- 레벨 텍스트 애니메이션 팝업 표시

### Sprite (수달 스프라이트)

- `sprite_success.png`: 4프레임 (기본/HIT/CRACK!/기뻐하는 모습)
- `sprite_miss.png`: 2프레임 (슬퍼하는 모습/MISS!)
- `showSuccess(frameIndex)` / `showMiss(frameIndex)` API

### SFX (효과음)

- `SFX.play("hit")` / `SFX.play("miss")`
- 중복 재생 방지: `currentTime = 0` 후 `play()`

---

## 개발 시 주의사항

- **모든 게임 로직이 `index.html` 한 파일**에 인라인으로 작성되어 있음. 새 JS 파일로 분리할 때는 `<script src="">` 순서(bgm.js 먼저)에 유의
- **Tone.js 비동기 초기화**: `BGM.start()`는 `async/await` 필수. 사용자 제스처 없이는 오디오 컨텍스트가 시작되지 않음
- **조개 위치 계산은 tick 기반**: `px per frame` 방식이 아니라 `(currentTick - spawnTick) / travelTicks`로 계산. BPM이 바뀌어도 음악과 동기화됨
- **터치/클릭 이벤트 중복 방지**: `lastTapTime` 100ms 쿨다운으로 `touchstart + click` 동시 발생 차단
- **스프라이트 시트 좌표**: `shell_types.png`는 `-100px` 간격, success 스프라이트는 `-320px / -167px` 간격

---

## 테스트 방법

별도 빌드 도구 없음. 브라우저에서 직접 실행:

1. `index.html`을 Chrome/Safari에서 열기
2. START GAME 클릭 → 오디오 컨텍스트 활성화 + 게임 시작
3. 모바일: 터치 이벤트(`touchstart`) 지원

게임플레이 검증 포인트:

- 조개가 박자에 맞게 날아오는지 (2비트마다 1개)
- 히트존 타이밍 시 흰 원 하이라이트
- 성공/실패 시 수달 스프라이트 전환 + 효과음
- 8마디 후 레벨업 팝업 + BPM 증가
