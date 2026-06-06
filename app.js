const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const roomBox = document.getElementById("roomBox");
const roomCodeEl = document.getElementById("roomCode");
const roomInput = document.getElementById("roomInput");
const soloBtn = document.getElementById("soloBtn");
const hostBtn = document.getElementById("hostBtn");
const joinForm = document.getElementById("joinForm");
const copyBtn = document.getElementById("copyBtn");
const stick = document.getElementById("stick");
const knob = document.getElementById("knob");
const shootBtn = document.getElementById("shootBtn");

const W = canvas.width;
const H = canvas.height;
const ARENA = { x: 32, y: 32, w: W - 64, h: H - 64 };
const TANK_R = 18;
const BULLET_R = 5;
const SHOT_COOLDOWN = 380;

const walls = [
  { x: 210, y: 110, w: 42, h: 190 },
  { x: 210, y: 390, w: 42, h: 140 },
  { x: 708, y: 110, w: 42, h: 190 },
  { x: 708, y: 390, w: 42, h: 140 },
  { x: 405, y: 88, w: 150, h: 42 },
  { x: 405, y: 510, w: 150, h: 42 },
  { x: 448, y: 260, w: 64, h: 120 },
];

const keys = new Set();
const input = { x: 0, y: 0, fire: false };
const remoteInput = { x: 0, y: 0, fire: false };

let peer = null;
let conn = null;
let netRole = "solo";
let lastNetSend = 0;
let lastShot = 0;
let winnerText = "";
let winnerUntil = 0;

const state = {
  bullets: [],
  tanks: {
    p1: makeTank("p1", 104, H / 2, 0, "#f5c542"),
    p2: makeTank("p2", W - 104, H / 2, Math.PI, "#5fc3ff"),
  },
};

function makeTank(id, x, y, a, color) {
  return { id, x, y, a, color, hp: 5, score: 0, dead: false, respawnAt: 0 };
}

function setStatus(text) {
  statusEl.textContent = text;
}

function roomId() {
  return "ta-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function setupPeerEvents(connection) {
  conn = connection;
  conn.on("open", () => setStatus("Connected"));
  conn.on("data", (msg) => {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "input") Object.assign(remoteInput, msg.input);
    if (msg.type === "state" && netRole === "client") {
      applyRemoteState(msg.state);
    }
  });
  conn.on("close", () => {
    setStatus("Disconnected");
    conn = null;
  });
}

hostBtn.addEventListener("click", () => {
  if (!window.Peer) {
    setStatus("Network unavailable");
    return;
  }
  cleanupPeer();
  const id = roomId();
  netRole = "host";
  peer = new Peer(id);
  peer.on("open", () => {
    roomCodeEl.textContent = id;
    roomBox.hidden = false;
    setStatus("Waiting");
  });
  peer.on("connection", setupPeerEvents);
  peer.on("error", () => setStatus("Peer error"));
});

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = roomInput.value.trim().toUpperCase();
  if (!id || !window.Peer) return;
  cleanupPeer();
  netRole = "client";
  peer = new Peer();
  peer.on("open", () => {
    setupPeerEvents(peer.connect(id));
    setStatus("Joining");
  });
  peer.on("error", () => setStatus("Join failed"));
});

soloBtn.addEventListener("click", () => {
  cleanupPeer();
  netRole = "solo";
  roomBox.hidden = true;
  setStatus("Solo ready");
});

copyBtn.addEventListener("click", async () => {
  if (!roomCodeEl.textContent) return;
  await navigator.clipboard?.writeText(roomCodeEl.textContent);
});

function cleanupPeer() {
  conn?.close();
  peer?.destroy();
  conn = null;
  peer = null;
}

window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
});

shootBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  input.fire = true;
});

shootBtn.addEventListener("pointerup", () => {
  input.fire = false;
});

shootBtn.addEventListener("pointercancel", () => {
  input.fire = false;
});

let stickPointer = null;
stick.addEventListener("pointerdown", (e) => {
  stickPointer = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  updateStick(e);
});

