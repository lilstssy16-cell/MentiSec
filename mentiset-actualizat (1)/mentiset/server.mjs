// Server local opțional pentru AI. Cheia API nu ajunge în browser.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const key = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-5';
const port = Number(process.env.PORT || 3000);
const staticFiles = new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/index.html', ['index.html','text/html; charset=utf-8']],
  ['/style.css', ['style.css','text/css; charset=utf-8']],
  ['/script.js', ['script.js','text/javascript; charset=utf-8']],
  ...[1,2,3,4].map(i => ['/images/s'+i+'.jpg', ['images/s'+i+'.jpg','image/jpeg']])
]);
const instructions = `Ești asistentul AI MentiSec. Răspunde scurt, cald, în română, în text simplu. Ajuți utilizatorii să exploreze site-ul și domeniile specialiștilor. Nu oferi diagnostic, tratament sau indicații despre medicamente. Nu te prezenta ca psiholog. Dacă utilizatorul descrie pericol imediat, încurajează contactarea serviciilor locale de urgență și a unei persoane de încredere. Nu cere informații medicale sau de identificare. Site-ul este un prototip, nu are programări sau profiluri detaliate. Datele demonstrative: Dr. Ana Popescu — anxietate, stres, stimă de sine; Andrei Ionescu — depresie, epuizare, relații; Maria Dumitrescu — familie, adolescenți, doliu; Dr. Mihai Stan — traumă, PTSD, somn. Nu pretinde că acești specialiști sunt verificați sau disponibili. Nu inventa prețuri, contacte sau programări.`;
function json(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
let active = 0;
let calls = [];
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/chat/status') return json(res,200,{ready:Boolean(key)});
    if (req.method === 'POST' && url.pathname === '/api/chat') {
      // Permite doar cereri de la aceeași origine pe serverul local.
      if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) return json(res,403,{error:'Origine nepermisă.'});
      if (!key) return json(res,503,{error:'Cheia API nu este configurată.'});
      if (!String(req.headers['content-type']).startsWith('application/json')) return json(res,415,{error:'Format invalid.'});
      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 24000) return json(res,413,{error:'Mesaj prea mare.'});
      }
      let parsed;
      try { parsed = JSON.parse(body); } catch { return json(res,400,{error:'Date invalide.'}); }
      const messages = parsed.messages;
      if (!Array.isArray(messages) || !messages.length || messages.length > 12 || messages.some(m => !m || !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 4000) || messages.at(-1).role !== 'user') return json(res,400,{error:'Conversație invalidă.'});
      calls = calls.filter(t => Date.now()-t < 60000);
      if (active >= 3 || calls.length >= 12) return json(res,429,{error:'Prea multe cereri. Încearcă mai târziu.'});
      calls.push(Date.now()); active++;
      try {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method:'POST', headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
          body:JSON.stringify({model,instructions,input:messages,max_output_tokens:600,store:false}),
          signal:AbortSignal.timeout(40000)
        });
        if (!response.ok) return json(res,502,{error:'Serviciul AI este indisponibil.'});
        const data = await response.json();
        const reply = (data.output || []).flatMap(item => item.content || []).filter(part => part.type === 'output_text').map(part => part.text).join('\n');
        if (!reply.trim()) return json(res,502,{error:'Răspuns gol.'});
        return json(res,200,{reply});
      } catch { return json(res,502,{error:'Conexiunea AI a eșuat.'}); }
      finally { active--; }
    }
    const file = staticFiles.get(url.pathname);
    if (req.method !== 'GET' || !file) return json(res,404,{error:'Pagina nu există.'});
    const bytes = await readFile(root + file[0]);
    res.writeHead(200,{'Content-Type':file[1],'X-Content-Type-Options':'nosniff'});
    res.end(bytes);
  } catch { if (!res.headersSent) json(res,500,{error:'Eroare de server.'}); else res.end(); }
});
server.listen(port, '127.0.0.1', () => console.log(`MentiSec: http://localhost:${port} — ${key ? 'AI configurat' : 'mod demonstrativ'}`));
