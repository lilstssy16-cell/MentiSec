// ===== Date specialiști =====
const specialists = [
  { cat: "Psiholog", img: "images/s1.jpg", name: "Dr. Ana Popescu", spec: "Psiholog clinician",
    tags: ["Anxietate", "Stres", "Stimă de sine"], exp: 12,
    desc: "Ajută adulții să își înțeleagă mai bine emoțiile și să dezvolte metode sănătoase de gestionare a provocărilor din viața de zi cu zi." },
  { cat: "Psihoterapeut", img: "images/s2.jpg", name: "Andrei Ionescu", spec: "Psihoterapeut cognitiv-comportamental",
    tags: ["Depresie", "Epuizare", "Relații"], exp: 8,
    desc: "Sprijin practic și cald pentru cei care trec prin epuizare, stări de tristețe sau presiunea vieții moderne." },
  { cat: "Jurist", img: "images/s3.jpg", name: "Maria Dumitrescu", spec: "Jurist",
    tags:  ["Drepturi", "Consultanță juridică", "Siguranță online"], exp: 6,
    desc: "Oferă sprijin juridic tinerilor și familiilor, explică drepturile lor și îi ajută să rezolve problemele legale, inclusiv cele din mediul online." },
  { cat: "IT", img: "images/s4.jpg", name: "Mihai Stan", spec: "Specialist în IT",
    tags: ["Securitate online", "Recuperare conturi", "Protecția datelor"], exp: 25,
    desc: "Ajută tinerii și familiile să își protejeze datele, să recupereze conturile compromise și să rezolve problemele tehnice din mediul online." },
];

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const info = document.getElementById("resultsInfo");
const inputs = document.querySelectorAll(".search-input");
const section = document.getElementById("specialisti");

// Elimină diacriticele, ca „stima” să găsească „stimă”
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function cardHTML(s) {
  return `
    <article class="card">
      <span class="card-cat">${s.cat}</span>
      <div class="card-img"><img src="${s.img}" alt="${s.name}" loading="lazy" width="816" height="816"></div>
      <div class="card-body">
        <h3>${s.name}</h3>
        <p class="card-spec">${s.spec} · ${s.exp} ani de experiență</p>
        <div class="tags">${s.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        <p class="card-desc">${s.desc}</p>
        <a href="#contact" class="card-link">Vezi profilul <span class="arrow">→</span></a>
      </div>
    </article>`;
}

function render(query = "") {
  const q = norm(query.trim());
  const list = q
    ? specialists.filter((s) => norm([s.name, s.spec, s.cat, ...s.tags].join(" ")).includes(q))
    : specialists;

  grid.innerHTML = list.map(cardHTML).join("");
  grid.hidden = list.length === 0;

  if (query.trim()) {
    const word = list.length === 1 ? "rezultat" : "rezultate";
    info.innerHTML = `${list.length} ${word} pentru „<strong>${escape(query.trim())}</strong>” <button type="button" id="clearBtn">Șterge</button>`;
    info.hidden = false;
    document.getElementById("clearBtn").onclick = () => setQuery("");
  } else {
    info.hidden = true;
  }

  if (!list.length) {
    empty.innerHTML = `Niciun specialist nu corespunde căutării „${escape(query.trim())}”. Încearcă „anxietate”, „stres” sau „Ana”.`;
    empty.hidden = false;
  } else {
    empty.hidden = true;
  }
}

function setQuery(v) {
  inputs.forEach((i) => { if (i.value !== v) i.value = v; });
  render(v);
}

inputs.forEach((input) => {
  input.addEventListener("input", (e) => {
    setQuery(e.target.value);
    if (e.target.value && window.scrollY < section.offsetTop - 200) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ===== Meniu mobil =====
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
menuBtn.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  menuBtn.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Închide meniul" : "Deschide meniul");
});
mobileMenu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

// ===== Umbră navbar la derulare =====
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 10), { passive: true });

// ===== Animații la intrarea în ecran =====
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

render();

