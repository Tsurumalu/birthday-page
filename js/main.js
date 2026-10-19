/* ============================================
   Birthday Gift — Interactive Logic
   Multi-edition segmented dial
   ============================================ */

(function () {
    'use strict';

    // --- Edition icons (thin line art, tinted by the edition colour) ---
    function iconSvg(paths) {
        return '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor"' +
            ' stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
    }

    // --- Editions config ---
    // Five editions around the dial. Order = clockwise from the top marker.
    var editions = [
        {
            id: 'story',
            label: 'Moments',
            labelCn: '时光',
            subtitle: 'The chapters of us, from the beginning.',
            page: 'moments.html',
            theme: 'theme-story',
            color: '#c8614a',
            icon: iconSvg(
                '<rect x="3" y="7.5" width="15" height="12.5" rx="2"/>' +
                '<path d="M7 7.5V5.6A1.6 1.6 0 0 1 8.6 4H19a2 2 0 0 1 2 2v10.6"/>' +
                '<path d="M3.6 17l3.9-3.2 3 2.6 3.2-3.2 4.3 3.6"/>'
            )
        },
        {
            id: 'letter',
            label: 'The Letter',
            labelCn: '信笺',
            subtitle: 'Words I want you to keep.',
            page: 'message.html',
            theme: 'theme-letter',
            color: '#5fb79a',
            icon: iconSvg(
                '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/>' +
                '<path d="M3.6 7 12 13.2 20.4 7"/>'
            )
        },
        {
            id: 'games',
            label: 'Games',
            labelCn: '小游戏',
            subtitle: 'Our little arcade — drop a pin, press play.',
            page: 'games-3d.html',
            theme: 'theme-games',
            color: '#a48cc4',
            icon: iconSvg(
                '<path d="M12 21.5s6.6-6.3 6.6-11.1a6.6 6.6 0 1 0-13.2 0C5.4 15.2 12 21.5 12 21.5Z"/>' +
                '<circle cx="12" cy="10.2" r="2.4"/>'
            )
        },
        {
            id: 'music',
            label: 'Music',
            labelCn: '行车音乐',
            subtitle: 'An evening drive — pick a tape, press play.',
            page: 'musics.html',
            theme: 'theme-music',
            color: '#e59a62',
            icon: iconSvg(
                '<path d="M9.2 18V5.6l10-2.1v12"/>' +
                '<circle cx="6.6" cy="18" r="2.6"/>' +
                '<circle cx="16.6" cy="15.5" r="2.6"/>'
            )
        },
        {
            id: 'cards',
            label: 'The Cards',
            labelCn: '留言板',
            subtitle: 'Leave a little note. We\u2019ll pin it up for you.',
            page: 'cards.html',
            theme: 'theme-cards',
            color: '#cf7f4e',
            icon: iconSvg(
                '<rect x="4" y="3.8" width="16" height="16.4" rx="2.6"/>' +
                '<path d="M8.2 9.4h7.6M8.2 13h5.2"/>'
            )
        }
    ];

    // Segments are evenly spread across the dial
    var SEGMENT = 360 / editions.length;

    var isHome = document.body.classList.contains('page-home');

    // --- Loader ---
    var loader = document.getElementById('loader');
    window.addEventListener('load', function () {
        setTimeout(function () {
            if (loader) {
                loader.classList.add('hidden');
            }
        }, 1200);
    });

    // --- Navigation ---
    var nav = document.getElementById('nav');

    // `nav-compact` mirrors .nav.scrolled on <body> so anything anchored to the
    // nav (the ‹ Back button) can follow it while it shrinks.
    function setNavCompact(on) {
        if (!nav) return;
        nav.classList.toggle('scrolled', on);
        document.body.classList.toggle('nav-compact', on);
    }

    function updateNavScroll() {
        if (!nav) return;
        setNavCompact(window.scrollY > 40);
    }

    if (nav && !isHome) {
        setNavCompact(true);
    }

    // --- Sound Toggle ---
    var soundToggle = document.getElementById('soundToggle');
    var audioContext = null;
    var isPlaying = false;
    var oscillators = [];

    function createAmbientSound() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            var frequencies = [261.63, 329.63, 392.00];
            var masterGain = audioContext.createGain();
            masterGain.gain.setValueAtTime(0, audioContext.currentTime);
            masterGain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 2);
            masterGain.connect(audioContext.destination);

            oscillators = frequencies.map(function (freq, index) {
                var osc = audioContext.createOscillator();
                var gain = audioContext.createGain();
                var filter = audioContext.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.value = freq;

                filter.type = 'lowpass';
                filter.frequency.value = 800;
                filter.Q.value = 1;

                gain.gain.value = 0.3;

                var lfo = audioContext.createOscillator();
                var lfoGain = audioContext.createGain();
                lfo.frequency.value = 0.1 + index * 0.05;
                lfoGain.gain.value = 2;
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);

                osc.start();
                lfo.start();

                return { osc: osc, lfo: lfo, gain: gain };
            });

            isPlaying = true;
        } catch (e) {
            console.warn('Audio playback not available:', e);
        }
    }

    function stopAmbientSound() {
        if (!audioContext || !isPlaying) return;

        oscillators.forEach(function (item) {
            try {
                item.osc.stop();
                item.lfo.stop();
            } catch (e) {
                // Already stopped
            }
        });
        oscillators = [];
        isPlaying = false;
    }

    function updateSoundIcon(muted) {
        var icon = document.getElementById('soundIcon');
        if (!icon) return;

        if (muted) {
            icon.innerHTML =
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
        } else {
            icon.innerHTML =
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        }
    }

    if (soundToggle) {
        soundToggle.classList.add('muted');
        // the mini player (and the car player via its bridge) owns this button:
        // it reflects the persisted mute state and takes over clicks
        if (window.MiniPlayer) MiniPlayer.setIconUpdater(updateSoundIcon, soundToggle);

        soundToggle.addEventListener('click', function () {
            // handled by the music player whenever a tape exists
            // (or on the music page itself); otherwise fall back
            // to the ambient drone below
            if (window.MiniPlayer && MiniPlayer.onSoundToggleClick()) return;

            if (isPlaying) {
                stopAmbientSound();
                soundToggle.classList.add('muted');
                updateSoundIcon(true);
            } else {
                createAmbientSound();
                soundToggle.classList.remove('muted');
                updateSoundIcon(false);
            }
        });
    }

    // --- Confetti / Particles ---
    var canvas = document.getElementById('confettiCanvas');
    if (canvas) {
        var ctx = canvas.getContext('2d');
        var particles = [];
        var animationId = null;
        var isVisible = true;

        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        // Fine dust drifting across the backdrop, tinted by the current edition
        function themeAccentColors() {
            var cs = getComputedStyle(document.body);
            var primary = (cs.getPropertyValue('--theme-primary') || '').trim() || '#d4a574';
            var soft = (cs.getPropertyValue('--theme-soft') || '').trim() || '#e8c79a';
            return [primary, soft, 'rgba(255, 255, 255, 0.72)'];
        }

        function createParticle() {
            var colors = themeAccentColors();
            return {
                x: Math.random() * canvas.width,
                y: -10,
                size: Math.random() * 3 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 0.5 + 0.2,
                speedX: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.2,
                sway: Math.random() * 0.02,
                swayOffset: Math.random() * Math.PI * 2,
            };
        }

        function initParticles() {
            particles = [];
            var count = Math.min(34, Math.floor(canvas.width / 42));
            for (var i = 0; i < count; i++) {
                var p = createParticle();
                p.y = Math.random() * canvas.height;
                particles.push(p);
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var time = Date.now() * 0.001;

            particles.forEach(function (p) {
                p.y += p.speedY;
                p.x += p.speedX + Math.sin(time + p.swayOffset) * p.sway * 10;

                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            if (isVisible) {
                animationId = requestAnimationFrame(animateParticles);
            }
        }

        var heroObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    isVisible = entry.isIntersecting;
                    if (isVisible && !animationId) {
                        animateParticles();
                    } else if (!isVisible && animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                });
            },
            { threshold: 0 }
        );

        var heroEl = document.getElementById('home') || document.getElementById('home');
        if (heroEl) {
            heroObserver.observe(heroEl);
        } else {
            // On sub-pages, always animate subtly
            animateParticles();
        }

        resizeCanvas();
        initParticles();
        animateParticles();

        window.addEventListener('resize', function () {
            resizeCanvas();
            initParticles();
        });
    }

    // --- Home Page: Segmented Dial ---
    if (isHome) {
        var dialEl = document.getElementById('dial');
        var dialRotor = document.getElementById('dialRotor');
        var dialSegments = document.getElementById('dialSegments');
        var dialLabels = document.getElementById('dialLabels');
        var dialHub = document.getElementById('dialHub');
        var dialCount = document.getElementById('dialCount');
        var arrowLeft = document.getElementById('arrowLeft');
        var arrowRight = document.getElementById('arrowRight');
        var randomBtn = document.getElementById('randomBtn');
        var homeTitle = document.getElementById('homeTitle');
        var homeTitleCn = document.getElementById('homeTitleCn');
        var homeTagline = document.getElementById('homeTagline');

        var SVGNS = 'http://www.w3.org/2000/svg';

        // Dial geometry — the SVG viewBox is 400 x 400, centred on 200,200
        var CX = 200;
        var CY = 200;
        var R_RING = 197;
        var R_WEDGE_OUT = 195;
        var R_WEDGE_IN = 58;

        var dialRotation = 0;
        var isDragging = false;
        var dragStartAngle = 0;
        var dragStartRotation = 0;
        var lastIndex = -1;

        function polar(r, angleDeg) {
            var a = (angleDeg - 90) * Math.PI / 180;
            return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
        }

        function sectorPath(rIn, rOut, startAngle, endAngle) {
            var large = (endAngle - startAngle) > 180 ? 1 : 0;
            var o1 = polar(rOut, startAngle);
            var o2 = polar(rOut, endAngle);
            var i2 = polar(rIn, endAngle);
            var i1 = polar(rIn, startAngle);
            return 'M' + o1.x.toFixed(2) + ' ' + o1.y.toFixed(2) +
                'A' + rOut + ' ' + rOut + ' 0 ' + large + ' 1 ' + o2.x.toFixed(2) + ' ' + o2.y.toFixed(2) +
                'L' + i2.x.toFixed(2) + ' ' + i2.y.toFixed(2) +
                'A' + rIn + ' ' + rIn + ' 0 ' + large + ' 0 ' + i1.x.toFixed(2) + ' ' + i1.y.toFixed(2) + 'Z';
        }

        function svgEl(name, attrs) {
            var node = document.createElementNS(SVGNS, name);
            for (var k in attrs) {
                if (Object.prototype.hasOwnProperty.call(attrs, k)) {
                    node.setAttribute(k, attrs[k]);
                }
            }
            return node;
        }

        // One path per tick band — keeps the rotor cheap to composite
        function tickBand(count, rFrom, rTo, everyMajor, rMajor) {
            var d = '';
            for (var i = 0; i < count; i++) {
                var a = i * (360 / count);
                var major = everyMajor && (i % everyMajor === 0);
                var p1 = polar(rFrom, a);
                var p2 = polar(major ? rMajor : rTo, a);
                d += 'M' + p1.x.toFixed(2) + ' ' + p1.y.toFixed(2) +
                    'L' + p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
            }
            return d;
        }

        function renderDial() {
            if (!dialSegments || !dialLabels) return;
            dialSegments.innerHTML = '';

            // The selected wedge is painted with this gradient (re-tinted per edition)
            var defs = svgEl('defs');
            var grad = svgEl('radialGradient', {
                id: 'dialWedgeGrad',
                gradientUnits: 'userSpaceOnUse',
                cx: CX, cy: CY, r: 196
            });
            var offsets = [0, 0.5, 0.8, 1];
            var alphas = [0.04, 0.3, 0.8, 1];
            offsets.forEach(function (offset, i) {
                grad.appendChild(svgEl('stop', {
                    offset: offset,
                    'stop-color': editions[0].color,
                    'stop-opacity': alphas[i]
                }));
            });
            defs.appendChild(grad);
            dialSegments.appendChild(defs);

            // Machined face — sunk disc, tick grilles, hairline rings.
            // The centre band is left empty: the static lens etching (r 100-124)
            // and the aperture disc (r ~98) cover it. Kept sparse on purpose:
            // two tick bands + four hairlines, the barrel does the talking.
            dialSegments.appendChild(svgEl('circle', { class: 'dial-disc', cx: CX, cy: CY, r: R_WEDGE_OUT }));
            dialSegments.appendChild(svgEl('path', { class: 'dial-tick', d: tickBand(45, 128, 152, 0, 0) }));
            dialSegments.appendChild(svgEl('path', { class: 'dial-tick dial-tick--major', d: tickBand(30, 160, 172, 3, 184) }));
            [152, 172].forEach(function (r) {
                dialSegments.appendChild(svgEl('circle', { class: 'dial-ring', cx: CX, cy: CY, r: r }));
            });
            dialSegments.appendChild(svgEl('circle', { class: 'dial-ring', cx: CX, cy: CY, r: R_WEDGE_OUT }));
            dialSegments.appendChild(svgEl('circle', { class: 'dial-ring', cx: CX, cy: CY, r: R_RING }));

            var gapHalf = 0.9;
            editions.forEach(function (edition, i) {
                var angle = i * SEGMENT;
                var d = sectorPath(R_WEDGE_IN, R_WEDGE_OUT, angle - SEGMENT / 2 + gapHalf, angle + SEGMENT / 2 - gapHalf);

                // Whisper of the edition colour…
                dialSegments.appendChild(svgEl('path', {
                    class: 'dial-segment',
                    'data-section': edition.id,
                    d: d,
                    fill: edition.color
                }));

                // …and the bloom that fires when it is selected
                dialSegments.appendChild(svgEl('path', {
                    class: 'dial-segment-glow',
                    'data-section': edition.id,
                    d: d
                }));
            });

            // Labels ride on two alternating radii so the ring reads as scattered
            editions.forEach(function (edition) {
                var label = document.createElement('div');
                label.className = 'dial-label';
                label.setAttribute('data-section', edition.id);
                label.style.setProperty('--label-color', edition.color);
                label.innerHTML =
                    '<span class="dial-label-icon">' + edition.icon + '</span>' +
                    '<span class="dial-label-text">' + edition.label + '</span>' +
                    '<span class="dial-label-cn">' + edition.labelCn + '</span>';
                dialLabels.appendChild(label);
            });
        }

        renderDial();

        /* --- Aperture blades ---
           8 spiral blades on a glass disc; the centre hole is punched by the
           CSS mask on .dial-iris (--iris-r), the disc itself just rotates. */
        var dialIris = document.getElementById('dialIris');
        var irisBlades = document.getElementById('irisBlades');

        function irisPolar(r, angleDeg) {
            var a = angleDeg * Math.PI / 180;
            return { x: 100 + r * Math.cos(a), y: 100 + r * Math.sin(a) };
        }

        function bladePath() {
            var rIn = 25, rOut = 97;
            var a = irisPolar(rIn, 0);
            var b = irisPolar(rOut, 34);
            var c = irisPolar(rOut, 108);
            var d = irisPolar(rIn, 74);
            function dir(p, angleDeg, len, sign) {
                var r = angleDeg * Math.PI / 180;
                return {
                    x: p.x + sign * len * Math.cos(r),
                    y: p.y + sign * len * Math.sin(r)
                };
            }
            var cp1 = dir(a, 90, 44, 1);
            var cp2 = dir(b, 124, 50, -1);
            var cp3 = dir(c, 198, 50, 1);
            var cp4 = dir(d, -16, 44, -1);
            var f = function (p) { return p.x.toFixed(2) + ' ' + p.y.toFixed(2); };
            return 'M' + f(a) +
                'C' + f(cp1) + ' ' + f(cp2) + ' ' + f(b) +
                'A' + rOut + ' ' + rOut + ' 0 0 1 ' + f(c) +
                'C' + f(cp3) + ' ' + f(cp4) + ' ' + f(d) +
                'A' + rIn + ' ' + rIn + ' 0 0 0 ' + f(a) + 'Z';
        }

        function buildIris() {
            if (!irisBlades) return;
            var defs = svgEl('defs');

            var glass = svgEl('radialGradient', { id: 'irisGlass', cx: '50%', cy: '50%', r: '50%' });
            [['0%', 'iris-stop-hi'], ['55%', 'iris-stop-mid'], ['100%', 'iris-stop-lo']].forEach(function (s) {
                glass.appendChild(svgEl('stop', { offset: s[0], class: s[1] }));
            });
            defs.appendChild(glass);

            var metal = svgEl('radialGradient', { id: 'irisMetal', cx: '50%', cy: '50%', r: '50%' });
            [['0%', 'iris-stop-lo'], ['62%', 'iris-stop-mid'], ['100%', 'iris-stop-hi']].forEach(function (s) {
                metal.appendChild(svgEl('stop', { offset: s[0], class: s[1] }));
            });
            defs.appendChild(metal);

            var sheen = svgEl('linearGradient', { id: 'irisSheen', x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
            [['0%', 0.1], ['38%', 0.02], ['62%', 0]].forEach(function (s) {
                sheen.appendChild(svgEl('stop', { offset: s[0], 'stop-color': '#ffffff', 'stop-opacity': s[1] }));
            });
            defs.appendChild(sheen);
            irisBlades.appendChild(defs);

            // Glass base
            irisBlades.appendChild(svgEl('circle', { cx: 100, cy: 100, r: 96.5, fill: 'url(#irisGlass)' }));

            var d = bladePath();
            for (var i = 0; i < 8; i++) {
                irisBlades.appendChild(svgEl('path', {
                    class: 'iris-blade',
                    d: d,
                    fill: 'url(#irisMetal)',
                    transform: 'rotate(' + (i * 45) + ' 100 100)'
                }));
            }

            // Theme-tinted reflection arc over the blades (re-colours per edition)
            irisBlades.appendChild(svgEl('circle', {
                cx: 100, cy: 100, r: 76, fill: 'none',
                style: 'stroke: var(--theme-soft)',
                'stroke-width': 2.5, opacity: 0.34,
                'stroke-dasharray': '118 360',
                transform: 'rotate(-38 100 100)'
            }));

            // Coating sheen + barrel lip
            irisBlades.appendChild(svgEl('circle', { cx: 100, cy: 100, r: 96.5, fill: 'url(#irisSheen)' }));
            irisBlades.appendChild(svgEl('circle', { cx: 100, cy: 100, r: 96.5, fill: 'none', stroke: 'rgba(255,255,255,0.16)', 'stroke-width': 1 }));
            irisBlades.appendChild(svgEl('circle', { cx: 100, cy: 100, r: 92, fill: 'none', stroke: 'rgba(255,255,255,0.08)', 'stroke-width': 1 }));
        }

        buildIris();

        var glowEls = dialSegments ? dialSegments.querySelectorAll('.dial-segment-glow') : [];
        var labelEls = dialLabels ? dialLabels.querySelectorAll('.dial-label') : [];
        var gradStops = dialSegments ? dialSegments.querySelectorAll('#dialWedgeGrad stop') : [];

        function labelRadius(index) {
            var size = dialEl ? dialEl.offsetWidth : 340;
            return size * (index % 2 === 0 ? 0.365 : 0.43);
        }

        function getSelectedIndex(rotation) {
            var snapped = Math.round(rotation / SEGMENT) * SEGMENT;
            var n = editions.length;
            return ((Math.round(-snapped / SEGMENT) % n) + n) % n;
        }

        function applyTheme(index) {
            var edition = editions[index];

            // Re-tint the whole page: backdrop, glow, hairlines
            var themeClasses = editions.map(function (e) { return e.theme; });
            document.body.classList.remove.apply(document.body.classList, themeClasses);
            document.body.classList.add(edition.theme);

            // Masthead copy + hub counter (only when the edition actually changed)
            if (index !== lastIndex) {
                if (homeTitle) {
                    homeTitle.textContent = edition.label;
                    homeTitle.classList.remove('swap');
                    void homeTitle.offsetWidth;
                    homeTitle.classList.add('swap');
                }
                if (homeTitleCn) {
                    homeTitleCn.textContent = edition.labelCn;
                    homeTitleCn.classList.remove('swap');
                    void homeTitleCn.offsetWidth;
                    homeTitleCn.classList.add('swap');
                }
                if (homeTagline) {
                    homeTagline.textContent = edition.subtitle;
                }
                if (dialCount) {
                    dialCount.textContent = ('0' + (index + 1)).slice(-2) + ' / 0' + editions.length;
                }
                lastIndex = index;
            }

            // Re-colour the selected wedge gradient
            for (var s = 0; s < gradStops.length; s++) {
                gradStops[s].setAttribute('stop-color', edition.color);
            }

            // Selected wedge bloom
            for (var g = 0; g < glowEls.length; g++) {
                if (g === index) glowEls[g].classList.add('active');
                else glowEls[g].classList.remove('active');
            }

            // Active label
            for (var l = 0; l < labelEls.length; l++) {
                if (l === index) {
                    labelEls[l].classList.add('active');
                    labelEls[l].classList.remove('inactive');
                } else {
                    labelEls[l].classList.remove('active');
                    labelEls[l].classList.add('inactive');
                }
            }

            // Nav active
            var navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(function (link) {
                link.classList.remove('active');
                if (link.getAttribute('href') === edition.page) {
                    link.classList.add('active');
                }
            });
        }

        /* --- Aperture ceremony ---
           Deliberate edition switches shut the iris, swap the theme in the
           dark, then re-open onto the ENTER hub. Dragging swaps instantly —
           the ceremony only fires once the dial has settled. */
        var irisBusy = false;
        var irisPending = -1;
        var irisAngle = 0;

        function hubPop() {
            if (!dialHub) return;
            dialHub.classList.remove('enter-pop');
            void dialHub.offsetWidth;
            dialHub.classList.add('enter-pop');
        }

        function irisOpen() {
            if (!dialIris) return;
            irisAngle += 30;
            if (irisBlades) irisBlades.style.transform = 'rotate(' + irisAngle + 'deg)';
            dialIris.classList.remove('is-closed');
            hubPop();
        }

        function irisRun() {
            irisBusy = true;
            irisAngle += 24;
            if (irisBlades) irisBlades.style.transform = 'rotate(' + irisAngle + 'deg)';
            dialIris.classList.add('is-closed');
            setTimeout(function () {
                if (irisPending >= 0) applyTheme(irisPending);
                setTimeout(function () {
                    irisOpen();
                    setTimeout(function () {
                        irisBusy = false;
                        var next = irisPending;
                        if (next >= 0 && next !== lastIndex) {
                            irisPending = next;
                            irisRun();
                        } else {
                            irisPending = -1;
                        }
                    }, 520);
                }, 90);
            }, 340);
        }

        function updateTheme(index, instant) {
            if (!dialIris || instant) {
                applyTheme(index);
                return;
            }
            if (index === lastIndex) return;
            irisPending = index;
            if (!irisBusy) irisRun();
        }

        function updateDial(rotation, animate, instant) {
            dialRotation = rotation;

            if (dialRotor) {
                if (animate) {
                    dialRotor.classList.remove('dragging');
                } else {
                    dialRotor.classList.add('dragging');
                }
                dialRotor.style.transform = 'rotate(' + rotation + 'deg)';
            }

            // Keep every label upright by counter-rotating it
            for (var i = 0; i < labelEls.length; i++) {
                var label = labelEls[i];
                label.style.transition = animate
                    ? 'opacity 0.35s var(--ease-out), transform 0.6s var(--ease-out)'
                    : 'none';
                var angle = i * SEGMENT;
                var radius = labelRadius(i);
                label.style.transform =
                    'translate(-50%, -50%) ' +
                    'rotate(' + angle + 'deg) ' +
                    'translateY(-' + radius + 'px) ' +
                    'rotate(' + (-(angle + rotation)) + 'deg)';
            }

            updateTheme(getSelectedIndex(rotation), instant === true);
        }

        function snapDial() {
            var snapped = Math.round(dialRotation / SEGMENT) * SEGMENT;
            updateDial(snapped, true, true);
        }

        // Step to the neighbouring edition (direction +1 = next, -1 = previous)
        function stepEdition(direction) {
            var n = editions.length;
            var next = (((getSelectedIndex(dialRotation) + direction) % n) + n) % n;
            goToIndex(next, true);
        }

        // Turn to a specific edition by the shortest way round
        function goToIndex(index, animate) {
            var target = -(index * SEGMENT);
            while (target - dialRotation > 180) target -= 360;
            while (target - dialRotation < -180) target += 360;
            updateDial(target, animate !== false);
        }

        function enterSelected() {
            var index = getSelectedIndex(dialRotation);
            if (dialHub) {
                dialHub.classList.add('pulse');
                setTimeout(function () {
                    dialHub.classList.remove('pulse');
                }, 700);
            }
            window.location.href = editions[index].page;
        }

        function randomise() {
            if (editions.length < 2) return;
            var current = getSelectedIndex(dialRotation);
            var next = current;
            while (next === current) {
                next = Math.floor(Math.random() * editions.length);
            }
            goToIndex(next, true);
        }

        // Pointer angle from centre (0 = top, clockwise)
        function pointerToAngle(clientX, clientY) {
            var rect = dialEl.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 2;
            var screenAngle = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
            return screenAngle + 90;
        }

        function normalizeDelta(angle) {
            angle = angle % 360;
            if (angle > 180) angle -= 360;
            if (angle < -180) angle += 360;
            return angle;
        }

        var dragStartIndex = -1;

        function onDragStart(e) {
            if (!dialEl || !dialRotor) return;

            var target = e.target;
            if (target.closest('.dial-hub-btn')) return;
            if (target.closest('.dial-label')) return;

            isDragging = true;
            dialRotor.classList.add('dragging');
            dragStartIndex = getSelectedIndex(dialRotation);

            var point = e.touches ? e.touches[0] : e;
            dragStartAngle = pointerToAngle(point.clientX, point.clientY);
            dragStartRotation = dialRotation;

            e.preventDefault();
        }

        function onDragMove(e) {
            if (!isDragging) return;

            var point = e.touches ? e.touches[0] : e;
            var currentAngle = pointerToAngle(point.clientX, point.clientY);
            var delta = normalizeDelta(currentAngle - dragStartAngle);
            var newRotation = dragStartRotation + delta;

            updateDial(newRotation, false, true);
            e.preventDefault();
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            dialRotor.classList.remove('dragging');
            // Colours already followed the drag; settle, then fire the ceremony
            var changed = getSelectedIndex(dialRotation) !== dragStartIndex;
            snapDial();
            if (changed && !irisBusy) irisRun();
        }

        // Event bindings
        if (dialEl) {
            dialEl.addEventListener('mousedown', onDragStart);
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);

            dialEl.addEventListener('touchstart', onDragStart, { passive: false });
            document.addEventListener('touchmove', onDragMove, { passive: false });
            document.addEventListener('touchend', onDragEnd);

            dialEl.addEventListener('wheel', function (e) {
                if (Math.abs(e.deltaY) < 1) return;
                e.preventDefault();
                stepEdition(e.deltaY > 0 ? 1 : -1);
            }, { passive: false });
        }

        // Keyboard — the whole chooser responds, just like the reference
        document.addEventListener('keydown', function (e) {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            var tag = e.target && e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                stepEdition(1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                stepEdition(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                enterSelected();
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                randomise();
            } else if (e.key === ' ' && (e.target === dialEl || e.target === dialHub)) {
                e.preventDefault();
                enterSelected();
            }
        });

        // Arrow buttons
        if (arrowLeft) {
            arrowLeft.addEventListener('click', function () {
                stepEdition(-1);
            });
        }
        if (arrowRight) {
            arrowRight.addEventListener('click', function () {
                stepEdition(1);
            });
        }
        if (randomBtn) {
            randomBtn.addEventListener('click', function () {
                randomise();
            });
        }

        // Label click — jump straight to that edition
        for (var li = 0; li < labelEls.length; li++) {
            (function (label, index) {
                label.addEventListener('click', function (e) {
                    e.stopPropagation();
                    goToIndex(index, true);
                });
            })(labelEls[li], li);
        }

        // Hub click — enter the selected edition
        if (dialHub) {
            dialHub.addEventListener('click', enterSelected);
        }

        // Initialize
        updateDial(0, true, true);

        // Deep link — index.html?e=letter opens straight on that edition
        var deepLink = null;
        if (window.location.search) {
            var qPairs = window.location.search.replace(/^\?/, '').split('&');
            for (var qi = 0; qi < qPairs.length; qi++) {
                var qKey = qPairs[qi].split('=');
                if (qKey[0] === 'e') {
                    deepLink = decodeURIComponent(qKey[1] || '');
                    break;
                }
            }
        }
        if (deepLink) {
            for (var ei = 0; ei < editions.length; ei++) {
                if (editions[ei].id === deepLink || editions[ei].page === deepLink) {
                    updateDial(-(ei * SEGMENT), false, true);
                    if (dialRotor) dialRotor.classList.remove('dragging');
                    break;
                }
            }
        }

        // Labels are positioned in pixels, so re-lay them out on resize
        var resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                updateDial(dialRotation, false, true);
            }, 120);
        });

        // Opening shot: the aperture dilates onto the ENTER hub
        setTimeout(function () {
            irisOpen();
        }, 1100);

        // Trigger reveal animations
        setTimeout(function () {
            document.querySelectorAll('.reveal-up').forEach(function (el) {
                el.classList.add('visible');
            });
        }, 200);
    }

    // --- Sub Pages: Journey Map (Moments page) ---
    var journeyTrain = document.getElementById('journeyTrain');
    var pipContainer = document.getElementById('pipContainer');

    var journey = [
        { id: 'tanglang', date: '2026.03', place: '塘朗山', city: '深圳',
          color: '#51B37C', icon: '\u26F0', theme: 'postcard',
          memory: '第一次一起爬山。山不高，路不长，但从此以后，每一段路都想和你一起走。',
          items: buildPostcardItems({ color: '#51B37C', icon: '\u26F0',
            photos: ['山顶的风', '半山腰的初春'], photosIcon2: '\uD83C\uDF3F',
            lines: ['第一次一起爬山', '山不高，路不长', '但从此以后', '每一段路都想和你一起走'],
            sticker: 'FRESH AIR', stickerIcon: '\uD83C\uDF3F', doodleShape: 'arrow-curl' }) },
        { id: 'guangming', date: '2026.04', place: '光明', city: '深圳',
          color: '#7b8024', icon: '\uD83C\uDF3F', theme: 'postcard',
          memory: '春天的光明，草木茂盛，阳光正好。我们走过的小路，现在想起来都在发光。',
          items: buildPostcardItems({ color: '#7b8024', icon: '\uD83C\uDF3F',
            photos: ['春天的光明', '发光的小路'], photosIcon2: '\uD83C\uDF3F',
            lines: ['草木茂盛', '阳光正好', '我们走过的小路', '现在想起来都在发光'],
            sticker: '新绿', stickerIcon: '\uD83C\uDF3F', doodleShape: 'asterisk' }) },
        { id: 'xiamen', date: '2026.05', place: '厦门', city: '福建',
          color: '#5D8BBA', icon: '\uD83C\uDF0A', theme: 'postcard',
          memory: '海风、鼓浪屿、和你。这座城市的味道，大概就是我们旅行最初的样子。',
          background: { imageUrl: 'assets/xiamen-bg.jpg' },
          items: buildPostcardItems({ color: '#5D8BBA', icon: '\uD83C\uDF0A',
            photos: ['鼓浪屿的海风', '沙坡尾的傍晚'], photosIcon2: '\uD83C\uDF06',
            lines: ['海风', '鼓浪屿', '和你的笑', '是我们旅行最初的样子'],
            sticker: 'STAY SALTY', stickerIcon: '\uD83C\uDF0A', doodleShape: 'heart' }) },
        { id: 'zhuhai', date: '2026.06', place: '珠海', city: '广东',
          color: '#F9CD6C', icon: '\uD83C\uDF05', theme: 'postcard',
          memory: '情侣路上慢慢走，海对面就是澳门。那天的夕阳，美得让人不想回家。',
          items: buildPostcardItems({ color: '#F9CD6C', icon: '\uD83C\uDF05',
            photos: ['情侣路的夕阳', '海对面的澳门'], photosIcon2: '\uD83C\uDFD6',
            lines: ['慢慢走', '海对面就是澳门', '那天的夕阳', '美得让人不想回家'],
            sticker: '海风', stickerIcon: '\uD83C\uDF05', doodleShape: 'scribble' }) },
        { id: 'macau', date: '2026.06', place: '澳门', city: '中国澳门',
          color: '#DD92AC', icon: '\uD83C\uDFDB', theme: 'film',
          filmRoll: 'ROLL 02', titleEn: 'MACAU, CHINA',
          memory: '走过大三巴，吃过蛋挞，赌场没赢钱，但赢了一个和你在一起的下午。',
          items: buildFilmItems({
            roll: 'ROLL 02',
            framesTop: [
              { no: '02A', cap: '大三巴的午后', icon: '\uD83C\uDFDB', c1: '#8a5a6b', c2: '#2b1a22' },
              { no: '02B', cap: '石板路的光', icon: '\uD83C\uDF05', c1: '#b07a4e', c2: '#33200f' },
              { no: '03A', cap: '议事亭前地', icon: '\uD83C\uDFD7', c1: '#7d8f7a', c2: '#1d2620' },
              { no: '03B', cap: '风吹过骑楼', icon: '\uD83C\uDF2C', c1: '#5f7d96', c2: '#16222e' }
            ],
            framesMid: [
              { no: '12A', cap: '刚出炉的蛋挞', icon: '\uD83C\uDF6E', c1: '#c98a3f', c2: '#3a230d' },
              { no: '12B', cap: '巷子里的猫', icon: '\uD83D\uDC08', c1: '#96685f', c2: '#241512' },
              { no: '13A', cap: '霓虹初上', icon: '\uD83C\uDF03', c1: '#8f5f8f', c2: '#1f1224' },
              { no: '13B', cap: '赢了整个下午', icon: '\u2728', c1: '#b5925c', c2: '#2c2010' }
            ],
            framesSide: [
              { no: '24A', cap: '窗边的光', icon: '\uD83E\uDE9F', c1: '#a07d55', c2: '#251a0e' },
              { no: '24B', cap: '街角邮筒', icon: '\uD83D\uDDF3', c1: '#6d8a6b', c2: '#17211a' },
              { no: '25A', cap: '回程的船', icon: '\u26F5', c1: '#5c7a99', c2: '#131e2a' }
            ],
            notes: [
              { text: '这一卷，光刚刚好', x: 2, y: 29.5, rotate: -3 },
              { text: '比赌赢钱还开心的一天', x: 58, y: 62, rotate: 2, flip: true },
              { text: '下一卷，香港', x: 30, y: 76, rotate: -2 }
            ],
            endText: 'TO BE CONTINUED'
          }) },
        { id: 'hongkong', date: '2026.08', place: '香港', city: '中国香港',
          color: '#4CB57A', icon: '\uD83C\uDF03', theme: 'postcard',
          memory: '维多利亚港的灯火，太平山顶的风，还有你。这座城市的拥挤里，藏着我们最安静的时光。',
          items: buildPostcardItems({ color: '#4CB57A', icon: '\uD83C\uDF03',
            photos: ['维港的灯火', '太平山顶的风'], photosIcon2: '\uD83D\uDEA0',
            lines: ['维多利亚港的灯火', '太平山顶的风', '还有你', '城市拥挤里最安静的时光'],
            sticker: 'VIBES', stickerIcon: '\uD83C\uDF03', doodleShape: 'arrow-curl' }) },
        { id: 'chengdu', date: '2026.08', place: '成都', city: '四川',
          color: '#DF6A69', icon: '\uD83D\uDC3C', theme: 'postcard',
          memory: '火锅、熊猫、和你。在成都的慢节奏里，第一次觉得时间可以这么温柔。',
          items: buildPostcardItems({ color: '#DF6A69', icon: '\uD83D\uDC3C',
            photos: ['火锅与熊猫', '慢下来的时间'], photosIcon2: '\uD83C\uDF72',
            lines: ['火锅', '熊猫', '和你', '时间第一次这么温柔'],
            sticker: '安逸', stickerIcon: '\uD83D\uDC3C', doodleShape: 'heart' }) },
        { id: 'singapore', date: '2026.10', place: '新加坡', city: 'Singapore',
          color: '#E190B9', icon: '\uD83E\uDD81', theme: 'postcard',
          memory: '鱼尾狮、环球影城、滨海湾的灯光秀。这是我们一起走得最远的一次，也是你生日前最后一次旅行。',
          items: buildPostcardItems({ color: '#E190B9', icon: '\uD83E\uDD81',
            photos: ['滨海湾的灯', '鱼尾狮的笑'], photosIcon2: '\uD83C\uDFA1',
            lines: ['鱼尾狮', '环球影城', '滨海湾灯光秀', '一起走得最远的一次'],
            sticker: 'HELLO!', stickerIcon: '\uD83E\uDD81', doodleShape: 'sparkle' }) }
    ];

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var pipZIndex = 9000;

    // ===== Postcard Theme (Theme 1) helpers =====
    function hexToRgb(h) {
        h = (h || '#888888').replace('#', '');
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        return {
            r: parseInt(h.substr(0, 2), 16),
            g: parseInt(h.substr(2, 2), 16),
            b: parseInt(h.substr(4, 2), 16)
        };
    }

    function lighten(hex, amt) {
        var c = hexToRgb(hex);
        return 'rgb(' + Math.min(255, c.r + amt) + ',' + Math.min(255, c.g + amt) + ',' + Math.min(255, c.b + amt) + ')';
    }

    // Simple hand-drawn doodle marks (extend with more shapes later)
    function doodleSvg(shape, color) {
        color = color || '#2d9e7e';
        var s = '<svg viewBox="0 0 100 100" fill="none" stroke="' + color +
            '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">';
        if (shape === 'heart') {
            s += '<path d="M50 78 C18 54 18 24 40 24 C50 24 50 34 50 38 C50 34 50 24 60 24 C82 24 82 54 50 78 Z"/>';
        } else if (shape === 'asterisk') {
            s += '<path d="M50 14 L50 86 M14 50 L86 50 M25 25 L75 75 M75 25 L25 75"/>';
        } else if (shape === 'sparkle') {
            s += '<path d="M50 12 C54 40 60 46 88 50 C60 54 54 60 50 88 C46 60 40 54 12 50 C40 46 46 40 50 12 Z"/>';
        } else if (shape === 'scribble') {
            s += '<path d="M10 60 C25 30 40 90 55 55 C70 20 85 80 92 50"/>';
        } else { // arrow-curl (default)
            s += '<path d="M14 64 C20 36 44 30 66 40 C78 45 84 58 82 70"/>';
            s += '<path d="M68 84 L82 70 L93 78"/>';
        }
        s += '</svg>';
        return s;
    }

    // Vintage postage stamp SVGs (airmail circle / travel circle / city-arrival oval)
    function stampSvg(o) {
        o = o || {};
        var kind = o.kind || 'airmail';
        var ink = o.color || '#1e3a8a';
        var accent = o.accent || '#b91c1c';
        var city = o.city || 'CITY';
        var date = o.date || '';
        var s = '';
        if (kind === 'airmail') {
            s = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">'
                + '<defs>'
                + '<path id="amT" d="M 16,60 a 44,44 0 0,1 88,0"/>'
                + '<path id="amB" d="M 18,60 a 42,42 0 0,0 84,0"/>'
                + '</defs>'
                + '<circle cx="60" cy="60" r="58" fill="#fdfbf2"/>'
                + '<circle cx="60" cy="60" r="56" fill="none" stroke="' + ink + '" stroke-width="2.5"/>'
                + '<circle cx="60" cy="60" r="51" fill="none" stroke="' + ink + '" stroke-width="0.8"/>'
                + '<text font-family="Georgia,serif" font-size="11" font-weight="700" fill="' + ink + '" letter-spacing="3"><textPath href="#amT" startOffset="50%" text-anchor="middle">AIR MAIL</textPath></text>'
                + '<text font-family="Georgia,serif" font-size="7" font-weight="600" fill="' + ink + '" letter-spacing="2"><textPath href="#amB" startOffset="50%" text-anchor="middle">PAR AVION</textPath></text>'
                + '<g transform="translate(60,62)">'
                + '<path d="M -22,0 L -6,-2 L 4,-10 L 20,-8 L 26,0 L 14,3 L 6,3 L 3,11 L -2,10 L -8,2 Z" fill="' + ink + '"/>'
                + '</g>'
                + '</svg>';
        } else if (kind === 'travel') {
            s = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">'
                + '<defs>'
                + '<path id="tvT" d="M 18,60 a 42,42 0 0,1 84,0"/>'
                + '</defs>'
                + '<circle cx="60" cy="60" r="58" fill="#fdfbf2"/>'
                + '<circle cx="60" cy="60" r="56" fill="none" stroke="' + ink + '" stroke-width="2.5"/>'
                + '<circle cx="60" cy="60" r="51" fill="none" stroke="' + ink + '" stroke-width="0.8"/>'
                + '<text font-family="Georgia,serif" font-size="12" font-weight="700" fill="' + ink + '" letter-spacing="4"><textPath href="#tvT" startOffset="50%" text-anchor="middle">TRAVEL</textPath></text>'
                + '<g transform="translate(60,68)">'
                + '<circle cx="-14" cy="-12" r="4" fill="none" stroke="' + ink + '" stroke-width="1.5"/>'
                + '<polygon points="-22,12 -10,-4 -2,6 8,-10 22,12" fill="' + ink + '"/>'
                + '</g>'
                + '</svg>';
        } else if (kind === 'city') {
            s = '<svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg">'
                + '<defs>'
                + '<path id="ctT" d="M 26,55 a 44,32 0 0,1 88,0"/>'
                + '<path id="ctB" d="M 28,55 a 42,30 0 0,0 84,0"/>'
                + '</defs>'
                + '<ellipse cx="70" cy="55" rx="68" ry="52" fill="#fdfbf2"/>'
                + '<ellipse cx="70" cy="55" rx="66" ry="50" fill="none" stroke="' + ink + '" stroke-width="2.5"/>'
                + '<ellipse cx="70" cy="55" rx="61" ry="45" fill="none" stroke="' + ink + '" stroke-width="0.8"/>'
                + '<text font-family="Georgia,serif" font-size="7" font-weight="700" fill="' + ink + '" letter-spacing="2.5"><textPath href="#ctT" startOffset="50%" text-anchor="middle">WELCOME TO</textPath></text>'
                + '<text font-family="Georgia,serif" font-size="7" font-weight="700" fill="' + ink + '" letter-spacing="2"><textPath href="#ctB" startOffset="50%" text-anchor="middle">ARRIVAL' + (date ? ' · ' + esc(date) : '') + '</textPath></text>'
                + '<text x="70" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="800" fill="' + accent + '" letter-spacing="1.5">' + esc(city) + '</text>'
                + '<g transform="translate(70,76)">'
                + '<rect x="-18" y="-2" width="6" height="10" fill="' + ink + '"/>'
                + '<rect x="-10" y="-8" width="5" height="16" fill="' + ink + '"/>'
                + '<rect x="-2" y="-4" width="5" height="12" fill="' + ink + '"/>'
                + '<rect x="6" y="-6" width="5" height="14" fill="' + ink + '"/>'
                + '<rect x="13" y="-1" width="6" height="9" fill="' + ink + '"/>'
                + '<polygon points="-7,-8 -6,-12 -5,-8" fill="' + ink + '"/>'
                + '</g>'
                + '</svg>';
        }
        return s || '<svg viewBox="0 0 120 120"></svg>';
    }

    // Build the standard 5-piece postcard collage for a place, plus two
    // vintage postage stamps scattered around. To add new component kinds
    // (ticket / boarding pass / etc.) just extend renderCollageItem() below.
    function buildPostcardItems(o) {
        var light = lighten(o.color, 62);
        var items = [
            { type: 'photo-print', x: 3, y: 4, w: 53, rotate: -4,
              image: o.photoImage || null, photoC1: light, photoC2: o.color, icon: o.icon,
              caption: o.photos && o.photos[0], hasTape: true },
            { type: 'postcard-back', x: 47, y: 3, w: 51, rotate: 4,
              stamp: o.stamp || o.icon, address: o.address || 'WISHING YOU HAPPY DAYS!',
              photo: o.postcardPhoto || null, lines: o.lines },
            { type: 'photo-print', x: 43, y: 55, w: 56, rotate: 5,
              image: o.photoImage2 || null, photoC1: lighten(o.color, 40), photoC2: o.color,
              icon: o.photosIcon2 || o.icon, caption: o.photos && o.photos[1] },
            { type: 'sticker', shape: 'round', x: 40, y: 39, rotate: -12,
              color: o.color, icon: o.stickerIcon, text: o.sticker },
            { type: 'doodle', shape: o.doodleShape || 'arrow-curl', x: 0, y: 41, rotate: -12, color: o.doodle || '#2d9e7e' }
        ];
        // Two vintage postage stamps scattered on the page (extensible)
        var stamps = o.stamps || [
            { shape: 'airmail', x: 55, y: 29, rotate: -8 },
            { shape: 'city',    x: 0,  y: 50, rotate: 10,
              city: o.city, accent: '#b91c1c' }
        ];
        for (var si = 0; si < stamps.length; si++) {
            var st = stamps[si];
            items.push({
                type: 'postage-stamp',
                shape: st.shape,
                x: st.x, y: st.y, rotate: st.rotate,
                color: st.color || '#1e3a8a',
                accent: st.accent || '#b91c1c',
                city: st.city || o.city,
                date: st.date || o.date
            });
        }
        return items;
    }

    // ===== Film Theme (Theme 2 · 胶卷光影) helpers =====

    // Build the film-roll collage for a place: two horizontal strips + one
    // vertical strip, a line-art camera, handwritten notes and film markings.
    function buildFilmItems(o) {
        var items = [
            // Top horizontal strip — the "establishing shots"
            { type: 'film-strip', dir: 'h', x: 0, y: 4, w: 63, rotate: -2.4, frames: o.framesTop },
            // Line-art camera hanging top right
            { type: 'film-camera', x: 68, y: 1, rotate: 4 },
            // Bottom horizontal strip — food / details
            { type: 'film-strip', dir: 'h', x: 26, y: 41, w: 60, rotate: 1.8, frames: o.framesMid },
            // Vertical strip on the right edge
            { type: 'film-strip', dir: 'v', x: 87.5, y: 47, w: 11.5, rotate: 2.4, frames: o.framesSide },
            // Film edge markings
            { type: 'film-edge', text: 'MACAU COLOR 400 \u00B7 36 EXP', x: 0.5, y: 38 },
            { type: 'film-edge', text: (o.roll || 'ROLL 02') + ' \u00B7 2026', x: 97.2, y: 4 },
            // Sparkles + end mark
            { type: 'film-sparkle', x: 62, y: 0.5, rotate: 10 },
            { type: 'film-sparkle', x: 24, y: 64, rotate: -8 },
            { type: 'film-sparkle', x: 93, y: 40, rotate: 14 },
            { type: 'film-end', text: o.endText || 'TO BE CONTINUED', x: 62, y: 77, rotate: -1.5 }
        ];
        // Handwritten notes with curly arrows
        (o.notes || []).forEach(function (n) {
            items.push({ type: 'film-note', text: n.text, x: n.x, y: n.y, rotate: n.rotate || 0, flip: !!n.flip, arrow: n.arrow !== false });
        });
        return items;
    }

    function cameraSvg() {
        var st = 'stroke="#f2ead9" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"';
        var s = '<svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg">';
        // strap + lugs
        s += '<circle cx="14" cy="70" r="6" ' + st + '/>';
        s += '<circle cx="206" cy="70" r="6" ' + st + '/>';
        s += '<path d="M14 70 C 4 88 6 106 16 118" ' + st + '/>';
        s += '<path d="M206 70 C 216 88 214 106 204 118" ' + st + '/>';
        // body + top plate
        s += '<rect x="22" y="52" width="176" height="86" rx="12" fill="#16120f" ' + st + '/>';
        s += '<rect x="52" y="30" width="84" height="24" rx="8" fill="#16120f" ' + st + '/>';
        s += '<circle cx="150" cy="40" r="9" ' + st + '/>';
        s += '<circle cx="150" cy="40" r="3" ' + st + '/>';
        s += '<rect x="162" y="30" width="24" height="14" rx="4" ' + st + '/>';
        // lens
        s += '<circle cx="96" cy="95" r="34" ' + st + '/>';
        s += '<circle cx="96" cy="95" r="24" ' + st + '/>';
        s += '<circle cx="96" cy="95" r="12" fill="#f2ead9" stroke="none" opacity="0.92"/>';
        s += '<circle cx="102" cy="88" r="4" fill="#16120f" stroke="none"/>';
        // viewfinder + texture
        s += '<rect x="158" y="72" width="26" height="18" rx="4" ' + st + '/>';
        s += '<path d="M162 118 l14 -14 M170 122 l14 -14" stroke="#f2ead9" stroke-width="2" opacity="0.5" fill="none" stroke-linecap="round"/>';
        s += '<path d="M52 42 L38 42" ' + st + '/>';
        s += '</svg>';
        return s;
    }

    function filmArrowSvg() {
        return '<svg viewBox="0 0 80 60" fill="none" stroke="#f2ead9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M8 8 C 30 14 48 22 58 40"/>' +
            '<path d="M46 42 L58 40 L56 27"/>' +
            '</svg>';
    }

    function filmSparkleSvg() {
        return '<svg viewBox="0 0 60 60" fill="none" stroke="#f2ead9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M30 6 C32 22 38 28 54 30 C38 32 32 38 30 54 C28 38 22 32 6 30 C22 28 28 22 30 6 Z"/>' +
            '</svg>';
    }

    function esc(s) {
        return String(s == null ? '' : s);
    }

    // Render one collage component -> HTML string
    function renderCollageItem(it) {
        var style = 'left:' + (it.x || 0) + '%; top:' + (it.y || 0) + '%; --rot:' + (it.rotate || 0) + 'deg;';
        var cls = 'collage-item ' + it.type + (it.hasTape ? ' has-tape' : '');
        var inner = '';

        if (it.type === 'photo-print') {
            style += ' width:' + (it.w || 42) + '%;';
            if (it.image) {
                // Real photo: drop an <img> into the frame (lightbox enlarges it)
                inner =
                    '<div class="photo-frame photo-frame-img">' +
                        '<img class="photo-img" src="' + esc(it.image) + '" alt="' + esc(it.caption || '') + '" loading="lazy">' +
                    '</div>' +
                    (it.caption ? '<div class="photo-caption">' + esc(it.caption) + '</div>' : '');
            } else {
                // Placeholder print (gradient + emoji) until a real photo is supplied
                inner =
                    '<div class="photo-frame" style="--photo-c1:' + esc(it.photoC1 || '#7ba862') + ';--photo-c2:' + esc(it.photoC2 || '#3d5e2e') + '">' +
                        '<span class="photo-icon">' + esc(it.icon || '\uD83C\uDF04') + '</span>' +
                    '</div>' +
                    (it.caption ? '<div class="photo-caption">' + esc(it.caption) + '</div>' : '');
            }
        } else if (it.type === 'postcard-back') {
            style += ' width:' + (it.w || 42) + '%;';
            var pcPhoto = it.photo
                ? '<div class="postcard-photo"><img src="' + esc(it.photo) + '" alt="" loading="lazy"></div>'
                : '';
            inner =
                '<div class="postcard-stamp-box"><span class="postcard-stamp">' + esc(it.stamp || '\u2709') + '</span></div>' +
                '<div class="postcard-address">' + esc(it.address || 'WISHING YOU HAPPY DAYS!') + '</div>' +
                pcPhoto +
                '<div class="postcard-lines">' +
                    (it.lines || []).map(function (l) { return '<div class="postcard-line">' + esc(l) + '</div>'; }).join('') +
                '</div>';
        } else if (it.type === 'sticker') {
            if (it.shape === 'banner') {
                cls += ' sticker-banner';
                style += ' height:34px;';
                inner = esc(it.text);
            } else {
                cls += ' sticker-round';
                style += ' width:96px; height:96px;';
                inner = (it.icon ? '<span class="sticker-icon">' + esc(it.icon) + '</span>' : '') + esc(it.text);
            }
            if (it.color) style += ' --sticker-color:' + esc(it.color) + ';';
        } else if (it.type === 'doodle') {
            style += ' width:88px; height:88px;';
            inner = doodleSvg(it.shape, it.color);
        } else if (it.type === 'postage-stamp') {
            var sw, sh;
            if (it.shape === 'city') { sw = 140; sh = 110; }
            else { sw = 110; sh = 110; }
            // Cream paper backing + clip to the stamp shape so the page's
            // background (often green) doesn't show through as a box.
            style += ' width:' + sw + 'px; height:' + sh + 'px; background:#fdfbf2; border-radius:50%;';
            inner = '<div class="stamp-art">' + stampSvg({
                kind: it.shape, color: it.color, accent: it.accent,
                city: it.city, date: it.date
            }) + '</div>';
        } else if (it.type === 'film-strip') {
            var vertical = it.dir === 'v';
            cls += vertical ? ' film-strip-v' : ' film-strip-h';
            style += ' width:' + (it.w || (vertical ? 13 : 62)) + '%;';
            var fh = '';
            var frames = it.frames || [];
            for (var fi = 0; fi < frames.length; fi++) {
                var fr = frames[fi];
                var frameInner = fr.image
                    ? '<img class="film-frame-img" src="' + esc(fr.image) + '" alt="' + esc(fr.cap || '') + '" loading="lazy">'
                    : '<span class="film-frame-icon">' + esc(fr.icon || '\uD83C\uDF04') + '</span>';
                fh += '<div class="film-frame-wrap">' +
                        '<div class="film-frame" style="--photo-c1:' + esc(fr.c1 || '#4a323c') + ';--photo-c2:' + esc(fr.c2 || '#181014') + '">' +
                            '<span class="film-frame-no">' + esc(fr.no || '') + '</span>' + frameInner +
                        '</div>' +
                        (fr.cap ? '<div class="film-frame-cap">' + esc(fr.cap) + '</div>' : '') +
                    '</div>';
            }
            var holeH = '<div class="film-holes film-holes-h"></div>';
            var holeV = '<div class="film-holes film-holes-v"></div>';
            inner = vertical
                ? holeV + '<div class="film-frames">' + fh + '</div>' + holeV
                : holeH + '<div class="film-frames">' + fh + '</div>' + holeH;
        } else if (it.type === 'film-camera') {
            style += ' width:200px;';
            inner = cameraSvg();
        } else if (it.type === 'film-note') {
            style += ' width:190px;';
            inner =
                '<div class="film-note-text">' + esc(it.text) + '</div>' +
                (it.arrow === false ? '' : filmArrowSvg());
            if (it.flip) cls += ' arrow-flip';
        } else if (it.type === 'film-sparkle') {
            style += ' width:34px; height:34px;';
            inner = filmSparkleSvg();
        } else if (it.type === 'film-edge') {
            style += ' width:20px;';
            inner = '<span class="film-edge-text">' + esc(it.text) + '</span>';
        } else if (it.type === 'film-end') {
            inner = '<span class="film-end-mark"><i></i>' + esc(it.text) + '</span>';
        } else if (it.type === 'ticket-stub') {
            style += ' width:' + (it.w || 80) + '%;';
            inner =
                '<div class="ticket-main">' +
                    '<div class="ticket-route">' + esc(it.from) + ' &rarr; ' + esc(it.to) + '</div>' +
                    '<div class="ticket-detail">' + esc(it.date) + ' &middot; ' + esc(it.seatLabel || 'SEAT') + '</div>' +
                '</div>' +
                '<div class="ticket-perf"></div>' +
                '<div class="ticket-stub-side">' + esc(it.seatLabel || 'SEAT') + '<div class="ticket-seat">' + esc(it.seat) + '</div></div>';
            if (it.color) style += ' --ticket-color:' + esc(it.color) + ';';
        } else if (it.type === 'boarding-pass') {
            style += ' width:' + (it.w || 84) + '%;';
            inner =
                '<div class="bp-main">' +
                    '<div class="bp-flight">' + esc(it.flight) + '</div>' +
                    '<div class="bp-row">' +
                        '<div class="bp-field"><strong>From</strong><span>' + esc(it.from) + '</span></div>' +
                        '<div class="bp-field"><strong>To</strong><span>' + esc(it.to) + '</span></div>' +
                        '<div class="bp-field"><strong>Seat</strong><span>' + esc(it.seat) + '</span></div>' +
                    '</div>' +
                '</div>' +
                '<div class="bp-stub">' + esc(it.seat) + '</div>';
            if (it.color) style += ' --ticket-color:' + esc(it.color) + ';';
        }

        return '<div class="' + cls + '" style="' + style + '" tabindex="0" role="button" aria-label="点击放大">' + inner + '</div>';
    }

    function renderPlaceCollage(place, placeIndex, prevPlace, nextPlace, totalStr) {
        var placeNo = ('0' + (placeIndex + 1)).slice(-2);

        // Background: photo if provided, else a soft tint derived from the place colour.
        // Painted directly as inline styles on body (not via a CSS custom property):
        // a url() inside a custom property is resolved relative to the stylesheet
        // (css/), which would 404 for "assets/...". Inline styles resolve relative
        // to the document, so "assets/xiamen-bg.jpg" hits the real file.
        if (place.background && place.background.imageUrl) {
            document.body.style.backgroundImage = 'url("' + place.background.imageUrl + '")';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundRepeat = 'no-repeat';
        } else if (place.background && place.background.css) {
            document.body.style.backgroundImage = place.background.css;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundRepeat = 'no-repeat';
        } else if (place.color) {
            document.body.style.backgroundImage =
                'linear-gradient(180deg, ' + lighten(place.color, 98) + ', ' + lighten(place.color, 42) + ')';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundRepeat = 'no-repeat';
        }

        var html = '';
        html += '<a class="place-back" href="moments.html">&#8249; 全部邮票</a>';
        html += '<header class="place-masthead">';
        html += '  <span class="place-label">POSTCARD PRINTS</span>';
        html += '  <div class="place-no">No. ' + placeNo + ' / ' + totalStr + '</div>';
        html += '  <h1 class="place-title">' + esc(place.place) + '</h1>';
        html += '  <div class="place-sub">' + esc(place.date) + ' &middot; ' + esc(place.city) + '</div>';
        html += '</header>';
        html += '<div class="place-collage" id="placeCollage">';
        (place.items || []).forEach(function (it) { html += renderCollageItem(it); });
        html += '</div>';
        html += '<nav class="place-nav">';
        html += prevPlace
            ? '<a class="place-nav-link" href="place.html?place=' + prevPlace.id + '">&#8249; ' + esc(prevPlace.place) + '</a>'
            : '<span></span>';
        html += nextPlace
            ? '<a class="place-nav-link place-nav-next" href="place.html?place=' + nextPlace.id + '">' + esc(nextPlace.place) + ' &rarr;</a>'
            : '<span></span>';
        html += '</nav>';

        placePage.innerHTML = html;

        var collage = document.getElementById('placeCollage');
        var itemEls = collage ? collage.querySelectorAll('.collage-item') : [];
        for (var ci = 0; ci < itemEls.length; ci++) {
            (function (el) {
                el.addEventListener('click', function () { openLightbox(el); });
                el.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(el); }
                });
            })(itemEls[ci]);
        }
    }

    // Film theme (Theme 2 · 胶卷光影) — darkroom poster layout
    function renderPlaceFilm(place, placeIndex, prevPlace, nextPlace, totalStr) {
        var placeNo = ('0' + (placeIndex + 1)).slice(-2);

        // Switch the body theme to the dark film look
        document.body.classList.remove('theme-postcard');
        document.body.classList.add('theme-film');

        var html = '';
        html += '<a class="place-back" href="moments.html">&#8249; 全部底片</a>';
        html += '<header class="place-masthead film-masthead">';
        html += '  <span class="film-roll-tag">' + esc(place.filmRoll || 'ROLL 02') + ' &middot; FILM</span>';
        html += '  <div class="place-no">No. ' + placeNo + ' / ' + totalStr + '</div>';
        html += '  <h1 class="place-title film-title">' + esc(place.place) + '</h1>';
        html += '  <div class="film-title-en">' + esc(place.titleEn || 'MACAU, CHINA') + '</div>';
        html += '  <div class="place-sub">' + esc(place.date) + ' &middot; ' + esc(place.city) + '</div>';
        html += '  <p class="film-memory">' + esc(place.memory || '') + '</p>';
        html += '</header>';
        html += '<div class="place-collage film-stage" id="placeCollage">';
        (place.items || []).forEach(function (it) { html += renderCollageItem(it); });
        html += '</div>';
        html += '<nav class="place-nav">';
        html += prevPlace
            ? '<a class="place-nav-link" href="place.html?place=' + prevPlace.id + '">&#8249; ' + esc(prevPlace.place) + '</a>'
            : '<span></span>';
        html += nextPlace
            ? '<a class="place-nav-link place-nav-next" href="place.html?place=' + nextPlace.id + '">' + esc(nextPlace.place) + ' &rarr;</a>'
            : '<span></span>';
        html += '</nav>';

        placePage.innerHTML = html;

        var collage = document.getElementById('placeCollage');
        var itemEls = collage ? collage.querySelectorAll('.collage-item') : [];
        for (var ci = 0; ci < itemEls.length; ci++) {
            (function (el) {
                el.addEventListener('click', function () { openLightbox(el); });
                el.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(el); }
                });
            })(itemEls[ci]);
        }
    }

    // Lightbox (click any collage item to enlarge)
    var lightboxEl = document.getElementById('placeLightbox');
    var lightboxStageEl = document.getElementById('placeLightboxStage');
    var lightboxWired = false;

    function openLightbox(srcEl) {
        if (!lightboxEl) return;
        var clone = srcEl.cloneNode(true);
        clone.classList.add('in-lightbox');
        clone.removeAttribute('style');
        clone.style.cursor = 'default';
        lightboxStageEl.innerHTML = '';
        lightboxStageEl.appendChild(clone);
        lightboxEl.hidden = false;
        requestAnimationFrame(function () { lightboxEl.classList.add('open'); });
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightboxEl) return;
        lightboxEl.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(function () { lightboxEl.hidden = true; lightboxStageEl.innerHTML = ''; }, 320);
    }

    if (lightboxEl && !lightboxWired) {
        lightboxWired = true;
        var lbClose = document.getElementById('placeLightboxClose');
        var lbScrim = document.getElementById('placeLightboxScrim');
        if (lbClose) lbClose.addEventListener('click', closeLightbox);
        if (lbScrim) lbScrim.addEventListener('click', closeLightbox);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && lightboxEl && !lightboxEl.hidden) closeLightbox();
        });
    }

    // Build smooth path through all points (Catmull-Rom → Bezier)
    function createSmoothPath(points) {
        if (points.length < 2) return '';
        var d = 'M ' + points[0].x + ' ' + points[0].y;
        for (var i = 0; i < points.length - 1; i++) {
            var p0 = points[i - 1] || points[i];
            var p1 = points[i];
            var p2 = points[i + 1];
            var p3 = points[i + 2] || p2;
            var cp1x = p1.x + (p2.x - p0.x) / 6;
            var cp1y = p1.y + (p2.y - p0.y) / 6;
            var cp2x = p2.x - (p3.x - p1.x) / 6;
            var cp2y = p2.y - (p3.y - p1.y) / 6;
            d += ' C ' + cp1x + ' ' + cp1y + ' ' + cp2x + ' ' + cp2y + ' ' + p2.x + ' ' + p2.y;
        }
        return d;
    }

    // --- Journey Stage (scroll-driven polaroid clothesline) ---
    // Prints are pegged to a sagging string. Scrolling slides the whole line
    // past a fixed centre; the line chases the scroll with a critically damped
    // spring, and every print swings on its peg with the speed the line is
    // moving, then settles back. Scroll position stays the single source of
    // truth — drag / click / arrow keys all just move the window scroll.
    var journeyStageEl = document.getElementById('journeyStage');
    var journeyHintEl = document.getElementById('journeyHint');
    var plRoot = document.getElementById('polaroidLine');

    /* --- The moments ----------------------------------------------------
       Photos live in assets/moments/. `label` is the handwriting on the
       print, `text` is the thought shown under the line. Add or remove
       entries freely — the counter and the railway follow the count.
       `fit: 'contain'` is for photos whose shape fights the print frame
       (very tall or very wide): they are shown whole over a blurred copy
       of themselves instead of being cropped. */
    var moments = [
        { id: 'paizhao', image: 'assets/moments/m01.jpg', label: '宣讲那天',
          text: '在一起之前，有个周末我要去宣讲，玩出说要来给我拍照，我以为开玩笑呢，结果后面真来了，而且结束时候还送我回了个家。后面才知道那天其实他熬夜熬穿了，一时不知道应该感动还是说他要惜命一点。' },
        { id: 'goupiwang', image: 'assets/moments/m02.jpg', label: '狗屁王',
          text: '感谢这个送我狗屁王并且包保养（防滑贴+脚垫更换）的玩出\uD83D\uDE2D It means a lot' },
        { id: 'qinghui', image: 'assets/moments/m03.jpg', label: '清灰 + 加装',
          text: '弯处清灰+加装存储服务，好吧其实只是弯处比较爱倒腾电脑' },
        { id: 'jianpan', image: 'assets/moments/m04.jpg', label: '键盘复活', fit: 'contain',
          text: '不小心把水撒进我的磁轴键盘里了\uD83D\uDE2D 然后弯处提供到一个远程指导键盘拆卸清理修复服务 我感觉读电子系真有用吧！我的键盘已复活\u270C' },
        { id: 'pifu', image: 'assets/moments/m05.jpg', label: '心选皮肤',
          text: '感谢这个品味很好的弯处，就这样获得心选皮肤\uD83D\uDE0B' },
        { id: 'maixuanfeng', image: 'assets/moments/m06.jpg', label: '麦旋风',
          text: '玩出看到我之前发的微博说很想吃麦旋风，然后第二天就带我去吃了\u270C' },
        { id: 'guanjun', image: 'assets/moments/m07.jpg', label: '工院杯冠军',
          text: '工院杯冠军\uD83E\uDD47对手追分时投出关键3分之人<br>书院杯亚军\uD83E\uDD48进入状态最快最稳之人 好几场的前几分都是玩出拿的' },
        { id: 'chidao', image: 'assets/moments/m08.jpg', label: '快迟到的玩出',
          text: '二楼阳台拍的一个快迟到的玩出，我觉得我的构图很艺术有人懂吗' },
        { id: 'diandongche', image: 'assets/moments/m09.jpg', label: '校园兜风',
          text: '这个学期基本上都是：早上弯处就骑车送我去工位，然后去上课，中午来接我，下午一起去上课，下课之后去吃饭，晚上送我去工位，然后十一点多再来工位接我回宿舍。<br>好几次emo了，弯处就载我在校园里兜风，或者去欣园喂小猫。感谢伟大的弯处，感谢纯粹的、珍贵的校园时光。' },
        { id: 'xiyu', video: 'assets/moments/m10.mp4', image: 'assets/moments/m10.jpg',
          label: '西语对话', fit: 'contain',
          text: '去成都玩的时候遇到了西班牙人找人帮忙拍照，于是西语高考生热情对话中。有种吾家有儿初长成的欣慰感。' },
        { id: 'wanjudian', image: 'assets/moments/m11.jpg', label: '玩具店',
          text: '一看见玩具店就走不动道、嘴角下不来之人，最熟悉高达/小车/乐高之人。' },
        { id: 'gaoda', image: 'assets/moments/m12.jpg', label: '高达',
          text: '但是也是和我弟最有共同话题之人，感觉我弟已对弯处心生仰慕之情。' },
        { id: 'shuangying', image: 'assets/moments/m13.jpg', label: '双影奇境', fit: 'contain',
          text: '爽玩双影奇境！' },
        { id: 'pindou', image: 'assets/moments/m14.jpg', label: '爽拼拼豆',
          text: '爽拼半天豆，好爽好爽' },
        { id: 'wuzi', image: 'assets/moments/m15.jpg', label: '天神下凡',
          text: '弯处帮我从国内带到新加坡的物资、月饼，对于留子（体验期限四个月）完全是天神下凡' }
    ];

    function clampN(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function pad2(n) { return n < 10 ? '0' + n : String(n); }

    if (plRoot && journeyStageEl) {
        var N = moments.length;
        var plCardsEl = document.getElementById('plCards');
        var plPathEl = document.getElementById('plStringPath');
        var plCapEl = document.getElementById('plCap');
        var plCountEl = document.getElementById('plCount');
        var plSrEl = document.getElementById('plSr');
        var railBarEl = document.getElementById('journeyRailBar');
        var railTrainEl = document.getElementById('railBarTrain');
        var journeyFooterEl = document.querySelector('.footer');
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var CFG = { cardWidth: 300, cardRatio: 0.75, sag: 46, spacing: 1.06, spring: 62, swing: 1 };

        /* --- Painted photographs -----------------------------------------
           Places we have no photo of yet get a painted landscape instead, so
           the page works with no assets. Drop a file into `journey[i].image`
           and that wins. */
        var PALETTES = {
            dawn:  { top: '#e7b7a5', bottom: '#f8e8d6', sun: '#fff4df', far: '#d2b2bb', near: '#3a2a3b', mist: '255,240,232' },
            alpine:{ top: '#7ea5c8', bottom: '#e3ecf2', sun: '#ffffff', far: '#a9bfd0', near: '#1c3044', mist: '236,244,250' },
            dusk:  { top: '#2a2450', bottom: '#ef8d60', sun: '#ffd9a6', far: '#93607c', near: '#18121f', mist: '255,196,160' },
            mist:  { top: '#c4d0cb', bottom: '#eef1ec', sun: '#ffffff', far: '#aebcb5', near: '#2c3a33', mist: '246,248,245' },
            sea:   { top: '#8fc6d8', bottom: '#f0f6f4', sun: '#ffffff', far: '#7fa8bd', near: '#12303c', mist: '238,248,250' },
            jade:  { top: '#a8c6a0', bottom: '#f2f5e8', sun: '#fffbe8', far: '#8fae8c', near: '#22301f', mist: '244,248,238' },
            city:  { top: '#3b2a4a', bottom: '#f0a35e', sun: '#ffd9a6', far: '#7a4f6b', near: '#14101c', mist: '255,205,175' }
        };

        // Per-place mood + seed, so every print is a different photograph.
        var PHOTO_LOOK = {
            tanglang:  { palette: 'jade',   seed: 12 },
            guangming: { palette: 'dawn',   seed: 27 },
            xiamen:    { palette: 'sea',    seed: 5  },
            zhuhai:    { palette: 'dusk',   seed: 9  },
            macau:     { palette: 'city',   seed: 16 },
            hongkong:  { palette: 'city',   seed: 33 },
            chengdu:   { palette: 'mist',   seed: 21 },
            singapore: { palette: 'alpine', seed: 44 }
        };

        function mulberry32(seed) {
            var a = seed >>> 0;
            return function () {
                a = (a + 0x6d2b79f5) >>> 0;
                var t = a;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }
        function hexRgb(h) {
            var v = parseInt(h.replace('#', ''), 16);
            return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
        }
        function mixRgb(a, b, t) {
            var A = hexRgb(a), B = hexRgb(b);
            return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')';
        }

        // A layered-ridge landscape: sky, a low sun, five ridges fading into
        // haze with mist between them, a tree line, vignette, film grain.
        function paintLandscape(seed, palette, w, h) {
            var c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            var g = c.getContext('2d');
            if (!g) return '';
            var P = PALETTES[palette] || PALETTES.dawn;
            var r = mulberry32(seed * 104729 + 7);

            var sky = g.createLinearGradient(0, 0, 0, h * 0.72);
            sky.addColorStop(0, P.top);
            sky.addColorStop(1, P.bottom);
            g.fillStyle = sky;
            g.fillRect(0, 0, w, h);

            var sx = w * (0.22 + r() * 0.56);
            var sy = h * (0.26 + r() * 0.16);
            var halo = g.createRadialGradient(sx, sy, 0, sx, sy, w * 0.45);
            halo.addColorStop(0, 'rgba(' + hexRgb(P.sun).join(',') + ',.85)');
            halo.addColorStop(0.08, 'rgba(' + hexRgb(P.sun).join(',') + ',.55)');
            halo.addColorStop(1, 'rgba(' + hexRgb(P.sun).join(',') + ',0)');
            g.fillStyle = halo;
            g.fillRect(0, 0, w, h);
            g.fillStyle = P.sun;
            g.beginPath();
            g.arc(sx, sy, h * 0.045, 0, Math.PI * 2);
            g.fill();

            var layers = 5;
            for (var L = 0; L < layers; L++) {
                var k = L / (layers - 1);
                var base = h * (0.42 + k * 0.4);
                var amp = h * (0.07 + k * 0.1);
                var ph = [r(), r(), r(), r()].map(function (v) { return v * Math.PI * 2; });
                var fr = [1.3 + r(), 3.1 + r() * 2, 7 + r() * 4, 17 + r() * 8];
                var ridge = function (x) {
                    var u = x / w;
                    return base - amp * (
                        0.55 * Math.sin(u * fr[0] + ph[0]) +
                        0.28 * Math.sin(u * fr[1] + ph[1]) +
                        0.12 * Math.abs(Math.sin(u * fr[2] + ph[2])) +
                        0.05 * Math.sin(u * fr[3] + ph[3])
                    );
                };
                var mist = g.createLinearGradient(0, base - amp * 1.4, 0, base + amp * 0.4);
                mist.addColorStop(0, 'rgba(' + P.mist + ',0)');
                mist.addColorStop(1, 'rgba(' + P.mist + ',' + (0.55 - k * 0.35).toFixed(2) + ')');
                g.fillStyle = mist;
                g.fillRect(0, base - amp * 1.4, w, amp * 1.8);
                var body = g.createLinearGradient(0, base - amp, 0, h);
                body.addColorStop(0, mixRgb(P.far, P.near, Math.pow(k, 1.3)));
                body.addColorStop(1, mixRgb(P.far, P.near, Math.min(1, Math.pow(k, 1.3) + 0.18)));
                g.fillStyle = body;
                g.beginPath();
                g.moveTo(0, h);
                for (var x = 0; x <= w; x += 6) g.lineTo(x, ridge(x));
                g.lineTo(w, h);
                g.closePath();
                g.fill();
                if (L >= layers - 2) {
                    g.fillStyle = mixRgb(P.far, P.near, Math.min(1, Math.pow(k, 1.3) + 0.08));
                    for (var tx = 0; tx < w; tx += 7 + r() * 9) {
                        if (r() < 0.35) continue;
                        var ty = ridge(tx) + 2;
                        var th = h * (0.025 + r() * 0.035) * (0.6 + k);
                        var tw = th * 0.32;
                        g.beginPath();
                        g.moveTo(tx, ty - th);
                        g.lineTo(tx + tw, ty);
                        g.lineTo(tx - tw, ty);
                        g.closePath();
                        g.fill();
                    }
                }
            }

            var vig = g.createRadialGradient(w / 2, h * 0.45, h * 0.3, w / 2, h / 2, w * 0.78);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,.32)');
            g.fillStyle = vig;
            g.fillRect(0, 0, w, h);

            var grain = g.getImageData(0, 0, w, h);
            var d = grain.data;
            for (var i = 0; i < d.length; i += 4) {
                var v = (r() - 0.5) * 14;
                d[i] += v;
                d[i + 1] += v;
                d[i + 2] += v;
            }
            g.putImageData(grain, 0, 0);
            return c.toDataURL('image/jpeg', 0.86);
        }

        /* --- Build the prints -------------------------------------------
           Prints are not links any more — this page is just photos plus a
           thought, so clicking one only slides it to the centre.
           To drop in a real photo: give the entry an `image`
           (`journey[i].image = 'assets/moments/xxx.jpg'`); anything without
           one keeps the painted placeholder below. */
        var cards = [];
        moments.forEach(function (m, i) {
            var media = '';
            if (m.video) {
                media = '<video src="' + m.video + '"' +
                    (m.image ? ' poster="' + m.image + '"' : '') +
                    ' muted loop playsinline preload="none"></video>';
            } else if (m.image) {
                media = '<img src="' + m.image + '" alt="' + m.label + '" draggable="false" />';
            }
            // blurred backdrop for the photos that are shown whole
            if (m.fit === 'contain' && m.image) {
                media = '<i class="pl-shot-bg" style="background-image:url(\'' +
                    m.image + '\')"></i>' + media;
            }
            var card = document.createElement('div');
            card.className = 'pl-card' + (m.video ? ' is-video' : '');
            card.setAttribute('data-i', i);
            card.setAttribute('data-on', i === 0 ? '1' : '0');
            card.setAttribute('data-fit', m.fit === 'contain' ? 'contain' : 'cover');
            card.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
            card.style.setProperty('--i', i);
            card.innerHTML =
                '<div class="pl-print">' +
                    '<div class="pl-shot">' + media + '</div>' +
                    '<div class="pl-note">' + m.label + '</div>' +
                '</div>' +
                '<div class="pl-peg"></div>';
            plCardsEl.appendChild(card);
            cards.push(card);
        });

        // Paint stand-ins for any moment without a photo, one per frame.
        (function paintQueue() {
            var queue = [];
            for (var q = 0; q < moments.length; q++) if (!moments[q].image) queue.push(q);
            (function next() {
                if (!queue.length) return;
                var i = queue.shift();
                var look = PHOTO_LOOK[moments[i].id] || { palette: 'dawn', seed: i + 3 };
                var url = paintLandscape(look.seed, look.palette, 900, 1200);
                var shot = cards[i] && cards[i].querySelector('.pl-shot');
                if (url && shot) {
                    var img = document.createElement('img');
                    img.src = url;
                    img.alt = moments[i].label;
                    img.draggable = false;
                    shot.appendChild(img);
                }
                requestAnimationFrame(next);
            })();
        })();

        /* --- Physics ----------------------------------------------------- */
        var sim = { off: 0, vel: 0, target: 0, a: [], w: [] };
        var size = { w: 0, h: 0, cw: 300, y0: 120, sag: 46 };
        var spacing = 318;
        var active = 0;
        var idle = true;
        var lineOn = false;   // the line is faded in far enough to run video

        function measure() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            var narrow = w < 700;
            // caption bar + railway bar. Raised for the FangSong captions: the
            // face runs wider per character at the same size, so the longest
            // thought needs an extra line or two than the old sans did.
            var bottomReserve = narrow ? 200 : 190;
            var y0 = Math.round(clampN(h * 0.17, 84, 148));
            var sag = Math.round(Math.min(CFG.sag, h * 0.075));
            // print height = cw / ratio (photo) + 64 (margins + note), so the
            // width budget has to be worked out from the height budget.
            var avail = h - y0 - sag - bottomReserve;
            var cw = Math.round(clampN(
                Math.min(CFG.cardWidth, w * (narrow ? 0.54 : 0.42), (avail - 70) * CFG.cardRatio),
                140, CFG.cardWidth));
            size = { w: w, h: h, cw: cw, y0: y0, sag: sag };
            spacing = cw * CFG.spacing;
            plRoot.style.setProperty('--pl-cw', cw + 'px');
        }

        function springStep(x, v, target, dt, k) {
            var c = 2 * Math.sqrt(k);
            var nv = v + (k * (target - x) - c * v) * dt;
            return [x + nv * dt, nv];
        }

        // A print lags the line, is pulled back by gravity, and is damped.
        function swingStep(a, w, lineVel, dt, gain) {
            var nw = w + (-38 * a - 4.2 * w + lineVel * 0.0034 * gain) * dt;
            return [clampN(a + nw * dt, -0.6, 0.6), nw];
        }

        function stringY(x, w, y0, sag) {
            var t = clampN(x / w, 0, 1);
            return y0 + 4 * sag * t * (1 - t);
        }

        function nearestAt(off) { return clampN(Math.round(off / spacing), 0, N - 1); }
        function stageTop() { return journeyStageEl.offsetTop; }
        function scrollNow() { return window.scrollY || window.pageYOffset || 0; }
        function journeyUnits() { return (scrollNow() - stageTop()) / window.innerHeight; }

        /* --- Per-frame render -------------------------------------------- */
        var prev = 0;
        var raf = 0;

        function frame(now) {
            raf = requestAnimationFrame(frame);
            var dt = Math.min(0.033, (now - prev) / 1000);
            prev = now;
            if (idle) return;

            var w = size.w, cw = size.cw, y0 = size.y0, sag = size.sag;
            var before = sim.off;
            var s = springStep(sim.off, sim.vel, sim.target, dt, CFG.spring);
            sim.off = s[0];
            sim.vel = s[1];
            var lineVel = -(sim.off - before) / Math.max(dt, 1e-3);
            var gain = reduceMotion ? 0 : CFG.swing;
            var near = nearestAt(sim.off);

            for (var i = 0; i < N; i++) {
                var el = cards[i];
                var x = w / 2 + i * spacing - sim.off;
                if (x < -cw * 1.6 || x > w + cw * 1.6) {
                    el.style.visibility = 'hidden';
                    continue;
                }
                el.style.visibility = 'visible';
                var sw = swingStep(sim.a[i] || 0, sim.w[i] || 0, lineVel, dt, gain);
                var a = sw[0];
                if (gain) a += Math.sin(now / 1300 + i * 1.7) * 0.0009 * gain;  // idle breeze
                sim.a[i] = a;
                sim.w[i] = sw[1];
                var y = stringY(x, w, y0, sag) - 6;
                el.style.transform =
                    'translate(' + (x - cw / 2).toFixed(1) + 'px,' + y.toFixed(1) + 'px)' +
                    ' rotate(' + a.toFixed(4) + 'rad)';
                el.style.zIndex = String(i === near ? N + 1 : N - Math.abs(i - near));
            }

            plPathEl.setAttribute('d', 'M0 ' + y0 + ' Q' + (w / 2) + ' ' + (y0 + 2 * sag) + ' ' + w + ' ' + y0);
            if (near !== active) {
                active = near;
                renderActive();
            }
        }

        function renderActive() {
            var m = moments[active];
            if (!m) return;
            for (var i = 0; i < cards.length; i++) {
                cards[i].setAttribute('data-on', i === active ? '1' : '0');
                cards[i].setAttribute('aria-hidden', i === active ? 'false' : 'true');
                var v = cards[i].querySelector('video');
                if (!v) continue;
                // only the centred clip runs, and only while the line is on screen
                if (i === active && lineOn) {
                    var pr = v.play();
                    if (pr && pr.catch) pr.catch(function () {});
                } else {
                    v.pause();
                }
            }
            if (plCapEl) {
                plCapEl.innerHTML = '<span class="pl-sub">' + m.text + '</span>';
            }
            if (plCountEl) plCountEl.innerHTML = '<b>' + pad2(active + 1) + '</b> / ' + pad2(N);
            if (plSrEl) plSrEl.textContent = '第 ' + (active + 1) + ' 张，共 ' + N + ' 张：' + m.label;
        }

        function pauseVideos() {
            for (var i = 0; i < cards.length; i++) {
                var v = cards[i].querySelector('video');
                if (v) v.pause();
            }
        }

        /* --- Scroll is the driver ---------------------------------------- */
        var ready = false;

        function onScroll() {
            var js = journeyUnits();
            sim.target = clampN(js, 0, N - 1) * spacing;

            // fade in from just above the stage, fade out once the last print lands
            var fin = clampN((js + 0.35) / 0.35, 0, 1);
            var fout = 1 - clampN((js - (N - 1) - 0.35) / 1, 0, 1);
            var op = Math.min(fin, fout);
            plRoot.style.opacity = op.toFixed(3);
            idle = op < 0.02;
            plRoot.setAttribute('data-idle', idle ? '1' : '0');
            if (!ready && op > 0.25) {
                ready = true;
                plRoot.setAttribute('data-ready', '1');   // starts the drop-in
            }
            if (lineOn !== op > 0.3) {
                lineOn = op > 0.3;
                if (lineOn) renderActive(); else pauseVideos();
            }

            if (journeyHintEl) journeyHintEl.classList.toggle('hidden', js > 0.12);

            if (railTrainEl) {
                railTrainEl.style.setProperty('--rail-pos',
                    (2 + clampN(js / (N - 1), 0, 1) * 96).toFixed(2) + '%');
            }
            if (railBarEl) railBarEl.classList.toggle('visible', op > 0.02);
        }

        function layoutStage() {
            var vh = window.innerHeight;
            var footerH = journeyFooterEl ? journeyFooterEl.offsetHeight : 0;
            journeyStageEl.style.height =
                Math.max(N * vh, Math.round((N + 1.7) * vh - footerH)) + 'px';
        }

        /* --- Programmatic scrolling (drag / click / arrows / buttons) ----- */
        var scrollAnim = 0;
        function cancelScrollAnim() {
            if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = 0; }
        }
        function animateScroll(top) {
            cancelScrollAnim();
            var from = scrollNow();
            var delta = Math.max(0, top) - from;
            if (Math.abs(delta) < 1) return;
            var t0 = performance.now();
            var dur = Math.min(900, 300 + Math.abs(delta) * 0.22);
            var step = function (now) {
                var t = Math.min(1, (now - t0) / dur);
                var e = 1 - Math.pow(1 - t, 3);
                window.scrollTo(0, from + delta * e);
                scrollAnim = t < 1 ? requestAnimationFrame(step) : 0;
            };
            scrollAnim = requestAnimationFrame(step);
        }
        function scrollToIndex(i) {
            animateScroll(stageTop() + clampN(i, 0, N - 1) * window.innerHeight);
        }

        window.addEventListener('wheel', cancelScrollAnim, { passive: true });
        window.addEventListener('touchstart', cancelScrollAnim, { passive: true });

        /* --- Drag the line ------------------------------------------------ */
        var drag = null;
        var lastDragEnd = -1e9;

        plRoot.addEventListener('pointerdown', function (e) {
            if (e.target && e.target.closest && e.target.closest('.pl-bar')) return;
            cancelScrollAnim();
            drag = { x: e.clientX, start: scrollNow(), lx: e.clientX, lt: e.timeStamp, v: 0, moved: false };
        });

        plRoot.addEventListener('pointermove', function (e) {
            if (!drag) return;
            var dx = e.clientX - drag.x;
            if (!drag.moved && Math.abs(dx) > 5) {
                drag.moved = true;
                plRoot.setAttribute('data-drag', '1');
                try { plRoot.setPointerCapture(e.pointerId); } catch (err) {}
            }
            if (!drag.moved) return;
            var dt = Math.max(1, e.timeStamp - drag.lt);
            drag.v = 0.7 * ((e.clientX - drag.lx) / dt) + 0.3 * drag.v;
            drag.lx = e.clientX;
            drag.lt = e.timeStamp;

            var idx = (drag.start - stageTop()) / window.innerHeight - dx / spacing;
            if (idx < 0) idx *= 0.35;                                   // rubber band
            else if (idx > N - 1) idx = (N - 1) + (idx - (N - 1)) * 0.35;
            window.scrollTo(0, Math.max(0, stageTop() + idx * window.innerHeight));
        });

        function endDrag(e) {
            if (!drag) return;
            var d = drag;
            drag = null;
            plRoot.setAttribute('data-drag', '0');
            if (e && e.pointerId != null) {
                try { plRoot.releasePointerCapture(e.pointerId); } catch (err) {}
            }
            if (!d.moved) return;
            lastDragEnd = performance.now();
            // carry the flick into the next station
            scrollToIndex(Math.round(clampN(sim.target / spacing - d.v * 180 / spacing, 0, N - 1)));
        }
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);

        /* --- Click a print: slides it to the centre (no navigation) ------ */
        cards.forEach(function (card, i) {
            card.addEventListener('click', function () {
                if (performance.now() - lastDragEnd < 320) return;
                scrollToIndex(i);
            });
        });

        var plPrev = document.getElementById('plPrev');
        var plNext = document.getElementById('plNext');
        if (plPrev) plPrev.addEventListener('click', function () { scrollToIndex(active - 1); });
        if (plNext) plNext.addEventListener('click', function () { scrollToIndex(active + 1); });

        plRoot.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') scrollToIndex(active + 1);
            else if (e.key === 'ArrowLeft') scrollToIndex(active - 1);
            else if (e.key === 'Home') scrollToIndex(0);
            else if (e.key === 'End') scrollToIndex(N - 1);
            else return;
            e.preventDefault();
        });

        /* --- Wiring ------------------------------------------------------- */
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () { onScroll(); ticking = false; });
        }, { passive: true });

        function refresh() {
            layoutStage();
            measure();
            sim.target = clampN(journeyUnits(), 0, N - 1) * spacing;
            sim.off = sim.target;
            onScroll();
            renderActive();
        }
        window.addEventListener('resize', refresh);
        window.addEventListener('load', refresh);

        layoutStage();
        measure();
        renderActive();
        onScroll();
        prev = performance.now();
        raf = requestAnimationFrame(frame);
    }

    // --- Place detail page (place.html?place=<id>) ---
    var placePage = document.getElementById('placePage');
    if (placePage) {
        var requestedId = null;
        var query = window.location.search;
        if (query) {
            var pairs = query.replace(/^\?/, '').split('&');
            for (var pi = 0; pi < pairs.length; pi++) {
                var kv = pairs[pi].split('=');
                if (kv[0] === 'place') {
                    requestedId = decodeURIComponent(kv[1] || '');
                    break;
                }
            }
        }

        var placeIndex = -1;
        for (var pj = 0; pj < journey.length; pj++) {
            if (journey[pj].id === requestedId) {
                placeIndex = pj;
                break;
            }
        }

        var totalStr = ('0' + journey.length).slice(-2);

        if (placeIndex === -1) {
            placePage.innerHTML =
                '<div class="place-error">' +
                    '<p class="stamp-no">Not found</p>' +
                    '<h1 class="place-title">没有找到这个地方</h1>' +
                    '<a class="place-back" href="moments.html" style="margin-top:1.75rem">&#8249; 回到全部邮票</a>' +
                '</div>';
        } else {
            var place = journey[placeIndex];
            var placeNo = ('0' + (placeIndex + 1)).slice(-2);
            var prevPlace = placeIndex > 0 ? journey[placeIndex - 1] : null;
            var nextPlace = placeIndex < journey.length - 1 ? journey[placeIndex + 1] : null;

            document.title = place.place + ' — Happy Birthday';

            if (place.theme === 'film' && place.items) {
                renderPlaceFilm(place, placeIndex, prevPlace, nextPlace, totalStr);
            } else if (place.theme === 'postcard' && place.items) {
                renderPlaceCollage(place, placeIndex, prevPlace, nextPlace, totalStr);
            } else {
                placePage.innerHTML =
                    '<a class="place-back" href="moments.html">&#8249; 全部邮票</a>' +
                    '<div class="place-art" style="--stamp-color: ' + place.color + '">' +
                        '<span class="place-art-icon">' + place.icon + '</span>' +
                    '</div>' +
                    '<div class="place-no">No. ' + placeNo + ' / ' + totalStr + '</div>' +
                    '<h1 class="place-title">' + place.place + '</h1>' +
                    '<div class="place-meta">' +
                        '<div class="place-meta-item"><strong>Date</strong>' + place.date + '</div>' +
                        '<div class="place-meta-item"><strong>City</strong>' + place.city + '</div>' +
                        '<div class="place-meta-item"><strong>Stop</strong>' + placeNo + ' / ' + totalStr + '</div>' +
                    '</div>' +
                    '<p class="place-memory">' + place.memory + '</p>' +
                    '<nav class="place-nav">' +
                        (prevPlace
                            ? '<a class="place-nav-link" href="place.html?place=' + prevPlace.id + '">&#8249; ' + prevPlace.place + '</a>'
                        : '<span></span>') +
                    (nextPlace
                        ? '<a class="place-nav-link place-nav-next" href="place.html?place=' + nextPlace.id + '">' + nextPlace.place + ' &rarr;</a>'
                        : '<span></span>') +
                '</nav>';
        }
    }
    }

    // --- Picture-in-Picture Window Management ---
    function bringToFront(win) {
        pipZIndex++;
        win.style.zIndex = pipZIndex;
    }

    function makeDraggable(win, header) {
        var isDown = false;
        var startX = 0, startY = 0;
        var winX = 0, winY = 0;

        function onStart(e) {
            isDown = true;
            header.classList.add('dragging');
            var point = e.touches ? e.touches[0] : e;
            var rect = win.getBoundingClientRect();
            startX = point.clientX;
            startY = point.clientY;
            winX = rect.left;
            winY = rect.top;
            bringToFront(win);
            e.preventDefault();
        }

        function onMove(e) {
            if (!isDown) return;
            var point = e.touches ? e.touches[0] : e;
            var dx = point.clientX - startX;
            var dy = point.clientY - startY;
            var newX = winX + dx;
            var newY = winY + dy;
            newX = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, newX));
            newY = Math.max(0, Math.min(window.innerHeight - 50, newY));
            win.style.left = newX + 'px';
            win.style.top = newY + 'px';
            e.preventDefault();
        }

        function onEnd() {
            isDown = false;
            header.classList.remove('dragging');
        }

        header.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        header.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }

    function openPipWindow(loc) {
        if (!pipContainer) return;

        // If already open, bring to front
        var existing = document.getElementById('pip-' + loc.id);
        if (existing) {
            bringToFront(existing);
            return;
        }

        var win = document.createElement('div');
        win.className = 'pip-window';
        win.id = 'pip-' + loc.id;

        var photoHtml = loc.photo
            ? '<img src="' + loc.photo + '" alt="' + loc.place + '">'
            : '<div class="pip-photo-placeholder">Add photo here<br>assets/' + loc.id + '.jpg</div>';

        win.innerHTML =
            '<div class="pip-header">' +
                '<div class="pip-title">' +
                    '<span class="pip-title-icon">&#9734;</span>' +
                    '<div>' +
                        '<div class="pip-title-text">' + loc.place + '</div>' +
                        '<div class="pip-title-date">' + loc.date + ' &middot; ' + loc.city + '</div>' +
                    '</div>' +
                '</div>' +
                '<button class="pip-close" aria-label="Close">&times;</button>' +
            '</div>' +
            '<div class="pip-body">' +
                '<div class="pip-photo">' + photoHtml + '</div>' +
                '<p class="pip-memory">' + loc.memory + '</p>' +
            '</div>' +
            '<div class="pip-footer">&#10022;</div>';

        pipContainer.appendChild(win);

        // Stagger position for multiple windows
        var openCount = pipContainer.querySelectorAll('.pip-window').length;
        var offset = (openCount - 1) * 28;
        var winW = 400;
        var winH = win.offsetHeight || 420;
        var centerX = (window.innerWidth - winW) / 2;
        var centerY = Math.max(80, (window.innerHeight - winH) / 2);
        win.style.left = Math.max(10, Math.min(window.innerWidth - winW - 10, centerX + offset)) + 'px';
        win.style.top = Math.max(80, Math.min(window.innerHeight - 100, centerY + offset)) + 'px';

        bringToFront(win);

        // Show with animation
        requestAnimationFrame(function () {
            win.classList.add('visible');
        });

        // Make draggable
        var header = win.querySelector('.pip-header');
        makeDraggable(win, header);

        // Close button
        var closeBtn = win.querySelector('.pip-close');
        closeBtn.addEventListener('click', function () {
            closePipWindow(win);
        });
    }

    function closePipWindow(win) {
        win.classList.add('closing');
        setTimeout(function () {
            if (win.parentNode) {
                win.parentNode.removeChild(win);
            }
        }, 300);
    }

    // --- Scroll Reveal ---
    var revealElements = document.querySelectorAll('.reveal-up, .reveal-side');
    if (revealElements.length && !isHome) {
        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    }
})();
