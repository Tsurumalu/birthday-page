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
    var TRACKS = [
        {
            id: 'sunset-drive',
            title: 'SUNSET DRIVE',
            artist: 'SIDE A \u00B7 CHILLWAVE',
            dur: 227,
            file: 'assets/music/sunset-drive.mp3',
            cover: 'assets/covers/cover-dusk.png',
            scene: 'dusk',
            body: '#d99a45', ink: '#5c3d14', label: '#f7ecd8',
            lyrics: [
                'Golden hour on the interstate',
                'Your hand out the window, riding the wind',
                'Every streetlight wakes up one by one',
                'The radio hums our summer back to me',
                'Orange sky melting into blue',
                'We drive a little slower tonight',
                'Nowhere to be, everything to feel',
                'Stay for one more sunset with me'
            ]
        },
        {
            id: 'neon-nights',
            title: 'NEON NIGHTS',
            artist: 'SIDE B \u00B7 CITY POP',
            dur: 254,
            file: 'assets/music/neon-nights.mp3',
            cover: 'assets/covers/cover-city.png',
            scene: 'city',
            body: '#7b6fd6', ink: '#241d55', label: '#ece7fb',
            lyrics: [
                'City lights bleed into the rain',
                'A crescent moon over the vending machine',
                'We chase the glow down empty streets',
                'Bassline thumping like a second heart',
                'Neon signatures on wet asphalt',
                'Every sign says open, we say stay',
                'Midnight is a color tonight',
                'The city hums us home'
            ]
        },
        {
            id: 'starry-coast',
            title: 'STARRY COAST',
            artist: 'SIDE A \u00B7 NOCTURNE',
            dur: 281,
            file: 'assets/music/starry-coast.mp3',
            cover: 'assets/covers/cover-stars.png',
            scene: 'stars',
            body: '#4a7fae', ink: '#14314d', label: '#e3eef8',
            lyrics: [
                'The Milky Way spills over the cliffs',
                'Salt air and a quiet engine hum',
                'A lighthouse counts the waves for us',
                'Ten thousand stars, one small car',
                'Moonlight writes silver on the sea',
                'We talk about nothing, beautifully',
                'The coast road curves into forever',
                'Park here, stay until the dawn'
            ]
        },
        {
            id: 'for-you',
            title: 'FOR YOU',
            artist: 'SIDE B \u00B7 MIXTAPE 1314',
            dur: 314,
            file: 'assets/music/for-you.mp3',
            cover: 'assets/covers/cover-tape.png',
            scene: 'dusk',
            body: '#cf6a5a', ink: '#5a2019', label: '#fae7de',
            lyrics: [
                'This one goes out to you',
                'Every song secretly knows your name',
                'I taped our laughter between the tracks',
                'Side A is where I miss you',
                'Side B is where I find you',
                'Rewind, replay, remember',
                'A whole album just to say one thing',
                'Happy birthday \u2014 press play'
            ]
        },
        {
            id: 'midnight-fm',
            title: 'MIDNIGHT FM',
            artist: 'SIDE A \u00B7 SYNTHWAVE',
            dur: 238,
            file: 'assets/music/midnight-fm.mp3',
            cover: 'assets/covers/cover-city.png',
            scene: 'city',
            body: '#4f8f7d', ink: '#12352b', label: '#e2f3ec',
            lyrics: [
                'Static and streetlights at 2 a.m.',
                'The DJ plays it slow for the night shift',
                'Dial drifting through sleeping cities',
                'Every station humming the same blue',
                'Headlights draw long quiet lines',
                'Coffee cold in the cupholder',
                'The tunnel swallows the chorus whole',
                'Signal fades, feeling doesn\u2019t'
            ]
        },
        {
            id: 'paper-moon',
            title: 'PAPER MOON',
            artist: 'SIDE B \u00B7 DREAMPOP',
            dur: 266,
            file: 'assets/music/paper-moon.mp3',
            cover: 'assets/covers/cover-stars.png',
            scene: 'stars',
            body: '#c7a3d9', ink: '#4a2c5e', label: '#f7eefb',
            lyrics: [
                'Fold the sky into a paper moon',
                'Crayon stars on a bedroom ceiling',
                'If the tide takes my letter, so be it',
                'We were made of summertime',
                'Clouds like unstamped postcards',
                'Dream in low resolution, love in high',
                'The night is soft around the edges',
                'Sleep tight, the moon keeps watch'
            ]
        },
        {
            id: 'gasoline-heart',
            title: 'GASOLINE HEART',
            artist: 'SIDE A \u00B7 ROADTRIP',
            dur: 213,
            file: 'assets/music/gasoline-heart.mp3',
            cover: 'assets/covers/cover-dusk.png',
            scene: 'dusk',
            body: '#b0513c', ink: '#4d1c12', label: '#f9e3da',
            lyrics: [
                'Full tank and a half-used map',
                'Dust on the dashboard, dreams on repeat',
                'Every mile marker counts us closer',
                'Your playlist vs. mine, a peace treaty',
                'Small towns glowing like pilot lights',
                'The engine learns our favorite song',
                'Rest stop skies, wide and endless',
                'Home is wherever you ride shotgun'
            ]
        },
        {
            id: 'aqua-veil',
            title: 'AQUA VEIL',
            artist: 'SIDE B \u00B7 AMBIENT',
            dur: 292,
            file: 'assets/music/aqua-veil.mp3',
            cover: 'assets/covers/cover-stars.png',
            scene: 'stars',
            body: '#3d7d8c', ink: '#113038', label: '#e0f2f6',
            lyrics: [
                'Blue on blue on blue',
                'The sea breathes under a velvet veil',
                'Windows down, let the ocean in',
                'Waves keep time better than we do',
                'Gulls write cursive across the wind',
                'A quiet kind of forever out here',
                'Salt on the air, calm in the chest',
                'Drift with me a little longer'
            ]
        },
        {
            id: 'honey-sky',
            title: 'HONEY SKY',
            artist: 'SIDE A \u00B7 BOSSA',
            dur: 247,
            file: 'assets/music/honey-sky.mp3',
            cover: 'assets/covers/cover-dusk.png',
            scene: 'dusk',
            body: '#dfa14e', ink: '#5a3a10', label: '#faf0dc',
            lyrics: [
                'Peach light pours over the dash',
                'Warm wind through fingers like honey',
                'The horizon drips gold, slowly',
                'Slow dance at sixty kilometers',
                'Your laugh, the best kind of chorus',
                'Sunburn sky, sugar-cloud days',
                'Evening sticks to us like jam',
                'One more golden mile, please'
            ]
        },
        {
            id: 'velvet-rain',
            title: 'VELVET RAIN',
            artist: 'SIDE B \u00B7 LOFI',
            dur: 259,
            file: 'assets/music/velvet-rain.mp3',
            cover: 'assets/covers/cover-city.png',
            scene: 'city',
            body: '#6c5a92', ink: '#291d45', label: '#ece5f8',
            lyrics: [
                'Rain makes velvet of the window',
                'Wipers keep the beat, we keep the quiet',
                'Streetlights bloom in every drop',
                'The night wears its softest coat',
                'Raindrops tapping secret morse code',
                'Warm air, cold glass, good company',
                'Every drop carries the melody down',
                'Let it rain \u2014 we\u2019re not in a hurry'
            ]
        }
    ];

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
    var lyricLayer = document.getElementById('lyricLayer');
    var lyricTint = document.getElementById('lyricTint');
    var lyricScroll = document.getElementById('lyricScroll');

    // --- state ---
    var current = -1;          // inserted tape index
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

    function setPlayingUI(on) {
        playing = on;
        document.body.classList.toggle('tape-playing', on);
        cockpit.classList.toggle('is-playing', on);
        btnPlay.classList.toggle('is-playing', on);
        if (ledPlay) ledPlay.classList.toggle('on', on);
        if (huMute) huMute.classList.toggle('on', on && !realMode);
        if (ledMute) ledMute.classList.toggle('on', on && !realMode);
    }

    function updateProgress() {
        if (current < 0) return;
        var t = TRACKS[current];
        var cur = realMode && realAudio ? realAudio.currentTime : simTime;
        var pct = Math.min(1, cur / t.dur);
        huFill.style.width = (pct * 100).toFixed(2) + '%';
        timeNow.textContent = fmt(cur);
        updateLyrics();
    }

    // ---------------------------------------------------------------
    // Lyrics on the windshield
    // ---------------------------------------------------------------
    var lyricLines = [];
    var lyricIdx = -1;

    function buildLyrics(t) {
        if (!lyricScroll) return;
        lyricScroll.innerHTML = '';
        lyricLines = [];
        lyricIdx = -1;
        (t.lyrics || []).forEach(function (line) {
            var p = document.createElement('p');
            p.className = 'lyric-line';
            p.textContent = line;
            lyricScroll.appendChild(p);
            lyricLines.push(p);
        });
        updateLyrics(true);
    }

    function updateLyrics(force) {
        if (current < 0 || !lyricLines.length) return;
        var t = TRACKS[current];
        var cur = realMode && realAudio ? realAudio.currentTime : simTime;
        var per = t.dur / lyricLines.length;
        var idx = Math.max(0, Math.min(lyricLines.length - 1, Math.floor(cur / per)));
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
        huSrc.textContent = 'TAPE ' + pad2(current + 1);
        huTrk.textContent = 'TRK ' + pad2(current + 1) + '/' + pad2(TRACKS.length);
        timeTotal.textContent = fmt(t.dur);
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
            if (realMode && realAudio) return;
            simTime += 0.25;
            if (simTime >= TRACKS[current].dur) { nextTrack(true); return; }
            updateProgress();
        }, 250);
        odoTimer = setInterval(function () {
            odo += 0.1;
            odometerEl.textContent = 'ODO ' + odo.toFixed(1);
        }, 1600);
    }

    function attachAudio(track) {
        realMode = false;
        if (realAudio) { realAudio.pause(); realAudio = null; }
        try {
            realAudio = new Audio();
            realAudio.volume = volume / 100;
            realAudio.preload = 'auto';
            realAudio.src = track.file;
            realAudio.addEventListener('canplaythrough', function () {
                realMode = true;
                if (playing) {
                    realAudio.currentTime = Math.min(simTime, track.dur - 1);
                    var p = realAudio.play();
                    if (p) p.catch(function () {});
                }
                setPlayingUI(playing);
            });
            realAudio.addEventListener('error', function () { realMode = false; setPlayingUI(playing); });
            realAudio.addEventListener('timeupdate', function () { if (realMode) updateProgress(); });
            realAudio.addEventListener('ended', function () { if (realMode) nextTrack(true); });
        } catch (e) { realAudio = null; }
    }

    function play() {
        if (current < 0) { hintNoTape(); return; }
        var t = TRACKS[current];
        simTime = Math.min(simTime, t.dur - 0.5);
        if (realMode && realAudio) {
            realAudio.currentTime = simTime;
            var p = realAudio.play();
            if (p) p.catch(function () { realMode = false; setPlayingUI(true); });
        }
        setPlayingUI(true);
        startTickers();
        updateProgress();
    }

    function pause() {
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
        realMode = false;
        setEmptyUI();
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
        var cur = realMode && realAudio ? realAudio.currentTime : simTime;
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
    var FEATURED = 4;   // tapes shown in the bottom rack

    function buildRack() {
        TRACKS.slice(0, FEATURED).forEach(function (t, i) {
            var el = document.createElement('button');
            el.className = 'cassette';
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
                el.className = 'spine';
                el.setAttribute('data-idx', i);
                el.style.setProperty('--tape-body', t.body);
                el.style.setProperty('--tape-ink', t.ink);
                el.setAttribute('aria-label', 'Insert tape: ' + t.title);
                el.innerHTML =
                    '<span class="spine-brand">FY</span>' +
                    '<span class="spine-title">' + t.title + '</span>' +
                    '<span class="spine-no">' + pad2(i + 1) + '</span>' +
                    '<span class="spine-led"></span>';
                el.addEventListener('click', function () { insertFromLibrary(i, el); });
                col.appendChild(el);
            });
        });
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
        var wasPlaying = playing;
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
        if (wasPlaying) play();
    }

    function syncRackSlot() {
        rack.querySelectorAll('.cassette').forEach(function (c, idx) {
            c.classList.toggle('hidden-slot', idx === current);
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
        if (name === 'cover' && current >= 0 && wsCover) {
            wsCover.style.backgroundImage = 'url("' + TRACKS[current].cover + '")';
        }
        if (wsFrame) wsFrame.classList.toggle('cover-view', name === 'cover');
        wsLayers.querySelectorAll('.ws-layer').forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('data-scene') === name);
        });
        sceneDotsWrap.querySelectorAll('.scene-dot').forEach(function (d) {
            d.classList.toggle('is-active', d.getAttribute('data-scene') === name);
        });
    }

    sceneDotsWrap.querySelectorAll('.scene-dot').forEach(function (d) {
        d.addEventListener('click', function () { setScene(d.getAttribute('data-scene'), true); });
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
    buildRack();
    buildSpines();
    setEmptyUI();
    setVolume(62);
    setCabin(false);
    setScene('dusk', false);
})();
