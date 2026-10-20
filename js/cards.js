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
    var nameInput = document.getElementById('nameInput');
    var messageInput = document.getElementById('messageInput');
    var printBtn = document.getElementById('printBtn');
    var tabletDot = document.getElementById('tabletDot');
    var printerOutput = document.getElementById('printerOutput');
    var pinHint = document.getElementById('pinHint');
    var printedCard = document.getElementById('printedCard');
    var printedAvatar = document.getElementById('printedAvatar');
    var printedBody = document.getElementById('printedBody');
    var printedAuthor = document.getElementById('printedAuthor');
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
        avatar: 'assets/cards/avatars/ava-01.png',
        isPrinting: false,
        isPrinted: false,
        isDragging: false,
        dragEl: null,
        dragIsPrinted: false,
        dragIsSticker: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        dragOriginParent: null,
        dragOriginNextSibling: null,
        dragOriginStyle: '',
        noteCount: 0
    };

    /* ---------- Event bindings ---------- */
    avatarSelect.addEventListener('click', onAvatarClick);
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

        // If a card is still sitting in the printer tray, pin it first so it
        // isn't lost when the next card slides out. Then print the new one.
        if (state.isPrinted) {
            var nextName = nameInput.value;
            var nextMessage = messageInput.value;

            pinToBoard();

            // Restore the form values the user had already typed for the
            // next card (pinToBoard calls resetPrinter, which clears them).
            nameInput.value = nextName;
            messageInput.value = nextMessage;
        }

        doPrint(name, message);
    }

    function isImageAvatar(avatar) {
        return avatar && (/\.(png|jpg|jpeg|webp|gif)$/i.test(avatar) || avatar.indexOf('/') !== -1);
    }

    function renderAvatar(avatar) {
        if (!avatar) return '';
        return isImageAvatar(avatar)
            ? '<img src="' + escapeHtml(avatar) + '" alt="">'
            : escapeHtml(avatar);
    }

    function doPrint(name, message) {
        state.isPrinting = true;
        printBtn.disabled = true;

        // Blink the tablet status dot like a printer LED while "printing".
        tabletDot.classList.add('on', 'blink');

        // Build the card content.
        printedAvatar.innerHTML = isImageAvatar(state.avatar)
            ? '<img src="' + escapeHtml(state.avatar) + '" alt="">'
            : escapeHtml(state.avatar);
        printedBody.textContent = message;
        printedAuthor.textContent = name ? '— ' + name : '— 一位朋友';

        // After the print delay, slide the card out of the slot.
        setTimeout(function () {
            printedCard.hidden = false;
            void printedCard.offsetWidth; // force reflow so the transition runs
            printedCard.classList.add('printed');
            tabletDot.classList.remove('on', 'blink');
            state.isPrinting = false;
            state.isPrinted = true;
            printBtn.disabled = false;
            printBtn.textContent = '再打印一张';

            // 出纸动画（0.75s）跑完后再放开裁切，并把卡片带进视野。
            // 手机/平板上卡片经常停在首屏下方，用户看不见卡片和图钉，
            // 就会以为「打印没反应」，纸条自然也传不上来。
            setTimeout(function () {
                printerOutput.classList.add('is-open');
                if (pinHint) pinHint.hidden = false;
                revealPrintedCard();
            }, 780);
        }, 900);
    }

    // 卡片若不在视野内，轻轻滚过去 —— 已经在视野里就不打扰用户。
    function revealPrintedCard() {
        try {
            var r = printedCard.getBoundingClientRect();
            var vh = window.innerHeight || document.documentElement.clientHeight;
            if (r.top < 8 || r.bottom > vh - 8) {
                printedCard.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        } catch (_) { /* 老浏览器不支持带参数的 scrollIntoView，忽略即可 */ }
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
            message: printedBody.textContent
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
        printerOutput.classList.remove('is-open');
        if (pinHint) pinHint.hidden = true;
        state.isPrinted = false;
        printBtn.textContent = '打印我的贺卡';
        // Keep the name + avatar for the next card; clear message.
        messageInput.value = '';
    }

    /* ---------- Drag the decorative stickers on the cork board ---------- */
    var STICKER_POS_KEY = 'cards_sticker_pos_v1';

    function restoreStickerPositions() {
        var saved = {};
        try { saved = JSON.parse(localStorage.getItem(STICKER_POS_KEY) || '{}'); } catch (_) {}
        Object.keys(saved).forEach(function (idx) {
            var st = boardCork.querySelector('.sticker-collage[data-sticker-idx="' + idx + '"]');
            if (st && saved[idx]) {
                st.style.left = saved[idx].left;
                st.style.top = saved[idx].top;
            }
        });
    }

    function saveStickerPosition(idx, left, top) {
        var saved = {};
        try { saved = JSON.parse(localStorage.getItem(STICKER_POS_KEY) || '{}'); } catch (_) {}
        saved[idx] = { left: left, top: top };
        try { localStorage.setItem(STICKER_POS_KEY, JSON.stringify(saved)); } catch (_) {}
    }

    function initStickerDrag() {
        var stickers = boardCork.querySelectorAll('.sticker-collage');
        stickers.forEach(function (sticker) {
            sticker.addEventListener('pointerdown', function (e) {
                if (state.isDragging || e.pointerType === 'touch') return;
                startStickerDrag(sticker, e);
            });
        });
    }

    function startStickerDrag(sticker, e) {
        e.preventDefault();
        state.isDragging = true;
        state.dragEl = sticker;
        state.dragIsPrinted = false;
        state.dragIsSticker = true;

        var rect = sticker.getBoundingClientRect();
        state.dragOffsetX = e.clientX - rect.left;
        state.dragOffsetY = e.clientY - rect.top;
        state.dragOriginStyle = sticker.getAttribute('style') || '';

        sticker.style.position = 'fixed';
        sticker.style.left = (e.clientX - state.dragOffsetX) + 'px';
        sticker.style.top = (e.clientY - state.dragOffsetY) + 'px';
        sticker.style.width = rect.width + 'px';
        sticker.style.margin = '0';
        sticker.classList.add('sticker-dragging');
        document.body.appendChild(sticker);
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
        state.dragIsSticker = false;

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
        el.classList.remove('sticker-dragging');

        if (state.dragIsSticker) {
            if (overBoard) {
                var nxS = e.clientX - boardRect.left - state.dragOffsetX;
                var nyS = e.clientY - boardRect.top - state.dragOffsetY;
                var pctX = ((nxS / boardRect.width) * 100).toFixed(2);
                var pctY = ((nyS / boardRect.height) * 100).toFixed(2);
                el.style.position = 'absolute';
                el.style.left = pctX + '%';
                el.style.top = pctY + '%';
                el.style.width = '';
                el.style.margin = '';
                boardCork.appendChild(el);
                saveStickerPosition(el.dataset.stickerIdx, pctX + '%', pctY + '%');
            } else {
                el.setAttribute('style', state.dragOriginStyle);
                boardCork.appendChild(el);
            }
        } else if (state.dragIsPrinted) {
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
        state.dragIsSticker = false;
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

        note.innerHTML =
            '<span class="pushpin pushpin-green pin-enter"></span>' +
            '<div class="printed-avatar">' + renderAvatar(data.avatar) + '</div>' +
            '<p class="note-text" style="margin-top:0.25rem;">' + escapeHtml(data.message) + '</p>' +
            '<p class="note-author">' + escapeHtml(data.name ? '— ' + data.name : '— 一位朋友') + '</p>';

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
            avatar: card.avatar || 'assets/cards/avatars/ava-01.png',
            name: card.name || '',
            message: card.message || ''
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

    function deleteCardById(id) {
        if (!id) return;
        var note = boardCork.querySelector('[data-card-id="' + id + '"]');
        if (note) {
            note.classList.add('note-leave');
            setTimeout(function () {
                if (note.parentNode) { note.remove(); updateWallCount(); }
            }, 300);
        }
        delete renderedCardIds[id];
    }

    function initCloud() {
        // Pull existing cards so the board is populated on load.
        // Retry a few times — transient network/TLS blips should not blank the board.
        loadCardsWithRetry(3, 400);
    }

    function loadCardsWithRetry(attempts, delay) {
        fetch(apiUrl('/api/cards'))
            .then(function (r) { if (!r.ok) throw new Error('no server'); return r.json(); })
            .then(function (list) {
                (list || []).forEach(function (card) { renderCard(card); });
                openStream();
            })
            .catch(function () {
                if (attempts > 1) {
                    setTimeout(function () { loadCardsWithRetry(attempts - 1, delay * 2); }, delay);
                } else {
                    // Final fallback: still open the realtime stream so newly added
                    // cards can backfill; don't silently pretend we're in static mode.
                    openStream();
                }
            });
    }

    function openStream() {
        try {
            var es = new EventSource(apiUrl('/api/cards/stream'));
            es.onmessage = function (e) {
                try {
                    var msg = JSON.parse(e.data);
                    if (msg.type === 'insert' && msg.card) renderCard(msg.card);
                    else if (msg.type === 'update' && msg.card) moveCard(msg.card);
                    else if (msg.type === 'delete' && msg.id) deleteCardById(msg.id);
                } catch (_) { /* ignore malformed */ }
            };
            es.onerror = function () { /* SSE retries automatically */ };
        } catch (_) { /* EventSource unsupported — cards still work locally */ }
    }

    // Sync badge count with the actual template notes on load.
    updateWallCount();

    // Kick off the backend sync once the DOM is ready.
    initCloud();

    // Decorative stickers can be dragged around; restore any saved positions.
    initStickerDrag();
    restoreStickerPositions();

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
