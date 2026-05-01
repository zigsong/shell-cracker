async function triggerGameOver() {
  BGM.pause();
  ShellGame.stop();
  LevelSystem.stop();
  const scoreEl = document.getElementById("gameoverScore");
  if (scoreEl) scoreEl.textContent = `SCORE: ${Score.current}`;

  // 리워드 버튼 활성화
  const rewardBtn = document.getElementById("rewardAdBtn");
  if (rewardBtn) rewardBtn.disabled = false;

  const overlay = document.getElementById("gameoverOverlay");
  overlay.style.display = "flex";
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });

  try {
    Leaderboard.init();
    await Leaderboard.submitScore(Score.current);
  } catch (e) {
    console.error("리더보드 오류", e);
  }
}

function hideGameover() {
  const overlay = document.getElementById("gameoverOverlay");
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 400);
}

// ─── 게임 시작 ───
async function startGame() {
  const introLayer = document.getElementById("introLayer");
  const gameScreen = document.getElementById("gameScreen");

  await BGM.start();
  await PopSFX.init();

  // 레벨 초기화
  LevelSystem.init();

  // 인트로 페이드아웃
  introLayer.classList.add("fade-out");

  // 게임 화면 페이드인
  setTimeout(() => {
    gameScreen.classList.add("active");
    requestAnimationFrame(() => {
      gameScreen.style.opacity = "1";
    });
  }, 300);

  // HP 초기화
  HP.init();
  Score.init();

  // 스프라이트 초기화 → 기본 캐릭터 (success 1번)
  Sprite.init();
  Sprite.showSuccess(0);

  // 다음 마디 경계에 맞춰 시작 → BGM과 박자 동기화
  setTimeout(() => {
    const measureSec = Tone.Time("1m").toSeconds();
    const nowSec = Tone.Transport.seconds;
    const startSec = (Math.floor(nowSec / measureSec) + 1) * measureSec;

    ShellGame.start(startSec);
    LevelSystem.start(startSec);

    // LISTEN 메시지도 Phase1 시작 시점(startSec)에 표시
    Tone.Draw.schedule(() => {
      LevelSystem.showLevelIndicator();
    }, startSec);
  }, 600);
}

// ─── 탭(터치/클릭) 입력 처리 ───
let lastTapTime = 0;
let tapResetTimer = null;
const gamePlaying = () =>
  document.getElementById("gameScreen").classList.contains("active") &&
  !document.getElementById("pauseOverlay").classList.contains("active");

function handleTap(e) {
  if (!gamePlaying()) return;
  if (e.target.closest("button")) return; // 버튼 클릭은 무시

  // 중복 호출 방지 (touchstart + click 동시 발생 차단)
  const now = Date.now();
  if (now - lastTapTime < 100) return;
  lastTapTime = now;

  if (tapResetTimer) clearTimeout(tapResetTimer);

  // 히트존에 조개가 있는지 확인
  const shell = ShellGame.findHittable();
  if (shell) {
    // 성공! → 열린 조개 + CRACK 수달
    ShellGame.openShell(shell);
    Sprite.showSuccess(2);
  } else {
    const nearest = ShellGame.findNearest();
    const hitZoneY =
      ShellGame.hitZoneY || window.innerHeight * 0.75 - 262;
    const inZone =
      nearest && nearest.y + 70 >= hitZoneY - ShellGame.hitZoneSize;

    if (LevelSystem.isListenPhase) {
      // listen 단계에서는 miss 처리 없음, pop 없을 때만 boing
      if (!PopSFX.isActive) Sprite.showMiss(0);
    } else if (inZone) {
      // 조개가 히트존 안에 있는데 타이밍 놓침 → HP 감소 + MISS!
      ShellGame.missShell(nearest);
    } else if (nearest) {
      // 조개가 히트존 밖 → HP만 감소, 조개는 계속 낙하
      SFX.play("miss");
      HP.lose();
      Sprite.showMiss(1);
      setTimeout(() => Sprite.showSuccess(0), 400);
    }
  }

  // 400ms 후 기본 포즈로 복귀
  tapResetTimer = setTimeout(() => {
    Sprite.showSuccess(0);
    tapResetTimer = null;
  }, 400);
}

let _touchFired = false;

document.getElementById("gameScreen").addEventListener("touchstart", (e) => {
  _touchFired = true;
  handleTap(e);
}, { passive: true });

