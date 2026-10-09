/* ============================================================
   Birthday Cards — local backend (persistence + realtime)
   Zero npm dependencies. Serves the whole static site AND a
   small JSON API + SSE channel so visitor-pinned cards survive
   reloads and show up live for everyone hitting this server.

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
const PORT = process.env.PORT || 8080;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

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
    '.glb': 'model/gltf-binary',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.miora': 'application/octet-stream',
    '.ardot': 'application/octet-stream'
};

const server = http.createServer(function (req, res) {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;

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

    /* ---------------- Static files ---------------- */
    let rel = pathname === '/' ? 'index.html' : pathname;
    let filePath = path.normalize(path.join(ROOT, rel));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(filePath, function (err, data) {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, function () {
    console.log('Birthday Cards server running at http://localhost:' + PORT);
    console.log('Open  http://localhost:' + PORT + '/cards.html');
});
