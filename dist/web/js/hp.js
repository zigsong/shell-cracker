// ─── HP 시스템 ───
// sprite_hp_heart.png: 1280×669px, 8프레임 (160px/프레임)
// 표시 56×56px, background-size 448×234px
// 1=full, 2=damage shake, 3=half(damaged), 4=skip,
// 5=empty outline, 6=filling start, 7=half recover, 8=full recovered
const HP = {
  max: 5,
  current: 5,

  F: {
    full: "-14px -70px",
    damage: "-55px -70px",
    half: "-96px -70px",
    empty: "-178px -70px",
    filling: "-218px -70px",
    halfRecover: "-259px -70px",
    fullRecover: "-298px -70px",
  },

  // 각 하트 상태: 'full' | 'half' | 'empty'
  states: [],

  init() {
    this.states = Array(this.max).fill("full");
    this._render();
  },

  _render() {
    const bar = document.getElementById("hpBar");
    bar.innerHTML = "";
    for (let i = 0; i < this.max; i++) {
      const div = document.createElement("div");
      div.className = "hp-heart-sprite";
      div.style.backgroundPosition =
        this.F[
          { full: "full", half: "half", empty: "empty" }[this.states[i]]
        ];
      bar.appendChild(div);
    }
  },

  _heart(idx) {
    return document.querySelectorAll(".hp-heart-sprite")[idx] || null;
  },

  _rightmostNonEmpty() {
    for (let i = this.max - 1; i >= 0; i--)
      if (this.states[i] !== "empty") return i;
    return -1;
  },

  _leftmostNonFull() {
    for (let i = 0; i < this.max; i++)
      if (this.states[i] !== "full") return i;
    return -1;
  },

  // miss: full → half (2→3), half → empty (2→5)
  lose() {
    const idx = this._rightmostNonEmpty();
    if (idx === -1) return;
    const h = this._heart(idx);
    if (!h) return;

    h.style.backgroundPosition = this.F.damage;
    h.classList.remove("anim-damage");
    void h.offsetWidth;
    h.classList.add("anim-damage");

    if (this.states[idx] === "full") {
      // full → half
      this.states[idx] = "half";
      setTimeout(() => {
        h.style.backgroundPosition = this.F.half;
      }, 380);
    } else {
      // half → empty
      this.states[idx] = "empty";
      setTimeout(() => {
        h.style.backgroundPosition = this.F.empty;
        if (this.states.every((s) => s === "empty")) {
          setTimeout(() => triggerGameOver(), 300);
        }
      }, 380);
    }
  },

  // hit 1번: empty → half (6→7→3)
  // hit 2번: half → full (7→8→1)
  gain() {
    const idx = this._leftmostNonFull();
    if (idx === -1) return;
    const h = this._heart(idx);
    if (!h) return;

    if (this.states[idx] === "empty") {
      // 1번째 hit: 반만 채우기
      this.states[idx] = "half";
      h.style.backgroundPosition = this.F.filling;
      h.classList.remove("anim-recover");
      void h.offsetWidth;
      h.classList.add("anim-recover");
      setTimeout(() => {
        h.style.backgroundPosition = this.F.halfRecover;
        setTimeout(() => {
          h.style.backgroundPosition = this.F.half;
        }, 200);
      }, 300);
    } else if (this.states[idx] === "half") {
      // 2번째 hit: 완전히 채우기
      this.states[idx] = "full";
      h.style.backgroundPosition = this.F.halfRecover;
      h.classList.remove("anim-recover");
      void h.offsetWidth;
      h.classList.add("anim-recover");
      setTimeout(() => {
        h.style.backgroundPosition = this.F.fullRecover;
        setTimeout(() => {
          h.style.backgroundPosition = this.F.full;
        }, 200);
      }, 300);
    }
  },
};

