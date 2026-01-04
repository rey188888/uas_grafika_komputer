const bgCanvas = document.getElementById("bg-canvas");

function resizeBackground() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  drawBackground();
}

function drawBackground() {
  const ctx = bgCanvas.getContext("2d");
  const w = bgCanvas.width;
  const h = bgCanvas.height;

  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
  gradient.addColorStop(0, "#2c3e50"); // Dark grayish blue
  gradient.addColorStop(1, "#000000"); // Black
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = Math.random() * 2 + 1;
    ctx.fillRect(x, y, size, size);
  }
}

window.addEventListener("resize", () => {
  resizeBackground();
});

resizeBackground();