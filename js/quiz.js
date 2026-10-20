/* ============================================
   Quiz — a TY-OS desktop app
   "How well do you know him?" — 11 questions
   (10 scored + 1 free-text opener), scoring,
   streak bonus, tiers and a leaderboard.
   --------------------------------------------
   The app registers itself onto the letter-room
   desktop via window.LetterDesk.registerApp()
   (see js/letter.js — the window shell, dragging,
   zoom and z-order are already handled there).

   Everything editable lives in the CONFIG block
   below: QUESTIONS / TIERS / APP.
   Scores are shared through /api/quiz when the
   local server (server.js) is running; without a
   backend everything falls back to localStorage.
   ============================================ */

(function () {
    'use strict';

    /* ============================================================
       CONFIG — edit me
       ------------------------------------------------------------
       d: difficulty · 1 = easy (10 pts) · 2 = medium (20) · 3 = hard (30)
       a: index of the correct option (0-based)
       fact: the one-liner revealed after answering
       ============================================================ */

    var QUESTIONS = [
        { d: 2, a: 2,
          q: '\u8EAB\u9AD8\u591A\u5C11\uFF1F',
          opts: ['180', '183', '185', '187'],
          fact: '185\u3002\u5408\u7167\u7684\u65F6\u5019\uFF0C\u4ED6\u603B\u662F\u5F97\u591A\u5F2F\u4E00\u70B9\u3002' },
        { d: 3, a: 3,
          q: '\u8001\u5BB6\u5728\u54EA\u91CC\uFF1F',
          opts: ['\u5E7F\u4E1C', '\u6CB3\u5317', '\u4E91\u5357', '\u65B0\u7586'],
          fact: '\u65B0\u7586\u3002\u8FDC\u5230\u6BCF\u6B21\u653E\u5047\u90FD\u8981\u7B97\u7740\u65E5\u5B50\u62A2\u7968\u3002' },
        { d: 3, a: 1,
          q: '\u54EA\u4E2A\u7CFB\uFF1F',
          opts: ['\u8BA1\u7B97\u673A\u7CFB', '\u7535\u5B50\u7CFB', '\u529B\u822A\u7CFB', '\u5FAE\u7535\u5B50\u7CFB'],
          fact: '\u7535\u5B50\u7CFB\u3002\u710A\u8FC7\u677F\u5B50\u7684\u4EBA\uFF0C\u624B\u662F\u7A33\u7684\u3002' },
        { d: 3, a: 3,
          q: '\u4E00\u5B9A\u4E0D\u4F1A\u5403\u7684\u4E1C\u897F\u662F\uFF1F',
          opts: ['\u69B4\u83B2', '\u80E1\u841D\u535C', '\u6298\u8033\u6839', '\u8611\u83C7'],
          fact: '\u8611\u83C7\u3002\u8FD9\u4E2A\u662F\u4E00\u53E3\u90FD\u4E0D\u78B0\u7684\u3002' },
        { d: 1, a: 1,
          q: '\u6E38\u620F\u65F6\u957F\u6700\u957F\u7684\u6E38\u620F\u662F\uFF1F',
          opts: ['CS2', 'APEX', '\u74E6', '\u6CF0\u62C9\u745E\u4E9A'],
          fact: 'APEX\u3002\u65F6\u957F\u6700\u957F\u7684\u90A3\u4E2A\uFF0C\u4E00\u76F4\u662F\u5B83\u3002' },
        { d: 2, a: 0,
          q: '\u6700\u7231\u5403\u7684\u5E97\u662F\uFF1F',
          opts: ['\u7CBF\u6761', '\u9EA6\u5F53\u52B3', '\u514B\u8317', '\u70E4\u8089'],
          fact: '\u7CBF\u6761\u3002\u4E00\u7897\u4E0B\u53BB\uFF0C\u522B\u7684\u5E97\u90FD\u5F97\u5F80\u540E\u6392\u3002' },
        { d: 3, a: 1,
          q: '\u4EE5\u4E0B\u4E0D\u5C5E\u4E8E\u4ED6\u7684\u53E3\u5934\u7985\u7684\u662F\uFF1F',
          opts: ['aa\u7684b', '\u4F55\u610F\u5473', 'a\u65AF\u7279bb', '\u8FD8\u771F\u662F'],
          fact: '\u300C\u4F55\u610F\u5473\u300D\u4E0D\u662F\u4ED6\u8BF4\u7684\u2014\u2014\u8FD9\u9898\u627E\u7684\u662F\u90A3\u4E2A\u4E0D\u4E00\u6837\u7684\u3002' },
        { d: 3, a: 0,
          q: '\u300C\u5F2F\u7537\u300D\u8FD9\u4E2A\u5916\u53F7\u662F\u4EC0\u4E48\u65F6\u5019\u8D77\u7684\uFF1F',
          opts: ['\u521D\u4E00', '\u521D\u4E09', '\u9AD8\u4E00', '\u9AD8\u4E09'],
          fact: '\u521D\u4E00\u3002\u90A3\u4E2A\u5E74\u7EAA\u8D77\u7684\u5916\u53F7\uFF0C\u4E00\u822C\u90FD\u8DDF\u4E00\u8F88\u5B50\u3002' },
        { d: 2, a: 2,
          q: '\u4ED6\u7684\u8868\u60C5\u5305\u98CE\u683C\u662F\u54EA\u4E00\u4E2A\uFF1F',
          opts: [{ img: 'assets/quiz/meme-a.png', t: '\u98CE\u683C A' }, { img: 'assets/quiz/meme-b.png', t: '\u98CE\u683C B' }, { img: 'assets/quiz/meme-c.png', t: '\u98CE\u683C C' }, { img: 'assets/quiz/meme-d.png', t: '\u98CE\u683C D' }],
          fact: '\u4E00\u773C\u5C31\u80FD\u8BA4\u51FA\u6765\u2014\u2014\u5C31\u662F\u8FD9\u4E2A\u5473\u3002' },
        { d: 1, a: 1,
          q: 'MBTI \u662F\uFF1F',
          opts: ['INTP', 'INFP', 'ENTP', 'ISFP'],
          fact: 'INFP\u3002\u5B89\u9759\uFF0C\u4F46\u5FC3\u91CC\u620F\u5F88\u591A\u3002' },
        { d: 1, a: -1, fun: true,
          q: '\u6700\u540E\uFF1A\u4F60\u559C\u6B22\u600E\u4E48\u53EB\u4ED6\uFF1F\uFF08\u8FD9\u9898\u4E0D\u7B97\u5206\uFF09',
          opts: ['\u5F2F\u7537', '\u6D77\u7F69', 'Felix', '\u7897\u6A71', { fill: true, t: '\u81EA\u5DF1\u5199\u4E00\u4E2A' }],
          fact: '\u8BB0\u4E0B\u4E86\u3002' }
    ];

    /* tiers by accuracy (base points earned / base points available) */
    var TIERS = [
        { min: 1.00, t: '\u7075\u9B42\u4F34\u4FA3', line: '\u4F60\u4E0D\u662F\u61C2\u4ED6\uFF0C\u4F60\u5C31\u662F\u4ED6\u3002\u6709\u70B9\u53EF\u6015\u3002' },
        { min: 0.85, t: '\u8001\u53CB', line: '\u5173\u6CE8\u4E86\u5F88\u591A\u5E74\u3002\u4F69\u670D\u3002' },
        { min: 0.65, t: '\u597D\u670B\u53CB', line: '\u7A33\u3002\u6709\u51E0\u5904\u7A7A\u767D\uFF0C\u91CD\u8981\u7684\u90FD\u586B\u4E0A\u4E86\u3002' },
        { min: 0.45, t: '\u70B9\u5934\u4E4B\u4EA4', line: '\u4F60\u53EA\u77E5\u9053\u6807\u9898\uFF0C\u4E0D\u77E5\u9053\u811A\u6CE8\u3002' },
        { min: 0.25, t: '\u964C\u751F\u4EBA', line: '\u6211\u4EEC\u89C1\u8FC7\u3002\u4E24\u6B21\u3002\u4F60\u4E24\u6B21\u90FD\u5FD8\u4E86\u3002' },
        { min: 0.00, t: '\u8C01\u6D3E\u4F60\u6765\u7684', line: '\u8BF4\u771F\u7684\uFF0C\u6562\u6765\u8003\u8BD5\uFF0C\u5F88\u4F69\u670D\u3002' }
    ];

    var APP = {
        id: 'quiz',
        label: '\u95EE\u5377',
        title: '\u95EE\u5377 \u00B7 \u4F60\u6709\u591A\u61C2\u4ED6\uFF1F',
        w: 620,
        h: 468
    };

    var ICON =
        '<svg viewBox="0 0 48 44">' +
        '<rect x="9" y="7" width="30" height="32" rx="2" fill="#fdfaf0" stroke="#26292e" stroke-width="2.5"/>' +
        '<rect x="18" y="3.5" width="12" height="7" rx="2" fill="#4fa89b" stroke="#26292e" stroke-width="2.5"/>' +
        '<path d="M18.5 17.5c0-3.2 2.9-4.8 5.5-4.8s5.5 1.6 5.5 4.8c0 3.2-5.5 4.3-5.5 7.8" fill="none" stroke="#26292e" stroke-width="2.6" stroke-linecap="round"/>' +
        '<circle cx="24" cy="31" r="1.9" fill="#26292e"/>' +
        '<path d="M15 37h18" stroke="#e8615c" stroke-width="2.4" stroke-linecap="round"/>' +
        '</svg>';

    var STORE_KEY = 'tyquiz.v1';
    /* 超时：跨域一次请求要走 DNS + TCP + TLS + OPTIONS 预检 + 实际请求，
       1.8s 在手机网络下必超时（表现为「只存在本机」）。读快写慢，POST 再重试一次。 */
    var NET = { timeout: 5000, postTimeout: 12000, retry: 1 };

    /* API 归属解析：
       - GitHub Pages（https 且不在服务器域名下）→ 'https://lzteddy.cn'（跨域，服务端已开 CORS）
       - 服务器域名 / 本地开发 → ''（同源相对路径）
       - ?api=http://host:port 可强制覆盖（本地联调跨域场景用） */
    function apiBase() {
        try {
            var q = new URLSearchParams(location.search).get('api');
            if (q) return q.replace(/\/+$/, '');
            var h = location.hostname;
            if (location.protocol === 'https:' &&
                h !== 'lzteddy.cn' && h !== 'www.lzteddy.cn' &&
                h !== 'localhost' && h !== '127.0.0.1') {
                return 'https://lzteddy.cn';
            }
        } catch (_) { /* file:// 等异常场景走同源 */ }
        return '';
    }
    function apiUrl(p) { return apiBase() + p; }
    var DIFF_LABEL = { 1: '\u7B80\u5355', 2: '\u4E2D\u7B49', 3: '\u56F0\u96BE' };

    /* ============================================================
       state
       ============================================================ */

    var S = {
        phase: 'start',      // start · play · result · board
        idx: 0,
        picks: [],           // option index per question
        streak: 0,
        best: 0,
        score: 0,
        base: 0,
        name: '',
        nick: '',        // 最后一题填的称呼（不计分）
        t0: 0,
        ms: 0,
        savedId: null,
        entries: null,       // leaderboard entries (server or local)
        boardFrom: 'local'
    };

    var bodyEl = null;
    var myWin = null;
    var advanceTimer = null;
    var locked = false;     // true while showing the answer reveal

    function baseOf(d) { return d === 3 ? 30 : d === 2 ? 20 : 10; }

    /* fun questions (a = -1) are not scored and never count toward accuracy */
    function scoredQs() {
        return QUESTIONS.filter(function (q) { return !q.fun; });
    }
    function maxBase() {
        return scoredQs().reduce(function (sum, q) { return sum + baseOf(q.d); }, 0);
    }
    function streakBonus(n) { return n >= 5 ? 10 : n >= 3 ? 5 : 0; }
    function accuracy() { return maxBase() ? S.base / maxBase() : 0; }
    function tierOf(acc) {
        for (var i = 0; i < TIERS.length; i++) {
            if (acc >= TIERS[i].min) return TIERS[i];
        }
        return TIERS[TIERS.length - 1];
    }
    function correctCount() {
        var n = 0;
        for (var i = 0; i < QUESTIONS.length; i++) {
            if (QUESTIONS[i].fun) continue;
            if (S.picks[i] === QUESTIONS[i].a) n++;
        }
        return n;
    }

    /* ---------- option shapes ----------
       an option is either a plain string, or
       { t: 'caption', img: 'path' }   — picture option
       { t: 'caption', fill: true }    — free-text option (no scoring) */
    function optObj(o) { return (o && typeof o === 'object') ? o : { t: o }; }
    function optText(o) { var x = optObj(o); return x.t == null ? '' : String(x.t); }
    function optArt(o, small) {
        var x = optObj(o);
        if (!x.img) return '';
        return '<span class="qz-opt-img' + (small ? ' is-sm' : '') + '">' +
            '<img src="' + esc(x.img) + '" alt="' + esc(x.t || '') + '" loading="lazy"></span>';
    }
    function hasPics(q) {
        return q.opts.some(function (o) { return !!optObj(o).img; });
    }

    /* ============================================================
       tiny helpers
       ============================================================ */

    function $(id) { return document.getElementById(id); }
    function make(tag, cls, html) {
        var el = document.createElement(tag);
        if (cls) el.className = cls;
        if (html != null) el.innerHTML = html;
        return el;
    }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function fmtTime(ms) {
        var s = Math.round(ms / 1000);
        var m = Math.floor(s / 60);
        var r = s % 60;
        return m + ':' + (r < 10 ? '0' : '') + r;
    }
    function pct(x) { return Math.round(x * 100) + '%'; }

    /* ============================================================
       storage — server first, localStorage fallback
       ============================================================ */

    function localEntries() {
        try {
            var raw = localStorage.getItem(STORE_KEY);
            var arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) { return []; }
    }
    function localSave(entry) {
        var arr = localEntries();
        arr.push(entry);
        try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (e) { /* full? ignore */ }
    }

    function api(method, payload, done) {
        if (!window.fetch) { done(null); return; }
        var isPost = method === 'POST';
        var ms = isPost ? NET.postTimeout : NET.timeout;
        var attempt = 0;

        (function go() {
            attempt++;
            var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
            if (payload) opts.body = JSON.stringify(payload);
            var ctrl = window.AbortController ? new AbortController() : null;
            if (ctrl) opts.signal = ctrl.signal;
            var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
            /* canRetry: only the write needs a second chance, and only once */
            var canRetry = isPost && attempt <= NET.retry;

            fetch(apiUrl('/api/quiz'), opts)
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (j) {
                    clearTimeout(timer);
                    if (j || !canRetry) { done(j); return; }
                    go();
                })
                .catch(function () {
                    clearTimeout(timer);
                    if (!canRetry) { done(null); return; }
                    go();
                });
        })();
    }

    /* best entry per name, sorted for the board */
    function boardRows(entries) {
        var best = {};
        entries.forEach(function (e) {
            var k = (e.name || 'someone').toLowerCase();
            if (!best[k] || e.score > best[k].score ||
                (e.score === best[k].score && (e.ms || 0) < (best[k].ms || 0))) {
                best[k] = e;
            }
        });
        return Object.keys(best).map(function (k) { return best[k]; })
            .sort(function (a, b) {
                return (b.score - a.score) || ((a.ms || 0) - (b.ms || 0));
            });
    }

    /* per-question pick distribution across all entries */
    function crowd() {
        var entries = S.entries || [];
        var out = [];
        for (var q = 0; q < QUESTIONS.length; q++) {
            var n = QUESTIONS[q].opts.length;
            var counts = [];
            for (var c = 0; c < n; c++) counts.push(0);
            var total = 0;
            entries.forEach(function (e) {
                var p = e.picks && e.picks[q];
                if (typeof p === 'number' && p >= 0 && p < n) { counts[p]++; total++; }
            });
            out.push({ counts: counts, total: total });
        }
        return out;
    }

    function loadEntries(done) {
        api('GET', null, function (j) {
            if (j && Array.isArray(j)) {
                S.entries = j;
                S.boardFrom = 'server';
            } else {
                S.entries = localEntries();
                S.boardFrom = 'local';
            }
            if (done) done();
        });
    }

    function saveEntry(done) {
        // sid 与本地 id 同源：超时重试时复用同一份 payload，服务端据此去重。
        var eid = 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        var entry = {
            id: eid,
            sid: eid,
            name: (S.name || '\u795E\u79D8\u8DEF\u4EBA').slice(0, 40),
            score: S.score,
            acc: Math.round(accuracy() * 1000) / 1000,
            tier: tierOf(accuracy()).t,
            best: S.best,
            ms: S.ms,
            picks: S.picks.slice(),
            nick: S.nick || '',   // 最后一题（不计分）填空的称呼
            ts: Date.now()
        };
        S.savedId = entry.id;
        localSave(entry);
        api('POST', entry, function (created) {
            if (done) done(created ? 'server' : 'local');
        });
    }

    /* ============================================================
       rendering
       ============================================================ */

    function render(body, win) {
        bodyEl = body;
        myWin = win;
        body.innerHTML = '';
        body.appendChild(make('div', 'qz'));
        var root = body.firstChild;

        if (S.phase === 'play') paintQuestion(root);
        else if (S.phase === 'result') paintResult(root);
        else if (S.phase === 'board') paintBoard(root);
        else paintStart(root);

        /* the dock always paints above windows — keep the actions reachable */
        keepAboveDock();
    }

    /* nudge the window up if its bottom would sit under the dock strip */
    function keepAboveDock() {
        if (!myWin || !myWin.isConnected) return;
        var dock = document.querySelector('.ui-dock');
        var scrUi = myWin.closest('.scr-ui');
        if (!dock || !scrUi) return;
        var w = myWin.getBoundingClientRect();
        var d = dock.getBoundingClientRect();
        if (w.bottom <= d.top + 1) return;
        var scale = parseFloat(getComputedStyle(scrUi).getPropertyValue('--ui-scale')) || 1;
        var shift = (w.bottom - d.top) / scale;
        var top = Math.max(0, (parseFloat(myWin.style.top) || 0) - shift);
        myWin.style.top = top + 'px';
    }

    function paint() {
        if (!bodyEl || !bodyEl.isConnected || !myWin) return;
        render(bodyEl, myWin);
    }

    /* ---------- start ---------- */

    function paintStart(root) {
        root.appendChild(make('div', 'qz-kicker', 'TY-OS &rsaquo; \u6E38\u5BA2\u7968'));

        var h = make('h3', 'qz-title', '\u4F60\u6709\u591A\u61C2 SJY\uFF1F');
        root.appendChild(h);
        root.appendChild(make('p', 'qz-sub',
            '\u5341\u9053\u5173\u4E8E\u4ED6\u7684\u9898\uFF0C\u5916\u52A0\u4E00\u9053\u4E0D\u7B97\u5206\u7684\u3002' +
            '\u4E0D\u8BB8\u63D0\u793A\uFF0C\u4E0D\u8BB8\u641C\u7D22\uFF0C\u4E0D\u8BB8\u7FFB\u804A\u5929\u8BB0\u5F55\u3002' +
            '\u7B54\u9519\u4E00\u534A\u624D\u6F02\u4EAE\u2014\u2014\u987A\u4FBF\u8FD8\u80FD\u770B\u5230' +
            '\u522B\u4EBA\u90FD\u9009\u4E86\u4EC0\u4E48\u3002'));

        var form = make('form', 'qz-form');
        var input = make('input', 'qz-name');
        input.type = 'text';
        input.maxLength = 24;
        input.autocomplete = 'off';
        input.placeholder = '\u4F60\u7684\u540D\u5B57 \u00B7 \u4E0A\u699C\u7528';
        input.setAttribute('aria-label', '\u4F60\u7684\u540D\u5B57');
        input.value = S.name || '';
        form.appendChild(input);
        var go = make('button', 'ui-btn is-primary qz-go', '\u5F00\u59CB &rsaquo;');
        go.type = 'submit';
        form.appendChild(go);
        root.appendChild(form);

        var row = make('div', 'qz-actions');
        var boardBtn = make('button', 'ui-btn', '\u6392\u884C\u699C');
        boardBtn.type = 'button';
        boardBtn.addEventListener('click', function () {
            S.name = input.value.trim();
            S.phase = 'board';
            loadEntries(paint);
        });
        row.appendChild(boardBtn);
        root.appendChild(row);

        root.appendChild(make('p', 'qz-fine',
            '\u5927\u7EA6\u4E09\u5206\u949F &middot; \u6210\u7EE9\u9ED8\u8BA4\u53EA\u5B58\u5728\u672C\u673A\uFF0C\u9664\u975E\u751F\u65E5\u670D\u52A1\u5668\u6B63\u5728\u8FD0\u884C\u3002'));

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            startRun(input.value.trim());
        });
        setTimeout(function () { input.focus(); }, 80);
    }

    function startRun(name) {
        S.name = name || '\u795E\u79D8\u8DEF\u4EBA';
        S.phase = 'play';
        S.idx = 0;
        S.picks = [];
        S.streak = 0;
        S.best = 0;
        S.score = 0;
        S.base = 0;
        S.savedId = null;
        S.nick = '';
        S.t0 = Date.now();
        paint();
    }

    /* ---------- question ---------- */

    function paintQuestion(root) {
        var q = QUESTIONS[S.idx];

        /* header: counter · difficulty · streak · score */
        var hdr = make('div', 'qz-hdr');
        hdr.appendChild(make('span', 'qz-count',
            '\u7B2C ' + (S.idx + 1) + ' / ' + QUESTIONS.length + ' \u9898'));
        hdr.appendChild(make('span', 'qz-diff is-d' + q.d, DIFF_LABEL[q.d]));
        if (S.streak >= 2) {
            hdr.appendChild(make('span', 'qz-streak', '\u2713 \u8FDE\u5BF9 ' + S.streak));
        }
        hdr.appendChild(make('span', 'qz-score', S.score + ' \u5206'));
        root.appendChild(hdr);

        var bar = make('div', 'qz-bar');
        var fill = make('span', 'qz-bar-fill');
        fill.style.width = (S.idx / QUESTIONS.length * 100) + '%';
        bar.appendChild(fill);
        root.appendChild(bar);

        root.appendChild(make('h3', 'qz-q', esc(q.q)));

        var opts = make('div', 'qz-opts' + (hasPics(q) ? ' is-pics' : ''));
        q.opts.forEach(function (o, i) {
            var x = optObj(o);
            var b = make('button', 'qz-opt' + (x.fill ? ' is-fill' : ''));
            b.type = 'button';
            b.dataset.i = i;
            b.innerHTML = '<span class="qz-key">' + (i + 1) + '</span>' +
                optArt(o) +
                '<span class="qz-opt-t">' +
                    esc(x.fill ? '\u81EA\u5DF1\u5199\u4E00\u4E2A\u2026' : optText(o)) +
                '</span>';
            b.addEventListener('click', function () {
                if (x.fill) openFill(i, b);
                else pick(i);
            });
            opts.appendChild(b);
        });
        root.appendChild(opts);

        var fillBox = make('div', 'qz-fill');
        root.appendChild(fillBox);

        root.appendChild(make('div', 'qz-reveal'));
        root.appendChild(make('p', 'qz-foot',
            '\u6309 1\u2013' + q.opts.length + ' \u9009\u62E9 \u00B7 \u56DE\u8F66\u786E\u8BA4'));

        locked = false;
    }

    /* free-text option: type a nickname, then commit it as the pick */
    function openFill(i, btn) {
        if (locked || S.phase !== 'play') return;
        var box = bodyEl.querySelector('.qz-fill');
        if (!box) return;

        Array.prototype.forEach.call(bodyEl.querySelectorAll('.qz-opt'), function (b) {
            b.classList.remove('is-sel');
        });
        btn.classList.add('is-sel');

        box.innerHTML = '';
        var input = make('input', 'qz-name qz-fill-input');
        input.type = 'text';
        input.maxLength = 24;
        input.autocomplete = 'off';
        input.placeholder = '\u4F60\u60F3\u53EB\u4ED6\u4EC0\u4E48\uFF1F';
        input.setAttribute('aria-label', '\u4F60\u60F3\u53EB\u4ED6\u4EC0\u4E48');
        var ok = make('button', 'ui-btn is-primary', '\u8BB0\u4E0B\u6765');
        ok.type = 'button';
        box.appendChild(input);
        box.appendChild(ok);
        box.classList.add('is-on');

        function commit() {
            var v = input.value.trim();
            if (!v) { input.focus(); return; }
            pick(i, v);
        }
        ok.addEventListener('click', commit);
        input.addEventListener('keydown', function (e) {
            e.stopPropagation();
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
        });
        setTimeout(function () { input.focus(); }, 80);
    }

    function pick(i, fillText) {
        if (locked || S.phase !== 'play') return;
        var q = QUESTIONS[S.idx];
        if (optObj(q.opts[i]).fill && !fillText) return;
        locked = true;

        if (fillText) S.nick = fillText.slice(0, 24);
        S.picks[S.idx] = i;

        var ok = !q.fun && i === q.a;
        if (q.fun) {
            /* no scoring, no streak break — this one is just for him to read */
        } else if (ok) {
            S.streak += 1;
            if (S.streak > S.best) S.best = S.streak;
            var bonus = streakBonus(S.streak);
            S.score += baseOf(q.d) + bonus;
            S.base += baseOf(q.d);
        } else {
            S.streak = 0;
        }

        /* mark the options */
        var nodes = bodyEl.querySelectorAll('.qz-opt');
        Array.prototype.forEach.call(nodes, function (b) {
            var bi = parseInt(b.dataset.i, 10);
            if (q.fun) {
                if (bi === i) b.classList.add('is-ok');
                else b.classList.add('is-dim');
            } else if (bi === q.a) b.classList.add('is-ok');
            else if (bi === i) b.classList.add('is-bad');
            else b.classList.add('is-dim');
        });

        /* clear the free-text box once an answer is locked in */
        var fillBox = bodyEl.querySelector('.qz-fill');
        if (fillBox) { fillBox.classList.remove('is-on'); fillBox.innerHTML = ''; }

        /* reveal line */
        var reveal = bodyEl.querySelector('.qz-reveal');
        if (q.fun) {
            var said = fillText ? ('\u4F60\u53EB\u4ED6\u300C' + fillText + '\u300D') :
                ('\u4F60\u9009\u4E86 ' + optText(q.opts[i]));
            reveal.innerHTML = '<div class="qz-reveal-line">\u2665 ' + esc(said) + '</div>' +
                '<div class="qz-fact">' + esc(q.fact) + '</div>';
        } else {
            var gain = ok ? baseOf(q.d) + (S.streak >= 3 ? streakBonus(S.streak) : 0) : 0;
            var line = (ok ? '\u2713 +' + gain : '\u2717') +
                ' &nbsp;<span class="qz-reveal-a">' + optArt(q.opts[q.a], true) +
                esc(optText(q.opts[q.a])) + '</span>';
            if (ok && S.streak >= 3) {
                line += ' <span class="qz-reveal-b">\u8FDE\u5BF9 +' + streakBonus(S.streak) + '</span>';
            }
            reveal.innerHTML = '<div class="qz-reveal-line">' + line + '</div>' +
                '<div class="qz-fact">' + esc(q.fact) + '</div>';
        }
        reveal.classList.add('is-on');

        /* score chip refresh */
        var chip = bodyEl.querySelector('.qz-score');
        if (chip) chip.textContent = S.score + ' \u5206';

        advanceTimer = setTimeout(advance, 1500);
    }

    function advance() {
        clearTimeout(advanceTimer);
        if (S.phase !== 'play') return;
        if (S.idx < QUESTIONS.length - 1) {
            S.idx += 1;
            paint();
        } else {
            finishRun();
        }
    }

    /* ---------- result ---------- */

    function finishRun() {
        S.phase = 'result';
        S.ms = Date.now() - S.t0;
        saveEntry(function (where) {
            S.savedWhere = where || 'local';
            /* pull the fresh entry list so crowd stats show up immediately */
            loadEntries(paint);
        });
        paint();
    }

    function paintResult(root) {
        var acc = accuracy();
        var tier = tierOf(acc);
        var C = 2 * Math.PI * 52;

        root.appendChild(make('div', 'qz-kicker', 'TY-OS &rsaquo; \u7ED3\u7B97'));

        var top = make('div', 'qz-res-top');
        var ring = make('div', 'qz-ring');
        ring.innerHTML =
            '<svg viewBox="0 0 120 120" aria-hidden="true">' +
            '<circle cx="60" cy="60" r="52" class="qz-ring-bg"/>' +
            '<circle cx="60" cy="60" r="52" class="qz-ring-fg" style="stroke-dasharray:' +
                (acc * C).toFixed(1) + ' ' + C.toFixed(1) + '"/>' +
            '<text x="60" y="66" class="qz-ring-num">' + pct(acc) + '</text>' +
            '</svg>';
        top.appendChild(ring);

        var meta = make('div', 'qz-res-meta');
        meta.appendChild(make('h3', 'qz-title is-sm', '\u4F60\u61C2\u4ED6'));
        meta.appendChild(make('div', 'qz-tier is-t' + (5 - Math.max(0, TIERS.indexOf(tier))), tier.t));
        meta.appendChild(make('p', 'qz-line', esc(tier.line)));
        top.appendChild(meta);
        root.appendChild(top);

        var stats = make('div', 'qz-stats');
        stats.appendChild(statCell(String(S.score), '\u603B\u5206'));
        stats.appendChild(statCell(correctCount() + ' / ' + scoredQs().length, '\u7B54\u5BF9'));
        stats.appendChild(statCell(String(S.best), '\u6700\u9AD8\u8FDE\u5BF9'));
        stats.appendChild(statCell(fmtTime(S.ms), '\u7528\u65F6'));
        root.appendChild(stats);
        /* review + crowd */
        var c = crowd();
        var review = make('div', 'qz-review');
        for (var i = 0; i < QUESTIONS.length; i++) {
            var q = QUESTIONS[i];
            var pickIdx = S.picks[i];
            var ok = pickIdx === q.a;
            var share = c[i].total && pickIdx != null
                ? Math.round((c[i].counts[pickIdx] || 0) / c[i].total * 100) : null;
            var row = make('div', 'qz-row' +
                (q.fun ? ' is-fun' : (ok ? ' is-ok' : ' is-bad')));

            var main, note;
            if (q.fun) {
                var said = (pickIdx === q.opts.length - 1 && S.nick)
                    ? S.nick
                    : (pickIdx == null ? '\u2014' : optText(q.opts[pickIdx]));
                main = '\u4F60\u53EB\u4ED6\u300C' + said + '\u300D';
                note = '';
            } else {
                main = optArt(q.opts[q.a], true) + esc(optText(q.opts[q.a]));
                note = ok ? '' :
                    '\u4F60\u9009\u4E86 ' + esc(optText(q.opts[pickIdx == null ? q.a : pickIdx]));
            }

            row.innerHTML =
                '<span class="qz-row-i">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' +
                '<span class="qz-row-mark">' + (q.fun ? '\u2665' : (ok ? '\u2713' : '\u2717')) + '</span>' +
                '<span class="qz-row-a">' + main + '</span>' +
                '<span class="qz-row-y">' + esc(note) + '</span>' +
                (share != null ? '<span class="qz-row-c">' + share + '% \u540C\u9009' : '');
            review.appendChild(row);
        }
        root.appendChild(review);

        var saved = make('p', 'qz-fine',
            S.savedWhere === 'server'
                ? '\u5DF2\u7528\u201C' + esc(S.name) + '\u201D\u5B58\u5165\u5171\u4EAB\u6392\u884C\u699C\u3002'
                : '\u53EA\u5B58\u5728\u672C\u673A\u2014\u2014\u542F\u52A8\u751F\u65E5\u670D\u52A1\u5668\u5373\u53EF\u5171\u4EAB\u6210\u7EE9\u3002');
        root.appendChild(saved);

        var actions = make('div', 'qz-actions');
        var again = make('button', 'ui-btn is-primary', '\u518D\u6765\u4E00\u5C40');
        again.type = 'button';
        again.addEventListener('click', function () { startRun(S.name); });
        actions.appendChild(again);

        var boardBtn = make('button', 'ui-btn', '\u6392\u884C\u699C');
        boardBtn.type = 'button';
        boardBtn.addEventListener('click', function () {
            S.phase = 'board';
            loadEntries(paint);
        });
        actions.appendChild(boardBtn);

        var copy = make('button', 'ui-btn', '\u590D\u5236\u6210\u7EE9');
        copy.type = 'button';
        copy.addEventListener('click', function () { copyResult(tier.t); });
        actions.appendChild(copy);
        root.appendChild(actions);
    }

    function statCell(v, k) {
        return make('div', 'qz-stat',
            '<span class="qz-stat-v">' + esc(v) + '</span>' +
            '<span class="qz-stat-k">' + esc(k) + '</span>');
    }

    function copyResult(tierName) {
        var text = '\u6211\u5728\u201C\u4F60\u6709\u591A\u61C2\u4ED6\u201D\u95EE\u5377\u91CC\u62FF\u4E86 ' + S.score + ' \u5206\u2014\u2014' +
            tierName + '\uFF0C\u6B63\u786E\u7387 ' + pct(accuracy()) + '\u3002\u8F6E\u5230\u4F60\u4E86\u3002';
        function done() {
            if (window.LetterDesk && window.LetterDesk.toast) {
                window.LetterDesk.toast('\u6210\u7EE9\u5DF2\u590D\u5236\u3002\u53BB\u8F7B\u8511\u522B\u4EBA\u5427\u3002');
            }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        } else {
            fallbackCopy(text); done();
        }
    }
    function fallbackCopy(text) {
        var ta = make('textarea', 'qz-clip');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
    }

    /* ---------- leaderboard ---------- */

    function paintBoard(root) {
        root.appendChild(make('div', 'qz-kicker', 'TY-OS &rsaquo; \u6392\u884C\u699C'));
        root.appendChild(make('h3', 'qz-title is-sm', '\u8C01\u6700\u61C2 SJY'));

        var rows = boardRows(S.entries || []);
        var list = make('div', 'qz-board');

        if (!rows.length) {
            list.appendChild(make('p', 'qz-fine', '\u8FD8\u6CA1\u6709\u6210\u7EE9\u3002\u603B\u5F97\u6709\u4E2A\u4EBA\u5148\u4E0A\u3002'));
        } else {
            rows.slice(0, 20).forEach(function (e, i) {
                var you = e.id === S.savedId;
                var row = make('div', 'qz-brow' + (you ? ' is-you' : ''));
                row.innerHTML =
                    '<span class="qz-brank">' + (i + 1) + '</span>' +
                    '<span class="qz-bname">' + esc(e.name) + (you ? ' \u2190 \u4F60' : '') + '</span>' +
                    '<span class="qz-btier">' + esc(e.tier || '') + '</span>' +
                    '<span class="qz-bacc">' + (typeof e.acc === 'number' ? pct(e.acc) : '') + '</span>' +
                    '<span class="qz-bscore">' + (e.score || 0) + '</span>';
                list.appendChild(row);
            });
        }
        root.appendChild(list);

        root.appendChild(make('p', 'qz-fine',
            S.boardFrom === 'server'
                ? rows.length + ' \u4F4D\u73A9\u5BB6 &middot; \u4E0E\u540C\u670D\u52A1\u5668\u4E0A\u7684\u6240\u6709\u4EBA\u5171\u4EAB'
                : '\u53EA\u5B58\u5728\u672C\u673A &middot; \u542F\u52A8\u751F\u65E5\u670D\u52A1\u5668\u5373\u53EF\u5171\u4EAB\u6210\u7EE9'));

        var actions = make('div', 'qz-actions');
        var back = make('button', 'ui-btn is-primary', S.phase === 'board' && S.savedId ? '\u518D\u6765\u4E00\u5C40' : '\u8FD4\u56DE');
        back.type = 'button';
        back.addEventListener('click', function () {
            if (S.savedId) startRun(S.name);
            else { S.phase = 'start'; paint(); }
        });
        actions.appendChild(back);
        root.appendChild(actions);
    }

    /* ============================================================
       keyboard — 1..4 to answer, enter to advance
       ============================================================ */

    document.addEventListener('keydown', function (e) {
        if (!myWin || !myWin.isConnected || !myWin.classList.contains('is-focus')) return;
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        if (S.phase === 'play') {
            var q = QUESTIONS[S.idx];
            var n = parseInt(e.key, 10);
            if (n >= 1 && n <= q.opts.length) {
                e.preventDefault();
                if (optObj(q.opts[n - 1]).fill) {
                    openFill(n - 1, bodyEl.querySelector('.qz-opt[data-i="' + (n - 1) + '"]'));
                } else {
                    pick(n - 1);
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (locked) advance();
            }
        }
    });

    /* ============================================================
       registration
       ============================================================ */

    function register() {
        var desk = window.LetterDesk;
        if (!desk || typeof desk.registerApp !== 'function') return false;

        var app = {
            id: APP.id,
            label: APP.label,
            title: APP.title,
            icon: ICON,
            w: APP.w,
            h: APP.h,
            render: render
        };
        desk.registerApp(app);

        /* keep the icon column tidy: Quiz sits above Trash */
        var icons = document.querySelector('.ui-icons');
        var trash = icons && icons.querySelector('[data-app="trash"]');
        var mine = icons && icons.querySelector('[data-app="' + APP.id + '"]');
        if (icons && trash && mine) icons.insertBefore(mine, trash);

        return true;
    }

    function whenReady(tries) {
        if (register()) return;
        if (tries <= 0) return;
        setTimeout(function () { whenReady(tries - 1); }, 100);
    }

    /* the letter page only */
    if (document.getElementById('letterPage')) {
        whenReady(60);
    }
})();
