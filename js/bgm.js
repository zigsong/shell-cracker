// ─── Game BGM 3 — C-G-Am-F chord progression ───

const BGM = {
  playing: false,
  inited: false,
  _seq: null,
  _masterVol: null,

  // 16-step patterns
  _grid: {
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    ohat:  [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],
    bass:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    mel:   [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    arp:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
  },

  // C - G - Am - F 코드 진행
  _MEL_N:  ["C5","C5","G5","G5","A5","A5","F5","F5","C5","C5","G5","G5","A5","A5","F5","F5"],
  _ARP_N:  ["E6","G6","E6","G6","A6","C6","A6","C6","E6","G6","E6","G6","A6","C6","A6","C6"],
  _BASS_N: ["C2","C2","C2","C2","G2","G2","G2","G2","A2","A2","A2","A2","F2","F2","F2","F2"],

  _synths: null,

  async init() {
    if (this.inited) return;
    this.inited = true;

    this._masterVol = new Tone.Volume(-6).toDestination();

    // ── 킥: 사인파 2레이어 ──────────────────────────
    const kDist = new Tone.Distortion(0.1).connect(this._masterVol);
    const kEnv = new Tone.AmplitudeEnvelope({
      attack: 0.001, decay: 0.26, sustain: 0, release: 0.05,
    }).connect(kDist);
    const kOsc = new Tone.Oscillator({ type: "sine", frequency: 80 }).connect(kEnv);
    const kSubE = new Tone.AmplitudeEnvelope({
      attack: 0.001, decay: 0.18, sustain: 0, release: 0.04,
    }).connect(this._masterVol);
    const kSub = new Tone.Oscillator({ type: "sine", frequency: 55 }).connect(kSubE);

    // ── 스네어: 노이즈 + 사인 바디 ──────────────────
    const sG = new Tone.Gain(0.65).connect(this._masterVol);
    const sHp = new Tone.Filter(1800, "highpass").connect(sG);
    const sN = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 },
    }).connect(sHp);
    const sB = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.03 },
    }).connect(sG);

    // ── 닫힌 하이햇 ──────────────────────────────────
    const hG = new Tone.Gain(0.26).connect(this._masterVol);
    const hHp = new Tone.Filter(7000, "highpass").connect(hG);
    const hN = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.008 },
    }).connect(hHp);

    // ── 오픈 하이햇 ──────────────────────────────────
    const oG = new Tone.Gain(0.16).connect(this._masterVol);
    const oHp = new Tone.Filter(5800, "highpass").connect(oG);
    const oN = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.09, sustain: 0.04, release: 0.06 },
    }).connect(oHp);

    // ── 베이스: 삼각파+사인파 믹스 ───────────────────
    const bLp = new Tone.Filter(350, "lowpass").connect(this._masterVol);
    const bTri = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.012, decay: 0.18, sustain: 0.12, release: 0.08 },
    }).connect(bLp);
    const bSin = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.012, decay: 0.18, sustain: 0.12, release: 0.08 },
    }).connect(bLp);
    bTri.volume.value = -5;
    bSin.volume.value = -8;

    // ── 멜로디: 펄스파+삼각파 ────────────────────────
    const mRev = new Tone.Reverb({ decay: 0.8, wet: 0.12 }).connect(this._masterVol);
    const mLp = new Tone.Filter(3800, "lowpass").connect(mRev);
    const mPul = new Tone.Synth({
      oscillator: { type: "pulse", width: 0.5 },
      envelope: { attack: 0.006, decay: 0.12, sustain: 0.05, release: 0.1 },
    }).connect(mLp);
    const mTri = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.006, decay: 0.12, sustain: 0.05, release: 0.1 },
    }).connect(mLp);
    mPul.volume.value = -9;
    mTri.volume.value = -14;

    // ── 아르페지오: 사인파 + 리버브 ──────────────────
    const aRev = new Tone.Reverb({ decay: 1.0, wet: 0.18 }).connect(this._masterVol);
    const aLp = new Tone.Filter(5200, "lowpass").connect(aRev);
    const aSin = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.15 },
    }).connect(aLp);
    aSin.volume.value = -10;

    this._synths = {
      kick: {
        trigger(t) {
          kOsc.start(t); kOsc.stop(t + 0.35);
          kEnv.triggerAttackRelease(0.26, t);
          kOsc.frequency.setValueAtTime(190, t);
          kOsc.frequency.exponentialRampToValueAtTime(42, t + 0.08);
          kSub.start(t); kSub.stop(t + 0.25);
          kSubE.triggerAttackRelease(0.18, t);
          kSub.frequency.setValueAtTime(110, t);
          kSub.frequency.exponentialRampToValueAtTime(38, t + 0.07);
        },
      },
      snare: {
        trigger(t) {
          sN.triggerAttackRelease("8n", t);
          sB.triggerAttackRelease(255, "16n", t, 0.48);
        },
      },
      hihat: {
        trigger(t) {
          hN.triggerAttackRelease("32n", t);
        },
      },
      ohat: {
        trigger(t) {
          oN.triggerAttackRelease("8n", t);
        },
      },
      bass: {
        trigger: (t, step) => {
          bTri.triggerAttackRelease(this._BASS_N[step], "8n", t);
          bSin.triggerAttackRelease(this._BASS_N[step], "8n", t);
        },
      },
      mel: {
        trigger: (t, step) => {
          mPul.triggerAttackRelease(this._MEL_N[step], "8n", t);
          mTri.triggerAttackRelease(this._MEL_N[step], "8n", t);
        },
      },
      arp: {
        trigger: (t, step) => {
          aSin.triggerAttackRelease(this._ARP_N[step], "16n", t);
        },
      },
    };

    Tone.Transport.bpm.value = 128;
  },

  _startSeq() {
    if (this._seq) this._seq.dispose();
    const TRACKS = ["kick", "snare", "hihat", "ohat", "bass", "mel", "arp"];
    this._seq = new Tone.Sequence(
      (time, step) => {
        TRACKS.forEach((tr) => {
          if (this._grid[tr][step]) this._synths[tr].trigger(time, step);
        });
      },
      [...Array(16).keys()],
      "16n"
    );
    this._seq.start(0);
  },

  async start() {
    await Tone.start();
    await this.init();
    if (!this.playing) {
      if (!this._seq) this._startSeq();
      Tone.Transport.start();
      this.playing = true;
    }
  },

  stop() {
    Tone.Transport.stop();
    if (this._seq) { this._seq.dispose(); this._seq = null; }
    this.playing = false;
  },

  pause() {
    if (this.playing) {
      Tone.Transport.pause();
      this.playing = false;
    }
  },

  setVolume(value) {
    if (this._masterVol) {
      this._masterVol.volume.value = Tone.gainToDb(value / 100);
    }
  },
};