document.getElementById("gameScreen").addEventListener("click", (e) => {
  if (_touchFired) { _touchFired = false; return; }
  handleTap(e);
});

// ─── 일시정지 ───
// Transport를 pause하지 않고 볼륨만 끔 → Tone.js 시퀀스 스케줄 유지
function pauseGame() {
  if (BGM._masterVol) BGM._masterVol.volume.value = -Infinity; // 음소거
  if (ShellGame.spawnSequence) ShellGame.spawnSequence.stop(); // 새 조개 스폰 중단
  ShellGame._pauseTick = Tone.Transport.ticks; // 위치 보정용 틱 기록
  ShellGame.running = false;
  if (ShellGame.animFrame) cancelAnimationFrame(ShellGame.animFrame);
  // listen 단계 플래그 및 타이머 정지
  clearTimeout(LevelSystem._listenTimer);
  LevelSystem.isListenPhase = false;
  // 이미 스케줄된 pop 사운드 뮤트
  if (PopSFX._gainNode) PopSFX._gainNode.gain.value = 0;
  document.getElementById("pauseOverlay").classList.add("active");
}

// ─── 게임 계속하기 ───
function resumeGame() {
  document.getElementById("pauseOverlay").classList.remove("active");
  // 볼륨 복원
  if (BGM._masterVol) BGM._masterVol.volume.value = -6;
  if (PopSFX._gainNode) PopSFX._gainNode.gain.value = 1.0;
  // Transport가 계속 진행된 만큼 spawnTick 보정 → 조개가 멈춘 자리에서 이어서
  const ticksElapsed = Tone.Transport.ticks - (ShellGame._pauseTick || 0);
  ShellGame.shells.forEach((s) => {
    if (s.state === "moving") s.spawnTick += ticksElapsed;
  });
  // spawnSequence 즉시 재시작
  ShellGame._startSequence(LevelSystem.currentLevel);
  ShellGame.spawnSequence.start("+0");
  // 애니메이션 루프 재시작
  ShellGame.running = true;
  ShellGame.loop();
}

// ─── 처음으로 돌아가기 ───
function goHome() {
  document.getElementById("pauseOverlay").classList.remove("active");

  BGM.stop();
  ShellGame.stop();
  LevelSystem.stop();

  const gameScreen = document.getElementById("gameScreen");
  gameScreen.classList.remove("active");
  gameScreen.style.opacity = "0";

  document.getElementById("introLayer").classList.remove("fade-out");
}

// ─── 이벤트 바인딩 ───
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("pauseBtn").addEventListener("click", pauseGame);
document
  .getElementById("resumeBtn")
  .addEventListener("click", resumeGame);
document.getElementById("homeBtn").addEventListener("click", goHome);

document
  .getElementById("retryBtn")
  .addEventListener("click", async () => {
    hideGameover();
    BGM.stop(); // Transport 완전 리셋 (0으로)
    ShellGame.stop(); // 혹시 남은 조개 정리
    LevelSystem.stop();
    await startGame(); // 처음부터 새 게임
  });

// ─── BGM 뮤트 버튼 ───
let _bgmMuted = false;
const MUTE_ICON = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>`;
const UNMUTE_ICON = `<path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`;
document.getElementById("muteBtn").addEventListener("click", () => {
  _bgmMuted = !_bgmMuted;
  document.getElementById("muteBtnIcon").innerHTML = _bgmMuted
    ? UNMUTE_ICON
    : MUTE_ICON;
  BGM.setVolume(_bgmMuted ? 0 : 100);
});
document
  .getElementById("gameoverHomeBtn")
  .addEventListener("click", () => {
    hideGameover();
    const gameScreen = document.getElementById("gameScreen");
    gameScreen.classList.remove("active");
    gameScreen.style.opacity = "0";
    document.getElementById("introLayer").classList.remove("fade-out");
  });

document
  .getElementById("lbNicknameBtn")
  .addEventListener("click", () => Leaderboard.updateNickname());

document
  .getElementById("rewardAdBtn")
  .addEventListener("click", async () => {
    const btn = document.getElementById("rewardAdBtn");
    btn.disabled = true;
    await Leaderboard.cancelScore();
    HP.gain();
    hideGameover();
    BGM.stop();
    ShellGame.stop();
    LevelSystem.stop();
    await startGame();
  });
