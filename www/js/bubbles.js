// ─── 물방울 생성 ───
function createBubbles() {
  const container = document.getElementById("bubbles");
  for (let i = 0; i < 15; i++) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const size = Math.random() * 15 + 5;
    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
    bubble.style.left = Math.random() * 100 + "%";
    bubble.style.bottom = "-20px";
    bubble.style.animationDuration = Math.random() * 5 + 5 + "s";
    bubble.style.animationDelay = Math.random() * 5 + "s";
    container.appendChild(bubble);
  }
}
createBubbles();

