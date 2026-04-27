// ─── 점수 시스템 ───
const Score = {
  current: 0,

  init() {
    this.current = 0;
    this._render();
  },

  addHit() {
    this.current += 5;
    this._render();
  },

  addBonus() {
    this.current += 10;
    this._render();
    this._showBonusPopup();
  },

  _render() {
    const el = document.getElementById("scoreDisplay");
    if (el) el.textContent = `SCORE: ${this.current}`;
  },

  _showBonusPopup() {
    const scoreEl = document.getElementById("scoreDisplay");
    const gameScreen = document.getElementById("gameScreen");
    if (!scoreEl || !gameScreen) return;
    const popup = document.createElement("div");
    popup.className = "score-bonus-popup";
    popup.textContent = "+10";
    popup.style.top = scoreEl.offsetTop - 8 + "px";
    gameScreen.appendChild(popup);
    setTimeout(() => popup.remove(), 1100);
  },
};

