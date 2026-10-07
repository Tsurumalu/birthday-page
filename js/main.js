/* ============================================
   Birthday Gift — Interactive Logic
   Multi-edition segmented dial
   ============================================ */

(function () {
    'use strict';

    // --- Editions config ---
    var editions = [
        {
            id: 'card',
            label: 'The Card',
            subtitle: 'A birthday card, written just for you.',
            page: 'card.html',
            theme: 'theme-card',
            icon: '&#9825;',
            color: '#c9a06a',
            angle: 0
        },
        {
            id: 'story',
            label: 'Moments',
            subtitle: 'The chapters of us, from the beginning.',
            page: 'moments.html',
            theme: 'theme-story',
            icon: '&#10022;',
            color: '#b88e8a',
            angle: 90
        },
        {
            id: 'letter',
            label: 'The Letter',
            subtitle: 'Words I want you to keep.',
            page: 'message.html',
            theme: 'theme-letter',
            icon: '&#9993;',
            color: '#7a9d90',
            angle: 180
        },
        {
            id: 'wish',
            label: 'The Wish',
            subtitle: 'Hopes for every year ahead.',
            page: 'wish.html',
            theme: 'theme-wish',
            icon: '&#9734;',
            color: '#7a94b8',
            angle: 270
        }
    ];

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

    function updateNavScroll() {
        if (!nav) return;
        if (window.scrollY > 40) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    if (nav && !isHome) {
        nav.classList.add('scrolled');
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

        soundToggle.addEventListener('click', function () {
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

        function createParticle() {
            var colors = ['#d4a574', '#e8c79a', '#f5f0e8', '#c9a06a', '#b88e8a', '#7a9d90', '#7a94b8'];
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
            var count = Math.min(45, Math.floor(canvas.width / 30));
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
        var arrowLeft = document.getElementById('arrowLeft');
        var arrowRight = document.getElementById('arrowRight');
        var homeTitle = document.getElementById('homeTitle');
        var homeSubtitle = document.getElementById('homeSubtitle');

        var dialRotation = 0;
        var isDragging = false;
        var dragStartAngle = 0;
        var dragStartRotation = 0;

        // Generate SVG segments
        function polarToCartesian(cx, cy, radius, angleInDegrees) {
            var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return {
                x: cx + (radius * Math.cos(angleInRadians)),
                y: cy + (radius * Math.sin(angleInRadians))
            };
        }

        function describeArc(x, y, radius, startAngle, endAngle) {
            var start = polarToCartesian(x, y, radius, endAngle);
            var end = polarToCartesian(x, y, radius, startAngle);
            var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
            return [
                'M', start.x, start.y,
                'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
            ].join(' ');
        }

        function createSegmentPath(cx, cy, innerR, outerR, startAngle, endAngle) {
            var outerArc = describeArc(cx, cy, outerR, startAngle, endAngle);
            var innerArc = describeArc(cx, cy, innerR, endAngle, startAngle);
            var innerStart = polarToCartesian(cx, cy, innerR, endAngle);
            return outerArc + ' L ' + innerStart.x + ' ' + innerStart.y + ' ' + innerArc + ' Z';
        }

        function renderDial() {
            if (!dialSegments || !dialLabels) return;

            var cx = 180;
            var cy = 180;
            var outerR = 170;
            var innerR = 62;
            var segmentSpan = 90;
            var gap = 2;

            editions.forEach(function (edition, i) {
                var startAngle = edition.angle - segmentSpan / 2 + gap / 2;
                var endAngle = edition.angle + segmentSpan / 2 - gap / 2;

                // Segment
                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('class', 'dial-segment');
                path.setAttribute('data-section', edition.id);
                path.setAttribute('d', createSegmentPath(cx, cy, innerR, outerR, startAngle, endAngle));
                path.setAttribute('fill', edition.color);
                dialSegments.appendChild(path);

                // Label
                var label = document.createElement('div');
                label.className = 'dial-label';
                label.setAttribute('data-section', edition.id);
                label.style.setProperty('--angle', edition.angle + 'deg');
                label.innerHTML =
                    '<span class="dial-label-icon">' + edition.icon + '</span>' +
                    '<span class="dial-label-text">' + edition.label + '</span>';
                dialLabels.appendChild(label);
            });
        }

        renderDial();

        function getSelectedIndex(rotation) {
            var snapped = Math.round(rotation / 90) * 90;
            return ((Math.round(-snapped / 90) % 4) + 4) % 4;
        }

        function updateTheme(index) {
            var edition = editions[index];

            // Update body theme class
            document.body.classList.remove('theme-card', 'theme-story', 'theme-letter', 'theme-wish');
            document.body.classList.add(edition.theme);

            // Update home text
            if (homeTitle) {
                homeTitle.textContent = edition.label;
            }
            if (homeSubtitle) {
                homeSubtitle.textContent = edition.subtitle;
            }

            // Update active segment
            var segments = document.querySelectorAll('.dial-segment');
            segments.forEach(function (seg, i) {
                if (i === index) {
                    seg.classList.add('active');
                } else {
                    seg.classList.remove('active');
                }
            });

            // Update active label
            var labels = document.querySelectorAll('.dial-label');
            labels.forEach(function (label, i) {
                if (i === index) {
                    label.classList.add('active');
                    label.classList.remove('inactive');
                } else {
                    label.classList.remove('active');
                    label.classList.add('inactive');
                }
            });

            // Update nav active
            var navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(function (link) {
                link.classList.remove('active');
                if (link.getAttribute('href') === edition.page) {
                    link.classList.add('active');
                }
            });
        }

        function updateDial(rotation, animate) {
            dialRotation = rotation;

            if (dialRotor) {
                if (animate) {
                    dialRotor.classList.remove('dragging');
                } else {
                    dialRotor.classList.add('dragging');
                }
                dialRotor.style.transform = 'rotate(' + rotation + 'deg)';
            }

            // Keep labels upright by counter-rotating
            var labels = document.querySelectorAll('.dial-label');
            labels.forEach(function (label, i) {
                if (animate) {
                    label.style.transition = 'opacity 0.3s var(--ease-out), transform 0.5s var(--ease-out)';
                } else {
                    label.style.transition = 'none';
                }
                var angle = editions[i].angle;
                var radius = parseFloat(getComputedStyle(dialEl).getPropertyValue('--label-radius')) || 108;
                label.style.transform =
                    'translate(-50%, -50%) ' +
                    'rotate(' + angle + 'deg) ' +
                    'translateY(-' + radius + 'px) ' +
                    'rotate(' + (-(angle + rotation)) + 'deg)';
            });

            var selectedIndex = getSelectedIndex(rotation);
            updateTheme(selectedIndex);
        }

        function snapDial() {
            var snapped = Math.round(dialRotation / 90) * 90;
            updateDial(snapped, true);
        }

        function rotateBySegments(direction) {
            var target = Math.round((dialRotation + direction * 90) / 90) * 90;
            updateDial(target, true);
        }

        // Pointer angle from center (0 = top, clockwise)
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

        function onDragStart(e) {
            if (!dialEl || !dialRotor) return;

            var target = e.target;
            if (target.closest('.dial-hub-btn')) return;
            if (target.closest('.dial-label')) return;

            isDragging = true;
            dialRotor.classList.add('dragging');

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

            updateDial(newRotation, false);
            e.preventDefault();
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            dialRotor.classList.remove('dragging');
            snapDial();
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
                var direction = e.deltaY > 0 ? 1 : -1;
                rotateBySegments(direction);
            }, { passive: false });

            dialEl.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    rotateBySegments(1);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    rotateBySegments(-1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (dialHub) dialHub.click();
                }
            });
        }

        // Arrow buttons
        if (arrowLeft) {
            arrowLeft.addEventListener('click', function () {
                rotateBySegments(-1);
            });
        }
        if (arrowRight) {
            arrowRight.addEventListener('click', function () {
                rotateBySegments(1);
            });
        }

        // Label click
        document.querySelectorAll('.dial-label').forEach(function (label) {
            label.addEventListener('click', function (e) {
                e.stopPropagation();
                var sectionId = label.getAttribute('data-section');
                for (var i = 0; i < editions.length; i++) {
                    if (editions[i].id === sectionId) {
                        var targetRotation = -editions[i].angle;
                        while (targetRotation - dialRotation > 180) targetRotation -= 360;
                        while (targetRotation - dialRotation < -180) targetRotation += 360;
                        updateDial(targetRotation, true);
                        break;
                    }
                }
            });
        });

        // Hub click — navigate to selected edition
        if (dialHub) {
            dialHub.addEventListener('click', function () {
                dialHub.classList.add('pulse');
                setTimeout(function () {
                    dialHub.classList.remove('pulse');
                }, 600);

                var selectedIndex = getSelectedIndex(dialRotation);
                window.location.href = editions[selectedIndex].page;
            });
        }

        // Initialize
        updateDial(0, true);

        // Trigger reveal animations
        setTimeout(function () {
            document.querySelectorAll('.reveal-up').forEach(function (el) {
                el.classList.add('visible');
            });
        }, 200);
    }

    // --- Sub Pages: Card Flip ---
    var birthdayCard = document.getElementById('birthdayCard');
    if (birthdayCard) {
        birthdayCard.addEventListener('click', function () {
            birthdayCard.classList.toggle('flipped');
        });

        birthdayCard.setAttribute('tabindex', '0');
        birthdayCard.setAttribute('role', 'button');
        birthdayCard.setAttribute('aria-label', 'Flip the birthday card');

        birthdayCard.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                birthdayCard.classList.toggle('flipped');
            }
        });
    }

    // --- Sub Pages: Wish Cards ---
    var wishCards = document.querySelectorAll('.wish-card');
    wishCards.forEach(function (card) {
        card.addEventListener('click', function () {
            card.classList.toggle('revealed');
        });

        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.classList.toggle('revealed');
            }
        });
    });

    // --- Sub Pages: Journey Map (Moments page) ---
    var stationsList = document.getElementById('stationsList');
    var railwayTimeline = document.getElementById('railwayTimeline');
    var journeyTrain = document.getElementById('journeyTrain');
    var journeyMap = document.getElementById('journeyMap');
    var journeyPath = document.getElementById('journeyPath');
    var journeyLocations = document.getElementById('journeyLocations');
    var pipContainer = document.getElementById('pipContainer');

    var journey = [
        { id: 'tanglang', date: '2026.03', place: '塘朗山', city: '深圳', x: 730, y: 470,
          gradient: 'linear-gradient(135deg, #1a4d2e 0%, #2d6a4f 50%, #40916c 100%)', icon: '\u26F0',
          memory: '第一次一起爬山。山不高，路不长，但从此以后，每一段路都想和你一起走。' },
        { id: 'guangming', date: '2026.04', place: '光明', city: '深圳', x: 695, y: 445,
          gradient: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 50%, #95d5b2 100%)', icon: '\uD83C\uDF3F',
          memory: '春天的光明，草木茂盛，阳光正好。我们走过的小路，现在想起来都在发光。' },
        { id: 'xiamen', date: '2026.05', place: '厦门', city: '福建', x: 810, y: 320,
          gradient: 'linear-gradient(135deg, #0077b6 0%, #0096c7 50%, #48cae4 100%)', icon: '\uD83C\uDF0A',
          memory: '海风、鼓浪屿、和你。这座城市的味道，大概就是我们旅行最初的样子。' },
        { id: 'zhuhai', date: '2026.06', place: '珠海', city: '广东', x: 595, y: 470,
          gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fcd34d 100%)', icon: '\uD83C\uDF05',
          memory: '情侣路上慢慢走，海对面就是澳门。那天的夕阳，美得让人不想回家。' },
        { id: 'macau', date: '2026.06', place: '澳门', city: '中国澳门', x: 560, y: 480,
          gradient: 'linear-gradient(135deg, #6b21a8 0%, #9333ea 50%, #c084fc 100%)', icon: '\uD83C\uDFDB',
          memory: '走过大三巴，吃过蛋挞，赌场没赢钱，但赢了一个和你在一起的下午。' },
        { id: 'hongkong', date: '2026.08', place: '香港', city: '中国香港', x: 760, y: 510,
          gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)', icon: '\uD83C\uDF03',
          memory: '维多利亚港的灯火，太平山顶的风，还有你。这座城市的拥挤里，藏着我们最安静的时光。' },
        { id: 'chengdu', date: '2026.08', place: '成都', city: '四川', x: 270, y: 265,
          gradient: 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #f87171 100%)', icon: '\uD83D\uDC3C',
          memory: '火锅、熊猫、和你。在成都的慢节奏里，第一次觉得时间可以这么温柔。' },
        { id: 'singapore', date: '2026.10', place: '新加坡', city: 'Singapore', x: 710, y: 605,
          gradient: 'linear-gradient(135deg, #134e4a 0%, #14b8a6 50%, #5eead4 100%)', icon: '\uD83E\uDD81',
          memory: '鱼尾狮、环球影城、滨海湾的灯光秀。这是我们一起走得最远的一次，也是你生日前最后一次旅行。' }
    ];

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var pipZIndex = 9000;

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

    // Generate station cards
    if (stationsList) {
        journey.forEach(function (loc) {
            var station = document.createElement('div');
            station.className = 'station';
            station.setAttribute('data-id', loc.id);
            station.setAttribute('tabindex', '0');
            station.setAttribute('role', 'button');
            station.innerHTML =
                '<div class="station-marker"></div>' +
                '<div class="station-card">' +
                    '<div class="station-card-image" style="background: ' + loc.gradient + '">' +
                        '<span class="station-card-icon">' + loc.icon + '</span>' +
                    '</div>' +
                    '<div class="station-card-body">' +
                        '<span class="station-card-date">' + loc.date + ' &middot; ' + loc.city + '</span>' +
                        '<h3 class="station-card-place">' + loc.place + '</h3>' +
                        '<p class="station-card-memory">' + loc.memory + '</p>' +
                        '<span class="station-card-hint">&#10022; 点击打开回忆 &rarr;</span>' +
                    '</div>' +
                '</div>';

            station.addEventListener('click', function () {
                openPipWindow(loc);
            });
            station.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPipWindow(loc);
                }
            });

            stationsList.appendChild(station);
        });

        // Reveal station cards on scroll
        var stationCards = stationsList.querySelectorAll('.station-card');
        var stationRevealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        stationRevealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
        );
        stationCards.forEach(function (card) {
            stationRevealObserver.observe(card);
        });
    }

    // Train scroll animation — train moves along the track as you scroll
    if (railwayTimeline && journeyTrain) {
        function updateTrainPosition() {
            var rect = railwayTimeline.getBoundingClientRect();
            var windowHeight = window.innerHeight;
            var timelineHeight = rect.height;

            // Progress: 0 when timeline top reaches viewport center, 1 when timeline bottom passes center
            var viewportCenter = windowHeight / 2;
            var progress = (viewportCenter - rect.top) / timelineHeight;
            progress = Math.max(0, Math.min(1, progress));

            // Train travels from top padding to bottom padding of the track
            var trackTop = 48;   // matches .railway-timeline padding-top (3rem)
            var trackBottom = timelineHeight - 48;
            var trainY = trackTop + progress * (trackBottom - trackTop - 30); // -30 for train height offset

            journeyTrain.style.top = trainY + 'px';

            // Highlight active station
            var stations = stationsList ? stationsList.querySelectorAll('.station') : [];
            var activeIndex = Math.round(progress * (journey.length - 1));
            stations.forEach(function (s, i) {
                if (i === activeIndex) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        }

        // Throttle with requestAnimationFrame
        var ticking = false;
        function onScrollTrain() {
            if (!ticking) {
                requestAnimationFrame(function () {
                    updateTrainPosition();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScrollTrain, { passive: true });
        window.addEventListener('resize', onScrollTrain);
        // Initial position
        setTimeout(updateTrainPosition, 100);
    }

    // Generate map path and markers
    if (journeyPath && journeyLocations) {
        // Path
        var pathD = createSmoothPath(journey);
        journeyPath.setAttribute('d', pathD);

        // Get path length for animation
        var pathLength = journeyPath.getTotalLength();
        journeyPath.style.strokeDasharray = pathLength;
        journeyPath.style.strokeDashoffset = pathLength;

        // Location markers
        journey.forEach(function (loc) {
            var g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('class', 'journey-loc');
            g.setAttribute('data-id', loc.id);
            g.setAttribute('transform', 'translate(' + loc.x + ' ' + loc.y + ')');

            // Glow circle
            var glow = document.createElementNS(SVG_NS, 'circle');
            glow.setAttribute('class', 'journey-loc-glow');
            glow.setAttribute('cx', '0');
            glow.setAttribute('cy', '0');
            glow.setAttribute('r', '18');
            g.appendChild(glow);

            // Main circle
            var circle = document.createElementNS(SVG_NS, 'circle');
            circle.setAttribute('class', 'journey-loc-circle');
            circle.setAttribute('cx', '0');
            circle.setAttribute('cy', '0');
            circle.setAttribute('r', '6');
            g.appendChild(circle);

            // Place name
            var text = document.createElementNS(SVG_NS, 'text');
            text.setAttribute('class', 'journey-loc-text');
            text.setAttribute('x', '0');
            text.setAttribute('y', '-16');
            text.textContent = loc.place;
            g.appendChild(text);

            // Date
            var dateText = document.createElementNS(SVG_NS, 'text');
            dateText.setAttribute('class', 'journey-loc-date');
            dateText.setAttribute('x', '0');
            dateText.setAttribute('y', '22');
            dateText.textContent = loc.date;
            g.appendChild(dateText);

            g.addEventListener('click', function () {
                openPipWindow(loc);
            });

            journeyLocations.appendChild(g);
        });

        // Scroll-triggered path drawing + marker reveal
        var mapHint = document.querySelector('.journey-map-hint');
        var mapObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        // Draw path
                        journeyPath.classList.add('drawn');

                        // Reveal markers one by one
                        var markers = journeyLocations.querySelectorAll('.journey-loc');
                        markers.forEach(function (marker, i) {
                            setTimeout(function () {
                                marker.classList.add('visible');
                            }, 400 + i * 250);
                        });

                        // Show hint
                        setTimeout(function () {
                            if (mapHint) mapHint.classList.add('visible');
                        }, 400 + markers.length * 250 + 200);

                        mapObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );

        var mapSection = document.getElementById('journeyMapSection');
        if (mapSection) {
            mapObserver.observe(mapSection);
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
