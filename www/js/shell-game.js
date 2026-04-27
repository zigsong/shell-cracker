// ─── 조개 게임 로직 ───
const ShellGame = {
  lane: null,
  shells: [], // { el, x, state: 'moving'|'opened'|'broken'|'done' }
  animFrame: null,
  spawnSequence: null,
  running: false,
  hitZoneSize: 60, // 시각 하이라이트 및 자동 miss 판정용 ±px
  hitWindow: 0.1, // fraction 기준 ±10% 이내만 hit 인정 (travelBeats=4 기준 ±0.4박 ≈ ±188ms)
  travelBeats: 4,
  travelDist: 0,
  spawnFrozenUntilTick: 0, // 레벨업 시 첫 마디 스폰 금지
  hitThisLevel: 0,
  missedThisLevel: 0,
  expectedShellsThisLevel: 0,

  // 레벨별 스폰 패턴 ("4n" 기준, 8스텝 = 2마디 루프)
  // Phase1(인덱스 0~3, 첫 마디)에만 스폰 → Phase2(인덱스 4~7)는 모두 null
  // 스폰된 조개는 4비트 후(Phase2 시작)에 pop → 유저가 Phase2에서 hit
  LEVEL_PATTERNS: [
    null, // 0: 미사용
    [1, 1, 1, 1, null, null, null, null], // 1: 4박 정박
    [1, null, 1, null, null, null, null, null], // 2: 1·3박
    [[1, 1], null, null, null, null, null, null, null], // 3: 8분 연타
    [1, null, 1, 1, null, null, null, null], // 4: 1·3·4박
    [[1, 1, 1], null, null, null, null, null, null, null], // 5: 셋잇단
    [1, 1, null, 1, null, null, null, null], // 6: 갤로핑
    [[1, null, 1], null, [1, 1], null, null, null, null, null], // 7: 싱코+연타
    [[1, 1, null, 1], null, null, null, null, null, null, null], // 8: 갤로핑 리듬
    [[1, null, 1, null, 1], null, null, null, null, null, null, null], // 9: 5분할
    [[1, 1], null, [1, null, 1], null, null, null, null, null], // 10: 복합
    [[1, 1], null, [1, 1, 1], null, null, null, null, null], // 11: 쌍+삼연음
    [[1, 1, 1], null, [1, 1, 1], null, null, null, null, null], // 12: 더블 삼연음
    [1, [1, 1], 1, null, null, null, null, null], // 13: 분산 혼합
    [[1, null, 1], [1, null, 1], null, null, null, null, null, null], // 14: 싱코 반복
    [[1, 1, null, 1], null, [1, 1], null, null, null, null, null], // 15: 갤로핑+쌍
    [[1, 1, 1, 1], null, null, null, null, null, null, null], // 16: 16분 연속
    [1, [1, 1], [1, null, 1], null, null, null, null, null], // 17: 혼합 박자
    [[1, null, 1, 1], [1, null, 1], null, null, null, null, null, null], // 18: 복잡한 분산
    [[1, 1, 1], [null, 1, 1], null, null, null, null, null, null], // 19: 연음 이어지기
    [[1, 1], [1, null, 1], null, [1, 1], null, null, null, null], // 20: 전박 분산
  ],

  // 레벨 → 패턴 (레벨 21부터는 10~20 순환)
  _getPattern(level) {
    if (level < this.LEVEL_PATTERNS.length)
      return this.LEVEL_PATTERNS[level];
    const hard = this.LEVEL_PATTERNS.slice(10);
    return hard[(level - 10) % hard.length];
  },

  start(seqStart = 0) {
    this.lane = document.getElementById("shellLane");
    this.shells = [];
    this.running = true;
    // 히트존 Y: 원래 bottom:calc(25% + 192px) 위치 → shell center 기준
    const hitZoneCenterY = window.innerHeight * 0.75 - 262;
    this.hitZoneY = hitZoneCenterY;
    this.travelDist = hitZoneCenterY + 70; // shell center starts at -70, arrives at hitZoneCenterY

    this._startSequence(1);
    this.spawnSequence.start(seqStart); // 다음 마디 경계에 정확히 시작 → BGM 동기화

    this.loop();
  },

  stop() {
    this.running = false;
    if (this.spawnSequence) {
      this.spawnSequence.dispose();
      this.spawnSequence = null;
    }
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.shells.forEach((s) => s.el.remove());
    this.shells = [];
    this.spawnFrozenUntilTick = 0; // 재시작 시 틱 초기화
    this.hitZoneY = null;
  },

  _startSequence(level) {
    if (this.spawnSequence) {
      this.spawnSequence.dispose();
      this.spawnSequence = null;
    }
    const pattern = this._getPattern(level);
    this.hitThisLevel = 0;
    this.missedThisLevel = 0;
    this.expectedShellsThisLevel = pattern
      .flat()
      .filter((v) => v === 1).length;
    this.spawnSequence = new Tone.Sequence(
      (time, value) => {
        if (value === null) return;
        // 오디오 콜백에서 직접 WebAudio 스케줄 → BGM 킥과 샘플 정확도로 동기화
        PopSFX.trigger(time);
        const scheduledTick = Tone.Transport.getTicksAtTime(time);
        Tone.Draw.schedule(() => {
          PopSFX.isActive = true;
          setTimeout(() => { PopSFX.isActive = false; }, 300);
          if (this.running) this.spawnShell(scheduledTick);
        }, time);
      },
      pattern,
      "4n",
    );
  },

  pause() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  },

  resume() {
    if (this.running) return;
    this.running = true;
    this.loop();
  },

  freezeSpawnFor(beats) {
    const PPQ = Tone.Transport.PPQ || 192;
    this.spawnFrozenUntilTick = Tone.Transport.ticks + beats * PPQ;
  },

  spawnShell(spawnTick) {
    if (spawnTick < this.spawnFrozenUntilTick) return;
    const el = document.createElement("div");
    el.className = "shell";
    const startY = -140;
    const baseX = window.innerWidth / 2 - 50;
    el.style.top = startY + "px";
    el.style.left = baseX + "px";
    this.lane.appendChild(el);
    this.shells.push({
      el,
      y: startY,
      baseX,
      spawnTick,
      state: "moving",
    });
  },

  loop() {
    if (!this.running) return;

    // tick 기반 위치 계산: BPM이 바뀌어도 항상 음악 박자에 동기화
    const PPQ = Tone.Transport.PPQ || 192;
    const travelTicks = this.travelBeats * PPQ;
    const currentTick = Tone.Transport.ticks;
    const startY = -140;
    const otterCenterY = this.hitZoneY || window.innerHeight * 0.75 - 83;

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const shell = this.shells[i];
      if (shell.state !== "moving") continue;

      const VISUAL_AHEAD = 0; // 오디오 비트와 시각 동기화
      const fraction =
        (currentTick - shell.spawnTick + VISUAL_AHEAD) / travelTicks;
      const y = startY + fraction * this.travelDist;
      shell.y = y;
      shell.el.style.top = y + "px";

      // 조개는 Phase1부터 완전히 보이며 직선 낙하
      shell.el.style.left = shell.baseX + "px";

      // 히트존 완전히 벗어나면 미스 (자동 판정)
      const shellCenterY = y + 70;
      if (shellCenterY > otterCenterY + this.hitZoneSize) {
        this.missShell(shell);
      }
    }

    // 화면 밖으로 나간 조개 정리
    for (let i = this.shells.length - 1; i >= 0; i--) {
      if (this.shells[i].y > window.innerHeight + 100) {
        this.shells[i].el.remove();
        this.shells.splice(i, 1);
      }
    }

    // 히트존 하이라이트
    const guide = document.querySelector(".hit-zone-guide");
    if (this.findHittable()) {
      guide.classList.add("hittable");
    } else {
      guide.classList.remove("hittable");
    }

    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  // 히트존 타이밍(fraction≈1.0)에 있는 조개 찾기
  findHittable() {
    const PPQ = Tone.Transport.PPQ || 192;
    const travelTicks = this.travelBeats * PPQ;
    const currentTick = Tone.Transport.ticks;
    let best = null;
    let bestDist = Infinity;

    for (const shell of this.shells) {
      if (shell.state !== "moving") continue;
      const fraction = (currentTick - shell.spawnTick) / travelTicks;
      // fraction=1.0이 완벽한 타이밍, ±hitWindow 이내만 hit
      const dist = Math.abs(fraction - 1.0);
      if (dist <= this.hitWindow && dist < bestDist) {
        best = shell;
        bestDist = dist;
      }
    }
    return best;
  },

  // 히트존에 가장 가까운 조개 찾기
  findNearest() {
    const PPQ = Tone.Transport.PPQ || 192;
    const travelTicks = this.travelBeats * PPQ;
    const currentTick = Tone.Transport.ticks;
    const otterCenterY = this.hitZoneY || window.innerHeight * 0.75 - 83;
    let best = null;
    let bestDist = Infinity;

    for (const shell of this.shells) {
      if (shell.state !== "moving") continue;
      const shellCenter = shell.y + 70;
      const dist = Math.abs(shellCenter - otterCenterY);
      if (dist < bestDist) {
        best = shell;
        bestDist = dist;
      }
    }
    return best;
  },

  // 성공: 열린 조개
  _checkLevelBonus() {
    if (
      this.hitThisLevel + this.missedThisLevel ===
      this.expectedShellsThisLevel
    ) {
      if (this.missedThisLevel === 0 && this.hitThisLevel > 0) {
        Score.addBonus();
      }
    }
  },

  openShell(shell) {
    SFX.play("hit");
    HP.gain();
    Score.addHit();
    if (window.__AIT__?.generateHapticFeedback) {
      window.__AIT__.generateHapticFeedback({ type: "tickWeak" });
    } else {
      window.Capacitor?.Plugins?.Haptics?.impact({ style: "Medium" });
    }
    this.hitThisLevel++;
    this._checkLevelBonus();
    shell.state = "opened";
    shell.el.classList.add("opened");
    setTimeout(() => {
      shell.el.classList.add("fade-out");
      setTimeout(() => {
        shell.el.remove();
        const idx = this.shells.indexOf(shell);
        if (idx !== -1) this.shells.splice(idx, 1);
      }, 300);
    }, 400);
  },

  // 실패: 깨진 조개
  missShell(shell) {
    SFX.play("miss");
    HP.lose();
    this.missedThisLevel++;
    this._checkLevelBonus();
    shell.state = "broken";
    shell.el.classList.add("broken");
    Sprite.showMiss(1);
    setTimeout(() => Sprite.showSuccess(0), 400);
    setTimeout(() => {
      shell.el.classList.add("fade-out");
      setTimeout(() => {
        shell.el.remove();
        const idx = this.shells.indexOf(shell);
        if (idx !== -1) this.shells.splice(idx, 1);
      }, 300);
    }, 400);
  },
};