// ===== Asistent: interfață locală + conexiune opțională la server =====
(() => {
  const launcher = document.getElementById('helpLauncher');
  const panel = document.getElementById('helpPanel');
  const close = document.getElementById('helpClose');
  const form = document.getElementById('helpForm');
  const input = document.getElementById('helpInput');
  const messages = document.getElementById('helpMessages');
  const send = document.getElementById('helpSend');
  const quick = document.querySelectorAll('[data-help]');
  let aiReady = false;
  let busy = false;
  const history = [];
  function addMessage(text, role = 'assistant') {
    const bubble = document.createElement('div');
    bubble.className = 'help-message' + (role === 'user' ? ' help-message-user' : '');
    const label = document.createElement('span');
    label.className = 'help-message-label';
    label.textContent = role === 'user' ? 'Tu' : 'MentiSet';
    bubble.append(label, document.createTextNode(text));
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }
  function toggle(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus({ preventScroll: true });
    else launcher.focus({ preventScroll: true });
  }
  launcher.addEventListener('click', () => toggle(panel.hidden));
  close.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) toggle(false);
  });
  addMessage('Bună! Te pot ghida prin MentiSec și te pot ajuta să explorezi specialiștii. Cu ce ai vrea să începem?');
  // Fără server sau cheie API, conversația rămâne explicit demonstrativă.
  const ready = location.protocol === 'http:' || location.protocol === 'https:'
    ? fetch('/api/chat/status', { signal: AbortSignal.timeout(3000) })
        .then(r => r.ok ? r.json() : null).then(data => {
          aiReady = data?.ready === true;
          if (aiReady) {
            document.getElementById('helpMode').textContent = 'AI conectat';
            document.getElementById('helpNotice').textContent = 'Asistent AI pentru orientare. Nu înlocuiește un psiholog. Mesajele sunt trimise către OpenAI.';
          }
        }).catch(() => {})
    : Promise.resolve();
  function demoReply(text) {
    const q = norm(text);
    if (/specialist|psiholog|aleg|stres|anxiet|famil|somn|trauma|depres|epuizare/.test(q)) {
      const keywords = ['anxietate','stres','familie','somn','trauma','depresie','epuizare'];
      const term = keywords.find(t => q.includes(t));
      if (term) {
        setQuery(term);
        return 'Am filtrat lista de specialiști pentru „' + term + '”. Poți vedea rezultatele în secțiunea Specialiști. Acesta este un exemplu de orientare, nu o recomandare clinică.';
      }
      return 'Poți căuta după nume, specializare sau domeniu, de exemplu „stres”, „familie” sau „somn”. Ce domeniu ai vrea să explorezi?';
    }
    if (/site|mentisec|functioneaz/.test(q)) return 'MentiSec prezintă specialiști și domeniile lor. Bara de căutare filtrează cardurile. În acest prototip nu sunt disponibile programări sau profiluri detaliate.';
    if (/buna|salut|hello/.test(q)) return 'Bună! Ce ai vrea să afli despre site sau despre alegerea unui specialist?';
    if (/multum/.test(q)) return 'Cu drag! Poți continua să explorezi lista de specialiști.';
    return 'În modul demonstrativ pot răspunde doar la câteva întrebări despre MentiSec și pot filtra specialiștii. Încearcă „Cum aleg un specialist?” sau „Caut un specialist pentru stres”.';
  }
  async function submit(text) {
    text = text.trim().slice(0, 1000);
    if (!text || busy) return;
    busy = true; send.disabled = true; quick.forEach(b => b.disabled = true);
    addMessage(text, 'user'); input.value = '';
    const pending = addMessage('Se pregătește răspunsul…');
    try {
      await ready;
      let reply;
      if (aiReady) {
        const response = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...history, { role: 'user', content: text }].slice(-12) }),
          signal: AbortSignal.timeout(45000)
        });
        if (!response.ok) throw new Error('unavailable');
        const data = await response.json();
        if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('empty');
        reply = data.reply;
      } else reply = demoReply(text);
      pending.remove(); addMessage(reply);
      history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
      if (history.length > 12) history.splice(0, history.length - 12);
    } catch {
      pending.remove();
      addMessage('Conexiunea AI nu a reușit. Mesajul nu a primit un răspuns. Încearcă din nou puțin mai târziu.');
      input.value = text;
    } finally {
      busy = false; send.disabled = false; quick.forEach(b => b.disabled = false);
    }
  }
  form.addEventListener('submit', e => { e.preventDefault(); submit(input.value); });
  quick.forEach(b => b.addEventListener('click', () => submit(b.dataset.help)));
})();
