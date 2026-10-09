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

    /* ============================================================
       1 · the lock
       ============================================================ */

    var PASSWORD = 'TS669';
    var QUESTION = '\u5982\u679C\u53EF\u4EE5\u81EA\u5DF1\u6311\u9009\u8F66\u724C\uFF0Cty \u4F1A\u6311\u9009\u4EC0\u4E48\uFF1F';
    var HINTS = [
        'Two letters, three digits. Both letters are someone you know by heart.',
        'The letters are her initials. The numbers are the luckiest kind.'
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
        shelfNote.querySelector('.shelf-note-tag').textContent = b.tag + ' \u00B7 KEEP FOREVER';
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

                /* the reference board mixes cream caps with silver butterfly caps;
                   those caps keep a small legend in the corner, like the real set */
                if (r > 0 && r < 5 && !k.cls && ((r * 2 + c) % 3 !== 0)) {
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
            id: 'letter', label: 'Letter', type: 'letter', title: 'Letter \u2014 sealed',
            icon: ICONS.letter, w: 700, h: 470, locked: true,
            render: renderLetterApp
        },
        {
            id: 'arcade', label: 'Arcade', type: 'placeholder', title: 'Arcade',
            icon: ICONS.arcade, w: 560, h: 320,
            note: 'Reserved for a small game.',
            detail: 'Drop a game in later: register an app with <code>type:"minigame"</code> and a <code>mount(el)</code> function in <code>js/letter.js</code> \u2014 the window shell is already handled.',
            tip: 'Ideas: snake, 2048, a memory match with our photos.'
        },
        {
            id: 'links', label: 'Links', type: 'links', title: 'Links',
            icon: ICONS.links, w: 620, h: 360
        },
        {
            id: 'notes', label: 'Notes', type: 'notes', title: 'Notes',
            icon: ICONS.notes, w: 520, h: 330
        },
        {
            id: 'trash', label: 'Trash', type: 'placeholder', title: 'Trash',
            icon: ICONS.trash, w: 480, h: 240,
            note: 'Nothing in here.',
            detail: 'Everything worth keeping is already on the desk.',
            tip: 'Empty. The way we like it.'
        },
        {
            id: 'welcome', label: 'Welcome', type: 'welcome', title: 'Welcome',
            hidden: true, w: 640, h: 330, render: renderWelcomeApp
        }
    ];

    /* hyperlinks — add { label, url } entries and Links.app lists them */
    var LINKS = [];

    /* short notes shown in Notes.app */
    var NOTES = [
        { h: '01', t: 'buy more sticky notes' },
        { h: '02', t: 'the plate is not a secret' },
        { h: '03', t: 'ask her about the song at 1:04' }
    ];

    var MENUS = [
        { id: 'logo', label: '\u273F', items: [
            { label: 'About TY-OS\u2026', act: showAbout },
            { sep: true },
            { label: 'Open the letter', act: function () { openApp('letter'); } },
            { label: 'Show desktop', act: closeAll },
            { sep: true },
            { label: 'Shut down', act: powerOff }
        ] },
        { id: 'file', label: 'File', items: [
            { label: 'Open the letter', act: function () { openApp('letter'); } },
            { label: 'New note', act: function () { openApp('notes'); } },
            { sep: true },
            { label: 'Close window', act: closeTop }
        ] },
        { id: 'edit', label: 'Edit', items: [
            { label: 'Undo', disabled: true },
            { label: 'Cut', disabled: true },
            { label: 'Copy', disabled: true },
            { label: 'Paste', disabled: true }
        ] },
        { id: 'view', label: 'View', items: [
            { label: 'Zoom window', act: zoomTop },
            { label: 'Show desktop', act: closeAll }
        ] },
        { id: 'special', label: 'Special', items: [
            { label: 'Empty trash', disabled: true },
            { label: 'Restart TY-OS', act: function () { location.reload(); } }
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
        scrUi.style.setProperty('--ui-scale', (w / UI_W).toFixed(4));
    }

    /* ---------- icons ---------- */

    function iconEl(app) {
        var el = make('button', 'ui-icon');
        el.type = 'button';
        el.dataset.app = app.id;
        el.innerHTML = '<span class="ui-icon-art">' + app.icon + '</span>' +
            '<span class="ui-icon-label">' + app.label + '</span>' +
            (app.locked ? '<span class="ui-icon-badge"></span>' : '');
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
                    '<button class="ui-dot ui-dot-close" type="button" aria-label="Close"></button>' +
                    '<button class="ui-dot ui-dot-zoom" type="button" aria-label="Zoom"></button>' +
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
            '<div class="wz-h">' + (app.note || 'Coming soon') + '</div>' +
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
        if (win.dataset.app) delete openWins[win.dataset.app];
        win.classList.add('is-closing');
        setTimeout(function () {
            if (win.parentNode) win.parentNode.removeChild(win);
        }, 200);
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
            id: 'about', title: 'About TY-OS', w: 420, h: 200,
            render: function (body) {
                body.innerHTML =
                    '<p><strong>TY-OS 1.0</strong> \u2014 built on a desk in a quiet room.</p>' +
                    '<p class="ui-tip">One screen, five icons, one sealed envelope.<br>' +
                    'Turn the lamp off. The screen stays warm.</p>';
            }
        };
        DESKTOP_APPS.push(app);
        createWindow(app);
    }

    function powerOff() {
        closeAll();
        room.classList.add('screen-off');
        toast('Good night \u2014 press the power button to come back.');
    }

    /* ---------- app renderers ---------- */

    function renderWelcomeApp(body, win) {
        win.querySelector('.ui-win-title').textContent = 'Welcome to TY-OS';
        body.innerHTML =
            '<div class="wz">' +
                '<div class="wz-art">' + WIZ_ART + '</div>' +
                '<div class="wz-text">' +
                    '<div class="wz-h">Welcome to TY-OS.</div>' +
                    '<p>There is one thing on this machine that matters: an envelope in <strong>Letter</strong>. It is sealed, and it only opens if you answer the question on the card.</p>' +
                    '<p class="ui-tip">Click any desktop icon to open it. Drag the title bars. Everything else is a placeholder for later.</p>' +
                    '<div class="wz-actions">' +
                        '<button class="ui-btn is-primary" type="button" data-act="open-letter">Open the letter</button>' +
                        '<button class="ui-btn" type="button" data-act="later">Later</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        body.querySelector('[data-act="open-letter"]').addEventListener('click', function () {
            openApp('letter');
        });
        body.querySelector('[data-act="later"]').addEventListener('click', function () {
            closeWindow(win);
        });
    }

    function renderLetterApp(body, win) {
        if (unlocked) return renderLetterOpened(body, win);

        win.querySelector('.ui-win-title').textContent = 'Letter \u2014 sealed';
        body.innerHTML =
            '<div class="lock-top">' +
                '<span class="lock-glyph">' + LOCK_GLYPH_LOCKED + '</span>' +
                '<p class="lock-q">' + QUESTION + '</p>' +
            '</div>' +
            '<form class="lock-form">' +
                '<input class="lock-input" type="text" maxlength="10" autocomplete="off" spellcheck="false" placeholder="\u00B7\u00B7\u00B7\u00B7\u00B7" aria-label="answer">' +
                '<button class="ui-btn is-primary" type="submit">Unlock</button>' +
            '</form>' +
            '<p class="lock-msg">Type the answer and press enter.</p>' +
            '<div class="lock-hints"><button class="lock-hint-btn" type="button">need a hint?</button>' +
            '<div class="lock-hint-list"></div></div>' +
            '<span class="lock-stamp">SEALED BY HAND</span>';

        var input = body.querySelector('.lock-input');
        var msg = body.querySelector('.lock-msg');
        var hintList = body.querySelector('.lock-hint-list');
        var hintIndex = 0;

        body.querySelector('.lock-hint-btn').addEventListener('click', function () {
            if (hintIndex >= HINTS.length) { hintIndex = 0; hintList.innerHTML = ''; return; }
            hintList.appendChild(make('div', 'lock-hint-line', HINTS[hintIndex]));
            hintIndex += 1;
            this.textContent = hintIndex >= HINTS.length ? 'hide hints' : 'another hint?';
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
                msg.textContent = 'Unlocked. The envelope is opening\u2026';
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
            if (dockHint) dockHint.textContent = 'unlocked \u00B7 the letter is on the desk';
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
                ? 'Not that one. Try again.'
                : 'Still not it \u2014 ' + attempts + ' tries. The hint button is right there.';
        }
        input.classList.remove('is-bad');
        void input.offsetWidth;
        input.classList.add('is-bad');
        input.select();
    }

    function renderLetterOpened(body, win) {
        win.querySelector('.ui-win-title').textContent = 'Letter \u2014 for ty';
        body.innerHTML =
            '<div class="wz">' +
                '<div class="wz-art">' + ICONS.letter + '</div>' +
                '<div class="wz-text">' +
                    '<div class="wz-h">Delivered.</div>' +
                    '<p>The paper is out of the envelope and lying on the desk. Read it again whenever you like \u2014 it will say the same thing.</p>' +
                    '<p class="ui-tip">Sealed by hand on a Tuesday, opened by you.</p>' +
                    '<div class="wz-actions">' +
                        '<button class="ui-btn is-primary" type="button" data-act="read">Read it again</button>' +
                        '<button class="ui-btn" type="button" data-act="close">Put it away</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        body.querySelector('[data-act="read"]').addEventListener('click', openLetter);
        body.querySelector('[data-act="close"]').addEventListener('click', function () { closeWindow(win); });
    }

    function renderLinksApp(body, win) {
        if (!LINKS.length) {
            body.innerHTML =
                '<div class="wz-h">No links yet.</div>' +
                '<p>This window is a real hyperlink list \u2014 it just needs entries.</p>' +
                '<p class="ui-tip">Add them in <code class="ui-code">js/letter.js</code>: ' +
                '<code class="ui-code">LINKS = [{ label: "our playlist", url: "https://\u2026" }]</code></p>';
            return;
        }
        body.innerHTML = '<div class="wz-h">Links</div><div class="ui-linklist">' +
            LINKS.map(function (l, i) {
                return '<a class="ui-link" href="' + l.url + '" target="_blank" rel="noopener">' +
                    (i + 1) + '. ' + l.label + '</a>';
            }).join('') + '</div>';
    }

    function renderNotesApp(body, win) {
        body.innerHTML = '<div class="wz-h">Notes to self</div><div class="ui-notelist">' +
            NOTES.map(function (n) {
                return '<div class="ui-note"><span class="ui-note-h">' + n.h + '</span>' +
                    '<span class="ui-note-t">' + n.t + '</span></div>';
            }).join('') + '</div>' +
            '<p class="ui-tip">Edit <code class="ui-code">NOTES</code> in js/letter.js.</p>';
    }

    /* ---------- clock + toast ---------- */

    function tickClock() {
        var el = $('uiClock');
        if (!el) return;
        var d = new Date();
        var days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        var h = d.getHours();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12; if (h === 0) h = 12;
        var m = d.getMinutes();
        el.textContent = days[d.getDay()] + ' ' + h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
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
            setTimeout(function () { openApp('welcome'); }, 480);
        }, 2400);
    }

    /* ============================================================
       7 · the letter out of the screen
       ============================================================ */

    var letterFloat = $('letterFloat');
    var paperEl = $('paper');
    var lineTimers = [];

    function openLetter() {
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
                toast('Reply is reserved \u2014 wire it up in js/letter.js');
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
        links: LINKS,
        notes: NOTES,
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
        },
        addLink: function (label, url) {
            LINKS.push({ label: label, url: url });
        }
    };
})();
