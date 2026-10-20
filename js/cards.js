/* ============================================================
   The Cards — guestbook / scrapboard interactions
   Pick an avatar, write a note, hit "Print my card" and the
   card slides out of the tablet's paper slot (with a blinking
   status dot). From there:
     · desktop — drag it onto the cork board or tap 📌 to pin it;
       already-pinned cards can be dragged around to rearrange.
     · mobile — it lands on the board by itself right after
       printing (touch has no hover and dragging is disabled).

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

            // 出纸动画（0.75s）跑完后再放开裁切，随后分设备走两条路：
            //   · 手机/平板：没有 hover、拖拽也被禁用，卡片滑出后直接落到墙上，
            //     不要求用户再去找那个 📌 按钮（微信里经常点不到）。
            //   · 桌面：保持原样 —— 卡片停在出纸口，提示用户点 📌 钉上墙。
            setTimeout(function () {
                printerOutput.classList.add('is-open');
                if (isMobileView()) {
                    setTimeout(function () {
                        if (state.isPrinted) pinToBoard();
                        revealBoard();
                    }, 620);
                } else {
                    if (pinHint) pinHint.hidden = false;
                    revealPrintedCard();
                }
            }, 780);
        }, 900);
    }

    // 移动端自动钉上后，把板子带进视野，让用户看到纸条落在哪。
    function revealBoard() {
        try {
            var r = boardCork.getBoundingClientRect();
            var vh = window.innerHeight || document.documentElement.clientHeight;
            if (r.top < 8 || r.bottom > vh - 8) {
                boardCork.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        } catch (_) { /* 老浏览器忽略 */ }
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

    /* ---------- Coordinate space: 百分比（响应式） ----------
       板子是流式的：桌面约 956px 宽，手机上只有 330px（差近 3 倍）。
       早先坐标存的是绝对像素，于是「在电脑上钉下的卡片」到了手机上
       整块落到板子右侧之外，又被 .board-cork 的 overflow:hidden 裁干净
       —— 这就是「手机上有些卡片看不到 / 微信里提交了却不显示」的根因。
       现在一律以「相对板子的百分比 (xp/yp)」为准，渲染时换算回当前
       板尺寸的像素，并夹进板内，保证任何视口下都看得见。 */
    var REF_BOARD_W = 956;   // 1440 视口下 #boardCork 实测宽度（折算旧像素数据用）
    var REF_BOARD_H = 700;   // 同上，实测高度
    var BOARD_PAD = 12;

    function storedToPct(card) {
        if (Number.isFinite(card.xp) && Number.isFinite(card.yp)) {
            return { x: clamp(card.xp, 0, 100), y: clamp(card.yp, 0, 100) };
        }
        // 旧数据：像素 → 百分比
        if (Number.isFinite(card.x) && Number.isFinite(card.y)) {
            return {
                x: clamp((card.x / REF_BOARD_W) * 100, 0, 100),
                y: clamp((card.y / REF_BOARD_H) * 100, 0, 100)
            };
        }
        return { x: 42, y: 38 };
    }

    // 按每张纸条自己的百分比，落到当前板尺寸上，并夹进板内（扣掉卡片自身宽高）。
    function layoutNotes() {
        try {
            var b = boardCork.getBoundingClientRect();
            if (!b.width || !b.height) return;
            var notes = boardCork.querySelectorAll('.board-note');
            for (var i = 0; i < notes.length; i++) {
                var note = notes[i];
                if (state.isDragging && note === state.dragEl) continue;
                var xp = parseFloat(note.dataset.xp);
                var yp = parseFloat(note.dataset.yp);
                if (!isFinite(xp)) xp = 42;
                if (!isFinite(yp)) yp = 38;
                var w = note.offsetWidth || 150;
                var h = note.offsetHeight || 130;
                var maxX = Math.max(BOARD_PAD, b.width - w - BOARD_PAD);
                var maxY = Math.max(BOARD_PAD, b.height - h - BOARD_PAD);
                note.style.left = clamp((xp / 100) * b.width, BOARD_PAD, maxX) + 'px';
                note.style.top = clamp((yp / 100) * b.height, BOARD_PAD, maxY) + 'px';
            }
        } catch (_) { /* 拿不到布局时保持原样 */ }
    }

    var relayoutTimer = null;
    function scheduleLayout() {
        if (relayoutTimer) clearTimeout(relayoutTimer);
        relayoutTimer = setTimeout(function () {
            relayoutTimer = null;
            layoutNotes();
        }, 150);
    }
    window.addEventListener('resize', scheduleLayout);
    window.addEventListener('orientationchange', scheduleLayout);

    // 手机 / 平板：没有 hover，触摸拖拽也是禁用的（见 startDrag）。
    var mobileMQ = null;
    try { mobileMQ = window.matchMedia('(max-width: 900px)'); } catch (_) {}
    function isMobileView() {
        if (mobileMQ) return mobileMQ.matches;
        return ('ontouchstart' in window);
    }

    // 新钉的卡片尽量不叠在一起：按当前张数做黄金角散布。
    function scatterPct(i) {
        var GOLD = 0.6180339887;
        return {
            x: 5 + ((i * GOLD) % 1) * 76,
            y: 5 + ((i * GOLD * 1.7) % 1) * 74
        };
    }

    /* ---------- Pin the printed card to the board ---------- */
    function pinToBoard() {
        if (!state.isPrinted) return;
        var p = scatterPct(boardCork.querySelectorAll('.board-note').length);
        commitCard(+p.x.toFixed(2), +p.y.toFixed(2));
    }

    // Build the note from the printed card, drop it on the board, sync to backend.
    // x / y 均为百分比。
    function commitCard(xp, yp) {
        var data = {
            avatar: state.avatar,
            name: nameFromAuthor(printedAuthor.textContent),
            message: printedBody.textContent
        };
        var note = createBoardNote(data, xp, yp, null);
        boardCork.appendChild(note);
        setupBoardNoteDrag(note, false);
        layoutNotes();
        state.noteCount++;
        updateWallCount();
        syncCardToServer(note, xp, yp, data);
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
                commitCard(
                    +(boardRect.width ? (nx / boardRect.width) * 100 : 42).toFixed(2),
                    +(boardRect.height ? (ny / boardRect.height) * 100 : 38).toFixed(2)
                );
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
                var pxp = +(boardRect.width ? (nx2 / boardRect.width) * 100 : 42).toFixed(2);
                var pyp = +(boardRect.height ? (ny2 / boardRect.height) * 100 : 38).toFixed(2);
                el.dataset.xp = String(pxp);
                el.dataset.yp = String(pyp);
                el.style.position = 'absolute';
                el.style.width = '';
                el.style.margin = '';
                el.style.transform = '';
                boardCork.appendChild(el);
                layoutNotes();
                if (el.dataset.cardId) updateCardPosition(el.dataset.cardId, pxp, pyp);
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

    // x / y 为百分比；真正写 px 的活交给 layoutNotes()，尺寸变了能跟着换算。
    function createBoardNote(data, x, y, id) {
        var note = document.createElement('article');
        var colorCls = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
        note.className = 'board-note ' + colorCls + ' note-enter';
        note.dataset.xp = String(x);
        note.dataset.yp = String(y);
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
    // xp / yp 为百分比（渲染权威值）；x / y 同时带上当前像素，便于管理面板查看。
    var POST_TIMEOUT = 12000;

    function syncCardToServer(note, xp, yp, data) {
        var clientId = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        note.dataset.clientId = clientId;
        renderedCardIds['client:' + clientId] = true;
        var b = boardCork.getBoundingClientRect();

        var payload = JSON.stringify({
            avatar: data.avatar,
            name: data.name,
            message: data.message,
            xp: xp,
            yp: yp,
            x: Math.round((xp / 100) * (b.width || REF_BOARD_W)),
            y: Math.round((yp / 100) * (b.height || REF_BOARD_H)),
            clientId: clientId
        });

        postWithRetry(payload, 1)
            .then(function (card) {
                if (card && card.id) {
                    note.dataset.cardId = card.id;
                    renderedCardIds[card.id] = true;
                }
            })
            .catch(function () {
                // 微信等环境里网络被拦时 previously 是完全静默的，用户以为传上去了。
                // 这里给一句明确提示，纸条仍留在墙上（本地可见）。
                showPinHint('纸条没传上去，检查下网络再试一次');
            });
    }

    // 带超时 + 一次重试的 POST；跨域首包慢时不要轻易判死。
    function postWithRetry(payload, retriesLeft) {
        return new Promise(function (resolve, reject) {
            var done = false;
            var ctl = null;
            if (typeof AbortController !== 'undefined') { ctl = new AbortController(); }
            var timer = setTimeout(function () {
                if (!done) { done = true; if (ctl) { try { ctl.abort(); } catch (_) {} } trigger(); }
            }, POST_TIMEOUT);

            function finish(fn, v) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                fn(v);
            }
            function trigger() {
                if (retriesLeft > 0) {
                    postWithRetry(payload, retriesLeft - 1).then(resolve, reject);
                } else {
                    reject(new Error('post failed'));
                }
            }

            var opts = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            };
            if (ctl) { opts.signal = ctl.signal; }

            fetch(apiUrl('/api/cards'), opts)
                .then(function (r) { return r.json().catch(function () { return null; }); })
                .then(function (card) {
                    if (card && card.id) { finish(resolve, card); }
                    else { finish(function () { trigger(); }); }
                })
                .catch(function () { finish(function () { trigger(); }); });
        });
    }

    function showPinHint(text) {
        if (!pinHint) return;
        pinHint.textContent = text;
        pinHint.hidden = false;
    }

    // 位置同步同样以百分比为准（拖拽排布后换设备/转屏都不会跑出板外）。
    function updateCardPosition(id, xp, yp) {
        fetch(apiUrl('/api/cards/' + encodeURIComponent(id)), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xp: xp, yp: yp })
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

        var data = {
            avatar: card.avatar || 'assets/cards/avatars/ava-01.png',
            name: card.name || '',
            message: card.message || ''
        };
        var p = storedToPct(card);
        var note = createBoardNote(data, +p.x.toFixed(2), +p.y.toFixed(2), card.id);
        boardCork.appendChild(note);
        setupBoardNoteDrag(note, false);
        layoutNotes();
        updateWallCount();
    }

    function moveCard(card) {
        if (!card.id) return;
        var note = boardCork.querySelector('[data-card-id="' + card.id + '"]');
        if (!note) return;
        var p = storedToPct(card);
        note.dataset.xp = String(+p.x.toFixed(2));
        note.dataset.yp = String(+p.y.toFixed(2));
        layoutNotes();
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
        var es = null;
        try {
            es = new EventSource(apiUrl('/api/cards/stream'));
            es.onmessage = function (e) {
                try {
                    var msg = JSON.parse(e.data);
                    if (msg.type === 'insert' && msg.card) renderCard(msg.card);
                    else if (msg.type === 'update' && msg.card) moveCard(msg.card);
                    else if (msg.type === 'delete' && msg.id) deleteCardById(msg.id);
                } catch (_) { /* ignore malformed */ }
            };
            es.onerror = function () {
                // 微信内置浏览器会静默吞掉 SSE —— 线上日志里 iPhone 微信只发过
                // GET /api/cards，从来没有 /api/cards/stream。真连不上就退化轮询，
                // 别让页面看起来像坏掉了。
                if (es && es.readyState === 2) startPolling();
            };
        } catch (_) {
            startPolling();
            return;
        }
        // 4 秒内还没 OPEN，当作不支持，上轮询兜底。
        setTimeout(function () {
            if (!es || es.readyState !== 1) startPolling();   // 1 = OPEN
        }, 4000);
    }

    /* ---------- SSE 兜底：轮询 ----------
       只在 SSE 用不了时启动（老浏览器 / 微信内核 / 代理掐长连接）。
       renderCard 自带 id 去重，重复拉不会多画卡片。 */
    var pollTimer = null;

    function startPolling() {
        if (pollTimer) return;
        var tick = function () {
            fetch(apiUrl('/api/cards'))
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (list) {
                    (list || []).forEach(function (card) { renderCard(card); });
                })
                .catch(function () { /* 离线时静默，等下一轮 */ });
        };
        tick();
        pollTimer = setInterval(tick, 8000);
    }

    // Sync badge count with the actual template notes on load.
    updateWallCount();

    // Kick off the backend sync once the DOM is ready.
    initCloud();

    // Decorative stickers can be dragged around; restore any saved positions.
    initStickerDrag();
    restoreStickerPositions();

    // 字体 / 头像图片到位后卡片尺寸会变，等它们落地再排一次版。
    layoutNotes();
    window.addEventListener('load', scheduleLayout);

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
