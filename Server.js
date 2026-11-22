// Сервер дуэлей на чистом Node.js (без пакетов). Комнаты хранятся в памяти.
// Запуск: node server.js   (порт берётся из переменной PORT)

const http = require("http");

const TTL = 15 * 60 * 1000;   // комната живёт 15 минут без действий
const START_DELAY = 5000;     // отсчёт после входа второго игрока
const MAX_RACE = 120 * 1000;  // гонка длится не дольше 2 минут
const MAX_CPS = 25;           // античит: не больше 25 знаков в секунду

const PHRASES = [
  "быстрые пальцы всегда побеждают", "съешь ещё этих мягких французских булок",
  "кто успел тот и съел", "тише едешь дальше будешь",
  "семь раз отмерь один раз отрежь", "лучше поздно чем никогда",
  "без труда не вытащишь и рыбку из пруда", "утро вечера мудренее",
  "на дворе трава на траве дрова", "карл у клары украл кораллы",
  "шла саша по шоссе и сосала сушку", "тридцать три корабля лавировали",
  "клавиатура быстрее мысли", "печатай быстро но без ошибок",
  "один за всех и все за одного", "волков бояться в лес не ходить",
  "что посеешь то и пожнёшь", "встань пораньше и поймай удачу",
  "маленький шаг каждый день ведёт к цели", "делу время а потехе час",
  "готовь сани летом а телегу зимой", "не имей сто рублей а имей сто друзей",
  "в гостях хорошо а дома лучше", "терпение и труд все перетрут",
  "под лежачий камень вода не течёт", "поспешишь людей насмешишь",
  "тише воды ниже травы", "яблоко от яблони недалеко падает",
  "не рой другому яму сам в неё попадёшь", "дарёному коню в зубы не смотрят",
  "обещанного три года ждут", "что имеем не храним потерявши плачем",
  "в тихом омуте черти водятся", "куй железо пока горячо",
  "новая метла по новому метёт", "лучше синица в руках чем журавль в небе",
  "собака лает а караван идёт", "своя ноша не тянет",
  "каков привет таков и ответ", "доброе слово и кошке приятно",
  "век живи век учись", "глаза боятся а руки делают",
  "аппетит приходит во время еды", "дружба дружбой а служба службой",
  "кашу маслом не испортишь", "работа не волк в лес не убежит",
  "делай добро и бросай его в воду", "тот кто рано встаёт тому бог подаёт",
  "после дождичка в четверг", "семеро одного не ждут",
  "у страха глаза велики", "мал золотник да дорог",
  "правда глаза колет", "по одёжке встречают по уму провожают",
  "не всё то золото что блестит", "мир не без добрых людей",
  "один в поле не воин", "от добра добра не ищут",
  "первый блин комом", "утопающий за соломинку хватается",
  "курочка по зёрнышку клюёт а сыта бывает", "дело мастера боится",
  "повторение мать учения", "телефон сел в самый неудачный момент",
  "пиши быстро думай ещё быстрее", "кофе остыл пока я печатал",
  "интернет пропал на самом интересном", "включи авиарежим и отдохни от мира",
  "сообщение отправлено но не прочитано", "нажми на кнопку и случится чудо",
  "быстрый ответ лучше долгого молчания", "каждая буква приближает к победе",
  "пальцы летают по клавишам как птицы", "сегодня я печатаю быстрее чем вчера",
  "ошибки делают нас внимательнее", "хороший день начинается с чашки кофе",
  "тренируйся каждый день и станешь лучше", "скорость приходит с практикой",
  "клавиатура знает все мои секреты", "не торопись но и не медли",
  "победа любит настойчивых", "новый день новые рекорды",
  "главное не победа а участие", "соперник силён но я быстрее",
  "дуэль скоро начнётся приготовься", "кто быстрее тот и победил",
  "в этой дуэли останется только один", "пусть победит самый быстрый",
  "удачи в бою и чистой печати", "ловкость рук и никакого мошенничества",
  "зимой в лесу тихо и красиво", "летнее солнце греет сильнее всего",
  "осенние листья падают на землю", "весной просыпается вся природа",
  "в лесу пахнет грибами и мхом", "по небу плывут белые облака",
  "река тихо несёт свои воды к морю", "горные вершины покрыты снегом",
  "ночью на небе светят тысячи звёзд", "ветер шумит в кронах старых сосен",
  "море волнуется раз море волнуется два", "на завтрак я люблю яичницу и чай",
  "борщ со сметаной самый вкусный обед", "бабушкины пирожки пахнут на весь дом",
  "горячий чай согревает в холодный вечер", "свежий хлеб с маслом и вареньем",
  "мороженое тает быстрее чем я ем", "шоколад делает этот день лучше",
  "арбуз сладкий а лимон кислый", "пицца лучше всего пока горячая",
  "кот спит на подоконнике в солнечный день", "собака встречает хозяина у двери",
  "маленький котёнок играет с клубком ниток", "попугай повторяет каждое слово",
  "ёжик ночью идёт искать грибы", "лиса тихо крадётся по снегу",
  "медведь зимой спит в тёплой берлоге", "рыбак сидит на берегу и ждёт улова",
  "москва стоит на берегах москвы реки", "санкт петербург основал пётр первый",
  "байкал самое глубокое озеро на земле", "земля вращается вокруг солнца",
  "луна светит отражённым светом солнца", "вода кипит при ста градусах",
  "в году двенадцать месяцев", "математика царица всех наук",
  "книга лучший друг человека", "учиться никогда не поздно",
  "знание сила а практика мастерство", "читай каждый день по одной странице",
  "пушкин наше всё", "завтра я точно начну новую жизнь",
  "будильник прозвонил а я не услышал", "ключи были в кармане а я их искал",
  "суббота самый лучший день недели", "кто рано встаёт тот много спит днём",
  "лень двигатель прогресса", "я не ленивый я экономлю энергию",
  "отпуск закончился а чемодан не разобран", "дождь стучит по крыше как барабан",
  "зонтик остался дома как всегда", "автобус уехал прямо перед моим носом",
  "лифт снова не работает поднимаюсь пешком", "в очереди всегда стоит самый медленный",
  "сегодня на ужин будет что нибудь вкусное", "бег по утрам заряжает на весь день",
  "спорт это здоровье и хорошее настроение", "футбол объединяет людей всего мира",
  "поезд мчится вдаль через леса и поля", "чемодан собран завтра в путь",
  "самолёт взлетел и город стал маленьким", "море песок и тёплое солнце",
  "дорога в тысячу вёрст начинается с шага", "мечты сбываются у тех кто действует",
  "верь в себя и всё получится", "никогда не сдавайся и иди вперёд",
  "каждый шаг приближает тебя к цели", "смелость города берёт",
  "удача любит смелых", "кто не рискует тот не пьёт шампанского",
  "ехал грека через реку", "от топота копыт пыль по полю летит",
  "четыре чёрненьких чумазеньких чертёнка", "у ежа ежата у ужа ужата",
  "бык тупогуб тупогубенький бычок",
];

