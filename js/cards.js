/* ============================================================
   The Cards — guestbook / scrapboard interactions
   Pick an avatar, write a note, hit "Print my card" and the
   card slides out of the tablet's paper slot (with a blinking
   status dot). From there you can drag it onto the cork board
   or tap the 📌 button to pin it. Already-pinned cards can be
   dragged around with a mouse to rearrange the board.

   Persistence + realtime: pinned cards are written to the local
   backend (server.js). On load we pull existing cards, and an
   SSE channel streams new cards so every visitor sees them live.
   If there is no backend (e.g. the page is opened as a plain
   static file), everything still works — cards just stay local.
   ============================================================ */
(function () {
    'use strict';

    var avatarSelect = document.getElementById('avatarSelect');
    var stickerSelect = document.getElementById('stickerSelect');
    var nameInput = document.getElementById('nameInput');
    var messageInput = document.getElementById('messageInput');
    var printBtn = document.getElementById('printBtn');
    var tabletDot = document.getElementById('tabletDot');
    var printerOutput = document.getElementById('printerOutput');
    var printedCard = document.getElementById('printedCard');
    var printedAvatar = document.getElementById('printedAvatar');
    var printedBody = document.getElementById('printedBody');
    var printedAuthor = document.getElementById('printedAuthor');
    var printedSticker = document.getElementById('printedSticker');
    var pinItBtn = document.getElementById('pinItBtn');
    var boardCork = document.getElementById('boardCork');

    // Tracks which server cards are already on the board (dedupe).
    var renderedCardIds = {};

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

    var state = {
        avatar: '🦊',
        sticker: '',
        stickerSvg: '',
        stickerColor: '',
        isPrinting: false,
        isPrinted: false,
        isDragging: false,
        dragEl: null,
        dragIsPrinted: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        dragOriginParent: null,
        dragOriginNextSibling: null,
        dragOriginStyle: '',
        noteCount: 0
    };

    var stickerSvgs = {
        heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
        flower: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5c1.5 2.5 4.5 2.5 6 0 .5 3 3.5 4 5.5 2.5-1 2.5.5 5 3 5.5-2.5 1.5-2.5 4.5 0 6-3 .5-4 3.5-2.5 5.5-2.5-1-5 .5-5.5 3-1.5-2.5-4.5-2.5-6 0-.5-3-3.5-4-5.5-2.5 1-2.5-.5-5-3-5.5 2.5-1.5 2.5-4.5 0-6 3-.5 4-3.5 2.5-5.5 2.5 1 5-.5 5.5-3z"/><circle cx="12" cy="12" r="3" fill="#6b4a32"/></svg>'
    };
    var stickerColors = { heart: '#ef4444', star: '#f59e0b', flower: '#f472b6' };

    /* ---------- Event bindings ---------- */
    avatarSelect.addEventListener('click', onAvatarClick);
    stickerSelect.addEventListener('click', onStickerClick);
    printBtn.addEventListener('click', onPrintClick);
    pinItBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    pinItBtn.addEventListener('click', function (e) { e.stopPropagation(); pinToBoard(); });
    printedCard.addEventListener('pointerdown', onPrintedPointerDown);

    // Existing notes on the board can be repositioned with a mouse.
    var existingNotes = boardCork.querySelectorAll('.board-note');
    for (var i = 0; i < existingNotes.length; i++) {
        setupBoardNoteDrag(existingNotes[i], false);
    }

    /* ---------- Selection handlers ---------- */
    function onAvatarClick(e) {
        var btn = e.target.closest('.avatar-btn');
        if (!btn) return;
        setSelected(avatarSelect, 'avatar-btn', btn);
        state.avatar = btn.dataset.avatar;
    }

    function onStickerClick(e) {
        var btn = e.target.closest('.sticker-btn');
        if (!btn) return;
        setSelected(stickerSelect, 'sticker-btn', btn);
        state.sticker = btn.dataset.sticker || '';
        state.stickerSvg = state.sticker ? stickerSvgs[state.sticker] : '';
        state.stickerColor = state.sticker ? stickerColors[state.sticker] : '';
    }

    function setSelected(container, cls, activeBtn) {
        var btns = container.querySelectorAll('.' + cls);
        for (var j = 0; j < btns.length; j++) {
            btns[j].classList.remove('selected');
        }
        activeBtn.classList.add('selected');
    }

    /* ---------- Print (the card slides out of the slot) ---------- */
    function onPrintClick() {
        if (state.isPrinting) return;

        var name = nameInput.value.trim();
        var message = messageInput.value.trim();
        if (!name && !message) {
            printBtn.classList.add('shake');
            setTimeout(function () { printBtn.classList.remove('shake'); }, 450);
            return;
        }

        doPrint(name, message);
    }

    function doPrint(name, message) {
        state.isPrinting = true;
        printBtn.disabled = true;

        // Blink the tablet status dot like a printer LED while "printing".
        tabletDot.classList.add('on', 'blink');

        // Build the card content.
        printedAvatar.textContent = state.avatar;
        printedBody.textContent = message;
        printedAuthor.textContent = name ? '— ' + name : '— A friend';
        printedSticker.innerHTML = state.stickerSvg
            ? '<span style="color:' + state.stickerColor + ';">' + state.stickerSvg + '</span>'
            : '';

        // After the print delay, slide the card out of the slot.
        setTimeout(function () {
            printedCard.hidden = false;
            void printedCard.offsetWidth; // force reflow so the transition runs
            printedCard.classList.add('printed');
            tabletDot.classList.remove('on', 'blink');
            state.isPrinting = false;
            state.isPrinted = true;
            printBtn.disabled = false;
            printBtn.textContent = 'Print another card';
        }, 900);
    }

    /* ---------- Pin the printed card to the board ---------- */
    function pinToBoard() {
        if (!state.isPrinted) return;
        var boardRect = boardCork.getBoundingClientRect();
        var baseX = boardRect.width / 2 - 80;
        var baseY = boardRect.height / 2 - 60;
        var offsetX = (state.noteCount % 3) * 22;
        var offsetY = Math.floor(state.noteCount / 3) * 22;
        var x = clamp(baseX + offsetX, 12, boardRect.width - 170);
        var y = clamp(baseY + offsetY, 12, boardRect.height - 130);
        commitCard(x, y);
    }

    // Build the note from the printed card, drop it on the board, sync to backend.
    function commitCard(x, y) {
        var data = {
            avatar: state.avatar,
            name: nameFromAuthor(printedAuthor.textContent),
            message: printedBody.textContent,
            stickerSvg: state.stickerSvg,
            stickerColor: state.stickerColor
        };
        var note = createBoardNote(data, x, y, null);
        boardCork.appendChild(note);
        setupBoardNoteDrag(note, false);
        state.noteCount++;
        updateWallCount();
        syncCardToServer(note, x, y, data);
        resetPrinter();
    }

    function resetPrinter() {
        printedCard.classList.remove('printed');
        printedCard.hidden = true;
        printedSticker.innerHTML = '';
        state.isPrinted = false;
        printBtn.textContent = 'Print my card';
        // Keep the name + avatar for the next card; clear message + sticker.
        messageInput.value = '';
        setSelected(stickerSelect, 'sticker-btn', stickerSelect.querySelector('[data-sticker=""]'));
        state.sticker = '';
        state.stickerSvg = '';
        state.stickerColor = '';
    }

    /* ---------- Drag the printed card (or a board card) ---------- */
    function onPrintedPointerDown(e) {
        if (state.isDragging) return;
        startDrag(printedCard, e, true);
    }

    function setupBoardNoteDrag(note, isPrinted) {
        note.addEventListener('pointerdown', function (e) {
            if (state.isDragging) return;
            startDrag(note, e, isPrinted);
        });
    }

    function startDrag(el, e, isPrinted) {
        // Drag is optimized for mouse; touch users can still read / tap.
        if (e.pointerType === 'touch') return;
        e.preventDefault();

        state.isDragging = true;
        state.dragEl = el;
        state.dragIsPrinted = !!isPrinted;

        var rect = el.getBoundingClientRect();
        state.dragOffsetX = e.clientX - rect.left;
        state.dragOffsetY = e.clientY - rect.top;
        state.dragOriginParent = el.parentNode;
        state.dragOriginNextSibling = el.nextSibling;
        state.dragOriginStyle = el.getAttribute('style') || '';

        el.style.position = 'fixed';
        el.style.left = (e.clientX - state.dragOffsetX) + 'px';
        el.style.top = (e.clientY - state.dragOffsetY) + 'px';
        el.style.width = rect.width + 'px';
        el.style.margin = '0';
        el.style.transform = 'rotate(0deg) scale(1.06)';
        el.classList.add('card-dragging');
        document.body.appendChild(el);
    }

    function onPointerMove(e) {
        if (!state.isDragging || !state.dragEl) return;
        e.preventDefault();
        state.dragEl.style.left = (e.clientX - state.dragOffsetX) + 'px';
        state.dragEl.style.top = (e.clientY - state.dragOffsetY) + 'px';
    }

    function onPointerUp(e) {
        if (!state.isDragging || !state.dragEl) return;

        var el = state.dragEl;
        var boardRect = boardCork.getBoundingClientRect();
        var overBoard = e.clientX >= boardRect.left && e.clientX <= boardRect.right &&
                        e.clientY >= boardRect.top && e.clientY <= boardRect.bottom;

        el.classList.remove('card-dragging');

        if (state.dragIsPrinted) {
            if (overBoard) {
                var nx = e.clientX - boardRect.left - state.dragOffsetX;
                var ny = e.clientY - boardRect.top - state.dragOffsetY;
                commitCard(nx, ny);
            } else {
                // Not dropped on the board — slide it back into the slot.
                el.setAttribute('style', state.dragOriginStyle);
                el.style.transform = '';
                state.dragOriginParent.insertBefore(el, state.dragOriginNextSibling);
            }
        } else {
            if (overBoard) {
                var nx2 = e.clientX - boardRect.left - state.dragOffsetX;
                var ny2 = e.clientY - boardRect.top - state.dragOffsetY;
                el.style.position = 'absolute';
                el.style.left = nx2 + 'px';
                el.style.top = ny2 + 'px';
                el.style.width = '';
                el.style.margin = '';
                el.style.transform = '';
                boardCork.appendChild(el);
                if (el.dataset.cardId) updateCardPosition(el.dataset.cardId, nx2, ny2);
            } else {
                el.setAttribute('style', state.dragOriginStyle);
                el.style.transform = '';
                state.dragOriginParent.insertBefore(el, state.dragOriginNextSibling);
            }
        }

        state.isDragging = false;
        state.dragEl = null;
        state.dragIsPrinted = false;
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    /* ---------- Build a board note ---------- */
    var NOTE_COLORS = ['note-warm', 'note-yellow', 'note-pink', 'note-blue', 'note-mint', 'note-lavender', 'note-coral', 'note-peach'];

    function createBoardNote(data, x, y, id) {
        var note = document.createElement('article');
        var colorCls = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
        note.className = 'board-note ' + colorCls + ' note-enter';
        note.style.left = x + 'px';
        note.style.top = y + 'px';
        note.style.setProperty('--rot', (Math.random() * 6 - 3).toFixed(1) + 'deg');
        if (id) {
            note.dataset.cardId = id;
            renderedCardIds[id] = true;
        }

        var stickerHtml = '';
        if (data.stickerSvg) {
            stickerHtml = '<div style="margin-top:0.2rem;color:' + data.stickerColor + ';">' + data.stickerSvg + '</div>';
        }

        note.innerHTML =
            '<span class="pushpin pushpin-green pin-enter"></span>' +
            '<div class="printed-avatar" style="font-size:1.4rem;line-height:1;">' + escapeHtml(data.avatar) + '</div>' +
            '<p class="note-text" style="margin-top:0.25rem;">' + escapeHtml(data.message) + '</p>' +
            '<p class="note-author">' + escapeHtml(data.name ? '— ' + data.name : '— A friend') + '</p>' +
            stickerHtml;

        setTimeout(function () {
            var pin = note.querySelector('.pushpin');
            if (pin) pin.classList.remove('pin-enter');
        }, 400);
        setTimeout(function () {
            note.classList.remove('note-enter');
        }, 500);

        return note;
    }

    /* ---------- Backend sync (persistence + realtime) ---------- */
    function syncCardToServer(note, x, y, data) {
        var clientId = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        note.dataset.clientId = clientId;
        renderedCardIds['client:' + clientId] = true;

        fetch(apiUrl('/api/cards'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                avatar: data.avatar,
                name: data.name,
                message: data.message,
                sticker: state.sticker,
                x: x,
                y: y,
                clientId: clientId
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (card) {
                if (card && card.id) {
                    note.dataset.cardId = card.id;
                    renderedCardIds[card.id] = true;
                }
            })
            .catch(function () { /* no backend — card stays local only */ });
    }

    function updateCardPosition(id, x, y) {
        fetch(apiUrl('/api/cards/' + encodeURIComponent(id)), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: x, y: y })
        }).catch(function () { /* ignore */ });
    }

    function renderCard(card) {
        // Already rendered (our own echo with a server id).
        if (card.id && renderedCardIds[card.id]) return;

        // Our own echo coming back via clientId — just map the id, don't duplicate.
        if (card.clientId && renderedCardIds['client:' + card.clientId]) {
            var localNote = boardCork.querySelector('[data-client-id="' + card.clientId + '"]');
            if (localNote && card.id) {
                localNote.dataset.cardId = card.id;
                renderedCardIds[card.id] = true;
            }
            return;
        }

        var boardRect = boardCork.getBoundingClientRect();
        var x = (card.x != null) ? card.x : (boardRect.width / 2 - 80);
        var y = (card.y != null) ? card.y : (boardRect.height / 2 - 60);
        var data = {
            avatar: card.avatar || '🦊',
            name: card.name || '',
            message: card.message || '',
            stickerSvg: card.sticker ? (stickerSvgs[card.sticker] || '') : '',
            stickerColor: card.sticker ? (stickerColors[card.sticker] || '') : ''
        };
        var note = createBoardNote(data, x, y, card.id);
        boardCork.appendChild(note);
        setupBoardNoteDrag(note, false);
        updateWallCount();
    }

    function moveCard(card) {
        if (!card.id) return;
        var note = boardCork.querySelector('[data-card-id="' + card.id + '"]');
        if (note && card.x != null && card.y != null) {
            note.style.left = card.x + 'px';
            note.style.top = card.y + 'px';
        }
    }

    function initCloud() {
        // Pull existing cards so the board is populated on load.
        fetch(apiUrl('/api/cards'))
            .then(function (r) { if (!r.ok) throw new Error('no server'); return r.json(); })
            .then(function (list) {
                (list || []).forEach(function (card) { renderCard(card); });
                openStream();
            })
            .catch(function () { /* static file mode — no persistence */ });
    }

    function openStream() {
        try {
            var es = new EventSource(apiUrl('/api/cards/stream'));
            es.onmessage = function (e) {
                try {
                    var msg = JSON.parse(e.data);
                    if (msg.type === 'insert' && msg.card) renderCard(msg.card);
                    else if (msg.type === 'update' && msg.card) moveCard(msg.card);
                } catch (_) { /* ignore malformed */ }
            };
            es.onerror = function () { /* SSE retries automatically */ };
        } catch (_) { /* EventSource unsupported — cards still work locally */ }
    }

    // Kick off the backend sync once the DOM is ready.
    initCloud();

    /* ---------- Utilities ---------- */
    function updateWallCount() {
        var el = document.querySelector('.board-badge .count');
        if (el) el.textContent = boardCork.querySelectorAll('.board-note').length;
    }

    function nameFromAuthor(text) {
        return String(text || '').replace(/^—\s*/, '');
    }

    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    function escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
})();
