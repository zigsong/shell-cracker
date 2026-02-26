BGM을 조정해줘: $ARGUMENTS

`js/bgm.js`의 현재 파라미터를 먼저 읽고, 요청에 맞게 수정해줘.

## 조정 가능한 파라미터 맵

### 전체 볼륨 / 이펙트
- `mainVol`: `Volume(-10)` — 전체 출력 레벨 (dB)
- `reverb`: `decay: 1.2`, `wet: 0.15` — 공간감
- `delay`: `delayTime: "8n."`, `feedback: 0.15`, `wet: 0.12` — 에코

### 리드 멜로디 (`leadSynth`)
- `oscillator.type`: `"square"` — 음색 (square/sawtooth/sine/triangle)
- `envelope`: attack/decay/sustain/release
- `volume`: `-12`
- 시퀀스: `leadPart` — 32개 16분음표 배열, `null`은 쉼표

### 베이스 (`bassSynth`)
- `oscillator.type`: `"triangle"`
- `filterEnvelope.baseFrequency`: `200` — 필터 컷오프
- `volume`: `-8`
- 시퀀스: `bassPart` — 32개 16분음표 배열

### 아르페지오 (`arpSynth`)
- `oscillator`: `pulse`, `width: 0.3`
- `volume`: `-20`
- 시퀀스: `arpPart` — 16개 16분음표 (1마디 루프)

### 드럼
- `kickSynth`: `pitchDecay: 0.04`, `octaves: 5`, `volume: -10`
- `hatSynth`: white noise, `volume: -22`
- `snareSynth`: pink noise, `volume: -16`
- 패턴: `drumLoop` — beat/sub 조건으로 킥/스네어/하이햇 타이밍 제어

### 전체 BPM
- `Tone.Transport.bpm.value`: `140` (인트로 기본값)
- 게임 내 시작 BPM: `LevelSystem.startBPM = 80` (index.html)

---

수정 시 **변경 전/후 값을 명시**해줘.