const rooms = new Map();

// ===================== РЕЙТИНГ ELO =====================
// Рейтинги хранятся в памяти сервера. Бесплатный Render «засыпает» и забывает их,
// поэтому каждый игрок хранит свой рейтинг и у себя: когда сервер просыпается,
// игрок возвращается в таблицу с сохранённым значением при первом же заходе.
const ladder = new Map(); // uid -> { name, r, w, l, g, seen }
const R_START = 1000, R_MIN = 100, R_MAX = 3000, ELO_K = 32;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const cleanUid = (s) => String(s || "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
const rating = (uid, claim) => {
  const e = uid && ladder.get(uid);
  return e ? e.r : clamp(Math.round(Number(claim)) || R_START, R_MIN, R_MAX); // известному игроку верим серверу
};
function ladderPut(uid, name, claim, now) {
  let e = ladder.get(uid);
  if (!e) {
    if (ladder.size >= 5000) { // не даём таблице расти бесконечно: убираем самого давнего
      let oldest = null;
      for (const [k, x] of ladder) if (!oldest || x.seen < ladder.get(oldest).seen) oldest = k;
      ladder.delete(oldest);
    }
    e = { name, r: clamp(Math.round(Number(claim)) || R_START, R_MIN, R_MAX), w: 0, l: 0, g: 0, seen: now };
    ladder.set(uid, e);
  }
  e.name = name; e.seen = now;
  return e;
}
// Победитель win ("a"|"b") получает очки, проигравший теряет (не ниже R_MIN).
function applyElo(v, win, now) {
  if (v.elo || !v.b || !v.a.uid || !v.b.uid || v.a.uid === v.b.uid) return;
  const lose = win === "a" ? "b" : "a";
  const W = v[win], L = v[lose];
  const exp = 1 / (1 + Math.pow(10, (L.r - W.r) / 400));
  const gain = Math.max(1, Math.round(ELO_K * (1 - exp)));
  const loss = Math.min(gain, L.r - R_MIN);
  v.elo = {};
  v.elo[win] = { from: W.r, to: W.r + gain, delta: gain };
  v.elo[lose] = { from: L.r, to: L.r - loss, delta: -loss };
  [[W, win, true], [L, lose, false]].forEach(([p, k, won]) => {
    const e = ladderPut(p.uid, p.name, p.r, now);
    e.r = v.elo[k].to; e.g++; if (won) e.w++; else e.l++;
  });
}
// =======================================================
let played = 0; // сколько партий закончено с момента запуска сервера

setInterval(() => {
  const t = Date.now();
  for (const [code, v] of rooms) if (t - v.touched > TTL) rooms.delete(code);
}, 60 * 1000);

function view(v, now) {
  const pub = (p) => p && { name: p.name, pos: p.pos, err: p.err, time: p.time, r: p.r };
  return {
    status: v.status,          // waiting | running | finished
    now,                       // серверное время для синхронизации старта
    startAt: v.startAt,
    text: v.b ? v.text : "",   // фраза скрыта, пока нет соперника
    winner: v.winner,          // "a" | "b" | "" | "x"
    left: v.left || "",
    players: { a: pub(v.a), b: pub(v.b) },
    elo: v.elo || null,        // изменение рейтинга после партии
  };
}

function send(res, obj) {
  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
  });
  res.end(JSON.stringify(obj));
}


