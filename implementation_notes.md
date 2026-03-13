# Implementation Notes

## 구현한 내용

### 2-phase 시스템 (Toss + Catch)

- **Phase 1 (Toss, 0~4비트)**: 조개가 좌우 랜덤 offset(±40~80px)에서 시작해 중앙으로 수평 이동. opacity 0.45, scale 0.8. 터치 불가.
- **Phase 2 (Catch, 4~8비트)**: 조개가 중앙 고정 상태로 히트존으로 낙하. opacity 1, scale 1. 터치 가능.
- fraction < 0.5 구간은 tossing 클래스, fraction >= 0.5 구간은 catchable 클래스로 전환.
- 미스 판정은 catchable 구간(fraction >= 0.5)에서만 발생.
- findHittable() / findNearest() 모두 fraction < 0.5 조개는 무시.

### SFX 변경

- `pop` 키 제거, `toss` 키 추가. 조개 스폰 시 `audio/toss_1.mp3` 재생.

### travelBeats 변경

- 4비트 -> 8비트로 변경. Phase 1(4비트) + Phase 2(4비트) = 총 8비트 낙하.

## 파일 변경 사항

`/Users/songjieun/Desktop/shell-cracker/index.html`:

1. **CSS** (.shell.fade-out 뒤): `.shell.tossing` (opacity 0.45, scale 0.8), `.shell.catchable` (opacity 1, scale 1, transition 0.25s) 추가.
2. **SFX 객체**: `pop: new Audio("audio/pop_1.mp3")` -> `toss: new Audio("audio/toss_1.mp3")` 교체.
3. **ShellGame.travelBeats**: `4` -> `8` 변경.
4. **spawnShell()**: `shell tossing` 클래스로 생성, startX/baseX 저장, offsetX 랜덤 적용, `SFX.play("toss")` 호출.
5. **loop() 내부**: fraction 기반 Phase 분기 처리 (left 보간 + 클래스 전환), 미스 판정에 `fraction >= 0.5` 조건 추가.
6. **findHittable()**: fraction < 0.5 skip, Tone.Transport.ticks 기반 fraction 계산 추가.
7. **findNearest()**: fraction < 0.5 skip, Tone.Transport.ticks 기반 fraction 계산 추가.

## 기존 코드와의 연결 지점

- `spawnShell()`: 기존 Tone.Sequence 스케줄러가 그대로 호출. shell 객체에 `startX`, `baseX` 필드 추가됨.
- `loop()`: 기존 requestAnimationFrame 루프 유지. 내부 fraction 계산 이후에 Phase 분기 블록 삽입.
- `findHittable()` / `findNearest()`: handleTap() 함수에서 동일하게 호출. 내부 로직만 변경, 반환 타입(shell 객체 또는 null) 동일.
- `SFX.play("toss")`: SFX 객체에 toss 키 추가 후 spawnShell에서 호출. 기존 hit/miss는 유지.

## 미구현 항목

없음. 요청된 7가지 변경사항 전부 적용 완료.

## 테스트 방법

브라우저에서 `/Users/songjieun/Desktop/shell-cracker/index.html` 직접 열기.

1. START GAME 클릭 -> 게임 화면 전환 확인.
2. 조개 스폰 시 `toss_1.mp3` 재생 확인 (브라우저 콘솔에서 오디오 에러 없어야 함).
3. 조개가 처음 등장할 때 좌우 offset 위치에서 반투명(opacity ~0.45), 작은 크기(scale 0.8)로 나타나는지 확인.
4. 조개가 중앙으로 수렴하면서 4비트 경과 후 full opacity + scale 1로 전환되는지 확인.
5. 조개가 tossing 상태일 때 탭해도 히트 판정이 없는지 확인.
6. 조개가 catchable 상태(히트존 접근)일 때 탭하면 성공 처리되는지 확인.
7. catchable 조개를 놓치면 미스 판정 + 수달 미스 스프라이트 표시 확인.
8. 히트존 가이드(흰 실루엣)가 catchable 조개 접근 시에만 하이라이트되는지 확인.
9. 일시정지 -> 재개 후 게임이 정상 동작하는지 확인.
10. 처음으로 돌아가기 -> 다시 START GAME -> 정상 초기화 확인.
