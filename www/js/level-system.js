// ─── 레벨 시스템 ───
const LevelSystem = {
  currentLevel: 1,
  barCount: 0,
  barsPerLevel: 2,
  barEvent: null,
  isListenPhase: false,

  init() {
    this.currentLevel = 1;
    this.barCount = 0;
    this.isListenPhase = false;
  },

  start(seqStart = 0) {
    const measureSec = Tone.Time("1m").toSeconds();
    this.barEvent = Tone.Transport.scheduleRepeat(
      (time) => {
        this.barCount++;
        if (this.barCount % this.barsPerLevel === 0) {
          this.currentLevel++;
          // 다음 마디 AudioContext 시간 (Tone.Draw용)
          const nextBarTime = time + measureSec;
          // 다음 마디 Transport 시간 (spawnSequence.start용)
          // seqStart + barCount * measureSec = 정확한 transport 상의 시작 위치
          const nextBarTransportSec = seqStart + this.barCount * measureSec;
          ShellGame._startSequence(this.currentLevel);
          ShellGame.spawnSequence.start(nextBarTransportSec);
          // 레벨 표시는 Phase1 시작 시점에 바로 표시 (오디오→비주얼 브리지)
          Tone.Draw.schedule(() => {
            this.showLevelIndicator();
          }, nextBarTime);
        }
      },
      "1m",
      seqStart,
    );
  },

  stop() {
    if (this.barEvent !== null) {
      Tone.Transport.clear(this.barEvent);
      this.barEvent = null;
    }
    clearTimeout(this._listenTimer);
    this.isListenPhase = false;
    this.currentLevel = 1;
    this.barCount = 0;
  },

  showLevelIndicator() {
    this.isListenPhase = true;
    const measureMs = (60000 / Tone.Transport.bpm.value) * 2;
    clearTimeout(this._listenTimer);
    this._listenTimer = setTimeout(() => {
      this.isListenPhase = false;
    }, measureMs);
  },
};

