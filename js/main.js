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
            angle: 60
        },
        {
            id: 'letter',
            label: 'The Letter',
            subtitle: 'Words I want you to keep.',
            page: 'message.html',
            theme: 'theme-letter',
            icon: '&#9993;',
            color: '#7a9d90',
            angle: 120
        },
        {
            id: 'wish',
            label: 'The Wish',
            subtitle: 'Hopes for every year ahead.',
            page: 'wish.html',
            theme: 'theme-wish',
            icon: '&#9734;',
            color: '#7a94b8',
            angle: 180
        },
        {
            id: 'games',
            label: 'Games',
            subtitle: 'Our little arcade — drop a pin, press play.',
            page: 'games.html',
            theme: 'theme-games',
            icon: '&#127918;',
            color: '#a48cc4',
            angle: 240
        },
        {
            id: 'music',
            label: 'Music',
            subtitle: 'An evening drive — pick a tape, press play.',
            page: 'musics.html',
            theme: 'theme-music',
            icon: '&#9835;',
            color: '#d98a56',
            angle: 300
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
            var segmentSpan = SEGMENT;
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
            var snapped = Math.round(rotation / SEGMENT) * SEGMENT;
            var n = editions.length;
            return ((Math.round(-snapped / SEGMENT) % n) + n) % n;
        }

        function updateTheme(index) {
            var edition = editions[index];

            // Update body theme class
            var themeClasses = editions.map(function (e) { return e.theme; });
            document.body.classList.remove.apply(document.body.classList, themeClasses);
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
            var snapped = Math.round(dialRotation / SEGMENT) * SEGMENT;
            updateDial(snapped, true);
        }

        function rotateBySegments(direction) {
            var target = Math.round((dialRotation + direction * SEGMENT) / SEGMENT) * SEGMENT;
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

    // --- Journey Stage (scroll-driven stamp collage) ---
    var journeyStampsEl = document.getElementById('journeyStamps');
    var journeyStageEl = document.getElementById('journeyStage');
    var journeyHintEl = document.getElementById('journeyHint');

    function lerp(a, b, t) { return a + (b - a) * t; }
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    if (journeyStampsEl && journeyStageEl) {
        var N = journey.length;
        var stampRotations = [-2.5, 1.8, -1.2, 2.2, -1.8, 1.4, -2.2, 1.1];
        var railBarEl = document.getElementById('journeyRailBar');
        var railTrainEl = document.getElementById('railBarTrain');
        var journeyFooterEl = document.querySelector('.footer');

        // Build stamp elements
        journey.forEach(function (loc, i) {
            var no = ('0' + (i + 1)).slice(-2);
            var total = ('0' + journey.length).slice(-2);
            var rot = stampRotations[i % stampRotations.length];
            var dateParts = loc.date.split('.');

            var stamp = document.createElement('a');
            stamp.className = 'stamp-anim';
            stamp.href = 'place.html?place=' + loc.id;
            stamp.setAttribute('data-id', loc.id);
            stamp.setAttribute('data-index', i);
            stamp.style.setProperty('--rot', rot + 'deg');
            stamp.style.setProperty('--stamp-color', loc.color);
            stamp.innerHTML =
                '<div class="stamp-inner">' +
                    '<div class="stamp-art">' +
                        '<span class="stamp-art-icon">' + loc.icon + '</span>' +
                        '<span class="stamp-postmark">' + dateParts[0] + '<br>' + dateParts[1] + '</span>' +
                    '</div>' +
                    '<div class="stamp-info">' +
                        '<div class="stamp-no">No. ' + no + ' / ' + total + '</div>' +
                        '<h3 class="stamp-place">' + loc.place + '</h3>' +
                        '<div class="stamp-meta">' + loc.date + ' &middot; ' + loc.city + '</div>' +
                    '</div>' +
                '</div>';

            journeyStampsEl.appendChild(stamp);
        });

        // Stage height = one viewport of travel per stamp, PLUS a tail section.
        // Without the tail the last stamp can never finish: the maximum scroll
        // position is (docHeight - vh), so a stage of exactly N * 100vh only
        // lets the final stamp reach (N-1)/N of its own journey.
        function layoutStage() {
            var vh = window.innerHeight;
            var footerH = journeyFooterEl ? journeyFooterEl.offsetHeight : 0;
            var h = Math.round((N + 1.7) * vh - footerH);
            journeyStageEl.style.height = Math.max(N * vh, h) + 'px';
        }

        var stampsAnim = journeyStampsEl.querySelectorAll('.stamp-anim');
        var hoveredStamp = null;

        // Hover tracking
        for (var hi = 0; hi < stampsAnim.length; hi++) {
            (function (s) {
                s.addEventListener('mouseenter', function () {
                    hoveredStamp = s;
                    updateJourneyPositions();
                });
                s.addEventListener('mouseleave', function () {
                    if (hoveredStamp === s) hoveredStamp = null;
                    updateJourneyPositions();
                });
                s.addEventListener('focus', function () {
                    hoveredStamp = s;
                    updateJourneyPositions();
                });
                s.addEventListener('blur', function () {
                    if (hoveredStamp === s) hoveredStamp = null;
                    updateJourneyPositions();
                });
            })(stampsAnim[hi]);
        }

        function updateJourneyPositions() {
            var scrollY = window.scrollY || window.pageYOffset;
            var vh = window.innerHeight;
            var vw = window.innerWidth;
            var stageTop = journeyStageEl.offsetTop;
            // Journey scroll in viewport-height units (0 = stage top, N = all stamps done)
            var journeyScrollVh = (scrollY - stageTop) / vh;
            var hintHidden = false;

            // Loose stack geometry (fan out diagonally so every stamp stays visible)
            var narrow = vw < 760;
            var xBase = narrow ? 24 : 32;    // vw
            var xStep = narrow ? 2.5 : 3.0;  // vw between neighbours
            var yStep = narrow ? 24 : 34;    // px between neighbours

            // --- Railway progress bar (pinned to the bottom of the viewport) ---
            var overall = Math.max(0, Math.min(1, journeyScrollVh / N));
            if (railTrainEl) {
                railTrainEl.style.setProperty('--rail-pos', (2 + overall * 96).toFixed(2) + '%');
            }
            if (railBarEl) {
                var railActive = journeyScrollVh > -0.8 && journeyScrollVh < N + 1.9;
                if (railActive) railBarEl.classList.add('visible');
                else railBarEl.classList.remove('visible');
            }

            for (var i = 0; i < stampsAnim.length; i++) {
                var stamp = stampsAnim[i];
                var baseRot = stampRotations[i % stampRotations.length];

                // Resting place inside the stack
                var stackX = xBase - i * xStep;                   // vw
                var stackY = (i - (N - 1) / 2) * yStep - 18;      // px
                var stackRot = baseRot + (i - (N - 1) / 2) * 0.8; // deg

                // For stamp i its own journey spans [i, i + 1]
                var progress = journeyScrollVh - i;

                var x, y, scale, opacity, rot;

                if (progress < 0) {
                    // Pre-journey: parked off-screen to the left
                    x = -80; y = 0; scale = 0.5; opacity = 0; rot = baseRot;
                } else if (progress >= 1) {
                    // Post-journey: settled in the stack
                    x = stackX; y = stackY; scale = 1; opacity = 1; rot = stackRot;
                } else {
                    if (progress > 0) hintHidden = true;
                    // Tilt gradually settles into the fanned stack angle
                    rot = lerp(baseRot, stackRot,
                        easeInOutCubic(Math.min(1, Math.max(0, (progress - 0.55) / 0.45))));

                    if (progress < 0.28) {
                        // A) Fly in from the left
                        var tA = easeInOutCubic(progress / 0.28);
                        x = lerp(-80, -30, tA);
                        y = 0;
                        scale = lerp(0.5, 1, tA);
                        opacity = tA;
                    } else if (progress < 0.58) {
                        // B) Reach the centre and grow
                        var tB = easeInOutCubic((progress - 0.28) / 0.3);
                        x = lerp(-30, 0, tB);
                        y = 0;
                        scale = lerp(1, 1.42, tB);
                        opacity = 1;
                    } else if (progress < 0.84) {
                        // C) Sweep to the right, slightly overshooting its slot
                        var tC = easeInOutCubic((progress - 0.58) / 0.26);
                        x = lerp(0, stackX + 9, tC);
                        y = lerp(0, stackY - 8, tC);
                        scale = lerp(1.42, 1.05, tC);
                        opacity = 1;
                    } else {
                        // D) Settle back into the stack
                        var tD = easeInOutCubic((progress - 0.84) / 0.16);
                        x = lerp(stackX + 9, stackX, tD);
                        y = lerp(stackY - 8, stackY, tD);
                        scale = lerp(1.05, 1, tD);
                        opacity = 1;
                    }
                }

                var stacked = progress >= 1;
                var isHovered = hoveredStamp === stamp && stacked;

                // The hover "lift" itself is a CSS transition on .stamp-inner,
                // so it stays smooth and springy instead of snapping.
                stamp.classList.toggle('stacked', stacked);
                stamp.style.setProperty('--x', x.toFixed(3) + 'vw');
                stamp.style.setProperty('--y', y.toFixed(2) + 'px');
                stamp.style.setProperty('--scale', scale.toFixed(4));
                stamp.style.setProperty('--rot', rot.toFixed(2) + 'deg');
                stamp.style.opacity = opacity;
                stamp.style.zIndex = isHovered ? 300 : (stacked ? (i + 20) : 10);
            }

            // Hide hint once the first stamp starts travelling
            if (journeyHintEl && hintHidden) {
                journeyHintEl.classList.add('hidden');
            }
        }

        var journeyTicking = false;
        window.addEventListener('scroll', function () {
            if (!journeyTicking) {
                requestAnimationFrame(function () {
                    updateJourneyPositions();
                    journeyTicking = false;
                });
                journeyTicking = true;
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            layoutStage();
            updateJourneyPositions();
        });
        window.addEventListener('load', function () {
            layoutStage();
            updateJourneyPositions();
        });

        // Initial position
        layoutStage();
        updateJourneyPositions();
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
