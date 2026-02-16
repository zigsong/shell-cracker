// ─── Game BGM using Tone.js ───

const BGM = {
  playing: false,
  inited: false,
  mainVol: null,
  leadSynth: null,
  bassSynth: null,
  arpSynth: null,
  kickSynth: null,
  hatSynth: null,
  snareSynth: null,
  leadPart: null,
  bassPart: null,
  arpPart: null,
  drumLoop: null,

  async init() {
    if (this.inited) return;
    this.inited = true;

    this.mainVol = new Tone.Volume(-10).toDestination();

    // Reverb는 비동기로 생성해야 함
    const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.15 });
    await reverb.generate();
    reverb.connect(this.mainVol);

    const delay = new Tone.FeedbackDelay({
      delayTime: "8n.",
      feedback: 0.15,
      wet: 0.12,
    }).connect(reverb);

    // Lead: catchy square wave melody
    this.leadSynth = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.15 },
      volume: -12,
    }).connect(delay);

    // Bass: punchy triangle
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.1 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 0.1,
        baseFrequency: 200,
        octaves: 1.5,
      },
      volume: -8,
    }).connect(reverb);

    // Arp: 8-bit pulse
    this.arpSynth = new Tone.Synth({
      oscillator: { type: "pulse", width: 0.3 },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.08 },
      volume: -20,
    }).connect(delay);

    // Drums
    this.kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 5,
      volume: -10,
      envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.1 },
    }).connect(this.mainVol);

    this.hatSynth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.002, decay: 0.05, sustain: 0, release: 0.03 },
      volume: -22,
    }).connect(this.mainVol);

    this.snareSynth = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.003, decay: 0.12, sustain: 0, release: 0.05 },
      volume: -16,
    }).connect(this.mainVol);

    Tone.Transport.bpm.value = 140;
    Tone.Transport.swing = 0;

    // Lead melody (2 bar loop)
    this.leadPart = new Tone.Sequence(
      (time, note) => {
        if (note !== null) {
          this.leadSynth.triggerAttackRelease(note, "16n", time);
        }
      },
      [
        "E5", "E5", null, "G5",
        "A5", null, "G5", "E5",
        "D5", null, "E5", null,
        "C5", null, null, null,
        "E5", "E5", null, "G5",
        "A5", null, "B5", "A5",
        "G5", null, "E5", null,
        "D5", null, null, null,
      ],
      "16n"
    );

    // Bass pattern (2 bar loop)
    this.bassPart = new Tone.Sequence(
      (time, note) => {
        if (note !== null) {
          this.bassSynth.triggerAttackRelease(note, "8n", time);
        }
      },
      [
        "C3", null, null, "C3",
        null, null, "C3", null,
        "E3", null, null, "E3",
        null, null, "E3", null,
        "F3", null, null, "F3",
        null, null, "F3", null,
        "G3", null, null, "G3",
        null, null, "G2", null,
      ],
      "16n"
    );

    // Arp pattern (1 bar loop)
    this.arpPart = new Tone.Sequence(
      (time, note) => {
        if (note !== null) {
          this.arpSynth.triggerAttackRelease(note, "32n", time);
        }
      },
      [
        "C6", "E6", "G6", "E6",
        "C6", "E6", "G6", "E6",
        "C6", "E6", "G6", "E6",
        "C6", "E6", "G6", "E6",
      ],
      "16n"
    );

    // Drum pattern (1 bar loop)
    this.drumLoop = new Tone.Loop((time) => {
      const pos = Tone.Transport.position;
      const parts = pos.split(":");
      const beat = parseInt(parts[1]);
      const sub = parseInt(parts[2]);

      if (beat === 0 && sub === 0)
        this.kickSynth.triggerAttackRelease("C1", "16n", time);
      if (beat === 1 && sub === 2)
        this.kickSynth.triggerAttackRelease("C1", "16n", time, 0.6);
      if (beat === 2 && sub === 0)
        this.kickSynth.triggerAttackRelease("C1", "16n", time);
      if (beat === 3 && sub === 2)
        this.kickSynth.triggerAttackRelease("C1", "16n", time, 0.5);

      if ((beat === 1 || beat === 3) && sub === 0)
        this.snareSynth.triggerAttackRelease("16n", time, 0.7);

      if (sub === 0 || sub === 2)
        this.hatSynth.triggerAttackRelease("32n", time, 0.3 + (sub === 0 ? 0.2 : 0));
    }, "16n");
  },

  async start() {
    await Tone.start();
    await this.init();

    if (!this.playing) {
      this.leadPart.start(0);
      this.bassPart.start(0);
      this.arpPart.start(0);
      this.drumLoop.start(0);
      Tone.Transport.start();
      this.playing = true;
    }
  },

  stop() {
    if (this.playing) {
      Tone.Transport.stop();
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
    if (this.mainVol) {
      this.mainVol.volume.value = Tone.gainToDb(value / 100);
    }
  }
};