stick.addEventListener("pointermove", (e) => {
  if (e.pointerId === stickPointer) updateStick(e);
});

stick.addEventListener("pointerup", resetStick);
stick.addEventListener("pointercancel", resetStick);

function updateStick(e) {
  const rect = stick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const max = rect.width * 0.33;
  const mag = Math.hypot(dx, dy);
  const scale = mag > max ? max / mag : 1;
  const x = dx * scale;
  const y = dy * scale;
  knob.style.transform = `translate(${x}px, ${y}px)`;
  input.x = x / max;
  input.y = y / max;
}

function resetStick() {
  stickPointer = null;
  input.x = 0;
  input.y = 0;
  knob.style.transform = "translate(0, 0)";
}

function readKeyboard() {
  let x = 0;
  let y = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
  const mag = Math.hypot(x, y) || 1;
  if (Math.abs(input.x) < 0.05 && Math.abs(input.y) < 0.05) {
    input.x = x / mag;
    input.y = y / mag;
  }
  input.fire = input.fire || keys.has("Space");
}

function moveTank(tank, move, dt) {
  if (tank.dead) return;
  const mag = Math.hypot(move.x, move.y);
  if (mag > 0.08) {
    const nx = move.x / mag;
    const ny = move.y / mag;
    tank.a = Math.atan2(ny, nx);
    const speed = 150;
    tryMove(tank, nx * speed * dt, ny * speed * dt);
  }
}

function tryMove(tank, dx, dy) {
  const oldX = tank.x;
  tank.x += dx;
  if (collidesTank(tank)) tank.x = oldX;
  const oldY = tank.y;
  tank.y += dy;
  if (collidesTank(tank)) tank.y = oldY;
}

function collidesTank(t) {
  if (t.x - TANK_R < ARENA.x || t.x + TANK_R > ARENA.x + ARENA.w || t.y - TANK_R < ARENA.y || t.y + TANK_R > ARENA.y + ARENA.h) return true;
  return walls.some((w) => circleRect(t.x, t.y, TANK_R, w));
}

function fire(tank, now) {
  if (tank.dead || now - tank.lastShot < SHOT_COOLDOWN) return;
  tank.lastShot = now;
  state.bullets.push({
    owner: tank.id,
    x: tank.x + Math.cos(tank.a) * 24,
    y: tank.y + Math.sin(tank.a) * 24,
    vx: Math.cos(tank.a) * 420,
    vy: Math.sin(tank.a) * 420,
    life: 1.8,
  });
}

function updateBullets(dt) {
  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.x < ARENA.x || b.x > ARENA.x + ARENA.w) {
      b.vx *= -1;
      b.x = Math.max(ARENA.x, Math.min(ARENA.x + ARENA.w, b.x));
    }
    if (b.y < ARENA.y || b.y > ARENA.y + ARENA.h) {
      b.vy *= -1;
      b.y = Math.max(ARENA.y, Math.min(ARENA.y + ARENA.h, b.y));
    }
    if (walls.some((w) => circleRect(b.x, b.y, BULLET_R, w))) b.life = 0;
    for (const tank of Object.values(state.tanks)) {
      if (tank.id === b.owner || tank.dead) continue;
      if (Math.hypot(tank.x - b.x, tank.y - b.y) < TANK_R + BULLET_R) {
        b.life = 0;
        tank.hp -= 1;
        if (tank.hp <= 0) {
          tank.dead = true;
          tank.respawnAt = performance.now() + 1300;
          state.tanks[b.owner].score += 1;
          winnerText = `${b.owner.toUpperCase()} scores`;
          winnerUntil = performance.now() + 900;
        }
      }
    }
  }
  state.bullets = state.bullets.filter((b) => b.life > 0);
}

function respawn(now) {
  for (const tank of Object.values(state.tanks)) {
    if (tank.dead && now >= tank.respawnAt) {
      const left = tank.id === "p1";
      Object.assign(tank, {
        x: left ? 104 : W - 104,
        y: H / 2,
        a: left ? 0 : Math.PI,
        hp: 5,
        dead: false,
      });
    }
  }
}

