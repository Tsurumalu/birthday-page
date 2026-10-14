/* ============================================================
   Birthday Cards — local backend (persistence + realtime)
   Zero npm dependencies. Serves the whole static site AND a
   small JSON API + SSE channel so visitor-pinned cards survive
   reloads and show up live for everyone hitting this server.
   Also stores the TY-OS quiz leaderboard (data/quiz.json).

   Run:  node server.js
   Then open: http://localhost:8080/cards.html
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');
const QUIZ_FILE = path.join(DATA_DIR, 'quiz.json');
const PORT = process.env.PORT || 8080;
// 站点住 GitHub Pages、API 住 api 子域 → 浏览器跨域调用需要 CORS。
// CORS_ORIGIN 可填 Pages  origin（逗号分隔多个），默认 *（接口本就公开可读）。
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const QUIZ_MAX_ENTRIES = 2000;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
if (!fs.existsSync(QUIZ_FILE)) fs.writeFileSync(QUIZ_FILE, '[]', 'utf8');

let cards = loadCards();
const sseClients = new Set();

function loadCards() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}
function saveCards() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf8');
}

/* ---------- quiz leaderboard (same pattern as cards) ---------- */

let quiz = loadQuiz();

function loadQuiz() {
    try {
        const raw = fs.readFileSync(QUIZ_FILE, 'utf8');
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}
function saveQuiz() {
    fs.writeFileSync(QUIZ_FILE, JSON.stringify(quiz, null, 2), 'utf8');
}
function clampNum(v, min, max, dflt) {
    const n = Number(v);
    if (!Number.isFinite(n)) return dflt;
    return Math.max(min, Math.min(max, n));
}
function broadcast(obj) {
    const chunk = 'data: ' + JSON.stringify(obj) + '\n\n';
    sseClients.forEach(function (res) {
        try { res.write(chunk); } catch (e) { /* drop dead client */ }
    });
}
function escapeStr(v, max) {
    return String(v == null ? '' : v).slice(0, max);
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.glb': 'model/gltf-binary',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.miora': 'application/octet-stream',
    '.ardot': 'application/octet-stream'
};

const server = http.createServer(function (req, res) {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;

    /* ---------- CORS（Pages 跨域调用 + 预检） ---------- */
    if (pathname.indexOf('/api/') === 0) {
        res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    }

    /* ---------------- API ---------------- */
    if (pathname === '/api/cards' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': MIME['.json'] });
        res.end(JSON.stringify(cards));
        return;
    }

    if (pathname === '/api/cards' && req.method === 'POST') {
        let body = '';
        req.on('data', function (c) { body += c; });
        req.on('end', function () {
            let d;
            try { d = JSON.parse(body); } catch (e) { res.writeHead(400); res.end('bad json'); return; }
            const card = {
                id: 'c' + Date.now() + Math.random().toString(36).slice(2, 7),
                avatar: escapeStr(d.avatar, 8) || '🦊',
                name: escapeStr(d.name, 40),
                message: escapeStr(d.message, 400),
                sticker: escapeStr(d.sticker, 20),
                x: Number.isFinite(d.x) ? Math.round(d.x) : null,
                y: Number.isFinite(d.y) ? Math.round(d.y) : null,
                clientId: escapeStr(d.clientId, 40),
                createdAt: Date.now()
            };
            cards.push(card);
            saveCards();
            broadcast({ type: 'insert', card: card });
            res.writeHead(201, { 'Content-Type': MIME['.json'] });
            res.end(JSON.stringify(card));
        });
        return;
    }

    if (pathname.indexOf('/api/cards/') === 0 && req.method === 'PUT') {
        const id = pathname.split('/').pop();
        let body = '';
        req.on('data', function (c) { body += c; });
        req.on('end', function () {
            let d;
            try { d = JSON.parse(body); } catch (e) { res.writeHead(400); res.end('bad json'); return; }
            const card = cards.find(function (c) { return c.id === id; });
            if (!card) { res.writeHead(404); res.end('not found'); return; }
            if (Number.isFinite(d.x)) card.x = Math.round(d.x);
            if (Number.isFinite(d.y)) card.y = Math.round(d.y);
            saveCards();
            broadcast({ type: 'update', card: card });
            res.writeHead(200, { 'Content-Type': MIME['.json'] });
            res.end(JSON.stringify(card));
        });
        return;
    }

    if (pathname === '/api/cards/stream' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.write('retry: 3000\n\n');
        sseClients.add(res);
        req.on('close', function () { sseClients.delete(res); });
        return;
    }

    /* ---------------- Quiz leaderboard ---------------- */

    if (pathname === '/api/quiz' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': MIME['.json'] });
        res.end(JSON.stringify(quiz));
        return;
    }

    if (pathname === '/api/quiz' && req.method === 'POST') {
        let body = '';
        req.on('data', function (c) { body += c; });
        req.on('end', function () {
            let d;
            try { d = JSON.parse(body); } catch (e) { res.writeHead(400); res.end('bad json'); return; }
            const picks = Array.isArray(d.picks)
                ? d.picks.slice(0, 24).map(function (p) {
                    const n = parseInt(p, 10);
                    return Number.isFinite(n) && n >= 0 && n < 8 ? n : -1;
                })
                : [];
            const entry = {
                id: 'q' + Date.now() + Math.random().toString(36).slice(2, 7),
                name: escapeStr(d.name, 40) || 'a mystery guest',
                score: clampNum(d.score, 0, 100000, 0),
                acc: clampNum(d.acc, 0, 1, 0),
                tier: escapeStr(d.tier, 24),
                best: clampNum(d.best, 0, 100, 0),
                ms: clampNum(d.ms, 0, 86400000, 0),
                picks: picks,
                createdAt: Date.now()
            };
            quiz.push(entry);
            if (quiz.length > QUIZ_MAX_ENTRIES) quiz = quiz.slice(-QUIZ_MAX_ENTRIES);
            saveQuiz();
            res.writeHead(201, { 'Content-Type': MIME['.json'] });
            res.end(JSON.stringify(entry));
        });
        return;
    }

    /* ---------------- Static files ---------------- */
    let rel = pathname === '/' ? 'index.html' : pathname;
    let filePath = path.normalize(path.join(ROOT, rel));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.stat(filePath, function (err, stat) {
        if (err || !stat.isFile()) { res.writeHead(404); res.end('not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        const range = req.headers.range;

        // 视频/音频需要 206 Partial Content，否则浏览器拖不动进度条
        if (range) {
            const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
            if (m) {
                let start = m[1] ? parseInt(m[1], 10) : 0;
                let end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
                if (isNaN(start)) start = 0;
                if (isNaN(end) || end > stat.size - 1) end = stat.size - 1;
                if (start > end) start = end;
                res.writeHead(206, {
                    'Content-Type': type,
                    'Accept-Ranges': 'bytes',
                    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                    'Content-Length': end - start + 1
                });
                fs.createReadStream(filePath, { start, end }).pipe(res);
                return;
            }
        }
        res.writeHead(200, {
            'Content-Type': type,
            'Accept-Ranges': 'bytes',
            'Content-Length': stat.size
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, function () {
    console.log('Birthday Cards server running at http://localhost:' + PORT);
    console.log('Open  http://localhost:' + PORT + '/cards.html');
});