// ===================== КВИЗ-ВЕЧЕРИНКА =====================
const QK = Number(process.env.QSCALE) || 1;     // только для тестов (ускорение времени)
const Q_DUR = 20000 * QK;      // время на вопрос
const Q_REVEAL = 4500 * QK;    // показ ответа
const Q_COUNT = 3000 * QK;     // отсчёт перед первым вопросом
const Q_NEXT = 1500 * QK;      // пауза перед следующим вопросом
const Q_TOTAL = 8, Q_MAXP = 8, Q_MAXC = 5;

const BANK = [
  ["Столица Австралии?", ["Канберра"]],
  ["Самая большая планета Солнечной системы?", ["Юпитер"]],
  ["Сколько дней в високосном году?", ["366", "триста шестьдесят шесть"]],
  ["Химический символ золота?", ["Au"]],
  ["Кто написал «Войну и мир»?", ["Толстой", "Лев Толстой"]],
  ["Самая длинная река Европы?", ["Волга"]],
  ["Сколько континентов на Земле?", ["7", "семь"]],
  ["Как называется естественный спутник Земли?", ["Луна"]],
  ["Столица Японии?", ["Токио"]],
  ["Сколько цветов у радуги?", ["7", "семь"]],
  ["Кто написал «Евгения Онегина»?", ["Пушкин", "Александр Пушкин"]],
  ["Самый большой океан на Земле?", ["Тихий", "Тихий океан"]],
  ["Какой газ нужен людям для дыхания?", ["Кислород"]],
  ["Столица Франции?", ["Париж"]],
  ["Самая высокая гора мира?", ["Эверест", "Джомолунгма"]],
  ["Как называется детёныш лошади?", ["Жеребёнок"]],
  ["Столица Италии?", ["Рим"]],
  ["Сколько букв в русском алфавите?", ["33", "тридцать три"]],
  ["Какая планета известна своими кольцами?", ["Сатурн"]],
  ["Какой металл жидкий при комнатной температуре?", ["Ртуть"]],
  ["Сколько лет в одном веке?", ["100", "сто"]],
  ["Столица Германии?", ["Берлин"]],
  ["Какая птица самая маленькая в мире?", ["Колибри"]],
  ["Сколько ног у паука?", ["8", "восемь"]],
  ["Столица Испании?", ["Мадрид"]],
  ["Какой город называют Северной Венецией?", ["Санкт-Петербург", "Петербург", "Питер"]],
  ["Какое животное самое быстрое на суше?", ["Гепард"]],
  ["Сколько секунд в минуте?", ["60", "шестьдесят"]],
  ["Кто написал «Мастера и Маргариту»?", ["Булгаков", "Михаил Булгаков"]],
  ["Столица Канады?", ["Оттава"]],
  ["Самое глубокое озеро в мире?", ["Байкал"]],
  ["Какая птица символизирует мир?", ["Голубь"]],
  ["Как называется наука о животных?", ["Зоология"]],
  ["Сколько градусов в прямом угле?", ["90", "девяносто"]],
  ["Столица Египта?", ["Каир"]],
  ["Кто написал «Преступление и наказание»?", ["Достоевский", "Фёдор Достоевский"]],
  ["Какой цвет получится при смешивании синего и жёлтого?", ["Зелёный"]],
  ["Столица Турции?", ["Анкара"]],
  ["Какой орган качает кровь по телу?", ["Сердце"]],
  ["Сколько месяцев в году?", ["12", "двенадцать"]],
];