function circleRect(cx, cy, cr, r) {
  const x = Math.max(r.x, Math.min(cx, r.x + r.w));
  const y = Math.max(r.y, Math.min(cy, r.y + r.h));
  return Math.hypot(cx - x, cy - y) < cr;
}

function aiInput(tank, target) {
  const dx = target.x - tank.x;
  const dy = target.y - tank.y;
  const dist = Math.hypot(dx, dy) || 1;
  return { x: dx / dist, y: dy / dist, fire: dist < 520 && Math.random() < 0.04 };
}

function serializeState() {
  return JSON.parse(JSON.stringify(state));
}

function applyRemoteState(next) {
  if (!next) return;
  state.tanks = next.tanks || state.tanks;
  state.bullets = next.bullets || [];
}

function sendNetwork(now) {
  if (!conn || !conn.open || now - lastNetSend < 33) return;
  lastNetSend = now;
  conn.send({ type: "input", input });
  if (netRole === "host") conn.send({ type: "state", state: serializeState() });
}

function update(dt, now) {
  readKeyboard();
  if (netRole === "client") {
    sendNetwork(now);
    input.fire = false;
    return;
  }
  const p1Move = input;
  const p2Move = netRole === "host" && conn?.open ? remoteInput : aiInput(state.tanks.p2, state.tanks.p1);
  moveTank(state.tanks.p1, p1Move, dt);
  moveTank(state.tanks.p2, p2Move, dt);
  if (p1Move.fire) fire(state.tanks.p1, now);
  if (p2Move.fire) fire(state.tanks.p2, now);
  updateBullets(dt);
  respawn(now);
  sendNetwork(now);
  input.fire = false;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawArena();
  for (const tank of Object.values(state.tanks)) drawTank(tank);
  for (const b of state.bullets) drawBullet(b);
  drawScores();
  if (performance.now() < winnerUntil) drawCenterText(winnerText);
}

function drawArena() {
  ctx.fillStyle = "#26313a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#192128";
  ctx.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
  ctx.strokeStyle = "#4a5966";
  ctx.lineWidth = 4;
  ctx.strokeRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
  ctx.fillStyle = "#5b4934";
  for (const w of walls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = "#8b7559";
    ctx.strokeRect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);
  }
  ctx.strokeStyle = "rgba(255,255,255,.04)";
  ctx.lineWidth = 1;
  for (let x = ARENA.x; x < ARENA.x + ARENA.w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, ARENA.y);
    ctx.lineTo(x, ARENA.y + ARENA.h);
    ctx.stroke();
  }
  for (let y = ARENA.y; y < ARENA.y + ARENA.h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(ARENA.x, y);
    ctx.lineTo(ARENA.x + ARENA.w, y);
    ctx.stroke();
  }
}

function drawTank(t) {
  if (t.dead) return;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.a);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(-18, -14, 38, 28);
  ctx.fillStyle = t.color;
  ctx.fillRect(-17, -13, 34, 26);
  ctx.fillStyle = "#111820";
  ctx.fillRect(4, -5, 30, 10);
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = .35;
  ctx.fillRect(-10, -9, 9, 18);
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#101317";
  ctx.fillRect(t.x - 23, t.y - 31, 46, 6);
  ctx.fillStyle = t.color;
  ctx.fillRect(t.x - 23, t.y - 31, 46 * (t.hp / 5), 6);
}

function drawBullet(b) {
  ctx.beginPath();
  ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
  ctx.fillStyle = b.owner === "p1" ? "#ffe58a" : "#9de0ff";
  ctx.fill();
}

function drawScores() {
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(W / 2 - 112, 12, 224, 42);
  ctx.fillStyle = "#fff";
  ctx.font = "700 24px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${state.tanks.p1.score}  :  ${state.tanks.p2.score}`, W / 2, 41);
}

function drawCenterText(text) {
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(W / 2 - 170, H / 2 - 42, 340, 84);
  ctx.fillStyle = "#fff";
  ctx.font = "800 34px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2 + 12);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt, now);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
