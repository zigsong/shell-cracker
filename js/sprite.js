// ─── 스프라이트 관리 ───
const Sprite = {
  el: null,
  // sprite_success: 2x2 그리드 (1280x669 → 표시 640x335, 프레임 320x167)
  // sprite_miss: 2x1 그리드 (1280x669 → 표시 640x669, 프레임 320x335)
  successFrames: [
    { x: 0, y: 0 }, // 1번: 기본 (조개 들고 있는 모습)
    { x: -320, y: 0 }, // 2번: HIT
    { x: 0, y: -167 }, // 3번: CRACK!
    { x: -320, y: -167 }, // 4번: 기뻐하는 모습
  ],
  missFrames: [
    { x: 10, y: 0 }, // 1번: 슬퍼하는 모습
    { x: -290, y: 0 }, // 2번: MISS!
  ],

  init() {
    this.el = document.getElementById("spriteCharacter");
  },

  showSuccess(frameIndex) {
    const frame = this.successFrames[frameIndex];
    this.el.style.backgroundImage = 'url("images/sprite_success.png")';
    this.el.style.backgroundSize = "640px 335px";
    this.el.style.width = "320px";
    this.el.style.height = "167px";
    this.el.style.backgroundPosition = frame.x + "px " + frame.y + "px";
  },

  showMiss(frameIndex) {
    if (frameIndex === 0) SFX.play("boing");
    const frame = this.missFrames[frameIndex];
    this.el.style.backgroundImage = 'url("images/sprite_miss.png")';
    this.el.style.backgroundSize = "640px 335px";
    this.el.style.width = "320px";
    this.el.style.height = "335px";
    this.el.style.backgroundPosition = frame.x + "px " + frame.y + "px";
  },
};

