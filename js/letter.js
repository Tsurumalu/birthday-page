/* ============================================
   Letter — the desk room
   Shelf · keyboard · pixel desktop · locked letter
   --------------------------------------------
   Everything you may want to edit lives in the
   CONFIG blocks at the top of each section.
   Public hooks: window.LetterDesk  (see letter-desk-guide.md)
   ============================================ */

(function () {
    'use strict';

    var page = document.getElementById('letterPage');
    if (!page) return;

    function $(id) { return document.getElementById(id); }
    function make(tag, cls, html) {
        var el = document.createElement(tag);
        if (cls) el.className = cls;
        if (html != null) el.innerHTML = html;
        return el;
    }

    var room = $('room');
    var screenEl = $('screen');
    var scrUi = $('scrUi');
    var UI_W = 1000;
    var UI_H = 625;
    /* below this scale the pixel chrome turns to mush on small windows —
       font sizes get compensated back up (see fitDesktop) */
    var MIN_READ = 0.62;
    var FS_FLOOR = 1.3;  /* desktop boost — user asked for larger type on big screens */
    var FS_MAX = 1.35;

    /* ============================================================
       1 · the lock
       ============================================================ */

    var PASSWORD = 'TS669';

    /* the letter is still being written. flip this to true when it's
       ready and every door into it opens again at once: the desktop
       icon, both menu items, the lock window and the big paper. */
    var LETTER_LIVE = false;
    var LETTER_SOON = '\u4FE1\u8FD8\u5728\u5199\u2026\u5199\u5B8C\u4E86\u5C31\u653E\u5728\u8FD9\u513F\u3002';
    var QUESTION = '\u5982\u679C\u53EF\u4EE5\u81EA\u5DF1\u6311\u9009\u8F66\u724C\uFF0Cty \u4F1A\u6311\u9009\u4EC0\u4E48\uFF1F';
    var HINTS = [
        '\u4E24\u4E2A\u5B57\u6BCD\uFF0C\u4E09\u4E2A\u6570\u5B57\u3002\u5B57\u6BCD\u662F\u4F60\u523B\u5728\u5FC3\u91CC\u7684\u90A3\u4E2A\u4EBA\u3002',
        '\u5B57\u6BCD\u662F\u5979\u7684\u540D\u5B57\u7F29\u5199\uFF0C\u6570\u5B57\u662F\u6700\u62DB\u8D22\u7684\u90A3\u79CD\u3002'
    ];

    /* ============================================================
       2 · the shelf
       ============================================================ */

    var BOOKS = [
        { t: 'THE FATE OF OPHELIA', tag: 'VHS', bw: 2.1, bh: 11.4, lean: 0,
          b1: '#1d3328', b2: '#152619', b3: '#0b1710', ink: '#e6d3a0', band: '#c9b47a', bandInk: '#2b2118',
          patch: 'linear-gradient(160deg,#7d9b6a,#3d5238)',
          q: 'read it twice in one night, cried at page one' },
        { t: 'Elizabeth Taylor', tcls: 'is-serif', tag: 'VOL 1', bw: 1.9, bh: 10.6,
          b1: '#181a1e', b2: '#121317', b3: '#08090b', ink: '#dfe3e8', band: '#2a4a6b', bandInk: '#e8eef5',
          patch: 'linear-gradient(150deg,#5f7fa3,#22384f)',
          q: 'the blue hour, on repeat' },
        { t: 'OPALITE', tag: 'HI-FI', bw: 2.2, bh: 11.2, foil: true,
          b1: '#b0503a', b2: '#8c3524', b3: '#5e2013', ink: '#fbe6c8', band: '#f0d9a8', bandInk: '#5e2013',
          q: 'the one that turns into rainbows in the sun' },
        { t: 'FATHER FIGURE', tag: 'VHS', bw: 2.0, bh: 11.6,
          b1: '#3f6b62', b2: '#2c4f49', b3: '#1a332f', ink: '#dff0ea', band: '#dfe9e4', bandInk: '#1a332f',
          q: 'the gentlest voice in the room' },
        { t: 'ELDEST DAUGHTER', tag: '140', bw: 1.8, bh: 10.2,
          b1: '#d5cfc2', b2: '#bdb6a6', b3: '#9c9484', ink: '#2c2a25', band: '#2c2a25', bandInk: '#e8e2d4',
          patch: 'linear-gradient(160deg,#b8b2a4,#6e6a60)',
          q: 'for the one who carries everyone' },
        { t: 'RUIN THE FRIENDSHIP', tag: 'VHS', bw: 2.1, bh: 11.0,
          b1: '#efe7d6', b2: '#ddd3bd', b3: '#c2b8a0', ink: '#b8352c', band: '#b8352c', bandInk: '#f6ece0',
          q: 'we never did. good.' },
        { t: 'actually romantic', tcls: 'is-serif', tag: 'VHS', bw: 2.0, bh: 10.8,
          b1: '#e08a3c', b2: '#c26f28', b3: '#9a531a', ink: '#fdf1dc', band: '#f2c86a', bandInk: '#7d4410',
          q: 'denim, a rainbow, and zero chill' },
        { t: 'WISHLIST', tag: 'VHS', bw: 2.0, bh: 10.4, foil: true,
          b1: '#d98fb5', b2: '#a878cc', b3: '#7b5fb0', ink: '#fdf3fa', band: '#f7e2ef', bandInk: '#5b406f',
          q: 'everything in here is for you' },
        { t: 'WOOD', tcls: 'is-serif', tag: 'T-120', bw: 2.2, bh: 11.3,
          b1: '#5a3a28', b2: '#432b1d', b3: '#2b1a11', ink: '#e9d5b6', band: '#c9a27a', bandInk: '#3a2616',
          patch: 'radial-gradient(circle at 50% 45%, #d8bd9a 0 42%, #7a5a3e 44%, #3a2616 100%)',
          q: 'a cabin, a window, no signal' },
        { t: 'coney island', tag: 'VHS', bw: 1.9, bh: 10.9,
          b1: '#c0392b', b2: '#9c2b20', b3: '#6f1b13', ink: '#f2e6d8', band: '#e7d8c4', bandInk: '#7a2418',
          q: 'the long way home, always' },
        { t: 'Honey', tcls: 'is-hand', tag: 'E-180', bw: 2.1, bh: 10.7,
          b1: '#1b2b3d', b2: '#131e2c', b3: '#0a1019', ink: '#e8d6b8', band: '#c9a27a', bandInk: '#1b2b3d',
          patch: 'linear-gradient(150deg,#e6cfa8,#a3763f)',
          q: 'slow, warm, and impossible to skip' },
        { t: 'THE LIFE OF A SHOWGIRL', tag: 'T-160', bw: 2.2, bh: 11.5,
          b1: '#1e5c40', b2: '#154430', b3: '#0d2c1f', ink: '#f6c56a', band: '#e8853c', bandInk: '#2b1a10',
          q: 'lights up every room she walks into' }
    ];

    var shelfBooks = $('shelfBooks');
    var shelfNote = null;
    var pulledBook = null;

    function buildShelf() {
        if (!shelfBooks) return;

        shelfNote = make('div', 'shelf-note',
            '<span class="shelf-note-title"></span>' +
            '<span class="shelf-note-line"></span>' +
            '<span class="shelf-note-tag"></span>');
        $('shelf').appendChild(shelfNote);

        BOOKS.forEach(function (b) {
            var el = make('button', 'book' + (b.lean ? ' is-lean' : '') + (b.foil ? ' is-foil' : ''));
            el.type = 'button';
            el.setAttribute('aria-label', b.t);
            el.style.setProperty('--bw', b.bw);
            el.style.setProperty('--bh', b.bh);
            el.style.setProperty('--b1', b.b1);
            el.style.setProperty('--b2', b.b2);
            el.style.setProperty('--b3', b.b3);
            el.style.setProperty('--inkc', b.ink);
            el.style.setProperty('--band', b.band);
            el.style.setProperty('--bandink', b.bandInk || '#2b2118');
            if (b.lean) el.style.setProperty('--lean', b.lean + 'deg');
            if (b.patch) el.style.setProperty('--patch', b.patch);

            el.innerHTML =
                '<span class="book-band">' + b.tag + '</span>' +
                (b.patch ? '<span class="book-patch"></span>' : '') +
                '<span class="book-title ' + (b.tcls || '') + '">' + b.t + '</span>';

            el.addEventListener('click', function (e) {
                e.stopPropagation();
                pullBook(el, b);
            });

            shelfBooks.appendChild(el);
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest || !e.target.closest('.shelf')) retractBook();
        });
    }

    function pullBook(el, b) {
        if (pulledBook === el) { retractBook(); return; }
        if (pulledBook) pulledBook.classList.remove('is-out');
        pulledBook = el;
        el.classList.add('is-out');

        shelfNote.querySelector('.shelf-note-title').textContent = b.t;
        shelfNote.querySelector('.shelf-note-line').textContent = '\u201C' + b.q + '\u201D';
        shelfNote.querySelector('.shelf-note-tag').textContent = b.tag + ' \u00B7 \u6C38\u4E45\u73CD\u85CF';
        shelfNote.style.left = (el.offsetLeft + el.offsetWidth / 2) + 'px';
        shelfNote.classList.add('is-on');
    }

    function retractBook() {
        if (pulledBook) { pulledBook.classList.remove('is-out'); pulledBook = null; }
        if (shelfNote) shelfNote.classList.remove('is-on');
    }

    /* ============================================================
       3 · the keyboard
       ============================================================ */

    var KEY_ROWS = [
        { off: 1, keys: [{ l: 'esc', code: 'Escape', cls: 'is-special is-dark' }]
            .concat((function () {
                var a = [];
                for (var i = 1; i <= 12; i++) a.push({ l: 'F' + i, code: 'F' + i, cls: 'is-special' });
                return a;
            })())
            .concat([{ l: 'del', code: 'Delete', cls: 'is-special is-dark' }]) },
        { keys: [
            { l: '`', code: 'Backquote' }, { l: '1', code: 'Digit1' }, { l: '2', code: 'Digit2' },
            { l: '3', code: 'Digit3' }, { l: '4', code: 'Digit4' }, { l: '5', code: 'Digit5' },
            { l: '6', code: 'Digit6' }, { l: '7', code: 'Digit7' }, { l: '8', code: 'Digit8' },
            { l: '9', code: 'Digit9' }, { l: '0', code: 'Digit0' }, { l: '-', code: 'Minus' },
            { l: '=', code: 'Equal' }, { l: 'bksp', w: 2, code: 'Backspace', cls: 'is-special' }
        ] },
        { keys: [
            { l: 'tab', w: 1.5, code: 'Tab', cls: 'is-special' },
            { l: 'Q', code: 'KeyQ' }, { l: 'W', code: 'KeyW' }, { l: 'E', code: 'KeyE' },
            { l: 'R', code: 'KeyR' }, { l: 'T', code: 'KeyT' }, { l: 'Y', code: 'KeyY' },
            { l: 'U', code: 'KeyU' }, { l: 'I', code: 'KeyI' }, { l: 'O', code: 'KeyO' },
            { l: 'P', code: 'KeyP' }, { l: '[', code: 'BracketLeft' }, { l: ']', code: 'BracketRight' },
            { l: '\\', w: 1.5, code: 'Backslash', cls: 'is-special' }
        ] },
        { keys: [
            { l: 'caps', w: 1.75, code: 'CapsLock', cls: 'is-special is-dark' },
            { l: 'A', code: 'KeyA' }, { l: 'S', code: 'KeyS' }, { l: 'D', code: 'KeyD' },
            { l: 'F', code: 'KeyF' }, { l: 'G', code: 'KeyG' }, { l: 'H', code: 'KeyH' },
            { l: 'J', code: 'KeyJ' }, { l: 'K', code: 'KeyK' }, { l: 'L', code: 'KeyL' },
            { l: ';', code: 'Semicolon' }, { l: '\'', code: 'Quote' },
            { l: 'enter', w: 2.25, code: 'Enter', cls: 'is-special' }
        ] },
        { keys: [
            { l: 'shift', w: 2.25, code: 'Shift', cls: 'is-special' },
            { l: 'Z', code: 'KeyZ' }, { l: 'X', code: 'KeyX' }, { l: 'C', code: 'KeyC' },
            { l: 'V', code: 'KeyV' }, { l: 'B', code: 'KeyB' }, { l: 'N', code: 'KeyN' },
            { l: 'M', code: 'KeyM' }, { l: ',', code: 'Comma' }, { l: '.', code: 'Period' },
            { l: '/', code: 'Slash' }, { l: 'shift', w: 2.75, code: 'Shift', cls: 'is-special' }
        ] },
        { keys: [
            { l: 'ctrl', w: 1.25, code: 'Control', cls: 'is-special' },
            { l: 'win', w: 1.25, code: 'Meta', cls: 'is-special' },
            { l: 'alt', w: 1.25, code: 'Alt', cls: 'is-special' },
            { l: 'space', w: 5.75, code: 'Space', cls: 'is-special' },
            { l: 'alt', w: 1.25, code: 'Alt', cls: 'is-special' },
            { l: 'fn', w: 1.25, code: 'Fn', cls: 'is-special' },
            { l: '\u2190', code: 'ArrowLeft', cls: 'is-special' },
            { l: '\u2193', code: 'ArrowDown', cls: 'is-special' },
            { l: '\u2192', code: 'ArrowRight', cls: 'is-special' }
        ] }
    ];

    var keyByCode = {};

    function buildKeyboard() {
        var host = $('kbdKeys');
        if (!host) return;

        KEY_ROWS.forEach(function (row, r) {
            var rowEl = make('div', 'kbd-row' + (row.off ? ' kbd-row-offset' : ''));
            row.keys.forEach(function (k, c) {
                var key = make('button', 'key' + (k.cls ? ' ' + k.cls : ''));
                key.type = 'button';
                key.textContent = k.l;
                if (k.w) key.style.setProperty('--w', k.w);

                /* the reference board mixes cream caps with silver butterfly caps.
                   Scatter a handful of them instead of covering the board, so the
                   set reads as 蝶恋花 rather than as noise; those caps keep a small
                   legend in the corner, like the real set */
                if (r > 0 && r < 5 && !k.cls && ((r + c) % 4 === 2)) {
                    key.classList.add('is-fly');
                    key.innerHTML = '<span class="key-legend">' + k.l + '</span>';
                }

                if (k.code) {
                    key.dataset.code = k.code;
                    key.dataset.label = k.l;
                    (keyByCode[k.code] = keyByCode[k.code] || []).push(key);
                    key.addEventListener('click', function () { onKeyClick(k); });
                }
                rowEl.appendChild(key);
            });
            host.appendChild(rowEl);
        });
    }

    function highlightKey(code, on) {
        var list = keyByCode[code];
        if (!list) return;
        list.forEach(function (el) { el.classList.toggle('is-down', on); });
    }

    var SIGNATURE_CODES = {
        ShiftLeft: 'Shift', ShiftRight: 'Shift',
        ControlLeft: 'Control', ControlRight: 'Control',
        AltLeft: 'Alt', AltRight: 'Alt'
    };

    function onKeyClick(k) {
        var lockInput = document.querySelector('.lock-input');
        if (!lockInput) return;
        var label = k.l;
        if (k.code === 'Backspace') { lockInput.value = lockInput.value.slice(0, -1); }
        else if (k.code === 'Enter') { submitLock(); return; }
        else if (label.length === 1 && /[a-z0-9]/i.test(label)) { lockInput.value += label; }
        else return;
        lockInput.focus();
    }

    document.addEventListener('keydown', function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        var code = SIGNATURE_CODES[e.code] || e.code;
        if (keyByCode[code]) {
            highlightKey(code, true);
            setTimeout(function () { highlightKey(code, false); }, 110);
        }
        if (e.key === 'Escape' && !$('letterFloat').hidden) closeLetter();
    });

    /* ============================================================
       4 · the mouse
       ============================================================ */

    function buildMouse() {
        var mouse = $('mouse');
        if (!mouse) return;
        mouse.addEventListener('click', function () {
            if (mouse.classList.contains('is-click')) return;
            mouse.classList.add('is-click');
            setTimeout(function () { mouse.classList.remove('is-click'); }, 320);
        });
    }

    /* ============================================================
       5 · the pixel desktop
       ============================================================ */

    var ICONS = {
        letter: '<svg viewBox="0 0 48 44"><rect x="4" y="11" width="40" height="27" rx="2" fill="#fdfaf0" stroke="#26292e" stroke-width="2.5"/><path d="M5 13 L24 27 L43 13" fill="none" stroke="#26292e" stroke-width="2.5"/><circle cx="38" cy="9" r="6" fill="#e8615c" stroke="#26292e" stroke-width="2"/><path d="M36 8.4c.9-1.4 2.9-.5 2 1.1-.3.6-2 1.9-2 1.9s-1.7-1.3-2-1.9c-.9-1.6 1.1-2.5 2-1.1z" fill="#fdfaf0"/></svg>',
        arcade: '<svg viewBox="0 0 48 44"><rect x="5" y="14" width="38" height="17" rx="8" fill="#f2a3bb" stroke="#26292e" stroke-width="2.5"/><rect x="12" y="20.5" width="8" height="3" fill="#26292e"/><rect x="14.5" y="18" width="3" height="8" fill="#26292e"/><circle cx="31" cy="20" r="2.6" fill="#26292e"/><circle cx="36" cy="25" r="2.6" fill="#26292e"/><rect x="18" y="10" width="12" height="5" rx="2" fill="#4fa89b" stroke="#26292e" stroke-width="2"/></svg>',
        links: '<svg viewBox="0 0 48 44"><circle cx="24" cy="22" r="15" fill="#a9d9ea" stroke="#26292e" stroke-width="2.5"/><ellipse cx="24" cy="22" rx="6.5" ry="15" fill="none" stroke="#26292e" stroke-width="2"/><path d="M9 22h30M11 15h26M11 29h26" stroke="#26292e" stroke-width="2"/></svg>',
        notes: '<svg viewBox="0 0 48 44"><rect x="10" y="6" width="28" height="32" rx="2" fill="#f6cf6a" stroke="#26292e" stroke-width="2.5"/><path d="M16 15h16M16 22h16M16 29h10" stroke="#26292e" stroke-width="2.2" stroke-linecap="round"/></svg>',
        trash: '<svg viewBox="0 0 48 44"><path d="M13 14h22l-2.4 23h-17.2z" fill="#dfe4e6" stroke="#26292e" stroke-width="2.5"/><path d="M9 12h30" stroke="#26292e" stroke-width="2.5"/><path d="M19 12V7h10v5" fill="none" stroke="#26292e" stroke-width="2.5"/><path d="M20 20v11M28 20v11" stroke="#26292e" stroke-width="2" stroke-linecap="round"/></svg>'
    };

    var WIZ_ART =
        '<svg viewBox="0 0 120 120">' +
        '<rect x="12" y="16" width="96" height="68" rx="7" fill="#fdfaf0" stroke="#26292e" stroke-width="4"/>' +
        '<rect x="23" y="27" width="74" height="46" rx="3" fill="#bfe6e8" stroke="#26292e" stroke-width="3"/>' +
        '<circle cx="42" cy="40" r="5.5" fill="#f6cf6a" stroke="#26292e" stroke-width="2"/>' +
        '<path d="M24 71 L45 45 L59 60 L74 41 L96 71 Z" fill="#4fa89b" stroke="#26292e" stroke-width="3"/>' +
        '<rect x="50" y="84" width="20" height="7" fill="#ddd2ba" stroke="#26292e" stroke-width="3"/>' +
        '<rect x="34" y="91" width="52" height="7" rx="2" fill="#cdc0a6" stroke="#26292e" stroke-width="3"/>' +
        '<path d="M99 24c4-7 13-2 9 5l-9 9-9-9c-4-7 5-12 9-5z" fill="#e8615c" stroke="#26292e" stroke-width="3"/>' +
        '</svg>';

    var LOCK_GLYPH_LOCKED =
        '<svg viewBox="0 0 60 66"><path d="M17 27v-9a13 13 0 0 1 26 0v9" fill="none" stroke="#26292e" stroke-width="5"/>' +
        '<rect x="9" y="26" width="42" height="33" rx="4" fill="#f6cf6a" stroke="#26292e" stroke-width="5"/>' +
        '<circle cx="30" cy="40" r="4.5" fill="#26292e"/><rect x="27.6" y="42" width="4.8" height="10" fill="#26292e"/></svg>';

    var LOCK_GLYPH_OPEN =
        '<svg viewBox="0 0 60 66"><path d="M17 27v-9a13 13 0 0 1 22-9" fill="none" stroke="#26292e" stroke-width="5"/>' +
        '<rect x="9" y="26" width="42" height="33" rx="4" fill="#8fd8c2" stroke="#26292e" stroke-width="5"/>' +
        '<path d="M22 41l6 6 11-12" fill="none" stroke="#26292e" stroke-width="5" stroke-linecap="round"/></svg>';

    /* apps shown on the desktop -------------------------------------------------- */

    var DESKTOP_APPS = [
        {
            id: 'letter', label: '\u4FE1\u4EF6', type: 'letter', title: '\u4FE1\u4EF6 \u2014 \u672A\u542F\u5C01',
            icon: ICONS.letter, w: 700, h: 470, locked: true,
            soon: !LETTER_LIVE,
            render: renderLetterApp,
            /* closing the letter (locked or opened) invites the quiz */
            onClose: function () { queueQuiz(900); }
        },
        {
            id: 'trash', label: '\u5E9F\u7EB8\u7BD3', type: 'placeholder', title: '\u5E9F\u7EB8\u7BD3',
            icon: ICONS.trash, w: 480, h: 240,
            note: '\u91CC\u9762\u4EC0\u4E48\u90FD\u6CA1\u6709\u3002',
            detail: '\u503C\u5F97\u7559\u4E0B\u7684\uFF0C\u90FD\u5DF2\u7ECF\u5728\u684C\u4E0A\u4E86\u3002',
            tip: '\u7A7A\u7684\u3002\u5C31\u50CF\u6211\u4EEC\u559C\u6B22\u7684\u90A3\u6837\u3002'
        },
        {
            id: 'welcome', label: '\u6B22\u8FCE', type: 'welcome', title: '\u6B22\u8FCE\u4F7F\u7528 TY-OS',
            hidden: true, w: 640, h: 330, render: renderWelcomeApp,
            /* whatever the visitor does with this window — closing it,
               "later", or opening the letter — the quiz steps in next */
            onClose: function () { queueQuiz(620); }
        }
    ];

    /* hyperlinks & notes were removed with their desktop apps */

    var MENUS = [
        { id: 'logo', label: '\u273F', items: [
            { label: '\u5173\u4E8E TY-OS\u2026', act: showAbout },
            { sep: true },
            { label: '\u6253\u5F00\u4FE1\u4EF6', disabled: !LETTER_LIVE, act: function () { openApp('letter'); } },
            { label: '\u663E\u793A\u684C\u9762', act: closeAll },
            { sep: true },
            { label: '\u5173\u673A', act: powerOff }
        ] },
        { id: 'file', label: '\u6587\u4EF6', items: [
            { label: '\u6253\u5F00\u4FE1\u4EF6', disabled: !LETTER_LIVE, act: function () { openApp('letter'); } },
            { sep: true },
            { label: '\u5173\u95ED\u7A97\u53E3', act: closeTop }
        ] },
        { id: 'edit', label: '\u7F16\u8F91', items: [
            { label: '\u64A4\u9500', disabled: true },
            { label: '\u526A\u5207', disabled: true },
            { label: '\u590D\u5236', disabled: true },
            { label: '\u7C98\u8D34', disabled: true }
        ] },
        { id: 'view', label: '\u663E\u793A', items: [
            { label: '\u7F29\u653E\u7A97\u53E3', act: zoomTop },
            { label: '\u663E\u793A\u684C\u9762', act: closeAll }
        ] },
        { id: 'special', label: '\u7279\u522B', items: [
            { label: '\u6E05\u7A7A\u5E9F\u7EB8\u7BD3', disabled: true },
            { label: '\u91CD\u542F TY-OS', act: function () { location.reload(); } }
        ] }
    ];

    var iconsLayer = $('uiIcons');
    var winsLayer = $('uiWins');
    var openWins = {};
    var zTop = 20;
    var winCount = 0;
    var unlocked = false;
    var attempts = 0;

    function getScale() {
        var s = parseFloat(getComputedStyle(scrUi).getPropertyValue('--ui-scale'));
        return s > 0.05 ? s : 1;
    }

    function fitDesktop() {
        if (!screenEl || !scrUi) return;
        var w = screenEl.clientWidth;
        if (!w) return;
        var s = w / UI_W;
        scrUi.style.setProperty('--ui-scale', s.toFixed(4));
        /* the screen shrinks with the window, but the pixel chrome and the
           quiz text must stay legible — scale fonts back up (capped at
           FS_MAX) instead of letting them shrink with everything else.
           FS_FLOOR keeps desktop text ~30% larger than the raw design
           size; the phone layout (≤900px) overrides --ui-fs back to 1. */
        var fs = Math.min(FS_MAX, Math.max(FS_FLOOR, MIN_READ / s));
        scrUi.style.setProperty('--ui-fs', fs.toFixed(3));
    }

    /* ---------- icons ---------- */

    function iconEl(app) {
        var el = make('button', 'ui-icon');
        el.type = 'button';
        el.dataset.app = app.id;
        el.innerHTML = '<span class="ui-icon-art">' + app.icon + '</span>' +
            '<span class="ui-icon-label">' + app.label + '</span>' +
            (app.soon ? '<span class="ui-icon-tag">\u672A\u5B8C</span>' : '') +
            (app.locked && !app.soon ? '<span class="ui-icon-badge"></span>' : '');
        if (app.soon) el.classList.add('is-soon');
        el.addEventListener('click', function () {
            selectIcon(el);
            openApp(app.id);
        });
        return el;
    }

    function selectIcon(el) {
        Array.prototype.forEach.call(iconsLayer.children, function (n) { n.classList.remove('is-sel'); });
        el.classList.add('is-sel');
    }

    function buildIcons() {
        if (!iconsLayer) return;
        iconsLayer.innerHTML = '';
        DESKTOP_APPS.forEach(function (app) {
            if (app.hidden) return;
            iconsLayer.appendChild(iconEl(app));
        });
    }

    /* ---------- windows ---------- */

    function createWindow(app) {
        var win = make('div', 'ui-win');
        win.dataset.app = app.id;
        win.style.width = (app.w || 560) + 'px';
        if (app.h) win.style.minHeight = app.h + 'px';

        var n = winCount++;
        var x = Math.min(140 + n * 30, UI_W - (app.w || 560) - 12);
        var y = Math.min(52 + (n % 4) * 28, UI_H - 200);
        win.style.left = Math.max(14, x) + 'px';
        win.style.top = Math.max(44, y) + 'px';

        win.innerHTML =
            '<div class="ui-win-bar">' +
                '<span class="ui-win-dots">' +
                    '<button class="ui-dot ui-dot-close" type="button" aria-label="\u5173\u95ED"></button>' +
                    '<button class="ui-dot ui-dot-zoom" type="button" aria-label="\u7F29\u653E"></button>' +
                '</span>' +
                '<span class="ui-win-title">' + (app.title || app.label) + '</span>' +
            '</div>' +
            '<div class="ui-win-body"></div>';

        var bar = win.querySelector('.ui-win-bar');
        var body = win.querySelector('.ui-win-body');

        win.querySelector('.ui-dot-close').addEventListener('click', function (e) {
            e.stopPropagation();
            closeWindow(win);
        });
        win.querySelector('.ui-dot-zoom').addEventListener('click', function (e) {
            e.stopPropagation();
            toggleZoom(win);
        });

        win.addEventListener('pointerdown', function () { bringToFront(win); });
        makeDraggable(win, bar);

        if (typeof app.render === 'function') {
            app.render(body, win);
        } else {
            body.innerHTML = placeholderBody(app);
        }

        winsLayer.appendChild(win);
        openWins[app.id] = win;
        bringToFront(win);
        return win;
    }

    function placeholderBody(app) {
        return '<div class="wz"><div class="wz-art">' +
            (app.icon || ICONS.arcade) +
            '</div><div class="wz-text">' +
            '<div class="wz-h">' + (app.note || '\u656C\u8BF7\u671F\u5F85') + '</div>' +
            '<p>' + (app.detail || '') + '</p>' +
            '<p class="ui-tip">' + (app.tip || '') + '</p>' +
            '</div></div>';
    }

    function makeDraggable(win, bar) {
        var start = null;
        bar.addEventListener('pointerdown', function (e) {
            if (e.target.closest('.ui-dot')) return;
            if (window.matchMedia('(max-width: 900px)').matches) return;
            e.preventDefault();
            var scale = getScale();
            start = {
                x: e.clientX,
                y: e.clientY,
                left: parseFloat(win.style.left) || 0,
                top: parseFloat(win.style.top) || 0,
                id: e.pointerId
            };
            bar.setPointerCapture(e.pointerId);
            bar.addEventListener('pointermove', onMove);
            bar.addEventListener('pointerup', onUp);
            bar.addEventListener('pointercancel', onUp);
        });

        function onMove(e) {
            if (!start) return;
            var nx = start.left + (e.clientX - start.x) / getScale();
            var ny = start.top + (e.clientY - start.y) / getScale();
            nx = Math.max(-40, Math.min(nx, UI_W - 80));
            ny = Math.max(0, Math.min(ny, UI_H - 60));
            win.style.left = nx + 'px';
            win.style.top = ny + 'px';
        }

        function onUp() {
            start = null;
            bar.removeEventListener('pointermove', onMove);
            bar.removeEventListener('pointerup', onUp);
            bar.removeEventListener('pointercancel', onUp);
        }
    }

    function toggleZoom(win) {
        var zoomed = win.classList.toggle('is-zoom');
        if (zoomed) {
            win.dataset.prev = JSON.stringify({
                w: win.style.width, h: win.style.minHeight, l: win.style.left, t: win.style.top
            });
            if (window.matchMedia('(max-width: 900px)').matches) return;
            win.style.width = (UI_W - 60) + 'px';
            win.style.minHeight = (UI_H - 110) + 'px';
            win.style.left = '30px';
            win.style.top = '44px';
        } else {
            try {
                var p = JSON.parse(win.dataset.prev || '{}');
                win.style.width = p.w || win.style.width;
                win.style.minHeight = p.h || '';
                win.style.left = p.l || win.style.left;
                win.style.top = p.t || win.style.top;
            } catch (err) { /* ignore */ }
        }
    }

    function bringToFront(win) {
        zTop += 1;
        win.style.zIndex = zTop;
        Object.keys(openWins).forEach(function (k) {
            if (openWins[k] && openWins[k] !== win) openWins[k].classList.remove('is-focus');
        });
        win.classList.add('is-focus');
    }

    function closeWindow(win) {
        if (!win) return;
        var id = win.dataset.app;
        if (id) delete openWins[id];
        win.classList.add('is-closing');
        setTimeout(function () {
            if (win.parentNode) win.parentNode.removeChild(win);
        }, 200);
        if (id) {
            var app = findApp(id);
            if (app && typeof app.onClose === 'function') app.onClose();
        }
    }

    function closeAll() {
        Object.keys(openWins).forEach(function (k) { closeWindow(openWins[k]); });
    }

    function topWindow() {
        var list = Object.keys(openWins).map(function (k) { return openWins[k]; });
        if (!list.length) return null;
        return list.sort(function (a, b) {
            return (parseInt(a.style.zIndex, 10) || 0) - (parseInt(b.style.zIndex, 10) || 0);
        }).pop();
    }

    function closeTop() { closeWindow(topWindow()); }
    function zoomTop() { toggleZoom(topWindow()); }

    function findApp(id) {
        for (var i = 0; i < DESKTOP_APPS.length; i++) {
            if (DESKTOP_APPS[i].id === id) return DESKTOP_APPS[i];
        }
        return null;
    }

    function openApp(id) {
        /* the letter is not written yet — it stays shut everywhere */
        if (id === 'letter' && !LETTER_LIVE) { toast(LETTER_SOON); return null; }
        var app = findApp(id);
        if (!app) return null;
        if (openWins[id]) { bringToFront(openWins[id]); return openWins[id]; }
        return createWindow(app);
    }

    /* ---------- menus ---------- */

    function buildMenus() {
        var bar = document.querySelector('.ui-menubar');
        if (!bar) return;
        var drop = make('div', 'ui-drop');
        scrUi.appendChild(drop);

        function closeDrop() {
            drop.classList.remove('is-open');
            Array.prototype.forEach.call(document.querySelectorAll('.ui-menu.is-open, .ui-logo.is-open'),
                function (b) { b.classList.remove('is-open'); });
        }

        MENUS.forEach(function (m) {
            var btn = m.id === 'logo' ? $('uiLogo') : bar.querySelector('[data-menu="' + m.id + '"]');
            if (!btn) return;
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var wasOpen = drop.classList.contains('is-open') && drop.dataset.menu === m.id;
                closeDrop();
                if (wasOpen) return;
                drop.dataset.menu = m.id;
                drop.innerHTML = m.items.map(function (it, i) {
                    if (it.sep) return '<div class="ui-drop-sep"></div>';
                    return '<button class="ui-drop-item" type="button" data-i="' + i + '"' +
                        (it.disabled ? ' disabled' : '') + '>' + it.label + '</button>';
                }).join('');
                drop.style.left = Math.max(8, btn.offsetLeft) + 'px';
                drop.classList.add('is-open');
                btn.classList.add('is-open');
                Array.prototype.forEach.call(drop.querySelectorAll('.ui-drop-item'), function (item) {
                    item.addEventListener('click', function () {
                        var def = m.items[parseInt(item.dataset.i, 10)];
                        closeDrop();
                        if (def && typeof def.act === 'function') def.act();
                    });
                });
            });
        });

        document.addEventListener('click', closeDrop);
        scrUi.addEventListener('click', function (e) { e.stopPropagation(); closeDrop(); });
    }

    function showAbout() {
        var win = openWins.about;
        if (win) { bringToFront(win); return; }
        var app = {
            id: 'about', title: '\u5173\u4E8E TY-OS', w: 420, h: 200,
            render: function (body) {
                body.innerHTML =
                    '<p><strong>TY-OS 1.0</strong> \u2014 \u5728\u4E00\u95F4\u5B89\u9759\u623F\u95F4\u7684\u4E66\u684C\u4E0A\u642D\u6210\u3002</p>' +
                    '<p class="ui-tip">\u4E00\u5757\u5C4F\u5E55\uFF0C\u51E0\u4E2A\u56FE\u6807\uFF0C\u4E00\u4E2A\u5C01\u7740\u7684\u4FE1\u5C01\u3002<br>' +
                    '\u628A\u53F0\u706F\u5173\u6389\u5427\uFF0C\u5C4F\u5E55\u4F1A\u4E00\u76F4\u6696\u7740\u3002</p>';
            }
        };
        DESKTOP_APPS.push(app);
        createWindow(app);
    }

    function powerOff() {
        closeAll();
        room.classList.add('screen-off');
        toast('\u665A\u5B89\u2014\u2014\u6309\u7535\u6E90\u952E\u56DE\u6765\u3002');
    }

    /* ---------- app renderers ---------- */

    /* the quiz (js/quiz.js) registers itself at runtime, so only queue it
       once it exists — and only once per visit, so closing it doesn't
       drag it back. */
    var quizQueued = false;

    /* is somebody in the middle of the letter? (window or the big paper) */
    function deskBusy() {
        return !!(openWins.letter || (letterFloat && !letterFloat.hidden));
    }

    function queueQuiz(delay) {
        if (quizQueued || openWins.quiz) return;
        if (!findApp('quiz')) return;
        quizQueued = true;
        setTimeout(function () {
            if (openWins.quiz || !findApp('quiz')) { quizQueued = false; return; }
            /* never cover the letter — hand the flag back and wait for
               the letter itself to trigger the next pass */
            if (deskBusy()) { quizQueued = false; return; }
            openApp('quiz');
        }, delay || 620);
    }

    function renderWelcomeApp(body, win) {
        win.querySelector('.ui-win-title').textContent = '\u6B22\u8FCE\u4F7F\u7528 TY-OS';
        body.innerHTML =
            '<div class="wz">' +
                '<div class="wz-art">' + WIZ_ART + '</div>' +
                '<div class="wz-text">' +
                    '<div class="wz-h">\u6B22\u8FCE\u4F7F\u7528 TY-OS\u3002</div>' +
                    '<p>\u8FD9\u53F0\u673A\u5668\u4E0A\u53EA\u6709\u4E00\u4EF6\u8981\u7D27\u7684\u4E8B\uFF1A<strong>\u4FE1\u4EF6</strong>\u91CC\u7684\u90A3\u4E2A\u4FE1\u5C01\u3002\u5B83\u5C01\u7740\uFF0C\u7B54\u5BF9\u5361\u7247\u4E0A\u7684\u95EE\u9898\u624D\u4F1A\u6253\u5F00\u3002</p>' +
                    '<p class="ui-tip">\u70B9\u684C\u9762\u4E0A\u7684\u56FE\u6807\u5C31\u80FD\u6253\u5F00\uFF0C\u6807\u9898\u680F\u53EF\u4EE5\u62D6\u7740\u8D70\u3002\u5173\u6389\u8FD9\u4E2A\u7A97\u53E3\uFF0C\u95EE\u5377\u4F1A\u81EA\u5DF1\u8DD1\u51FA\u6765\u3002</p>' +
                    '<div class="wz-actions">' +
                        '<button class="ui-btn is-primary" type="button" data-act="open-letter">\u6253\u5F00\u4FE1\u4EF6</button>' +
                        '<button class="ui-btn" type="button" data-act="later">\u5F85\u4E00\u4F1A\u513F</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        body.querySelector('[data-act="open-letter"]').addEventListener('click', function () {
            openApp('letter');
            queueQuiz(1500);   /* held back while they read — see deskBusy() */
        });
        body.querySelector('[data-act="later"]').addEventListener('click', function () {
            closeWindow(win);
            queueQuiz(620);
        });
    }

    function renderLetterApp(body, win) {
        if (unlocked) return renderLetterOpened(body, win);

        win.querySelector('.ui-win-title').textContent = '\u4FE1\u4EF6 \u2014 \u672A\u542F\u5C01';
        body.innerHTML =
            '<div class="lock-top">' +
                '<span class="lock-glyph">' + LOCK_GLYPH_LOCKED + '</span>' +
                '<p class="lock-q">' + QUESTION + '</p>' +
            '</div>' +
            '<form class="lock-form">' +
                '<input class="lock-input" type="text" maxlength="10" autocomplete="off" spellcheck="false" placeholder="\u00B7\u00B7\u00B7\u00B7\u00B7" aria-label="\u7B54\u6848">' +
                '<button class="ui-btn is-primary" type="submit">\u89E3\u9501</button>' +
            '</form>' +
            '<p class="lock-msg">\u8F93\u5165\u7B54\u6848\uFF0C\u6309\u56DE\u8F66\u3002</p>' +
            '<div class="lock-hints"><button class="lock-hint-btn" type="button">\u8981\u4E2A\u63D0\u793A\uFF1F</button>' +
            '<div class="lock-hint-list"></div></div>' +
            '<span class="lock-stamp">\u4EB2\u624B\u5C01\u4E0A</span>';

        var input = body.querySelector('.lock-input');
        var msg = body.querySelector('.lock-msg');
        var hintList = body.querySelector('.lock-hint-list');
        var hintIndex = 0;

        body.querySelector('.lock-hint-btn').addEventListener('click', function () {
            if (hintIndex >= HINTS.length) { hintIndex = 0; hintList.innerHTML = ''; return; }
            hintList.appendChild(make('div', 'lock-hint-line', HINTS[hintIndex]));
            hintIndex += 1;
            this.textContent = hintIndex >= HINTS.length ? '\u6536\u8D77\u63D0\u793A' : '\u518D\u6765\u4E00\u6761\uFF1F';
        });

        body.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            submitLock();
        });

        setTimeout(function () { input.focus(); }, 120);
    }

    function normalise(v) {
        return (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    function submitLock() {
        var input = document.querySelector('.lock-input');
        if (!input) return;
        var msg = document.querySelector('.lock-msg');
        var win = openWins.letter;
        var value = normalise(input.value);

        if (!value) return;

        if (value === normalise(PASSWORD)) {
            unlocked = true;
            attempts = 0;
            input.classList.remove('is-bad');
            input.classList.add('is-ok');
            input.readOnly = true;
            if (msg) {
                msg.className = 'lock-msg is-ok';
                msg.textContent = '\u89E3\u9501\u4E86\u3002\u4FE1\u5C01\u6B63\u5728\u6253\u5F00\u2026';
            }
            var glyph = document.querySelector('.lock-glyph');
            if (glyph) glyph.innerHTML = LOCK_GLYPH_OPEN;
            room.classList.add('unlocked');
            var icon = iconsLayer && iconsLayer.querySelector('[data-app="letter"]');
            if (icon) {
                var badge = icon.querySelector('.ui-icon-badge');
                if (badge) badge.parentNode.removeChild(badge);
            }
            var dockHint = $('uiDockHint');
            if (dockHint) dockHint.textContent = '\u5DF2\u89E3\u9501 \u00B7 \u4FE1\u5728\u684C\u4E0A';
            heartPop();
            setTimeout(function () {
                closeWindow(win);
                openLetter();
            }, 950);
            return;
        }

        attempts += 1;
        if (msg) {
            msg.className = 'lock-msg is-bad';
            msg.textContent = attempts === 1
                ? '\u4E0D\u662F\u8FD9\u4E2A\u3002\u518D\u8BD5\u8BD5\u3002'
                : '\u8FD8\u4E0D\u5BF9\u2014\u2014\u5DF2\u7ECF ' + attempts + ' \u6B21\u4E86\u3002\u63D0\u793A\u6309\u94AE\u5C31\u5728\u90A3\u513F\u3002';
        }
        input.classList.remove('is-bad');
        void input.offsetWidth;
        input.classList.add('is-bad');
        input.select();
    }

    function renderLetterOpened(body, win) {
        win.querySelector('.ui-win-title').textContent = '\u4FE1\u4EF6 \u2014 \u7ED9 ty';
        body.innerHTML =
            '<div class="wz">' +
                '<div class="wz-art">' + ICONS.letter + '</div>' +
                '<div class="wz-text">' +
                    '<div class="wz-h">\u9001\u5230\u4E86\u3002</div>' +
                    '<p>\u4FE1\u7EB8\u4ECE\u4FE1\u5C01\u91CC\u51FA\u6765\uFF0C\u8EBA\u5728\u684C\u4E0A\u4E86\u3002\u968F\u65F6\u53EF\u4EE5\u518D\u8BFB\u4E00\u904D\u2014\u2014\u5B83\u8BF4\u7684\u8FD8\u662F\u540C\u4E00\u4EF6\u4E8B\u3002</p>' +
                    '<p class="ui-tip">\u4E00\u4E2A\u5468\u4E8C\u4EB2\u624B\u5C01\u4E0A\uFF0C\u88AB\u4F60\u6253\u5F00\u3002</p>' +
                    '<div class="wz-actions">' +
                        '<button class="ui-btn is-primary" type="button" data-act="read">\u518D\u8BFB\u4E00\u904D</button>' +
                        '<button class="ui-btn" type="button" data-act="close">\u6536\u8D77\u6765</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        body.querySelector('[data-act="read"]').addEventListener('click', openLetter);
        body.querySelector('[data-act="close"]').addEventListener('click', function () { closeWindow(win); });
    }

    /* ---------- clock + toast ---------- */

    function tickClock() {
        var el = $('uiClock');
        if (!el) return;
        var d = new Date();
        var days = ['\u5468\u65E5', '\u5468\u4E00', '\u5468\u4E8C', '\u5468\u4E09', '\u5468\u56DB', '\u5468\u4E94', '\u5468\u516D'];
        var h = d.getHours();
        var m = d.getMinutes();
        el.textContent = days[d.getDay()] + ' ' + h + ':' + (m < 10 ? '0' + m : m);
    }

    var toastTimer = null;
    function toast(text) {
        var el = document.querySelector('.ui-toast');
        if (!el) {
            el = make('div', 'ui-toast');
            scrUi.appendChild(el);
        }
        el.textContent = text;
        el.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3400);
    }

    function heartPop() {
        var el = make('div', 'heart-pop', '\u2665');
        screenEl.appendChild(el);
        requestAnimationFrame(function () { el.classList.add('is-on'); });
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 1300);
    }

    /* ============================================================
       6 · boot
       ============================================================ */

    function boot() {
        var bootEl = $('scrBoot');
        room.classList.add('crt-on');
        setTimeout(function () { room.classList.remove('crt-on'); }, 700);

        setTimeout(function () {
            if (bootEl) bootEl.classList.add('is-done');
            setTimeout(function () {
                /* the quiz is the front door now — the welcome window only
                   shows up if js/quiz.js failed to register its app */
                if (findApp('quiz')) openApp('quiz');
                else openApp('welcome');
            }, 480);
        }, 2400);
    }

    /* ============================================================
       7 · the letter out of the screen
       ============================================================ */

    var letterFloat = $('letterFloat');
    var paperEl = $('paper');
    var lineTimers = [];

    function openLetter() {
        if (!LETTER_LIVE) { toast(LETTER_SOON); return; }
        if (!unlocked) { openApp('letter'); return; }
        if (!letterFloat.hidden) return;

        resetLines();
        letterFloat.hidden = false;
        requestAnimationFrame(function () { letterFloat.classList.add('is-open'); });

        setTimeout(function () {
            letterFloat.classList.add('is-paper');
            if (paperEl) paperEl.scrollTop = 0;
            revealLines();
        }, 1250);
        room.classList.add('focus');
    }

    function closeLetter() {
        letterFloat.classList.remove('is-paper');
        room.classList.remove('focus');
        setTimeout(function () { letterFloat.classList.remove('is-open'); }, 320);
        setTimeout(function () {
            letterFloat.hidden = true;
            resetLines();
            queueQuiz(900);   /* letter put away → quiz steps in */
        }, 1000);
    }

    function revealLines() {
        var lines = document.querySelectorAll('.paper .ln');
        Array.prototype.forEach.call(lines, function (el, i) {
            lineTimers.push(setTimeout(function () { el.classList.add('is-in'); }, 340 * i));
        });
    }

    function resetLines() {
        lineTimers.forEach(clearTimeout);
        lineTimers = [];
        Array.prototype.forEach.call(document.querySelectorAll('.paper .ln'), function (el) {
            el.classList.remove('is-in');
        });
    }

    function bindLetter() {
        if (!letterFloat) return;
        $('paperBack').addEventListener('click', closeLetter);
        $('lfScrim').addEventListener('click', closeLetter);
        var reply = $('paperReply');
        if (reply) {
            reply.addEventListener('click', function () {
                toast('\u56DE\u590D\u529F\u80FD\u7559\u7ED9\u4EE5\u540E\u2014\u2014\u5728 js/letter.js \u91CC\u63A5\u4E0A\u3002');
            });
        }
    }

    /* ============================================================
       8 · room controls + public hooks
       ============================================================ */

    function bindRoom() {
        var lamp = $('lampBtn');
        if (lamp) {
            lamp.addEventListener('click', function () {
                var on = lamp.classList.toggle('is-on');
                lamp.setAttribute('aria-pressed', on ? 'true' : 'false');
                room.classList.toggle('lamp-off', !on);
            });
        }

        var power = $('powerBtn');
        if (power) {
            power.addEventListener('click', function () {
                var off = room.classList.toggle('screen-off');
                if (!off) {
                    room.classList.add('crt-on');
                    setTimeout(function () { room.classList.remove('crt-on'); }, 620);
                }
            });
        }

        /* the drawn mouse nudges the whole room a little */
        var mouseEl = $('mouse');
        if (mouseEl) {
            mouseEl.addEventListener('click', function () {
                if (!unlocked) toast('The mouse works. The envelope still needs an answer.');
            });
        }

        bindLetter();
    }

    /* ---------- init ---------- */

    buildShelf();
    buildKeyboard();
    buildMouse();
    buildIcons();
    buildMenus();
    bindRoom();
    tickClock();
    setInterval(tickClock, 20000);
    fitDesktop();

    if (window.ResizeObserver) {
        new ResizeObserver(fitDesktop).observe(screenEl);
    }
    window.addEventListener('resize', fitDesktop);
    window.addEventListener('load', function () { setTimeout(boot, 420); });

    /* public interface — see letter-desk-guide.md */
    window.LetterDesk = {
        apps: DESKTOP_APPS,
        books: BOOKS,
        password: PASSWORD,
        isUnlocked: function () { return unlocked; },
        openApp: openApp,
        closeApp: function (id) { closeWindow(openWins[id]); },
        closeAll: closeAll,
        openLetter: openLetter,
        closeLetter: closeLetter,
        toast: toast,
        registerApp: function (app) {
            if (!app || !app.id) return null;
            if (findApp(app.id)) return findApp(app.id);
            DESKTOP_APPS.push(app);
            if (!app.hidden && iconsLayer) iconsLayer.appendChild(iconEl(app));
            return app;
        },
        unregisterApp: function (id) {
            var app = findApp(id);
            if (!app) return;
            closeWindow(openWins[id]);
            DESKTOP_APPS.splice(DESKTOP_APPS.indexOf(app), 1);
            var icon = iconsLayer && iconsLayer.querySelector('[data-app="' + id + '"]');
            if (icon) icon.parentNode.removeChild(icon);
        }
    };
})();
