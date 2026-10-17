/* ============================================
   Mini Player — persistent bar across pages
   One thin bar at the bottom-right of every page.
   Playback state lives in localStorage:
     { id, pos, ts, playing, muted }
   "pos" is the position at timestamp "ts", so the
   next page resumes at pos + (now - ts) seconds.
   The car player (musics.html) publishes into the
   same store via MiniPlayer.publish() and renders
   no bar of its own.

   All writes funnel through commit() on ONE
   in-memory state object — throttled trailing
   writes can never clobber a fresher mute toggle
   (they write the same object).
   ============================================ */

(function () {
    'use strict';

    var LS_KEY = 'gift-mini-player-v1';
    var TRACKS = window.GIFT_TRACKS || [];
    var isMusicPage = !!document.getElementById('musicPage');

    // ---------------------------------------------------------------
    // State store
    // ---------------------------------------------------------------
    var stMem = null;        // canonical in-memory state (lazy-loaded)
    var lastWrite = 0;
    var writeTimer = null;
    var iconFn = null;       // injected by main.js
    var soundBtn = null;     // the nav mute button
    var lastMuted = null;
    var muteToggler = null;  // injected by music.js (car player mute)

    function loadLS() {
        try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }
        catch (e) { return null; }
    }
    function saveLS(st) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch (e) {}
    }
    function stGet() {
        if (!stMem) {
            stMem = loadLS() || { id: null, pos: 0, ts: 0, playing: false, muted: false };
        }
        return stMem;
    }
    // where playback should be right now, given the stored moment
    function livePos(st) {
        if (!st.playing) return st.pos || 0;
        return (st.pos || 0) + (Date.now() - (st.ts || Date.now())) / 1000;
    }

    function syncIcon(st) {
        if (lastMuted === st.muted) return;
        lastMuted = st.muted;
        if (soundBtn) soundBtn.classList.toggle('muted', !!st.muted);
        if (iconFn) iconFn(!!st.muted);
    }

    function commit(patch, immediate) {
        var st = stGet();
        var k;
        for (k in patch) st[k] = patch[k];
        st.ts = Date.now();
        syncIcon(st);
        var now = Date.now();
        if (immediate || now - lastWrite > 900) {
            if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
            saveLS(st); lastWrite = now;
            return;
        }
        if (!writeTimer) {
            writeTimer = setTimeout(function () {
                writeTimer = null;
                saveLS(stGet()); lastWrite = Date.now();
            }, 1000);
        }
    }
    function commitNow() { commit({}, true); }

    window.MiniPlayer = {
        // merge a patch into the stored state (throttled unless immediate)
        publish: function (patch, opts) { commit(patch, !!(opts && opts.immediate)); },
        clear: function () {
            commit({ id: null, pos: 0, playing: false }, true);
        },
        setIconUpdater: function (fn, btn) {
            iconFn = fn; soundBtn = btn;
            var st = stGet();
            if (st.id) {
                lastMuted = null;
                syncIcon(st);          // reflect persisted mute on load
            }
        },
        setMuteToggler: function (fn) { muteToggler = fn; },
        initialMuted: function () { return !!stGet().muted; },
        // what another page should resume from: the stored moment plus
        // however many seconds have ticked by since it was written
        snapshot: function () {
            var st = stGet();
            return { id: st.id, pos: livePos(st), playing: !!st.playing, muted: !!st.muted };
        },
        // returns true when the click belongs to the player (so the legacy
        // ambient drone in main.js stays off); false = fall through
        onSoundToggleClick: function () {
            var st = stGet();
            if (isMusicPage) {
                commit({ muted: !st.muted }, true);
                if (muteToggler) muteToggler(st.muted);
                return true;
            }
            if (!st.id) return false;   // never played anything → ambient fallback
            commit({ muted: !st.muted }, true);
            if (audio) audio.muted = st.muted;
            return true;
        }
    };

    // ---------------------------------------------------------------
    // Bar + engine (every page except the car player itself)
    // ---------------------------------------------------------------
    if (isMusicPage) return;

    var audio = null;
    var cur = null;         // current track object
    var bar = null;
    var els = {};

    function trackById(id) {
        for (var i = 0; i < TRACKS.length; i++) {
            if (TRACKS[i].id === id) return TRACKS[i];
        }
        return null;
    }
    function trackIndex(t) { return TRACKS.indexOf(t); }
    function fmt(s) {
        s = Math.max(0, Math.floor(s));
        return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    }

    var SVG = {
        play: '<svg class="ic-play" viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M8.4 5.5v13l10.4-6.5z"/></svg>',
        pause: '<svg class="ic-pause" viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M7.6 5.5h3.2v13H7.6zM13.2 5.5h3.2v13h-3.2z"/></svg>',
        prev: '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 6h2.4v12H7zM19 6l-9.2 6L19 18z"/></svg>',
        next: '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14.6 6H17v12h-2.4zM5 6l9.2 6L5 18z"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    };

    function buildBar() {
        if (bar) return;
        bar = document.createElement('div');
        bar.className = 'mini-player is-hidden';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Mini player');
        bar.innerHTML =
            '<span class="mp-progress"><span class="mp-fill"></span></span>' +
            '<button class="mp-cover" aria-label="Open the music page"></button>' +
            '<div class="mp-meta">' +
                '<span class="mp-title"></span>' +
                '<span class="mp-artist"></span>' +
            '</div>' +
            '<div class="mp-eq" aria-hidden="true"><i></i><i></i><i></i></div>' +
            '<button class="mp-btn mp-prev" aria-label="Previous">' + SVG.prev + '</button>' +
            '<button class="mp-btn mp-play" aria-label="Play / pause">' + SVG.play + SVG.pause + '</button>' +
            '<button class="mp-btn mp-next" aria-label="Next">' + SVG.next + '</button>' +
            '<button class="mp-btn mp-close" aria-label="Close player">' + SVG.close + '</button>';
        document.body.appendChild(bar);
        els.fill = bar.querySelector('.mp-fill');
        els.cover = bar.querySelector('.mp-cover');
        els.title = bar.querySelector('.mp-title');
        els.artist = bar.querySelector('.mp-artist');
        els.eq = bar.querySelector('.mp-eq');
        els.time = document.createElement('span');
        els.time.className = 'mp-time';
        bar.querySelector('.mp-meta').appendChild(els.time);

        els.cover.addEventListener('click', function () { window.location.href = 'musics.html'; });
        bar.querySelector('.mp-meta').addEventListener('click', function () { window.location.href = 'musics.html'; });
        bar.querySelector('.mp-play').addEventListener('click', togglePlay);
        bar.querySelector('.mp-prev').addEventListener('click', prevTrack);
        bar.querySelector('.mp-next').addEventListener('click', function () { stepTrack(1, true); });
        bar.querySelector('.mp-close').addEventListener('click', function () {
            pause();
            bar.classList.add('is-hidden');
        });

        // click the thin progress line to seek
        var prog = bar.querySelector('.mp-progress');
        prog.addEventListener('click', function (e) {
            if (!cur || !audio) return;
            var r = prog.getBoundingClientRect();
            var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
            try { audio.currentTime = pct * (audio.duration || cur.dur); } catch (err) {}
            commitNow();
        });
    }

    function ensureAudio() {
        if (audio) return audio;
        audio = new Audio();
        audio.preload = 'auto';
        audio.muted = stGet().muted;
        audio.addEventListener('timeupdate', function () {
            if (!cur) return;
            renderProgress();
            publishProgress();
        });
        audio.addEventListener('ended', function () { stepTrack(1, true); });
        audio.addEventListener('loadedmetadata', function () {
            if (cur && isFinite(audio.duration) && audio.duration > 1) cur.dur = audio.duration;
        });
        audio.addEventListener('error', function () {
            if (!cur) return;
            setPlayingUI(false);
        });
        return audio;
    }

    function renderProgress() {
        if (!cur || !els.fill) return;
        var dur = (audio && isFinite(audio.duration) && audio.duration > 1) ? audio.duration : cur.dur;
        var p = Math.min(1, (audio ? audio.currentTime : 0) / dur);
        els.fill.style.width = (p * 100).toFixed(2) + '%';
        if (els.time) els.time.textContent = fmt(audio ? audio.currentTime : 0) + ' / ' + fmt(dur);
    }

    function setPlayingUI(on) {
        if (!bar) return;
        bar.classList.toggle('is-playing', on);
    }

    function publishProgress() {
        if (!cur) return;
        commit({ id: cur.id, pos: audio ? audio.currentTime : 0, playing: !!(audio && !audio.paused) });
    }

    function setTrack(t, pos, autoplay) {
        cur = t;
        ensureAudio();
        audio.muted = stGet().muted;
        audio.src = t.file;
        audio.load();
        var start = function () {
            try { audio.currentTime = Math.max(0, Math.min(pos, (audio.duration || t.dur) - 0.5)); } catch (e) {}
            if (autoplay) play(); else renderProgress();
        };
        if (audio.readyState >= 1) start();
        else audio.addEventListener('loadedmetadata', start, { once: true });
        // safety net: some engines ignore a seek issued straight after
        // metadata, so re-assert it once the file can actually play
        if (pos > 0.5) {
            audio.addEventListener('canplay', function () {
                if (!cur || cur !== t) return;
                try {
                    if (Math.abs(audio.currentTime - pos) > 1.2) {
                        audio.currentTime = Math.min(pos, (audio.duration || t.dur) - 0.5);
                    }
                } catch (e) {}
            }, { once: true });
        }

        els.cover.style.backgroundImage = 'url("' + t.cover + '")';
        els.title.textContent = t.title;
        els.artist.textContent = t.artist;
        bar.classList.remove('is-hidden');
        renderProgress();
        commit({ id: t.id, pos: pos, playing: false }, true);
    }

    function play() {
        if (!cur) return;
        ensureAudio();
        var p = audio.play();
        if (p && p.then) {
            p.then(function () { setPlayingUI(true); commit({ playing: true }, true); })
             .catch(function () {
                 // autoplay refused (no user gesture yet) — stay paused,
                 // one tap on the bar's play button picks it up
                 setPlayingUI(false);
                 commit({ playing: false }, true);
             });
        } else {
            commit({ playing: true }, true);
        }
    }
    function pause() {
        if (audio) audio.pause();
        setPlayingUI(false);
        commit({ playing: false }, true);
    }
    function togglePlay() {
        if (!cur) return;
        if (audio && !audio.paused) pause(); else play();
    }
    function stepTrack(dir, autoplay) {
        if (!TRACKS.length) return;
        var i = cur ? trackIndex(cur) : -1;
        var n = (i + dir + TRACKS.length) % TRACKS.length;
        setTrack(TRACKS[n], 0, autoplay);
    }
    function prevTrack() {
        if (audio && audio.currentTime > 3) {
            try { audio.currentTime = 0; } catch (e) {}
            commitNow();
            return;
        }
        stepTrack(-1, !!(audio && !audio.paused));
    }

    // save an exact position when the page goes away
    window.addEventListener('pagehide', function () {
        if (cur && audio && !audio.paused) commitNow();
    });

    // ---------------------------------------------------------------
    // Boot: pick up whatever the last page left behind
    // ---------------------------------------------------------------
    var st0 = stGet();
    if (st0.id && TRACKS.length) {
        var t0 = trackById(st0.id);
        if (t0) {
            buildBar();
            var pos = livePos(st0);
            if (pos >= t0.dur - 1.5) pos = 0;   // finished while we were away
            setTrack(t0, pos, st0.playing);
        }
    }
})();
