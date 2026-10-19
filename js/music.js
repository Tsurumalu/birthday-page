/* ============================================
   Music — in-car cassette player
   Tape deck · transport · gauges · knobs
   ============================================ */

(function () {
    'use strict';

    var page = document.getElementById('musicPage');
    if (!page) return;

    // ---------------------------------------------------------------
    // Config — drop real mp3 files into assets/music/ with these names
    // and the player switches from silent simulation to real audio.
    // ---------------------------------------------------------------
    // Timed lyrics for the real songs live in js/lyrics-zh.js (parsed from .lrc)
    var ZH = (window.ZH_LYRICS || {});

    function hasCJK(s) { return /[\u4E00-\u9FA5]/.test(s || ''); }

    // Shared library lives in js/tracks-core.js (the site-wide mini player
    // reads the same list). Scene / tape colours / lyrics are presentation
    // extras keyed by id; artist here is the display string for the deck.
    var EXTRAS = {
        'yigege': {
            artist: 'SIDE A \u00B7 \u536b\u5170',
            scene: 'dusk', body: '#d9885a', ink: '#5b2c12', label: '#fbe8da',
            lyrics: ZH['yigege']
        },
        'love-song': {
            artist: 'SIDE B \u00B7 \u65b9\u5927\u540c',
            scene: 'dusk', body: '#c25f79', ink: '#54202f', label: '#fae2e7',
            lyrics: ZH['love-song']
        },
        'chunfengchui': {
            artist: 'SIDE A \u00B7 \u65b9\u5927\u540c',
            scene: 'dusk', body: '#79a55f', ink: '#27421a', label: '#eaf4e0',
            lyrics: ZH['chunfengchui']
        },
        'aiaiai': {
            artist: 'SIDE B \u00B7 \u65b9\u5927\u540c',
            scene: 'city', body: '#c9a13e', ink: '#57430f', label: '#faf1d8',
            lyrics: ZH['aiaiai']
        },
        'tebiederens': {
            artist: 'SIDE A \u00B7 \u65b9\u5927\u540c',
            scene: 'stars', body: '#5b7fb5', ink: '#1e3350', label: '#e6eef9',
            lyrics: ZH['tebiederens']
        },
        'maienli': {
            artist: 'SIDE B \u00B7 \u65b9\u5927\u540c',
            scene: 'stars', body: '#9a6bb0', ink: '#3a2250', label: '#f2e8f8',
            lyrics: ZH['maienli']
        },
        'aibulai': {
            artist: 'FEAT \u00B7 \u65b9\u5927\u540c',
            scene: 'city', body: '#4f9a95', ink: '#173b39', label: '#e2f4f2',
            lyrics: ZH['aibulai']
        },
        'tuofeilun': {
            artist: 'SIDE A \u00B7 \u9648\u5955\u8fc5',
            scene: 'stars', body: '#8a6a4f', ink: '#3d2a18', label: '#f4ead9',
            lyrics: ZH['tuofeilun']
        },
        'v-rose': { artist: 'VIDEO TAPE \u00B7 SIDE A', body: '#b3566a', ink: '#4a1524', label: '#f7e0e6' },
        'v-transparent': { artist: 'VIDEO TAPE \u00B7 SIDE A', body: '#3f7f8c', ink: '#113038', label: '#e0f2f6' },
        'v-eleven': { artist: 'VIDEO TAPE \u00B7 SIDE B', body: '#6c5a92', ink: '#291d45', label: '#ece5f8' },
        'v-lightyear': { artist: 'VIDEO TAPE \u00B7 SIDE B', body: '#4a7fae', ink: '#14314d', label: '#e3eef8' }
    };

    var TRACKS = (window.GIFT_TRACKS || []).map(function (t) {
        var m = {}, k;
        for (k in t) m[k] = t[k];
        var ex = EXTRAS[t.id] || {};
        for (k in ex) m[k] = ex[k];
        return m;
    });

    function pad2(n) { return ('0' + n).slice(-2); }

    var SCENES = {
        dusk: 'assets/scenes/scene-dusk.png',
        city: 'assets/scenes/scene-city.png',
        stars: 'assets/scenes/scene-stars.png'
    };

    // --- elements ---
    var cockpit = document.getElementById('cockpit');
    var wsLayers = document.getElementById('wsLayers');
    var wsCover = document.getElementById('wsCover');
    var wsSpeed = document.getElementById('wsSpeed');
    var huArt = document.getElementById('huArt');
    var huTitle = document.getElementById('huTitle');
    var huArtist = document.getElementById('huArtist');
    var huSrc = document.getElementById('huSrc');
    var huTrk = document.getElementById('huTrk');
    var huMute = document.getElementById('huMute');
    var huClock = document.getElementById('huClock');
    var huFill = document.getElementById('huFill');
    var huProgress = document.getElementById('huProgress');
    var timeNow = document.getElementById('timeNow');
    var timeTotal = document.getElementById('timeTotal');
    var btnPlay = document.getElementById('btnPlay');
    var btnPrev = document.getElementById('btnPrev');
    var btnNext = document.getElementById('btnNext');
    var rack = document.getElementById('rack');
    var deckTape = document.getElementById('deckTape');
    var deckLabel = document.getElementById('deckLabel');
    var deckEmpty = document.getElementById('deckEmpty');
    var btnEject = document.getElementById('btnEject');
    var ledPlay = document.getElementById('ledPlay');
    var ledMute = document.getElementById('ledMute');
    var reelL = document.getElementById('reelL');
    var reelR = document.getElementById('reelR');
    var gaugeSpeed = document.getElementById('gaugeSpeed');
    var gaugeRpm = document.getElementById('gaugeRpm');
    var odometerEl = document.getElementById('odometer');
    var knobVol = document.getElementById('knobVol');
    var knobLight = document.getElementById('knobLight');
    var volLeds = document.getElementById('volLeds');
    var lightLeds = document.getElementById('lightLeds');
    var domeLight = document.getElementById('domeLight');
    var ventBtn = document.getElementById('ventBtn');
    var hazardBtn = document.getElementById('hazardBtn');
    var mirrorBtn = document.getElementById('mirrorBtn');
    var visorL = document.getElementById('visorLeft');
    var visorR = document.getElementById('visorRight');
    var sceneDotsWrap = document.getElementById('sceneDots');
    var spineLeft = document.getElementById('spineLeft');
    var spineRight = document.getElementById('spineRight');
    var wsFrame = document.querySelector('.ws-frame');
    var wsVideo = document.getElementById('wsVideo');
    var lyricLayer = document.getElementById('lyricLayer');
    var lyricTint = document.getElementById('lyricTint');
    var lyricScroll = document.getElementById('lyricScroll');

    // --- state ---
    var current = -1;          // inserted tape index
    var pendingSeek = -1;      // position to apply once metadata lands
    var autoRestoring = false; // true while we auto-resume (no silent fallback)
    var playing = false;
    var simTime = 0;           // simulated playback position (s)
    var tickTimer = null;
    var odoTimer = null;
    var odo = 1314.2;
    var volume = 62;
    var realAudio = null;
    var realMode = false;
    var activeScene = 'dusk';
    var coverPinned = false;   // user chose "cover" view manually

    // --- preload art ---
    TRACKS.forEach(function (t) {
        var a = new Image(); a.src = t.cover;
        if (SCENES[t.scene]) { var s = new Image(); s.src = SCENES[t.scene]; }
    });
    Object.keys(SCENES).forEach(function (k) { var i = new Image(); i.src = SCENES[k]; });

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    function fmt(s) {
        s = Math.max(0, Math.floor(s));
        return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    }

    // video tapes play a clip on the windshield instead of a scene
    function isVideo(i) { return !!(TRACKS[i] && TRACKS[i].kind === 'video'); }
    function videoMode() { return current >= 0 && isVideo(current); }

    function setPlayingUI(on) {
        playing = on;
        var silent = on && !realMode && !videoMode();
        document.body.classList.toggle('tape-playing', on);
        cockpit.classList.toggle('is-playing', on);
        btnPlay.classList.toggle('is-playing', on);
        if (ledPlay) ledPlay.classList.toggle('on', on);
        if (huMute) huMute.classList.toggle('on', silent);
        if (ledMute) ledMute.classList.toggle('on', silent);
        publishState();
    }

    // ---------------------------------------------------------------
    // Mini-player bridge — keeps the song alive across pages
    // ---------------------------------------------------------------
    function publishState(force) {
        if (!window.MiniPlayer) return;
        if (current < 0) { MiniPlayer.clear(); return; }
        var t = TRACKS[current];
        var cur = videoMode() && wsVideo ? (wsVideo.currentTime || 0)
                : (realMode && realAudio ? realAudio.currentTime : simTime);
        MiniPlayer.publish({
            id: t.id,
            pos: cur || 0,
            playing: playing,
            muted: volume === 0
        }, { immediate: !!force });
    }
    window.addEventListener('pagehide', function () { publishState(true); });

    function updateProgress() {
        if (current < 0) return;
        var t = TRACKS[current];
        var cur, dur;
        if (videoMode() && wsVideo) {
            cur = wsVideo.currentTime || 0;
            dur = wsVideo.duration || t.dur;
        } else {
            cur = realMode && realAudio ? realAudio.currentTime : simTime;
            dur = t.dur;
        }
        if (!isFinite(dur) || dur <= 0) dur = t.dur;
        var pct = Math.min(1, cur / dur);
        huFill.style.width = (pct * 100).toFixed(2) + '%';
        timeNow.textContent = fmt(cur);
        updateLyrics();
        publishState();
    }

    // ---------------------------------------------------------------
    // Lyrics on the windshield
    // ---------------------------------------------------------------
    var lyricLines = [];
    var lyricTimes = [];
    var lyricIdx = -1;

    function buildLyrics(t) {
        if (!lyricScroll) return;
        lyricScroll.innerHTML = '';
        lyricLines = [];
        lyricTimes = [];
        lyricIdx = -1;
        var cjk = hasCJK(t.title) || hasCJK(t.artist);
        (t.lyrics || []).forEach(function (line) {
            var p = document.createElement('p');
            p.className = 'lyric-line' + (cjk ? ' is-cjk' : '');
            // timed LRC: { t: seconds, x: text }  |  plain: 'text'
            var timed = (line && typeof line === 'object' && typeof line.t === 'number');
            p.textContent = timed ? line.x : String(line);
            lyricScroll.appendChild(p);
            lyricLines.push(p);
            lyricTimes.push(timed ? line.t : null);
        });
        updateLyrics(true);
    }

    function updateLyrics(force) {
        if (current < 0 || !lyricLines.length) return;
        var t = TRACKS[current];
        var cur = (realMode && realAudio && !realAudio.paused) ? realAudio.currentTime : simTime;
        var idx;
        if (lyricTimes[0] !== null && lyricTimes[0] !== undefined) {
            // walk the LRC timeline: last line whose time has passed
            idx = 0;
            for (var i = 0; i < lyricTimes.length; i++) {
                if (lyricTimes[i] <= cur) idx = i; else break;
            }
        } else {
            var per = t.dur / lyricLines.length;
            idx = Math.max(0, Math.min(lyricLines.length - 1, Math.floor(cur / per)));
        }
        idx = Math.max(0, Math.min(lyricLines.length - 1, idx));
        if (!force && idx === lyricIdx) return;
        lyricIdx = idx;
        lyricLines.forEach(function (el, i) {
            el.classList.toggle('is-active', i === idx);
            el.classList.toggle('is-past', i < idx);
        });
        var line = lyricLines[idx];
        var off = line.offsetTop - lyricScroll.clientHeight / 2 + line.offsetHeight / 2;
        lyricScroll.style.transform = 'translateY(' + (-off).toFixed(1) + 'px)';
    }

    function syncHasTape() {
        cockpit.classList.toggle('has-tape', current >= 0);
    }

    function setNowPlayingUI() {
        var t = TRACKS[current];
        huTitle.textContent = t.title;
        huArtist.textContent = t.artist;
        huSrc.textContent = (t.kind === 'video' ? 'VIDEO ' : 'TAPE ') + pad2(current + 1);
        huTrk.textContent = 'TRK ' + pad2(current + 1) + '/' + pad2(TRACKS.length);
        timeTotal.textContent = fmt(t.dur);
        // Chinese tape names need the CJK/pixel stack
        if (huTitle) huTitle.classList.toggle('is-cjk', hasCJK(t.title));
        if (huArtist) huArtist.classList.toggle('is-cjk', hasCJK(t.artist));
        if (deckLabel) deckLabel.classList.toggle('is-cjk', hasCJK(t.title));
        huArt.style.backgroundImage = 'url("' + t.cover + '")';
        huArt.classList.add('has-art');
        deckLabel.textContent = t.title;
        deckTape.style.setProperty('--tape-body', t.body);
        deckTape.style.setProperty('--tape-ink', t.ink);
        deckTape.style.setProperty('--tape-label', t.label);
        if (wsCover) wsCover.style.backgroundImage = 'url("' + t.cover + '")';
        if (lyricTint) lyricTint.style.backgroundImage = 'url("' + t.cover + '")';
        buildLyrics(t);
    }

    function setEmptyUI() {
        huTitle.textContent = 'INSERT A TAPE';
        huArtist.textContent = 'PICK ONE FROM THE RACK';
        huSrc.textContent = 'NO TAPE';
        huTrk.textContent = 'TRK --/' + pad2(TRACKS.length);
        timeTotal.textContent = '--:--';
        timeNow.textContent = '0:00';
        huFill.style.width = '0%';
        huArt.style.backgroundImage = '';
        huArt.classList.remove('has-art');
    }

    // ---------------------------------------------------------------
    // Playback engine (real audio if the file exists, else simulation)
    // ---------------------------------------------------------------
    function stopTickers() {
        if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
        if (odoTimer) { clearInterval(odoTimer); odoTimer = null; }
    }

    function startTickers() {
        stopTickers();
        tickTimer = setInterval(function () {
            // only stand down when the real audio is actually running
            if (realMode && realAudio && !realAudio.paused) return;
            if (videoMode()) return;            // video tracks keep their own clock
            simTime += 0.25;
            if (simTime >= TRACKS[current].dur) { nextTrack(true); return; }
            updateProgress();
        }, 250);
        odoTimer = setInterval(function () {
            odo += 0.1;
            odometerEl.textContent = 'ODO ' + odo.toFixed(1);
        }, 1600);
    }

    // --- video tape playback on the windshield ---
    function attachVideo(track) {
        if (!wsVideo) return;
        wsVideo.pause();
        wsVideo.src = track.file;
        wsVideo.volume = volume / 100;
        wsVideo.load();
        wsVideo.onloadedmetadata = function () {
            if (videoMode()) timeTotal.textContent = fmt(wsVideo.duration || track.dur);
            if (pendingSeek > 0.5) {
                try { wsVideo.currentTime = Math.min(pendingSeek, (wsVideo.duration || track.dur) - 0.5); } catch (e) {}
                simTime = pendingSeek;
                pendingSeek = -1;
                if (videoMode()) updateProgress();
            }
        };
        wsVideo.ontimeupdate = function () { if (videoMode()) updateProgress(); };
        wsVideo.onended = function () {
            if (!videoMode()) return;
            pause();
            nextTrack(true);
        };
        wsVideo.onerror = function () { if (wsFrame) wsFrame.classList.remove('video-view'); };
    }

    function attachAudio(track) {
        realMode = false;
        if (realAudio) { realAudio.pause(); realAudio = null; }
        if (track.kind === 'video') { attachVideo(track); return; }
        if (wsVideo) wsVideo.pause();   // leaving a video tape for an audio tape
        try {
            realAudio = new Audio();
            realAudio.volume = volume / 100;
            realAudio.preload = 'auto';
            realAudio.src = track.file;
            realAudio.addEventListener('canplaythrough', function () {
                if (playing) {
                    if (simTime > 0.5 && Math.abs((realAudio.currentTime || 0) - simTime) > 0.75) {
                        try { realAudio.currentTime = Math.min(simTime, track.dur - 1); } catch (e) {}
                    }
                    var p = realAudio.play();
                    if (p && p.then) {
                        p.then(function () { realMode = true; setPlayingUI(true); })
                         .catch(function () { realMode = false; setPlayingUI(true); });
                    } else { realMode = true; }
                } else {
                    realMode = true;   // buffered and ready for the user's PLAY
                }
                setPlayingUI(playing);
            });
            realAudio.addEventListener('loadedmetadata', function () {
                var d = realAudio.duration;
                if (isFinite(d) && d > 1) { track.dur = d; timeTotal.textContent = fmt(d); }
                if (pendingSeek > 0.5) {
                    try { realAudio.currentTime = Math.min(pendingSeek, (isFinite(d) ? d : track.dur) - 0.5); } catch (e) {}
                    simTime = pendingSeek;
                    pendingSeek = -1;
                    updateProgress();
                }
            });
            realAudio.addEventListener('error', function () { realMode = false; setPlayingUI(playing); });
            realAudio.addEventListener('timeupdate', function () { if (realMode) updateProgress(); });
            realAudio.addEventListener('ended', function () { if (realMode) nextTrack(true); });
        } catch (e) { realAudio = null; }
    }

    function play() {
        if (current < 0) { hintNoTape(); return; }
        var t = TRACKS[current];
        if (videoMode()) {
            if (wsFrame) wsFrame.classList.add('video-view');
            setPlayingUI(true);
            startTickers();
            var vp = wsVideo.play();
            if (vp) vp.catch(function () {});
            updateProgress();
            return;
        }
        simTime = Math.min(simTime, t.dur - 0.5);
        // Kick off real playback from inside the user gesture even if the file
        // is still buffering — otherwise autoplay policy can refuse the later
        // canplaythrough call and the progress bar freezes at 0.
        if (realAudio) {
            // Only seek when we actually resume mid-track: a redundant
            // currentTime=0 write before play() can stall the media clock.
            if (simTime > 0.5 && realAudio.readyState >= 1 &&
                Math.abs((realAudio.currentTime || 0) - simTime) > 0.75) {
                try { realAudio.currentTime = Math.min(simTime, (realAudio.duration || t.dur) - 0.5); } catch (e) {}
            }
            var p = realAudio.play();
            if (p && p.then) {
                p.then(function () { realMode = true; setPlayingUI(true); })
                 .catch(function () {
                     realMode = false;
                     if (autoRestoring) {
                         // browser blocked the silent auto-resume — stay paused
                         // at the right position rather than faking progress
                         autoRestoring = false;
                         setPlayingUI(false);
                         stopTickers();
                     } else {
                         setPlayingUI(true);
                     }
                 });
            }
        }
        setPlayingUI(true);
        startTickers();
        updateProgress();
    }

    function pause() {
        if (videoMode() && wsVideo) wsVideo.pause();
        if (realMode && realAudio) realAudio.pause();
        setPlayingUI(false);
        stopTickers();
    }

    function togglePlay() {
        if (current < 0) { hintNoTape(); return; }
        if (playing) pause(); else play();
    }

    function seekTo(pct) {
        if (current < 0) return;
        var t = TRACKS[current];
        if (videoMode() && wsVideo) {
            var vdur = wsVideo.duration || t.dur;
            try { wsVideo.currentTime = Math.max(0, Math.min(1, pct)) * vdur; } catch (e) {}
            updateProgress();
            return;
        }
        var target = Math.max(0, Math.min(1, pct)) * t.dur;
        if (realMode && realAudio) {
            try { realAudio.currentTime = target; } catch (e) {}
        }
        simTime = target;
        updateProgress();
    }

    function selectTape(i, autoPlay) {
        if (i === current) { if (autoPlay !== false && !playing) play(); return; }
        current = i;
        simTime = 0;
        attachAudio(TRACKS[i]);
        setNowPlayingUI();
        updateProgress();
        setScene(TRACKS[i].scene, false);
        if (autoPlay !== false) play(); else pause();
    }

    function ejectTape() {
        if (current < 0) return;
        pause();
        current = -1;
        simTime = 0;
        if (realAudio) { realAudio.pause(); realAudio = null; }
        if (wsVideo) wsVideo.pause();
        realMode = false;
        setEmptyUI();
        publishState(true);
        if (wsFrame) wsFrame.classList.remove('video-view');
        deckTape.classList.remove('inserted');
        deckTape.classList.add('ejecting');
        setTimeout(function () { deckTape.classList.remove('ejecting'); }, 500);
        rack.querySelectorAll('.cassette.hidden-slot').forEach(function (c) {
            c.classList.remove('hidden-slot');
        });
        syncRackSlot();
        syncSpines();
        syncHasTape();
        btnEject.disabled = true;
        if (!coverPinned) setScene('dusk', false);
    }

    function nextTrack(auto) {
        var next = (current + 1) % TRACKS.length;
        var wasPlaying = playing || auto;
        selectTapeVisual(next, wasPlaying);
    }

    function prevTrack() {
        var t = TRACKS[current];
        var cur = (realMode && realAudio && !realAudio.paused) ? realAudio.currentTime : simTime;
        if (cur > 3) { seekTo(0); return; }
        var prev = (current - 1 + TRACKS.length) % TRACKS.length;
        selectTapeVisual(prev, playing);
    }

    // next/prev swap the tape inside the deck with a little animation
    function selectTapeVisual(i, autoPlay) {
        deckTape.classList.add('swapping');
        setTimeout(function () {
            current = i;
            simTime = 0;
            attachAudio(TRACKS[i]);
            setNowPlayingUI();
            updateProgress();
            setScene(TRACKS[i].scene, false);
            syncRackSlot();
            syncSpines();
            syncHasTape();
            deckTape.classList.remove('swapping');
            if (autoPlay) play(); else pause();
        }, 260);
    }

    function hintNoTape() {
        rack.classList.add('hinting');
        btnPlay.classList.add('deny');
        setTimeout(function () {
            rack.classList.remove('hinting');
            btnPlay.classList.remove('deny');
        }, 900);
    }

    // ---------------------------------------------------------------
    // Rack (featured album tapes) + side spine library
    // ---------------------------------------------------------------
    // bottom rack holds the featured album tapes; on narrow screens the spine
    // walls are hidden, so it expands to the whole library (videos included)
    var FEATURED = 4;
    var narrowMQ = window.matchMedia('(max-width: 1100px)');

    function rackList() {
        return narrowMQ.matches ? TRACKS : TRACKS.slice(0, FEATURED);
    }

    function buildRack() {
        rack.innerHTML = '';
        rackList().forEach(function (t, slot) {
            var i = TRACKS.indexOf(t);
            var el = document.createElement('button');
            el.className = 'cassette' + (t.kind === 'video' ? ' is-video' : '') +
                (hasCJK(t.title) ? ' is-cjk' : '');
            el.setAttribute('data-idx', i);
            el.style.setProperty('--tape-body', t.body);
            el.style.setProperty('--tape-ink', t.ink);
            el.style.setProperty('--tape-label', t.label);
            el.setAttribute('aria-label', 'Insert tape: ' + t.title);
            el.innerHTML =
                '<span class="cas-screw cas-screw-a"></span>' +
                '<span class="cas-screw cas-screw-b"></span>' +
                '<span class="cas-label"><b>' + t.title + '</b><i>' + t.artist + '</i></span>' +
                '<span class="cas-window"><span class="cas-reel"></span><span class="cas-reel"></span></span>';
            el.addEventListener('click', function () { insertFromLibrary(i, el); });
            rack.appendChild(el);
        });
    }

    function buildSpines() {
        [spineLeft, spineRight].forEach(function (col, c) {
            if (!col) return;
            TRACKS.forEach(function (t, i) {
                // split the library: alternating columns like a tape wall
                if (i % 2 !== c) return;
                var el = document.createElement('button');
                el.className = 'spine' + (t.kind === 'video' ? ' is-video' : '') +
                    (hasCJK(t.title) ? ' is-cjk' : '');
                el.setAttribute('data-idx', i);
                el.style.setProperty('--tape-body', t.body);
                el.style.setProperty('--tape-ink', t.ink);
                el.setAttribute('aria-label', 'Insert tape: ' + t.title);
                el.innerHTML =
                    '<span class="spine-top">' +
                        '<span class="spine-brand">' + (t.kind === 'video' ? 'VHS' : 'FY') + '</span>' +
                        '<span class="spine-no">' + pad2(i + 1) + '</span>' +
                        '<span class="spine-led"></span>' +
                    '</span>' +
                    '<span class="spine-title">' + t.title + '</span>';
                el.addEventListener('click', function () { insertFromLibrary(i, el); });
                col.appendChild(el);
            });
        });
    }

    // rebuild the rack when we cross the breakpoint where the walls hide
    function bindRackResize() {
        var apply = function () { buildRack(); syncRackSlot(); };
        if (narrowMQ.addEventListener) narrowMQ.addEventListener('change', apply);
        else if (narrowMQ.addListener) narrowMQ.addListener(apply);
    }

    function insertFromLibrary(i, srcEl) {
        if (i === current) { togglePlay(); return; }
        if (current >= 0) {
            // put the old tape back before taking the new one
            rack.querySelectorAll('.cassette.hidden-slot').forEach(function (c) { c.classList.remove('hidden-slot'); });
        }
        if (srcEl && srcEl.classList.contains('cassette')) {
            srcEl.classList.add('is-pulling');
            setTimeout(function () { srcEl.classList.remove('is-pulling'); srcEl.classList.add('hidden-slot'); }, 240);
        }
        btnEject.disabled = false;
        pause();
        current = i;
        simTime = 0;
        attachAudio(TRACKS[i]);
        setNowPlayingUI();
        updateProgress();
        deckTape.classList.remove('inserted');
        void deckTape.offsetWidth;
        deckTape.classList.add('inserted');
        syncRackSlot();
        syncSpines();
        syncHasTape();
        setScene(TRACKS[i].scene, false);
        play();   // tape in → music on, no extra press needed
    }

    function syncRackSlot() {
        rack.querySelectorAll('.cassette').forEach(function (c) {
            c.classList.toggle('hidden-slot', Number(c.getAttribute('data-idx')) === current);
        });
    }

    function syncSpines() {
        document.querySelectorAll('.spine').forEach(function (s) {
            s.classList.toggle('is-active', Number(s.getAttribute('data-idx')) === current);
        });
    }

    // ---------------------------------------------------------------
    // Windshield scenes
    // ---------------------------------------------------------------
    (function initSceneLayers() {
        wsLayers.querySelectorAll('.ws-layer').forEach(function (l) {
            var key = l.getAttribute('data-scene');
            if (SCENES[key]) l.style.backgroundImage = 'url("' + SCENES[key] + '")';
        });
    })();

    function setScene(name, fromUser) {
        activeScene = name;
        if (fromUser) coverPinned = (name === 'cover');
        if (wsFrame) wsFrame.classList.toggle('cover-view', name === 'cover');
        // a video tape owns the whole glass — no scenery layer underneath
        if (wsFrame) wsFrame.classList.toggle('video-view', name === 'video');
        if (name === 'video') {
            wsLayers.querySelectorAll('.ws-layer').forEach(function (l) { l.classList.remove('is-active'); });
            sceneDotsWrap.querySelectorAll('.scene-dot').forEach(function (d) { d.classList.remove('is-active'); });
            return;
        }
        if (name === 'cover' && current >= 0 && wsCover) {
            wsCover.style.backgroundImage = 'url("' + TRACKS[current].cover + '")';
        }
        wsLayers.querySelectorAll('.ws-layer').forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('data-scene') === name);
        });
        sceneDotsWrap.querySelectorAll('.scene-dot').forEach(function (d) {
            d.classList.toggle('is-active', d.getAttribute('data-scene') === name);
        });
    }

    sceneDotsWrap.querySelectorAll('.scene-dot').forEach(function (d) {
        d.addEventListener('click', function () {
            // stepping back to a scenery view puts the video tape on hold
            if (videoMode() && playing) pause();
            setScene(d.getAttribute('data-scene'), true);
        });
    });

    // ---------------------------------------------------------------
    // Gauges (SVG built in JS)
    // ---------------------------------------------------------------
    function polar(cx, cy, r, deg) {
        var rad = (deg - 90) * Math.PI / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    }

    function buildGauge(svg, opts) {
        var NS = 'http://www.w3.org/2000/svg';
        var cx = 100, cy = 100, r = 80;
        var sweep = 240, start = -120;
        var el = function (name, attrs) {
            var n = document.createElementNS(NS, name);
            for (var k in attrs) n.setAttribute(k, attrs[k]);
            svg.appendChild(n);
            return n;
        };
        // face
        el('circle', { cx: cx, cy: cy, r: 96, fill: 'url(#gaugeFace)' });
        // red zone arc
        var a0 = start + sweep * (opts.redFrom / opts.max);
        var a1 = start + sweep;
        var p0 = polar(cx, cy, r - 4, a0), p1 = polar(cx, cy, r - 4, a1);
        el('path', {
            d: 'M ' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) +
               ' A ' + (r - 4) + ' ' + (r - 4) + ' 0 ' + ((a1 - a0) > 180 ? 1 : 0) + ' 1 ' +
               p1[0].toFixed(1) + ' ' + p1[1].toFixed(1),
            fill: 'none', stroke: '#ff5c5c', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.9
        });
        // ticks
        var step = opts.max / opts.majors;
        for (var v = 0; v <= opts.max + 0.001; v += step / 2) {
            var major = Math.abs(v / step - Math.round(v / step)) < 0.01;
            var deg = start + sweep * (v / opts.max);
            var o1 = polar(cx, cy, r - (major ? 14 : 8), deg);
            var o2 = polar(cx, cy, r - 2, deg);
            el('line', {
                x1: o1[0].toFixed(1), y1: o1[1].toFixed(1),
                x2: o2[0].toFixed(1), y2: o2[1].toFixed(1),
                stroke: v >= opts.redFrom ? '#ff7a6e' : '#ffb37a',
                'stroke-width': major ? 3.4 : 1.6,
                'stroke-linecap': 'round',
                opacity: major ? 0.95 : 0.55
            });
        }
        // needle group (JS rotates via --deg on the group)
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'needle-rot');
        var needle = document.createElementNS(NS, 'line');
        var tip = polar(cx, cy, r - 20, 0);
        needle.setAttribute('x1', cx); needle.setAttribute('y1', cy);
        needle.setAttribute('x2', tip[0].toFixed(1)); needle.setAttribute('y2', tip[1].toFixed(1));
        needle.setAttribute('stroke', '#ff6b5e');
        needle.setAttribute('stroke-width', 4);
        needle.setAttribute('stroke-linecap', 'round');
        needle.setAttribute('class', 'needle');
        g.appendChild(needle);
        svg.appendChild(g);
        el('circle', { cx: cx, cy: cy, r: 9, fill: '#1a1520', stroke: '#ff6b5e', 'stroke-width': 2.5 });
        el('circle', { cx: cx, cy: cy, r: 3, fill: '#ffb37a', opacity: 0.9 });
        return g;
    }

    // shared defs (gradients) once
    (function defs() {
        var NS = 'http://www.w3.org/2000/svg';
        var svg = gaugeSpeed;
        var defsEl = document.createElementNS(NS, 'defs');
        defsEl.innerHTML =
            '<radialGradient id="gaugeFace" cx="38%" cy="30%" r="85%">' +
            '<stop offset="0%" stop-color="#241c22"/><stop offset="70%" stop-color="#15101a"/><stop offset="100%" stop-color="#0b0810"/>' +
            '</radialGradient>';
        svg.appendChild(defsEl);
    })();

    var needleSpeed = buildGauge(gaugeSpeed, { max: 240, majors: 12, redFrom: 200 });
    var needleRpm = buildGauge(gaugeRpm, { max: 8, majors: 8, redFrom: 6.5 });

    function setNeedle(g, value, max) {
        var deg = -120 + 240 * Math.min(1, value / max);
        g.style.transform = 'rotate(' + deg.toFixed(1) + 'deg)';
    }
    setNeedle(needleSpeed, 0, 240);
    setNeedle(needleRpm, 0, 8);

    // ---------------------------------------------------------------
    // Knobs
    // ---------------------------------------------------------------
    function setVolume(v) {
        volume = Math.max(0, Math.min(100, v));
        var ang = -135 + 270 * volume / 100;
        knobVol.style.setProperty('--angle', ang + 'deg');
        if (realAudio) realAudio.volume = volume / 100;
        if (wsVideo) wsVideo.volume = volume / 100;
        var lit = Math.round(volume / 100 * 6);
        volLeds.querySelectorAll('i').forEach(function (led, i) {
            led.classList.toggle('on', i < lit);
        });
    }

    function knobAngle(e) {
        var r = knobVol.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var deg = Math.atan2(e.clientX - cx, cy - e.clientY) * 180 / Math.PI;
        return Math.max(-135, Math.min(135, deg));
    }

    var knobDragging = false;
    knobVol.addEventListener('pointerdown', function (e) {
        knobDragging = true;
        knobVol.setPointerCapture && knobVol.setPointerCapture(e.pointerId);
        setVolume((knobAngle(e) + 135) / 270 * 100);
        e.preventDefault();
    });
    window.addEventListener('pointermove', function (e) {
        if (!knobDragging) return;
        setVolume((knobAngle(e) + 135) / 270 * 100);
    });
    window.addEventListener('pointerup', function () { knobDragging = false; });
    knobVol.addEventListener('wheel', function (e) {
        e.preventDefault();
        setVolume(volume - Math.sign(e.deltaY) * 6);
    }, { passive: false });

    function setCabin(on) {
        cockpit.classList.toggle('cabin-bright', on);
        knobLight.classList.toggle('is-on', on);
        knobLight.style.setProperty('--angle', on ? '135deg' : '-135deg');
        if (lightLeds) lightLeds.querySelector('i').classList.toggle('on', on);
        if (domeLight) domeLight.classList.toggle('on', on);
    }
    knobLight.addEventListener('click', function () {
        setCabin(!cockpit.classList.contains('cabin-bright'));
    });
    if (domeLight) {
        domeLight.addEventListener('click', function () {
            setCabin(!cockpit.classList.contains('cabin-bright'));
        });
    }

    // ---------------------------------------------------------------
    // Small cabin interactions
    // ---------------------------------------------------------------
    if (ventBtn) {
        ventBtn.addEventListener('click', function () {
            ventBtn.classList.toggle('is-on');
        });
    }

    if (hazardBtn) {
        hazardBtn.addEventListener('click', function () {
            hazardBtn.classList.toggle('is-on');
        });
    }

    if (mirrorBtn) {
        mirrorBtn.addEventListener('click', function () {
            document.getElementById('windshield').classList.toggle('night');
            mirrorBtn.classList.toggle('flipped');
        });
    }

    function bindVisor(el) {
        if (!el) return;
        el.addEventListener('click', function () { el.classList.toggle('down'); });
    }
    bindVisor(visorL);
    bindVisor(visorR);

    // ---------------------------------------------------------------
    // Seek bar
    // ---------------------------------------------------------------
    function seekFromEvent(e) {
        var r = huProgress.getBoundingClientRect();
        seekTo((e.clientX - r.left) / r.width);
    }
    var seeking = false;
    huProgress.addEventListener('pointerdown', function (e) {
        if (current < 0) return;
        seeking = true;
        huProgress.setPointerCapture && huProgress.setPointerCapture(e.pointerId);
        seekFromEvent(e);
    });
    window.addEventListener('pointermove', function (e) { if (seeking) seekFromEvent(e); });
    window.addEventListener('pointerup', function () { seeking = false; });

    // ---------------------------------------------------------------
    // Transport wiring
    // ---------------------------------------------------------------
    btnPlay.addEventListener('click', togglePlay);
    btnNext.addEventListener('click', function () { if (current < 0) { hintNoTape(); return; } nextTrack(false); });
    btnPrev.addEventListener('click', function () { if (current < 0) { hintNoTape(); return; } prevTrack(); });
    btnEject.addEventListener('click', ejectTape);

    document.addEventListener('keydown', function (e) {
        if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
        if (e.code === 'Space') {
            if (e.target === document.body) { e.preventDefault(); togglePlay(); }
        } else if (e.code === 'ArrowLeft' && current >= 0) {
            seekTo((realMode && realAudio ? realAudio.currentTime : simTime) - 5);
        } else if (e.code === 'ArrowRight' && current >= 0) {
            seekTo((realMode && realAudio ? realAudio.currentTime : simTime) + 5);
        }
    });

    // ---------------------------------------------------------------
    // Clock + idle needle states
    // ---------------------------------------------------------------
    // Cross-page restore — the mini player keeps the song alive on other
    // pages, so the car page takes it over (tape + position) on arrival
    // instead of starting from an empty deck.
    // ---------------------------------------------------------------
    function restoreFromShared() {
        if (!window.MiniPlayer || typeof MiniPlayer.snapshot !== 'function') return;
        var snap = MiniPlayer.snapshot();
        if (!snap || !snap.id) return;
        var idx = -1, i;
        for (i = 0; i < TRACKS.length; i++) { if (TRACKS[i].id === snap.id) { idx = i; break; } }
        if (idx < 0) return;
        var pos = snap.pos || 0;
        if (pos > (TRACKS[idx].dur || 0) - 2) pos = 0;   // finished while away
        current = idx;
        pendingSeek = pos;
        simTime = pos;
        attachAudio(TRACKS[idx]);
        setNowPlayingUI();
        updateProgress();
        setScene(TRACKS[idx].scene, false);
        if (deckTape) deckTape.classList.add('inserted');
        btnEject.disabled = false;
        syncRackSlot();
        syncSpines();
        syncHasTape();
        if (snap.playing) { autoRestoring = true; play(); }
        else { pause(); }
    }

    function tickClock() {
        var d = new Date();
        huClock.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
    tickClock();
    setInterval(tickClock, 30000);

    // needles follow the tape
    setInterval(function () {
        if (playing) {
            setNeedle(needleSpeed, 52 + Math.sin(Date.now() / 900) * 3, 240);
            setNeedle(needleRpm, 2.6 + Math.sin(Date.now() / 620) * 0.5, 8);
        } else if (current >= 0) {
            setNeedle(needleSpeed, 0, 240);
            setNeedle(needleRpm, 0.8, 8);
        } else {
            setNeedle(needleSpeed, 0, 240);
            setNeedle(needleRpm, 0, 8);
        }
    }, 120);

    // ---------------------------------------------------------------
    // Boot
    // ---------------------------------------------------------------
    if (window.MiniPlayer) {
        var mutePrevVol = 0;
        MiniPlayer.setMuteToggler(function (muted) {
            if (muted) { if (volume > 0) mutePrevVol = volume; setVolume(0); }
            else { setVolume(mutePrevVol || 62); }
        });
        if (MiniPlayer.initialMuted()) { mutePrevVol = 62; setVolume(0); }
    }
    buildRack();
    bindRackResize();
    buildSpines();
    setEmptyUI();
    setVolume(62);
    setCabin(false);
    setScene('dusk', false);
    restoreFromShared();
})();
