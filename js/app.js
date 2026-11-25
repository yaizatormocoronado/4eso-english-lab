/* 4ESO English Lab – single-page app. Data comes from js/data.js (window.COURSE). */
(function () {
  "use strict";
  const COURSE = window.COURSE || [];
  const app = document.getElementById("app");
  const LEVELS = [["basic", "Basic", "●○○"], ["intermediate", "Intermediate", "●●○"], ["advanced", "Advanced", "●●●"]];

  /* ---------- storage ---------- */
  const KEY = "eso4-english-lab";
  let store = { xp: 0, words: {}, best: {}, sound: true };
  try { Object.assign(store, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} updateXP(); }
  function updateXP() { document.getElementById("xp").textContent = store.xp + " XP"; }

  /* ---------- theme + sound ---------- */
  const themeBtn = document.getElementById("theme");
  function applyTheme() {
    let t = null; try { t = localStorage.getItem(KEY + "-theme"); } catch (e) {}
    if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
    themeBtn.textContent = "Theme: " + (t || "auto");
  }
  themeBtn.addEventListener("click", () => {
    let t = null; try { t = localStorage.getItem(KEY + "-theme"); } catch (e) {}
    const next = t === null ? "dark" : t === "dark" ? "light" : null;
    try { next ? localStorage.setItem(KEY + "-theme", next) : localStorage.removeItem(KEY + "-theme"); } catch (e) {}
    applyTheme();
  });
  applyTheme();
  const soundBtn = document.getElementById("sound");
  function paintSound() { soundBtn.textContent = "Sound: " + (store.sound ? "on" : "off"); }
  soundBtn.addEventListener("click", () => { store.sound = !store.sound; save(); paintSound(); });
  paintSound();
  updateXP();

  let actx = null;
  function beep(good) {
    if (!store.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = good ? [660, 880] : [220, 180];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = good ? "sine" : "square"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, actx.currentTime + i * 0.11);
        g.gain.exponentialRampToValueAtTime(good ? 0.18 : 0.06, actx.currentTime + i * 0.11 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + i * 0.11 + 0.16);
        o.connect(g).connect(actx.destination); o.start(actx.currentTime + i * 0.11); o.stop(actx.currentTime + i * 0.11 + 0.18);
      });
    } catch (e) {}
  }

  /* ---------- speech ---------- */
  const canSpeak = "speechSynthesis" in window;
  function speak(text) {
    if (!canSpeak) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/\(.*?\)/g, "").replace(/somebody/g, "somebody"));
      const voices = speechSynthesis.getVoices();
      u.voice = voices.find(v => v.lang === "en-GB") || voices.find(v => v.lang && v.lang.startsWith("en")) || null;
      u.lang = "en-GB"; u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- helpers ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<mark>$1</mark>");
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const unitById = id => COURSE.find(u => String(u.id) === String(id));
  const PAIR = { 1: "#ff9a3d", 2: "#00c2a8", 3: "#00b8f0", 4: "#ff4fd8", 5: "#ffb000", 6: "#ff7a3d", 7: "#2ad46b", 8: "#b44bff" };
  const pair = u => PAIR[u.id] || u.color;
  function setUnitColor(u) {
    document.documentElement.style.setProperty("--u", u ? u.color : "#ff3d7f");
    document.documentElement.style.setProperty("--u2", u ? pair(u) : "#8b3dff");
  }
  function confetti(colors) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
    const ctx = c.getContext("2d"), W = c.width = innerWidth, H = c.height = innerHeight;
    const ps = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * 120, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
      s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colors[Math.floor(Math.random() * colors.length)] }));
    let t = 0;
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++t < 160) requestAnimationFrame(frame); else c.remove();
    })();
  }
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[‘’´`]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
      .replace(/won't/g, "will not").replace(/can't/g, "can not").replace(/cannot/g, "can not").replace(/n't/g, " not")
      .replace(/'ll/g, " will").replace(/'ve/g, " have").replace(/'re/g, " are").replace(/\bi'm\b/g, "i am")
      .replace(/\s*\/\s*/g, " / ").replace(/[.!?,;:]+(\s|$)/g, "$1").replace(/\s+/g, " ").trim();
  }
  function wordForms(w) {
    const base = w[0];
    const out = new Set();
    base.split(" / ").forEach(p => {
      out.add(p.replace(/[()]/g, ""));
      out.add(p.replace(/\s*\(.*?\)\s*/g, " ").trim());
    });
    [...out].forEach(f => { out.add(f.replace(/somebody/g, "someone")); out.add(f.replace(/someone's/g, "your")); });
    return [...out].map(norm);
  }
  const starText = ex => (ex.match(/\*(.+?)\*/g) || []).map(s => s.slice(1, -1)).join(" … ");
  const gapped = ex => esc(ex).replace(/\*(.+?)\*/g, '<span class="blank">&nbsp;?&nbsp;</span>');
  const plain = ex => ex.replace(/\*/g, "");

  function allWords(u) {
    const out = [];
    u.vocab.forEach((s, si) => s.words.forEach(w => out.push({ w, set: si, key: "u" + u.id + "|" + w[0] })));
    return out;
  }
  const matchers = {};
  const IRREG = { hang: ["hung"], show: ["shown"], get: ["got", "gotten", "getting"], come: ["came"], bring: ["brought"], tell: ["told"],
    meet: ["met"], stand: ["stood"], run: ["ran", "running"], shoot: ["shot", "shooting"], lose: ["lost", "losing"], take: ["took", "taken", "taking"],
    make: ["made", "making"], give: ["gave", "given", "giving"], find: ["found"], hold: ["held"], end: ["ended"], set: ["setting"],
    expand: ["expanded"], save: ["saving"], raise: ["raising"], achieve: ["achieving"], sign: ["signed"], reach: ["reached"],
    launch: ["launched"], donate: ["donating"], promote: ["promoting"], point: ["pointed"], crash: ["crashed"], judge: ["judging"] };
  function vocabMatcher(u) {
    if (matchers[u.id]) return matchers[u.id];
    const entries = [];
    allWords(u).forEach(x => {
      x.w[0].split(" / ").forEach(f => {
        f = f.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
        if (!f || /somebody|someone/.test(f)) return;
        entries.push({ f, x });
      });
    });
    entries.sort((a, b) => b.f.length - a.f.length);
    const pat = entries.map(e => {
      const words = e.f.split(" ").map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const inflect = w => "(?:" + [w].concat(IRREG[w.toLowerCase()] || []).join("|") + ")(?:s|es|ed|d|ing)?";
      words[0] = inflect(words[0]);
      if (words.length > 1) words[words.length - 1] = inflect(words[words.length - 1]);
      return "(" + words.join("\\s+") + ")";
    });
    const re = new RegExp("\\b(?:" + pat.join("|") + ")\\b", "gi");
    return (matchers[u.id] = { re, entries });
  }
  function linkVocab(u, root) {
    const { re, entries } = vocabMatcher(u);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest("button, .vw, .topic-words, .label, .deco") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    const found = new Set();
    nodes.forEach(node => {
      const t = node.nodeValue; re.lastIndex = 0;
      if (!re.test(t)) return; re.lastIndex = 0;
      const frag = document.createDocumentFragment(); let last = 0, m;
      while ((m = re.exec(t))) {
        const gi = m.slice(1).findIndex(v => v !== undefined); const e = entries[gi];
        frag.appendChild(document.createTextNode(t.slice(last, m.index)));
        const sp = document.createElement("span");
        sp.className = "vw"; sp.tabIndex = 0; sp.textContent = m[0];
        sp.dataset.es = e.x.w[3]; sp.dataset.word = e.x.w[0]; sp.title = e.x.w[0] + " = " + e.x.w[3];
        frag.appendChild(sp); found.add(e.x.w[0]); last = m.index + m[0].length;
      }
      frag.appendChild(document.createTextNode(t.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
    return found;
  }
  function topicWords(u, g) {
    const div = document.createElement("div");
    div.innerHTML = g.slides.map(s => [s.h, s.sub, s.hook, s.title, ...(s.p || []), ...(s.ex || []), ...(s.text || []), ...((s.rows || []).flat()), ...((s.items || []).flat()), s.q, ...(s.o || [])].filter(Boolean).join(" . ")).join(" . ");
    const words = [...linkVocab(u, div)];
    return words.slice(0, 10);
  }
  function mastery(u) {
    const ws = allWords(u);
    const m = ws.filter(x => (store.words[x.key] || 0) >= 4).length;
    return { m, total: ws.length, pct: Math.round(100 * m / ws.length) };
  }
  function grammarDone(u) {
    let done = 0, total = 0;
    u.grammar.forEach(g => LEVELS.forEach(([k]) => { total++; if ((store.best["u" + u.id + "|" + g.id + "|" + k] || 0) >= 70) done++; }));
    return { done, total };
  }

  /* ---------- student identity + activity log (Google Sheets) ---------- */
  const CFG = window.LAB_CONFIG || {};
  const CLASSES = CFG.classes || ["4ºA", "4ºB", "4ºC", "4ºD"];
  function student() { return store.student && store.student.name ? store.student : null; }
  function paintStudent() {
    const el = document.getElementById("who");
    if (!el) return;
    const s = student();
    el.hidden = !s;
    if (s) el.textContent = s.name + " · " + s.group;
  }
  function logEvent(data) {
    const s = student();
    if (!s) return;
    const row = Object.assign({ time: new Date().toISOString(), student: s.name, group: s.group, xp: store.xp }, data);
    store.outbox = (store.outbox || []).concat([row]).slice(-200);
    save();
    flush();
  }
  let flushing = false;
  function flush() {
    if (!CFG.sheetUrl || flushing || !(store.outbox || []).length) return;
    flushing = true;
    const batch = store.outbox.slice(0, 25);
    fetch(CFG.sheetUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ rows: batch }) })
      .then(() => { store.outbox = store.outbox.slice(batch.length); save(); flushing = false; if (store.outbox.length) flush(); })
      .catch(() => { flushing = false; });
  }
  window.addEventListener("online", flush);
  setInterval(flush, 60000);

  function renderSignIn() {
    setUnitColor(null);
    document.title = "Sign in · 4ESO English Lab";
    const s = store.student || {};
    app.innerHTML = `<section class="wrap signin"><form class="panel signin-card" id="signin" novalidate>
      <img class="logo-big" src="img/logo.png" alt="In Order Words" width="560" height="313">
      <div><span class="label">Before you start</span><h1>Who are you?</h1>
      <p class="sub">Your teacher will see the activities you complete and your scores.</p></div>
      <label for="st-name">Your name${CFG.askCode ? " or student code" : ""}</label>
      <input class="type-in" id="st-name" autocomplete="off" maxlength="40" placeholder="${CFG.askCode ? "e.g. C-07" : "First name and first surname"}" value="${esc(s.name || "")}">
      <label for="st-group">Your class</label>
      <select class="type-in" id="st-group">${CLASSES.map(c => `<option${c === s.group ? " selected" : ""}>${esc(c)}</option>`).join("")}</select>
      <p class="err" id="st-err" hidden>Please write your name.</p>
      <button class="btn" type="submit">Start learning →</button>
      <p class="privacy">We only save your name, your class and your results in the activities, so your teacher can follow your progress. Nothing else is collected.</p>
    </form></section>`;
    document.getElementById("signin").addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("st-name").value.trim().replace(/\s+/g, " ");
      if (name.length < 2) { document.getElementById("st-err").hidden = false; return; }
      const changed = !s.name || s.name !== name;
      store.student = { name, group: document.getElementById("st-group").value };
      save(); paintStudent();
      if (changed) logEvent({ activity: "Sign in", unit: "", detail: "", level: "", score: "" });
      location.hash = "#/";
      route();
    });
    setTimeout(() => document.getElementById("st-name").focus(), 50);
  }

  /* ---------- router ---------- */
  let cleanup = null;
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    if (canSpeak) try { speechSynthesis.cancel(); } catch (e) {}
    const parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
    window.scrollTo(0, 0);
    if (!student() || parts[0] === "signin") return renderSignIn();
    if (parts[0] === "unit" && unitById(parts[1])) {
      const u = unitById(parts[1]);
      setUnitColor(u);
      if (parts[2] === "slides") return renderSlides(u, parts[3]);
      if (parts[2] === "practice") return renderPractice(u, parts[3]);
      if (parts[2] === "exercises") return renderExercises(u, parts[3], parts[4]);
      return renderUnit(u);
    }
    setUnitColor(null);
    renderHome();
  }
  window.addEventListener("hashchange", route);

  /* ---------- home ---------- */
  function renderHome() {
    document.title = "4ESO English Lab · In Order Words";
    app.innerHTML = `
      <section class="wrap hero"><div class="hero-grid"><div style="display:grid;gap:14px;min-width:0">
        <span class="label">4º ESO · English · 8 units</span>
        <h1><span class="hl hl1">Learn</span> it, <span class="hl hl2">practise</span> it, <span class="hl hl3">own</span> it.</h1>
        <p>Every unit has interactive grammar presentations, a vocabulary trainer, grammar exercises at three levels and worksheets you can download and print.</p></div>
        <img class="logo-big" src="img/logo.png" alt="In Order Words – Teach · Create · Inspire" width="560" height="313"></div>
        <div class="howto"><span class="c1">▶ Watch the presentation</span><span class="c2">✎ Do the exercises</span><span class="c3">★ Train your vocabulary</span><span class="c4">⬇ Download a worksheet</span></div>
      </section>
      <section class="wrap units">
        ${COURSE.map(u => {
          const m = mastery(u), g = grammarDone(u);
          return `<a class="unit-tile" href="#/unit/${u.id}" style="--u:${u.color};--u2:${pair(u)}">
            <div><div class="num">${u.id}</div></div>
            <div><h2>${esc(u.title)}</h2><p>${esc(u.topic)}</p></div>
            <div style="display:grid;gap:10px">
              <ul>${u.grammar.map(gr => `<li>${esc(gr.title)}</li>`).join("")}</ul>
              <div class="meter-row"><span>Vocabulary ${m.m}/${m.total}</span><div class="meter"><i style="width:${m.pct}%"></i></div></div>
              <div class="meter-row"><span>Grammar levels ${g.done}/${g.total}</span><div class="meter"><i style="width:${Math.round(100 * g.done / g.total)}%"></i></div></div>
            </div></a>`;
        }).join("")}
      </section>
      <footer class="site"><div class="wrap"><img class="foot-logo" src="img/logo-sm.png" alt="In Order Words" width="93" height="52"><span>Your progress is saved in this browser only. Use the same device and browser to keep your XP.</span></div></footer>`;
  }

  /* ---------- unit page ---------- */
  function renderUnit(u) {
    document.title = `Unit ${u.id}: ${u.title} · 4ESO English Lab`;
    const ws = allWords(u);
    const m = mastery(u);
    const dl = (href, label, tag) => `<a class="dl" href="${href}" download>${tag ? `<b>${tag}</b>` : ""}${esc(label)}</a>`;
    app.innerHTML = `
      <section class="band"><div class="wrap">
        <a class="back" href="#/">← All units</a>
        <span class="label">Unit ${u.id}</span>
        <h1>${esc(u.title)}</h1>
        <p>${esc(u.topic)}</p>
      </div></section>
      <div class="wrap unit-grid">
        <section>
          <div class="section-h"><h2>Grammar</h2><span class="label">${u.grammar.length} topics</span></div>
          ${u.grammar.map((g, gi) => `
            <article class="panel">
              <div><span class="label">Grammar ${gi + 1}</span><h3>${esc(g.title)}</h3><p class="sub">${esc(g.short)}</p></div>
              <div class="row"><a class="btn" href="#/unit/${u.id}/slides/${g.id}">▶ Watch the presentation</a></div>
              <div class="group-label">Interactive exercises</div>
              <div class="row">${LEVELS.map(([k, l, d]) => {
                const b = store.best["u" + u.id + "|" + g.id + "|" + k];
                return `<a class="lvl" href="#/unit/${u.id}/exercises/${g.id}/${k}"><span class="dots">${d}</span>${l}${b != null ? `<span class="best">${b}%</span>` : ""}</a>`;
              }).join("")}</div>
              <div class="group-label">Worksheets (PDF)</div>
              <div class="row">${LEVELS.map(([k, l]) => dl(u.files.grammar[g.id][k], l, "PDF")).join("")}</div>
            </article>`).join("")}
        </section>
        <section>
          <div class="section-h"><h2>Vocabulary</h2><span class="label">${ws.length} words</span></div>
          <article class="panel">
            <div><h3>Vocabulary trainer</h3><p class="sub">Learn new words, then practise them with quick games. You have mastered <b>${m.m}</b> of ${m.total} words.</p></div>
            <div class="meter"><i style="width:${m.pct}%"></i></div>
            <div class="row"><a class="btn" href="#/unit/${u.id}/practice/all">Start practising</a></div>
            <div class="row">${u.vocab.map((s, si) => `<a class="lvl" href="#/unit/${u.id}/practice/${si}">${esc(s.name)}</a>`).join("")}</div>
            <div class="group-label">Downloads (PDF)</div>
            <div class="row">${dl(u.files.list, "Vocabulary list (English + Spanish)", "PDF")}</div>
            <div class="row">${LEVELS.map(([k, l]) => dl(u.files.vocab[k], "Worksheet: " + l, "PDF")).join("")}</div>
          </article>
          <article class="panel">
            <div class="section-h" style="margin:0"><h3>Word list</h3></div>
            <div class="set-tabs" role="group" aria-label="Vocabulary sets">${u.vocab.map((s, si) => `<button type="button" data-set="${si}" aria-pressed="${si === 0}">${esc(s.name)}</button>`).join("")}</div>
            <div class="words" id="words"></div>
          </article>
        </section>
      </div>`;
    const box = document.getElementById("words");
    function showSet(si) {
      app.querySelectorAll(".set-tabs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.set == si)));
      box.innerHTML = u.vocab[si].words.map((w, i) => {
        const s = store.words["u" + u.id + "|" + w[0]] || 0;
        return `<div class="word"><div><b>${esc(w[0])}</b><span class="pos">${esc(w[1])}</span>${canSpeak ? `<button class="say" type="button" data-say="${esc(w[0])}" aria-label="Listen to ${esc(w[0])}">🔊</button>` : ""}</div>
          <div class="es">${esc(w[3])}</div><div class="def">${esc(w[2])}<br><i>${esc(plain(w[4]))}</i>${s >= 4 ? ' · <b style="color:var(--good)">mastered</b>' : ""}</div></div>`;
      }).join("");
    }
    app.querySelector(".set-tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) showSet(+b.dataset.set); });
    box.addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) speak(b.dataset.say); });
    showSet(0);
  }

  /* ---------- slides ---------- */
  function renderSlides(u, gid) {
    const g = u.grammar.find(x => x.id === gid) || u.grammar[0];
    document.title = `${g.title} · Unit ${u.id}`;
    let i = 0;
    const slides = g.slides;
    const tw = topicWords(u, g);
    let loggedDeck = false;
    const pad = n => String(n).padStart(2, "0");
    const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    function deco(s) {
      const n = slides.length, k = i + 1, T = esc(u.title.toUpperCase());
      const hud = {
        1: `<div class="hud"><span>${esc(g.title)}</span><span>p. ${k}</span></div><span class="tape t1"></span><span class="tape t2"></span>`,
        2: `<div class="hud"><span>Pitch deck · ${T}</span><span>${pad(k)} / ${pad(n)}</span></div><span class="bars"></span>`,
        3: `<div class="hud"><span>Planet Earth · ${esc(g.title)}</span><span>${k}/${n}</span></div><span class="leaf"></span><span class="leaf l2"></span>`,
        4: `<div class="hud"><span class="rec">● REC</span><span>ISO 400 · f/2.8 · 1/250</span><span>IMG_${pad(u.id)}${pad(k)}</span></div><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>`,
        5: `<div class="hud"><span>Field guide · Section ${u.id}.${k}</span><span>${esc(g.title)}</span></div><span class="compass">N</span>`,
        6: `<div class="hud"><div class="masthead">The Daily 4ESO</div><div class="dateline"><span>Vol. ${u.id} · No. ${k}</span><span>${esc(today)}</span><span>Price: one good answer</span></div></div>`,
        7: `<div class="hud"><span>Blueprint // ${esc(g.title)} // rev ${u.id}.${k}</span><span>Scale 1:100</span></div><span class="dim"></span>`,
        8: `<div class="hud"><span>1UP</span><span>Score ${String(k * 120).padStart(6, "0")}</span><span class="hearts">♥♥♥</span><span>Level ${k}</span></div>${s.k === "title" ? '<span class="press">Press start ▶</span>' : ""}`
      }[u.id] || "";
      return `<div class="deco" aria-hidden="true">${hud}</div>`;
    }
    app.innerHTML = `<div class="deck themed theme-${u.id}">
      <div class="wrap stage-top"><a class="close" href="#/unit/${u.id}" aria-label="Close presentation">×</a>
        <div class="progress"><i id="pb"></i></div><span class="streak" id="count"></span></div>
      <div class="wrap slide-wrap" id="sw"></div>
      <div class="wrap deck-nav">
        <button class="btn ghost" id="prev" type="button">← Back</button>
        <div class="dots" id="dots">${slides.map((_, j) => `<button type="button" data-j="${j}" aria-label="Slide ${j + 1}"></button>`).join("")}</div>
        <button class="btn" id="next" type="button">Next →</button>
      </div></div>`;
    const sw = document.getElementById("sw");
    function body(s) {
      switch (s.k) {
        case "title": return `<div class="slide title-slide"><span class="label">Unit ${u.id} · ${esc(u.title)}</span><h2>${esc(s.h)}</h2><p class="lead">${esc(s.sub)}</p><div class="hook"><b>Think:</b> ${esc(s.hook)}</div>${tw.length ? `<div class="topic-words"><span class="label">Topic words in this presentation</span><div>${tw.map(w => `<button type="button" class="chip" data-say="${esc(w)}">${esc(w)}</button>`).join("")}</div></div>` : ""}</div>`;
        case "context": return `<div class="slide context-slide"><span class="label">${esc(s.h)}</span><article class="doc"><div class="doc-kind">${esc(s.kind)}</div><h3>${esc(s.title)}</h3>${s.text.map(p => `<p>${md(p)}</p>`).join("")}</article><p class="note">The grammar is <mark>highlighted</mark>. Tap the <span class="vw-sample">underlined words</span> to see the Spanish translation.</p></div>`;
        case "text": return `<div class="slide"><h2>${esc(s.h)}</h2>${(s.p || []).map(p => `<p class="lead">${md(p)}</p>`).join("")}${s.ex ? `<ul class="examples">${s.ex.map(e => `<li>${md(e)}${canSpeak ? ` <button class="say" type="button" data-say="${esc(e.replace(/\*\*/g, ""))}" aria-label="Listen">🔊</button>` : ""}</li>`).join("")}</ul>` : ""}</div>`;
        case "table": return `<div class="slide"><h2>${esc(s.h)}</h2><div class="table-scroll"><table class="gtable"><thead><tr>${s.cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map(c => `<td>${md(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${s.note ? `<p class="note">${md(s.note)}</p>` : ""}</div>`;
        case "mistakes": return `<div class="slide"><h2>${esc(s.h)}</h2><div class="mist">${s.items.map(m => `<div><div class="w">✗ ${esc(m[0])}</div><div class="r">✓ ${esc(m[1])}</div><div class="why">${esc(m[2])}</div></div>`).join("")}</div></div>`;
        case "check": return `<div class="slide"><span class="label">Quick check</span><h2>${md(s.q).replace(/___/g, '<span class="blank" style="border-bottom:3px solid var(--u)">&nbsp;&nbsp;&nbsp;&nbsp;</span>')}</h2><div class="opts">${s.o.map((o, j) => `<button class="opt" type="button" data-o="${j}"><span class="k">${"ABC"[j]}</span>${esc(o)}</button>`).join("")}</div><div id="cfb"></div></div>`;
        case "sum": return `<div class="slide"><h2>${esc(s.h)}</h2><ul class="summary-list">${s.p.map(p => `<li>${md(p)}</li>`).join("")}</ul>
          <div class="row"><a class="btn" href="#/unit/${u.id}/exercises/${g.id}/basic">Practise now →</a><a class="btn ghost" href="${u.files.grammar[g.id].basic}" download>Download a worksheet</a></div></div>`;
      }
      return "";
    }
    function show() {
      const s = slides[i];
      sw.innerHTML = body(s);
      sw.querySelector(".slide").insertAdjacentHTML("afterbegin", deco(s));
      linkVocab(u, sw.querySelector(".slide"));
      document.getElementById("pb").style.width = ((i + 1) / slides.length * 100) + "%";
      document.getElementById("count").textContent = (i + 1) + "/" + slides.length;
      document.querySelectorAll("#dots button").forEach((b, j) => b.setAttribute("aria-current", String(j === i)));
      document.getElementById("prev").disabled = i === 0;
      const nx = document.getElementById("next");
      nx.disabled = i === slides.length - 1;
      if (i === slides.length - 1 && !loggedDeck) { loggedDeck = true; logEvent({ activity: "Presentation", unit: "Unit " + u.id + " " + u.title, detail: g.title + " (viewed to the end)", level: "", score: "" }); }
      if (s.k === "check") {
        sw.querySelector(".opts").addEventListener("click", e => {
          const b = e.target.closest(".opt"); if (!b) return;
          const j = +b.dataset.o, ok = j === s.a;
          sw.querySelectorAll(".opt").forEach((x, xi) => { x.disabled = true; if (xi === s.a) x.classList.add("right"); else if (xi === j) x.classList.add("wrong"); });
          document.getElementById("cfb").innerHTML = `<div class="check-fb ${ok ? "ok" : "no"}"><b>${ok ? "Correct!" : "Not quite."}</b> ${esc(s.e)}</div>`;
          beep(ok);
          if (ok) { store.xp += 5; save(); }
        });
      }
    }
    const go = d => { const n = i + d; if (n >= 0 && n < slides.length) { i = n; show(); } };
    document.getElementById("prev").onclick = () => go(-1);
    document.getElementById("next").onclick = () => go(1);
    document.getElementById("dots").onclick = e => { const b = e.target.closest("button"); if (b) { i = +b.dataset.j; show(); } };
    sw.addEventListener("click", e => {
      const v = e.target.closest(".vw");
      if (v) { sw.querySelectorAll(".vw.open").forEach(x => x !== v && x.classList.remove("open")); v.classList.toggle("open"); speak(v.dataset.word); return; }
      const b = e.target.closest("[data-say]"); if (b) speak(b.dataset.say);
    });
    const key = e => { if (e.key === "ArrowRight" || e.key === "PageDown") go(1); if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1); if (e.key === "Escape") location.hash = "#/unit/" + u.id; };
    let tx = null;
    const ts = e => { tx = e.touches[0].clientX; };
    const te = e => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); tx = null; };
    document.addEventListener("keydown", key);
    sw.addEventListener("touchstart", ts, { passive: true });
    sw.addEventListener("touchend", te);
    cleanup = () => document.removeEventListener("keydown", key);
    show();
  }

  /* ---------- shared quiz engine ---------- */
  // step: {type, html, setup(el, answer), checkable, explain}
  function runQuiz(u, opts) {
    const queue = opts.steps.slice();
    const total = queue.filter(s => s.type !== "intro").length;
    let doneCount = 0, streak = 0, firstTryRight = 0, answered = 0;
    const wrongs = [];
    const seenWrong = new Set();
    app.innerHTML = `<div class="stage">
      <div class="wrap stage-top"><a class="close" href="#/unit/${u.id}" aria-label="Quit">×</a>
        <div class="progress"><i id="pb" style="width:0"></i></div><span class="streak" id="streak" title="Streak"></span></div>
      <div class="wrap q-area" id="qa"></div>
      <div class="foot" id="foot"><div class="wrap"><div class="msg" id="msg"></div><button class="btn" id="act" type="button">Check</button></div></div>
    </div>`;
    const qa = document.getElementById("qa"), foot = document.getElementById("foot"), msg = document.getElementById("msg"), act = document.getElementById("act");
    let cur = null, state = "answer", getAnswer = null;

    function paintProgress() {
      document.getElementById("pb").style.width = Math.min(100, doneCount / Math.max(1, total) * 100) + "%";
      document.getElementById("streak").textContent = streak >= 2 ? "🔥" + streak : "";
    }
    function next() {
      foot.className = "foot"; msg.innerHTML = "";
      if (!queue.length) return finish();
      cur = queue.shift();
      state = "answer";
      qa.innerHTML = `<div class="q">${cur.html}</div>`;
      const el = qa.firstElementChild;
      getAnswer = null;
      act.className = "btn"; act.disabled = false;
      if (cur.type === "intro") { act.textContent = "Got it"; state = "intro"; }
      else { act.textContent = "Check"; }
      if (cur.setup) cur.setup(el, (fn, autoCheck) => {
        getAnswer = fn;
        if (autoCheck) check();
      });
      const inp = el.querySelector("input");
      if (inp) setTimeout(() => inp.focus(), 50);
      paintProgress();
    }
    function check() {
      if (state !== "answer") return;
      if (!getAnswer) return;
      const ans = getAnswer();
      if (ans == null || ans === "") return;
      const ok = cur.check(ans);
      state = "feedback";
      const first = !seenWrong.has(cur);
      if (ok) {
        streak++; if (first) firstTryRight++;
        doneCount++;
        const gain = 10 + (streak >= 3 ? 5 : 0);
        store.xp += gain;
        opts.onResult && opts.onResult(cur, true, first);
        foot.className = "foot ok";
        msg.innerHTML = `<strong>${["Great!", "Correct!", "Nice one!", "Excellent!", "Well done!"][Math.floor(Math.random() * 5)]}</strong><span>+${gain} XP${cur.explain ? " · " + esc(cur.explain) : ""}</span>`;
        act.className = "btn go-good";
      } else {
        streak = 0;
        if (first) { wrongs.push(cur); seenWrong.add(cur); }
        opts.onResult && opts.onResult(cur, false, first);
        if (opts.retry) queue.push(cur); else doneCount++;
        foot.className = "foot no";
        msg.innerHTML = `<strong>Correct answer:</strong><span>${esc(cur.solution)}${cur.explain ? "<br>" + esc(cur.explain) : ""}</span>`;
        act.className = "btn go-bad";
      }
      if (first) answered++;
      if (cur.after) cur.after(qa.firstElementChild, ok);
      act.textContent = "Continue";
      save(); beep(ok); paintProgress();
      act.focus();
    }
    act.addEventListener("click", () => { if (state === "answer") check(); else next(); });
    const key = e => {
      if (e.key === "Enter" && !e.target.closest(".close")) {
        if (e.target.tagName === "BUTTON" && e.target !== act) return;
        e.preventDefault(); if (state === "answer") check(); else next();
      }
    };
    document.addEventListener("keydown", key);
    cleanup = () => document.removeEventListener("keydown", key);

    function finish() {
      const pct = answered ? Math.round(100 * firstTryRight / answered) : 100;
      opts.onFinish && opts.onFinish(pct, firstTryRight, answered);
      if (pct >= 70) confetti([u.color, pair(u), "#ffd23f", "#ffffff", "#1c2a3a"]);
      save();
      foot.remove();
      document.getElementById("pb").style.width = "100%";
      qa.innerHTML = `<div class="results">
        <span class="label">${esc(opts.title)}</span>
        <h2>${pct >= 90 ? "Outstanding!" : pct >= 70 ? "Great work!" : pct >= 50 ? "Good effort!" : "Keep practising!"}</h2>
        <div class="stats"><div class="stat"><b>${pct}%</b><span>first-try accuracy</span></div><div class="stat"><b>${firstTryRight}/${answered}</b><span>correct</span></div><div class="stat"><b>${store.xp}</b><span>total XP</span></div></div>
        ${wrongs.length ? `<div class="review"><span class="label">Review your mistakes</span>${wrongs.map(w => `<div>${esc(w.reviewQ || "")} → <b>${esc(w.solution)}</b></div>`).join("")}</div>` : ""}
        <div class="row" style="justify-content:center">${opts.again ? `<a class="btn" href="${opts.again}" id="again">Try again</a>` : ""}${opts.extra || ""}<a class="btn ghost" href="#/unit/${u.id}">Back to unit</a></div>
      </div>`;
      const again = document.getElementById("again");
      if (again) again.addEventListener("click", e => { e.preventDefault(); route(); });
    }
    next();
  }

  function mcSetup(correctIdx) {
    return (el, ready) => {
      let sel = null;
      el.querySelectorAll(".opt").forEach((b, j) => b.addEventListener("click", () => {
        if (b.disabled) return;
        el.querySelectorAll(".opt").forEach(x => x.classList.remove("sel"));
        b.classList.add("sel"); sel = j;
        ready(() => sel, true);
      }));
      const keyPick = e => { const n = parseInt(e.key, 10); const bs = el.querySelectorAll(".opt"); if (n >= 1 && n <= bs.length && document.body.contains(el) && !bs[0].disabled) bs[n - 1].click(); };
      document.addEventListener("keydown", keyPick);
      const prev = cleanup; cleanup = () => { document.removeEventListener("keydown", keyPick); prev && prev(); };
    };
  }
  function mcAfter(correctIdx) {
    return (el) => el.querySelectorAll(".opt").forEach((b, j) => { b.disabled = true; if (j === correctIdx) b.classList.add("right"); else if (b.classList.contains("sel")) b.classList.add("wrong"); });
  }
  const optsHtml = (list, cls) => `<div class="opts ${cls || ""}">${list.map((o, j) => `<button class="opt" type="button"><span class="k">${j + 1}</span>${esc(o)}</button>`).join("")}</div>`;
  function typeSetup(el, ready) {
    const inp = el.querySelector("input");
    ready(() => inp.value.trim());
  }
  function tilesSetup(words) {
    return (el, ready) => {
      const tray = el.querySelector(".tray"), bank = el.querySelector(".bank");
      const picked = [];
      bank.innerHTML = words.map((w, j) => `<button class="tile" type="button" data-j="${j}">${esc(w)}</button>`).join("");
      bank.addEventListener("click", e => {
        const b = e.target.closest(".tile"); if (!b || b.classList.contains("used")) return;
        b.classList.add("used"); picked.push(+b.dataset.j); paint();
      });
      tray.addEventListener("click", e => {
        const b = e.target.closest(".tile"); if (!b) return;
        const j = +b.dataset.j; picked.splice(picked.indexOf(j), 1);
        bank.querySelector(`[data-j="${j}"]`).classList.remove("used"); paint();
      });
      function paint() { tray.innerHTML = picked.map(j => `<button class="tile" type="button" data-j="${j}">${esc(words[j])}</button>`).join(""); }
      ready(() => picked.length === words.length ? picked.map(j => words[j]).join(" ") : (picked.length ? picked.map(j => words[j]).join(" ") : ""));
    };
  }

  /* ---------- vocabulary practice ---------- */
  function renderPractice(u, setArg) {
    const pool = allWords(u).filter(x => setArg === "all" || setArg == null || String(x.set) === setArg);
    const setName = setArg === "all" || setArg == null ? "All words" : u.vocab[+setArg].name;
    document.title = `Vocabulary · Unit ${u.id}`;
    const strength = x => store.words[x.key];
    const unseen = pool.filter(x => strength(x) == null);
    const seen = pool.filter(x => strength(x) != null).sort((a, b) => strength(a) - strength(b) || Math.random() - .5);
    const newOnes = shuffle(unseen).slice(0, seen.length >= 4 ? 3 : 5);
    const targets = newOnes.concat(seen.slice(0, 7 - newOnes.length)).slice(0, 7);
    const distract = (x, n, f) => sample(allWords(u).filter(y => y.key !== x.key && f(y) !== f(x)), n).map(f);

    function q(x, kind) {
      const w = x.w;
      const base = { word: x, reviewQ: w[0] };
      if (kind === "es") {
        const options = shuffle([w[0]].concat(distract(x, 3, y => y.w[0])));
        const c = options.indexOf(w[0]);
        return { ...base, type: "mc", html: `<span class="kind">Translate</span><h2>What's the English for “${esc(w[3])}”?</h2>${optsHtml(options, "grid2")}`, setup: mcSetup(c), after: mcAfter(c), check: a => a === c, solution: w[0], reviewQ: w[3] };
      }
      if (kind === "def") {
        const options = shuffle([w[0]].concat(distract(x, 3, y => y.w[0])));
        const c = options.indexOf(w[0]);
        return { ...base, type: "mc", html: `<span class="kind">Definition</span><h2>${esc(w[2][0].toUpperCase() + w[2].slice(1))}</h2>${optsHtml(options)}`, setup: mcSetup(c), after: mcAfter(c), check: a => a === c, solution: w[0], reviewQ: w[2] };
      }
      if (kind === "listen") {
        const options = shuffle([w[0]].concat(distract(x, 3, y => y.w[0])));
        const c = options.indexOf(w[0]);
        return { ...base, type: "mc", html: `<span class="kind">Listen</span><h2>Which word do you hear?</h2><button class="listen-btn" type="button" aria-label="Play the word">🔊</button>${optsHtml(options, "grid2")}`,
          setup: (el, ready) => { const b = el.querySelector(".listen-btn"); b.onclick = () => speak(w[0]); setTimeout(() => speak(w[0]), 250); mcSetup(c)(el, ready); },
          after: mcAfter(c), check: a => a === c, solution: w[0], reviewQ: "(listening) " + w[0] };
      }
      if (kind === "gap") {
        const right = starText(w[4]);
        const options = shuffle([right].concat(distract(x, 3, y => starText(y.w[4]))));
        const c = options.indexOf(right);
        return { ...base, type: "mc", html: `<span class="kind">Complete the sentence</span><div class="sentence">${gapped(w[4])}</div>${optsHtml(options, "grid2")}`, setup: mcSetup(c), after: mcAfter(c), check: a => a === c, solution: right, explain: plain(w[4]), reviewQ: plain(w[4]).replace(right, "___") };
      }
      if (kind === "type") {
        const forms = wordForms(w);
        return { ...base, type: "type", html: `<span class="kind">Type the word</span><h2>“${esc(w[3])}”</h2><p class="prompt-sub">${esc(w[2])}</p><input class="type-in" id="typein" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type in English"><span class="hint">Hint: starts with “${esc(w[0][0])}” · ${w[0].replace(/\(.*?\)/g, "").trim().split(" ").length} word(s)</span>`,
          setup: typeSetup, check: a => forms.includes(norm(a)), solution: w[0], reviewQ: w[3], after: el => { el.querySelector("input").disabled = true; } };
      }
    }
    function intro(x) {
      const w = x.w;
      return { type: "intro", word: x, html: `<span class="kind">New word</span><div class="flash"><div class="big-word">${esc(w[0])}</div><div class="label">${esc(w[1])}</div><div>${esc(w[2])}</div><div class="es">🇪🇸 ${esc(w[3])}</div><div class="ex">“${esc(plain(w[4]))}”</div>${canSpeak ? `<button class="btn ghost" type="button" data-say>🔊 Listen</button>` : ""}</div>`,
        setup: el => { const b = el.querySelector("[data-say]"); if (b) { b.onclick = () => speak(w[0]); setTimeout(() => speak(w[0]), 250); } } };
    }
    function pairs(list) {
      const left = shuffle(list), right = shuffle(list);
      return { type: "pairs", reviewQ: "Match the pairs", solution: list.map(x => x.w[0] + " = " + x.w[3]).join(" · "),
        html: `<span class="kind">Match the pairs</span><h2>Tap the matching pairs</h2><div class="pairs"><div class="opts">${left.map(x => `<button class="opt" type="button" data-k="${esc(x.key)}">${esc(x.w[0])}</button>`).join("")}</div><div class="opts">${right.map(x => `<button class="opt" type="button" data-k="${esc(x.key)}">${esc(x.w[3])}</button>`).join("")}</div></div>`,
        setup: (el, ready) => {
          let pick = null, left2 = list.length, mistakes = 0;
          el.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
            if (b.classList.contains("done")) return;
            const side = b.parentElement;
            if (!pick || pick.parentElement === side) { el.querySelectorAll(".opt.sel").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); pick = b; return; }
            if (pick.dataset.k === b.dataset.k) {
              [pick, b].forEach(x => { x.classList.remove("sel"); x.classList.add("done"); x.disabled = true; }); left2--;
              if (canSpeak) speak(pick.parentElement === el.querySelector(".pairs .opts") ? pick.textContent : b.textContent);
              if (left2 === 0) ready(() => mistakes, true);
            } else {
              mistakes++; b.classList.add("wrong"); const p = pick; setTimeout(() => { b.classList.remove("wrong"); p.classList.remove("sel"); }, 450);
            }
            pick = null;
          }));
        },
        check: m => m <= 1 };
    }

    const steps = [];
    const kindsFor = x => {
      const s = strength(x) || 0;
      const easy = ["es", "def", canSpeak ? "listen" : "es"], hard = ["type", "gap", "def"];
      return s >= 2 ? hard : easy;
    };
    targets.forEach(x => {
      if (strength(x) == null) steps.push(intro(x));
      steps.push(q(x, sample(kindsFor(x), 1)[0]));
    });
    const round2 = shuffle(targets).map(x => q(x, sample(["type", "gap", "def", "es"], 1)[0]));
    steps.push(...round2);
    if (pool.length >= 4) steps.push(pairs(sample(targets.length >= 5 ? targets : pool, Math.min(5, pool.length))));

    runQuiz(u, {
      steps, retry: true, title: `Unit ${u.id} · ${setName}`, again: location.hash,
      onResult: (step, ok, first) => {
        if (!step.word) return;
        const k = step.word.key, s = store.words[k] || 0;
        store.words[k] = ok ? Math.min(5, s + (first ? 1 : 0)) : Math.max(0, s - 1);
      },
      onFinish: (pct, right, total) => {
        targets.forEach(x => { if (store.words[x.key] == null) store.words[x.key] = 1; });
        const m = mastery(u);
        logEvent({ activity: "Vocabulary practice", unit: "Unit " + u.id + " " + u.title, detail: setName + " (" + targets.length + " words; mastered " + m.m + "/" + m.total + ")", level: "", score: pct, correct: right + "/" + total });
      },
      extra: `<a class="btn ghost" href="${u.files.vocab.basic}" download>Download a worksheet</a>`
    });
  }

  /* ---------- grammar exercises ---------- */
  function renderExercises(u, gid, lvl) {
    const g = u.grammar.find(x => x.id === gid) || u.grammar[0];
    const L = LEVELS.find(l => l[0] === lvl) || LEVELS[0];
    document.title = `${g.title} · ${L[1]} · Unit ${u.id}`;
    const items = shuffle(g.ex[L[0]]);
    const steps = items.map(it => {
      const head = `<span class="kind">${esc(g.title)} · ${L[1]}</span>`;
      if (it.r) {
        const target = it.r;
        const words = target.replace(/[?.!]$/, "").split(" ");
        let tiles = shuffle(words);
        for (let t = 0; t < 5 && tiles.join(" ") === words.join(" "); t++) tiles = shuffle(words);
        return { type: "order", html: `${head}<h2>Put the words in order.</h2><div class="tray" aria-label="Your sentence"></div><div class="bank"></div>`,
          setup: tilesSetup(tiles), check: a => norm(a) === norm(target), solution: target, reviewQ: "Word order",
          after: el => el.querySelectorAll(".tile").forEach(t => t.disabled = true) };
      }
      const qHtml = esc(it.q).replace(/___/g, '<span class="blank">&nbsp;?&nbsp;</span>');
      if (it.o) {
        return { type: "mc", html: `${head}<div class="sentence">${qHtml}</div>${optsHtml(it.o)}`, setup: mcSetup(it.a), after: mcAfter(it.a), check: a => a === it.a, solution: it.o[it.a], reviewQ: it.q };
      }
      const answers = it.a.map(norm);
      return { type: "type", html: `${head}<div class="sentence">${qHtml}</div><input class="type-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer">${it.h ? `<span class="hint">${esc(it.h)}</span>` : `<span class="hint">Write only the missing words (or the full sentence if asked).</span>`}`,
        setup: typeSetup, check: a => answers.includes(norm(a)), solution: it.a[0], reviewQ: it.q, after: el => { el.querySelector("input").disabled = true; } };
    });
    const nextLvl = LEVELS[LEVELS.indexOf(L) + 1];
    runQuiz(u, {
      steps, retry: false, title: `${g.title} · ${L[1]}`, again: location.hash,
      onFinish: (pct, right, total) => {
        const k = "u" + u.id + "|" + g.id + "|" + L[0]; store.best[k] = Math.max(store.best[k] || 0, pct);
        logEvent({ activity: "Grammar exercise", unit: "Unit " + u.id + " " + u.title, detail: g.title, level: L[1], score: pct, correct: right + "/" + total });
      },
      extra: (nextLvl ? `<a class="btn" href="#/unit/${u.id}/exercises/${g.id}/${nextLvl[0]}">Next level: ${nextLvl[1]}</a>` : "") +
        `<a class="btn ghost" href="${u.files.grammar[g.id][L[0]]}" download>Download worksheet</a><a class="btn ghost" href="#/unit/${u.id}/slides/${g.id}">Review the presentation</a>`
    });
  }

  if (canSpeak) try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch (e) {}
  document.addEventListener("click", e => {
    const a = e.target.closest("a[download]");
    if (!a) return;
    const m = location.hash.match(/unit\/(\d+)/); const u = m && unitById(m[1]);
    logEvent({ activity: "Worksheet download", unit: u ? "Unit " + u.id + " " + u.title : "", detail: a.getAttribute("href").split("/").pop(), level: "", score: "" });
  });
  document.getElementById("who").addEventListener("click", () => { location.hash = "#/signin"; });
  paintStudent();
  flush();
  route();
})();
