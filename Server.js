// Сервер дуэлей на чистом Node.js (без пакетов). Комнаты хранятся в памяти.
// Запуск: node server.js   (порт берётся из переменной PORT)

const http = require("http");

const TTL = 15 * 60 * 1000;   // комната живёт 15 минут без действий
const START_DELAY = 5000;     // отсчёт после входа второго игрока
const MAX_RACE = 120 * 1000;  // гонка длится не дольше 2 минут
const MAX_CPS = 25;           // античит: не больше 25 знаков в секунду

const PHRASES = [
  "быстрые пальцы всегда побеждают",
  "съешь ещё этих мягких французских булок",
  "кто успел тот и съел",
  "тише едешь дальше будешь",
  "семь раз отмерь один раз отрежь",
  "лучше поздно чем никогда",
  "без труда не вытащишь и рыбку из пруда",
  "утро вечера мудренее",
  "на дворе трава на траве дрова",
  "карл у клары украл кораллы",
  "шла саша по шоссе и сосала сушку",
  "тридцать три корабля лавировали",
  "клавиатура быстрее мысли",
  "печатай быстро но без ошибок",
  "один за всех и все за одного",
  "волков бояться в лес не ходить",
  "что посеешь то и пожнёшь",
  "встань пораньше и поймай удачу",
  "маленький шаг каждый день ведёт к цели",
  "делу время а потехе час",
];

const rooms = new Map();

setInterval(() => {
  const t = Date.now();
  for (const [code, v] of rooms) if (t - v.touched > TTL) rooms.delete(code);
}, 60 * 1000);

function view(v, now) {
  const pub = (p) => p && { name: p.name, pos: p.pos, err: p.err, time: p.time };
  return {
    status: v.status,          // waiting | running | finished
    now,                       // серверное время для синхронизации старта
    startAt: v.startAt,
    text: v.b ? v.text : "",   // фраза скрыта, пока нет соперника
    winner: v.winner,          // "a" | "b" | "" | "x"
    left: v.left || "",
    players: { a: pub(v.a), b: pub(v.b) },
  };
}

function send(res, obj) {
  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
  });
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  const q = u.searchParams;
  const now = Date.now();
  const room = q.get("room") || "";
  const you = q.get("you") === "b" ? "b" : "a";
  const name = (q.get("name") || "Игрок").slice(0, 12);
  const player = () => ({ name, pos: 0, err: 0, time: 0 });
  const v = rooms.get(room);
  if (v) v.touched = now;

  switch (u.pathname) {
    case "/create": {
      for (let i = 0; i < 20; i++) {
        const code = String(1000 + Math.floor(Math.random() * 9000));
        if (rooms.has(code)) continue;
        rooms.set(code, {
          text: PHRASES[Math.floor(Math.random() * PHRASES.length)],
          status: "waiting", startAt: 0, winner: "", left: "",
          a: player(), b: null, touched: now,
        });
        return send(res, { room: code, you: "a" });
      }
      return send(res, { error: "busy" });
    }

    case "/join": {
      if (!v) return send(res, { error: "nf" });
      if (v.b) return send(res, { error: "full" });
      v.b = player();
      v.status = "running";
      v.startAt = now + START_DELAY;
      return send(res, { ok: true, you: "b" });
    }

    case "/state": {
      if (!v) return send(res, { error: "nf" });
      const pos = parseInt(q.get("pos") || "0") || 0;
      const err = parseInt(q.get("err") || "0") || 0;
      const me = v[you];
      if (me && v.status === "running" && now >= v.startAt) {
        const len = v.text.length;
        const cap = Math.floor((now - v.startAt) / 1000 * MAX_CPS) + 6;
        me.pos = Math.max(me.pos, Math.min(Math.max(0, pos), cap, len));
        me.err = Math.min(Math.max(0, err), 999);
        if (me.pos >= len) {
          me.time = now - v.startAt;
          v.winner = you;
          v.status = "finished";
        } else if (now - v.startAt > MAX_RACE) {
          v.status = "finished";
        }
      }
      return send(res, view(v, now));
    }

    case "/leave": {
      if (v && v.status !== "finished") {
        v.status = "finished";
        if (!v.b) v.winner = "x";
        else { v.winner = you === "a" ? "b" : "a"; v.left = you; }
      }
      return send(res, { ok: true });
    }

    default:
      return send(res, { ok: true, service: "typing-duel" });
  }
}).listen(process.env.PORT || 3000); 
