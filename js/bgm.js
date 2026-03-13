// ─── Game BGM 2 — 8-bit rhythm, ocean & clear ───

const BGM = {
  playing: false,
  inited: false,
  _seq: null,
  _masterVol: null,

  // 16-step grid (Shoreline preset)
  _grid: {
    kick:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hihat:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    melody: [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
    arp:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
  },

  _MELODY_NOTES: ["C5","E5","G5","A5","C5","G5","E5","A5","C5","E5","G5","A5","E5","G5","C5","A5"],
  _ARP_NOTES:    ["C6","E6","G6","C6","A5","C6","E6","A5","F5","A5","C6","F5","G5","B5","D6","G5"],

  _synths: null,

  async init() {
    if (this.inited) return;
    this.inited = true;

    this._masterVol = new Tone.Volume(-6).toDestination();

    // Kick
    const kickEnv = new Tone.AmplitudeEnvelope({
      attack: 0.004, decay: 0.25, sustain: 0, release: 0.06,
    }).connect(this._masterVol);
    const kickOsc = new Tone.Oscillator({ frequency: 100, type: "sine" }).connect(kickEnv);

    // Snare
    const snareGain = new Tone.Gain(0.5).connect(this._masterVol);
    const snareHi = new Tone.Filter(2000, "highpass").connect(snareGain);
    const snareNoise = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.002, decay: 0.11, sustain: 0, release: 0.05 },
    }).connect(snareHi);
    const snareBody = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.04 },
    }).connect(snareGain);

    // Hihat
    const hatGain = new Tone.Gain(0.25).connect(this._masterVol);
    const hatFilter = new Tone.Filter(6500, "highpass").connect(hatGain);
    const hatNoise = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.015 },
    }).connect(hatFilter);

    // Melody (square + triangle mix)
    const melFilter = new Tone.Filter(3500, "lowpass").connect(this._masterVol);
    const melSq = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.003, decay: 0.13, sustain: 0.06, release: 0.1 },
    }).connect(melFilter);
    melSq.volume.value = -10;
    const melTri = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.003, decay: 0.13, sustain: 0.06, release: 0.1 },
    }).connect(melFilter);
    melTri.volume.value = -13;

    // Arp (triangle)
    const arpFilter = new Tone.Filter(5000, "lowpass").connect(this._masterVol);
    const arpSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.004, decay: 0.1, sustain: 0.0, release: 0.12 },
    }).connect(arpFilter);
    arpSynth.volume.value = -11;

    this._synths = {
      kick: {
        trigger(t) {
          kickOsc.start(t);
          kickOsc.stop(t + 0.32);
          kickEnv.triggerAttackRelease(0.25, t);
          kickOsc.frequency.setValueAtTime(150, t);
          kickOsc.frequency.exponentialRampToValueAtTime(52, t + 0.1);
        },
      },
      snare: {
        trigger(t) {
          snareNoise.triggerAttackRelease("16n", t);
          snareBody.triggerAttackRelease(240, "16n", t, 0.4);
        },
      },
      hihat: {
        trigger(t) {
          hatNoise.triggerAttackRelease("32n", t);
        },
      },
      melody: {
        trigger: (t, step) => {
          melSq.triggerAttackRelease(this._MELODY_NOTES[step], "8n", t);
          melTri.triggerAttackRelease(this._MELODY_NOTES[step], "8n", t);
        },
      },
      arp: {
        trigger: (t, step) => {
          arpSynth.triggerAttackRelease(this._ARP_NOTES[step], "16n", t);
        },
      },
    };

    Tone.Transport.bpm.value = 128;
  },

  _startSeq() {
    if (this._seq) this._seq.dispose();
    const TRACKS = ["kick", "snare", "hihat", "melody", "arp"];
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
      this._startSeq();
      Tone.Transport.start();
      this.playing = true;
    }
  },

  stop() {
    if (this.playing) {
      Tone.Transport.stop();
      if (this._seq) { this._seq.dispose(); this._seq = null; }
      this.playing = false;
    }
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