const quizzes = new Map();
setInterval(() => {
  const t = Date.now();
  for (const [c, v] of quizzes) if (t - v.touched > 30 * 60 * 1000) quizzes.delete(c);
}, 60 * 1000);

const qnorm = (s) => String(s).toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9 ]/g, " ").replace(/\s+/g, " ").trim();
function lev(a, b) {
  const d = [];
  for (let i = 0; i <= a.length; i++) d[i] = [i];
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function qCorrect(given, answers) {
  const g = qnorm(given);
  if (!g) return false;
  return answers.some((a) => {
    const n = qnorm(a);
    return g === n || (n.length >= 5 && lev(g, n) <= 1); // допускаем одну опечатку в длинных ответах
  });
}
const resetCur = (v) => v.players.forEach((p) => { p.cur = { ok: false, tries: 0, gain: 0 }; });
const shuffled = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Время идёт лениво: состояние двигается при каждом запросе.
function qAdvance(v, now) {
  for (let g = 0; g < 4; g++) {
    if (v.status === "q" && now >= v.qStart) {
      const cur = v.qs[v.qi];
      const act = v.players.filter((p) => now - p.seen < 10000 && cur.by !== p.pid);
      const done = act.length > 0 && act.every((p) => p.cur.ok || p.cur.tries >= 3);
      if (now >= v.qEnd || done) { v.status = "reveal"; v.phaseEnd = now + Q_REVEAL; continue; }
    }
    if (v.status === "reveal" && now >= v.phaseEnd) {
      if (v.qi + 1 >= v.qs.length) v.status = "final";
      else { v.qi++; v.status = "q"; v.qStart = now + Q_NEXT; v.qEnd = v.qStart + Q_DUR; resetCur(v); }
      continue;
    }
    break;
  }
}

function qView(v, me, now) {
  const cur = v.qs[v.qi];
  const over = v.status === "reveal" || v.status === "final";
  const showQ = cur && (over || (v.status === "q" && now >= v.qStart));
  return {
    status: v.status, now, qi: v.qi, total: v.qs.length, customN: v.custom.length,
    host: v.host === me.pid, qStart: v.qStart, qEnd: v.qEnd, phaseEnd: v.phaseEnd,
    q: showQ ? cur.q : "", own: !!cur && cur.by === me.pid,
    correct: cur && over ? cur.a[0] : "",
    me: { score: me.score, ok: me.cur.ok, tries: me.cur.tries, gain: me.cur.gain },
    players: v.players.map((p) => ({
      name: p.name, score: p.score, host: p.pid === v.host,
      ok: p.cur.ok, gain: p.cur.gain, author: !!cur && cur.by === p.pid,
    })),
  };
}

function quizApi(path, q, now) {
  const room = q.get("room") || "", pid = q.get("pid") || "";
  const name = (q.get("name") || "Игрок").slice(0, 12);
  const newPlayer = () => ({ pid: Math.random().toString(36).slice(2, 8), name, score: 0, seen: now, cur: { ok: false, tries: 0, gain: 0 } });

  if (path === "/qcreate") {
    for (let i = 0; i < 20; i++) {
      const code = String(1000 + Math.floor(Math.random() * 9000));
      if (quizzes.has(code)) continue;
      const p = newPlayer();
      quizzes.set(code, { status: "lobby", host: p.pid, players: [p], custom: [], qs: [], qi: 0, qStart: 0, qEnd: 0, phaseEnd: 0, touched: now });
      return { room: code, pid: p.pid };
    }
    return { error: "busy" };
  }

  const v = quizzes.get(room);
  if (!v) return { error: "nf" };
  v.touched = now;

  if (path === "/qjoin") {
    if (v.status !== "lobby") return { error: "started" };
    if (v.players.length >= Q_MAXP) return { error: "full" };
    const p = newPlayer();
    v.players.push(p);
    return { pid: p.pid };
  }

  const me = v.players.find((p) => p.pid === pid);
  if (!me) return { error: "nf" };
  me.seen = now;

  switch (path) {
    case "/qadd": {
      const text = (q.get("q") || "").trim().slice(0, 70), ans = (q.get("a") || "").trim().slice(0, 40);
      if (v.host !== pid || v.status !== "lobby") return { error: "denied" };
      if (!text || !ans) return { error: "empty" };
      if (v.custom.length >= Q_MAXC) return { error: "limit" };
      v.custom.push({ q: text, a: [ans], by: pid });
      return { ok: true, n: v.custom.length };
    }
    case "/qstart": {
      if (v.host !== pid || v.status !== "lobby") return { error: "denied" };
      const rest = shuffled(BANK).slice(0, Math.max(0, Q_TOTAL - v.custom.length)).map((b) => ({ q: b[0], a: b[1], by: "" }));
      v.qs = shuffled(v.custom.concat(rest));
      v.status = "q"; v.qi = 0; v.qStart = now + Q_COUNT; v.qEnd = v.qStart + Q_DUR;
      resetCur(v);
      return { ok: true };
    }
    case "/qanswer": {
      qAdvance(v, now);
      const cur = v.qs[v.qi];
      if (v.status !== "q" || now < v.qStart || now > v.qEnd) return { ok: false, late: true };
      if (cur.by === pid) return { ok: false, own: true };
      if (me.cur.ok) return { ok: true, already: true, gain: me.cur.gain };
      if (me.cur.tries >= 3) return { ok: false, tries: me.cur.tries };
      me.cur.tries++;
      if (!qCorrect(q.get("a") || "", cur.a)) return { ok: false, tries: me.cur.tries };
      const first = !v.players.some((p) => p.cur.ok);
      const gain = 50 + Math.round(50 * Math.max(0, v.qEnd - now) / Q_DUR) + (first ? 20 : 0);
      me.cur.ok = true; me.cur.gain = gain; me.score += gain;
      return { ok: true, gain };
    }
    case "/qstate":
      qAdvance(v, now);
      return qView(v, me, now);
    case "/qleave": {
      v.players = v.players.filter((p) => p.pid !== pid);
      if (!v.players.length) quizzes.delete(room);
      else if (v.host === pid) v.host = v.players[0].pid;
      return { ok: true };
    }
  }
  return { error: "unknown" };
}
// ===========================================================

http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  const q = u.searchParams;
  const now = Date.now();
  const room = q.get("room") || "";
  const you = q.get("you") === "b" ? "b" : "a";
  const name = (q.get("name") || "Игрок").slice(0, 12);
  const uid = cleanUid(q.get("uid"));
  const player = () => ({ name, pos: 0, err: 0, time: 0, uid, r: rating(uid, q.get("r")) });
  if (u.pathname.startsWith("/q")) return send(res, quizApi(u.pathname, q, now));

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
          a: player(), b: null, touched: now, created: now,
          pub: q.get("pub") !== "0", // открытая комната видна в списке
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
          played++;
          applyElo(v, you, now);
        } else if (now - v.startAt > MAX_RACE) {
          v.status = "finished";
        }
      }
      return send(res, view(v, now));
    }

    case "/list": {
      const list = [];
      let playing = 0;
      for (const [code, r] of rooms) {
        if (now - r.touched > 15000) continue; // игроки ушли
        if (r.status === "running") playing++;
        if (r.status === "waiting" && r.pub) list.push({ room: code, name: r.a.name, r: r.a.r, age: Math.round((now - r.created) / 1000) });
      }
      list.sort((a, b) => a.age - b.age);
      return send(res, { rooms: list.slice(0, 12), playing });
    }

    case "/top": {
      if (uid) ladderPut(uid, name, q.get("r"), now);
      const all = [...ladder.entries()].sort((x, y) => y[1].r - x[1].r || y[1].g - x[1].g);
      const idx = uid ? all.findIndex(([id]) => id === uid) : -1;
      const mine = idx >= 0 ? all[idx][1] : null;
      return send(res, {
        top: all.slice(0, 10).map(([id, e]) => ({ name: e.name, r: e.r, g: e.g, me: id === uid })),
        rank: idx >= 0 ? idx + 1 : 0, total: all.length,
        me: mine ? { r: mine.r, g: mine.g, w: mine.w, l: mine.l } : null,
      });
    }

    case "/stats": {
      let playing = 0, waiting = 0;
      for (const r of rooms.values()) {
        if (r.status === "finished" || now - r.touched > 15000) continue; // нет активности 15 с — не считаем
        if (r.status === "running") playing += 2; else waiting += 1;
      }
      return send(res, { playing, waiting, played });
    }

    case "/leave": {
      if (v && v.status !== "finished") {
        v.status = "finished";
        if (!v.b) v.winner = "x";
        else {
          v.winner = you === "a" ? "b" : "a"; v.left = you;
          if (now >= v.startAt) applyElo(v, v.winner, now); // выход во время гонки = поражение
        }
      }
      return send(res, { ok: true, elo: v ? v.elo || null : null });
    }

    default:
      return send(res, { ok: true, service: "typing-duel" });
  }
}).listen(process.env.PORT || 3000); 
