/* ============================================
   Games — arcade world map
   Pins on an isometric island + video lightbox
   ============================================ */

(function () {
    'use strict';

    var mapCanvas = document.getElementById('gameMapCanvas');
    var mapStage = document.getElementById('gameMapStage');
    if (!mapCanvas || !mapStage) return;

    /* --------------------------------------------
       Game spots config
       - x / y : position on the map in % (0-100)
       - video.type:
           'file'     -> local video  { src: 'assets/videos/xxx.mp4' }
           'bilibili' -> B站嵌入播放器 { src: 'https://player.bilibili.com/player.html?bvid=BVxxxx&autoplay=0' }
           'youtube'  -> YouTube 嵌入  { src: 'https://www.youtube.com/embed/xxxx' }
           'none'     -> 显示占位提示，等视频准备好
       -------------------------------------------- */
    var spots = [
        {
            id: 'cs2',
            name: 'CS2',
            zh: '反恐精英2',
            icon: '\uD83D\uDCA3',
            color: '#f08a3c',
            x: 15, y: 34,
            video: { type: 'none' }
        },
        {
            id: 'valorant',
            name: 'VALORANT',
            zh: '无畏契约',
            icon: '\uD83C\uDFAF',
            color: '#ff4655',
            x: 44, y: 20,
            video: { type: 'none' }
        },
        {
            id: 'hok',
            name: 'HONOR',
            zh: '王者荣耀',
            icon: '\uD83D\uDC51',
            color: '#ffd166',
            x: 72, y: 20,
            video: { type: 'none' }
        },
        {
            id: 'pubg',
            name: 'PUBG',
            zh: '绝地求生',
            icon: '\uD83C\uDF73',
            color: '#7fa86b',
            x: 88, y: 44,
            video: { type: 'none' }
        },
        {
            id: 'apex',
            name: 'APEX',
            zh: 'Apex 英雄',
            icon: '\u26A1',
            color: '#d96a4e',
            x: 74, y: 66,
            video: { type: 'none' }
        },
        {
            id: 'roco',
            name: 'ROCO',
            zh: '洛克王国',
            icon: '\uD83D\uDC3E',
            color: '#8f7bd6',
            x: 40, y: 74,
            video: { type: 'none' }
        },
        {
            id: 'repo',
            name: 'REPO',
            zh: 'R.E.P.O.',
            icon: '\uD83D\uDC7E',
            color: '#5fd3c4',
            x: 16, y: 62,
            video: { type: 'none' }
        },
        {
            id: 'fishing',
            name: 'FISHING',
            zh: '渔力全开',
            icon: '\uD83D\uDC1F',
            color: '#4aa8d8',
            x: 52, y: 52,
            video: { type: 'none' }
        }
    ];

    // --- Map world layer (pans & zooms inside the 3D canvas) ---
    var WORLD_PAD = 18;                    // % overhang on every side
    var WORLD_SPAN = 100 + WORLD_PAD * 2;  // world is 136% of the canvas
    var world = document.createElement('div');
    world.className = 'game-map-world';
    mapCanvas.insertBefore(world, mapCanvas.firstChild);

    function toWorldPct(x, y) {
        return { x: (x + WORLD_PAD) / WORLD_SPAN * 100, y: (y + WORLD_PAD) / WORLD_SPAN * 100 };
    }

    // --- Render pins ---
    spots.forEach(function (spot, i) {
        var pin = document.createElement('button');
        pin.className = 'map-pin';
        pin.id = 'pin-' + spot.id;
        var wp = toWorldPct(spot.x, spot.y);
        pin.style.left = wp.x + '%';
        pin.style.top = wp.y + '%';
        pin.style.setProperty('--pin-color', spot.color);
        pin.style.setProperty('--pin-delay', (0.6 + i * 0.18) + 's');
        pin.setAttribute('aria-label', spot.zh + ' ' + spot.name);
        pin.innerHTML =
            '<span class="map-pin-drop"></span>' +
            '<span class="map-pin-head">' + spot.icon + '</span>' +
            '<span class="map-pin-tag">' +
                '<strong>' + spot.name + '</strong>' +
                '<em>' + spot.zh + '</em>' +
            '</span>';
        world.appendChild(pin);

        pin.addEventListener('click', function () {
            openSpot(spot);
        });
    });

    // --- Interaction engine -----------------------------------------
    //  drag            -> pan the map
    //  shift/right-drag-> orbit the viewing angle
    //  wheel / pinch   -> zoom (cursor-anchored)
    //  two-finger twist-> orbit the viewing angle
    //  buttons / dblclick -> zoom & reset
    // ------------------------------------------------------------------
    var ORBIT_X = 24, ORBIT_Y = 15;     // viewing angle limits (deg)
    var ZOOM_MIN = 1, ZOOM_MAX = 2.4;

    var view   = { x: 0, y: 0, zoom: 1, ox: 0, oy: 0, hx: 0, hy: 0 };
    var target = { x: 0, y: 0, zoom: 1, ox: 0, oy: 0 };
    var hoverT = { x: 0, y: 0 };
    var rafId = null;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function canvasSize() { return { w: mapCanvas.clientWidth, h: mapCanvas.clientHeight }; }

    function clampPan() {
        var s = canvasSize();
        var span = WORLD_SPAN / 100;
        var maxX = Math.max(0, (s.w * span * target.zoom - s.w) / 2);
        var maxY = Math.max(0, (s.h * span * target.zoom - s.h) / 2);
        target.x = clamp(target.x, -maxX, maxX);
        target.y = clamp(target.y, -maxY, maxY);
        target.ox = clamp(target.ox, -ORBIT_X, ORBIT_X);
        target.oy = clamp(target.oy, -ORBIT_Y, ORBIT_Y);
        target.zoom = clamp(target.zoom, ZOOM_MIN, ZOOM_MAX);
    }

    function apply() {
        mapCanvas.style.transform =
            'rotateX(' + (view.oy + view.hy).toFixed(3) + 'deg) rotateY(' + (view.ox + view.hx).toFixed(3) + 'deg)';
        world.style.transform =
            'translate3d(' + view.x.toFixed(2) + 'px,' + view.y.toFixed(2) + 'px,0) scale(' + view.zoom.toFixed(4) + ')';
        world.style.setProperty('--pin-inv', (1 / view.zoom).toFixed(4));
    }

    function tick() {
        var settled = true;
        ['x', 'y', 'zoom', 'ox', 'oy', 'hx', 'hy'].forEach(function (k) {
            var t = (k === 'hx') ? hoverT.x : (k === 'hy') ? hoverT.y : target[k];
            var d = t - view[k];
            if (Math.abs(d) > 0.005) { view[k] += d * 0.18; settled = false; }
            else view[k] = t;
        });
        apply();
        rafId = settled ? null : requestAnimationFrame(tick);
    }
    function kick() { if (!rafId) rafId = requestAnimationFrame(tick); }

    // pointer bookkeeping
    var pointers = {};
    var pointerCount = 0;
    var dragMode = null;        // 'pan' | 'orbit' | 'pinch'
    var moved = false;
    var start = null;
    var startView = null;
    var suppressClickUntil = 0;

    function snapshot() {
        var arr = [];
        for (var id in pointers) arr.push({ x: pointers[id].x, y: pointers[id].y });
        return arr;
    }

    // NOTE: deliberately no setPointerCapture here — capturing the pointer
    // retargets the subsequent click to the container, which would swallow
    // every pin click. We track moves on window instead.
    function onDown(e) {
        if (e.target.closest('.map-controls')) return;
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        pointerCount++;
        dragMode = pointerCount === 1
            ? ((e.button === 2 || e.shiftKey || e.altKey) ? 'orbit' : 'pan')
            : 'pinch';
        moved = false;
        start = snapshot();
        startView = { x: target.x, y: target.y, zoom: target.zoom, ox: target.ox, oy: target.oy };
        // NB: the 'dragging' class is only added once the pointer has actually
        // travelled — it disables hit-testing on pins, so applying it on
        // pointerdown would make every pin click land on the map instead.
    }

    function beginDrag() {
        if (!moved) {
            moved = true;
            mapStage.classList.add('dragging');
        }
    }

    function onMove(e) {
        if (!pointers[e.pointerId]) {
            // plain hover — gentle parallax layered on top of the manual orbit
            if (mapStage.contains(e.target)) {
                var r = mapStage.getBoundingClientRect();
                hoverT.x = ((e.clientX - r.left) / r.width - 0.5) * 3;
                hoverT.y = -((e.clientY - r.top) / r.height - 0.5) * 2.5;
                kick();
            }
            return;
        }
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        var pts = snapshot();

        if (dragMode === 'pan' && pts.length === 1) {
            var dx = pts[0].x - start[0].x, dy = pts[0].y - start[0].y;
            if (Math.abs(dx) + Math.abs(dy) > 6) beginDrag();
            if (!moved) return;
            target.x = startView.x + dx;
            target.y = startView.y + dy;
            clampPan();
        } else if (dragMode === 'orbit' && pts.length === 1) {
            var ox = pts[0].x - start[0].x, oy = pts[0].y - start[0].y;
            if (Math.abs(ox) + Math.abs(oy) > 6) beginDrag();
            if (!moved) return;
            target.ox = startView.ox + ox * 0.14;
            target.oy = startView.oy - oy * 0.12;
            clampPan();
        } else if (dragMode === 'pinch' && pts.length >= 2) {
            var d0 = Math.hypot(start[0].x - start[1].x, start[0].y - start[1].y) || 1;
            var d1 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
            if (Math.abs(d1 - d0) > 4) beginDrag();
            target.zoom = clamp(startView.zoom * (d1 / d0), ZOOM_MIN, ZOOM_MAX);
            // two-finger twist drives the viewing angle
            var a0 = Math.atan2(start[1].y - start[0].y, start[1].x - start[0].x);
            var a1 = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
            var da = a1 - a0;
            if (da > Math.PI) da -= 2 * Math.PI;
            if (da < -Math.PI) da += 2 * Math.PI;
            if (Math.abs(da) > 0.03) beginDrag();
            target.ox = startView.ox + da * 28;
            // pan with the midpoint
            target.x = startView.x + (pts[0].x + pts[1].x) / 2 - (start[0].x + start[1].x) / 2;
            target.y = startView.y + (pts[0].y + pts[1].y) / 2 - (start[0].y + start[1].y) / 2;
            clampPan();
        }
        kick();
    }

    function endPointer(e) {
        if (!pointers[e.pointerId]) return;
        delete pointers[e.pointerId];
        pointerCount = Math.max(0, pointerCount - 1);
        if (pointerCount === 0) {
            mapStage.classList.remove('dragging');
            if (moved) suppressClickUntil = Date.now() + 350;
            dragMode = null;
            start = startView = null;
        } else {
            // went from two pointers down to one — restart as a pan
            dragMode = 'pan';
            start = snapshot();
            startView = { x: target.x, y: target.y, zoom: target.zoom, ox: target.ox, oy: target.oy };
        }
    }
    mapStage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);

    // swallow the click that follows a drag so pins don't open
    mapStage.addEventListener('click', function (e) {
        if (Date.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); }
    }, true);

    mapStage.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    mapStage.addEventListener('mouseleave', function () {
        hoverT.x = 0; hoverT.y = 0; kick();
    });

    // wheel zoom anchored at the cursor
    mapStage.addEventListener('wheel', function (e) {
        e.preventDefault();
        var r = mapCanvas.getBoundingClientRect();
        var cx = e.clientX - r.left - r.width / 2;
        var cy = e.clientY - r.top - r.height / 2;
        var nz = clamp(target.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), ZOOM_MIN, ZOOM_MAX);
        if (nz !== target.zoom) {
            var k = nz / target.zoom;
            target.x = cx - (cx - target.x) * k;
            target.y = cy - (cy - target.y) * k;
            target.zoom = nz;
            clampPan();
            kick();
        }
    }, { passive: false });

    function resetView() {
        target.x = 0; target.y = 0; target.zoom = 1; target.ox = 0; target.oy = 0;
        clampPan(); kick();
    }
    mapStage.addEventListener('dblclick', resetView);

    function zoomAtCenter(f) {
        var s = canvasSize();
        var nz = clamp(target.zoom * f, ZOOM_MIN, ZOOM_MAX);
        var k = nz / target.zoom;
        target.x = (s.w / 2) - ((s.w / 2) - target.x) * k;
        target.y = (s.h / 2) - ((s.h / 2) - target.y) * k;
        target.zoom = nz;
        clampPan(); kick();
    }

    // on-screen controls
    function svgIcon(name) {
        var paths = {
            plus: '<path d="M8 3v10M3 8h10"/>',
            minus: '<path d="M3 8h10"/>',
            rotl: '<path d="M2.5 8a5.5 5.5 0 1 0 1.7-3.95"/><path d="M3.6 1.2v3.2h3.2"/>',
            rotr: '<path d="M13.5 8a5.5 5.5 0 1 1-1.7-3.95"/><path d="M12.4 1.2v3.2H9.2"/>',
            home: '<circle cx="8" cy="8" r="2.6"/><path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5"/>'
        };
        return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
    }

    var controls = document.createElement('div');
    controls.className = 'map-controls';
    controls.innerHTML =
        '<button type="button" data-act="zin" aria-label="放大地图">' + svgIcon('plus') + '</button>' +
        '<button type="button" data-act="zout" aria-label="缩小地图">' + svgIcon('minus') + '</button>' +
        '<button type="button" data-act="rotl" aria-label="向左转动视角">' + svgIcon('rotl') + '</button>' +
        '<button type="button" data-act="rotr" aria-label="向右转动视角">' + svgIcon('rotr') + '</button>' +
        '<button type="button" data-act="reset" aria-label="复位视角">' + svgIcon('home') + '</button>';
    mapStage.appendChild(controls);
    controls.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        var act = b.getAttribute('data-act');
        if (act === 'zin') zoomAtCenter(1.3);
        else if (act === 'zout') zoomAtCenter(1 / 1.3);
        else if (act === 'rotl') { target.ox = clamp(target.ox - 15, -ORBIT_X, ORBIT_X); kick(); }
        else if (act === 'rotr') { target.ox = clamp(target.ox + 15, -ORBIT_X, ORBIT_X); kick(); }
        else resetView();
    });

    window.addEventListener('resize', function () { clampPan(); kick(); });

    // --- Video lightbox ---
    var lightbox = document.getElementById('gameVideoLightbox');
    var panel = document.getElementById('gameVideoPanel');

    function videoBodyHtml(spot) {
        var v = spot.video || { type: 'none' };

        if (v.type === 'file' && v.src) {
            return '<video class="game-video-player" src="' + v.src + '" controls playsinline></video>';
        }
        if (v.type === 'bilibili' && v.src) {
            return '<iframe class="game-video-player" src="' + v.src + '" scrolling="no" frameborder="0" allowfullscreen></iframe>';
        }
        if (v.type === 'youtube' && v.src) {
            return '<iframe class="game-video-player" src="' + v.src + '" frameborder="0" allowfullscreen></iframe>';
        }

        // Placeholder — video not ready yet
        return (
            '<div class="game-video-placeholder">' +
                '<span class="game-video-placeholder-icon">\uD83C\uDFAC</span>' +
                '<strong>' + spot.name + ' 的精彩集锦还在路上</strong>' +
                '<p>把视频文件放到 <code>assets/videos/' + spot.id + '.mp4</code>，' +
                '然后在 <code>js/games.js</code> 里把这项的 video 改成 ' +
                '<code>{ type: "file", src: "assets/videos/' + spot.id + '.mp4" }</code>；' +
                '或者直接填入 B 站 / YouTube 的嵌入链接。</p>' +
            '</div>'
        );
    }

    function openSpot(spot) {
        if (!lightbox || !panel) return;

        panel.innerHTML =
            '<div class="game-video-head">' +
                '<span class="game-video-icon" style="--pin-color:' + spot.color + '">' + spot.icon + '</span>' +
                '<div class="game-video-titles">' +
                    '<h2 class="game-video-name">' + spot.name + '</h2>' +
                    '<p class="game-video-zh">' + spot.zh + ' \u00B7 HIGHLIGHTS</p>' +
                '</div>' +
            '</div>' +
            '<div class="game-video-body">' + videoBodyHtml(spot) + '</div>';

        lightbox.hidden = false;
        lightbox.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(function () { lightbox.classList.add('open'); });
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Stop playback
        setTimeout(function () {
            if (lightbox.hidden) return;
            lightbox.hidden = true;
            panel.innerHTML = '';
        }, 320);
    }

    var closeBtn = document.getElementById('gameVideoClose');
    var scrim = document.getElementById('gameVideoScrim');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (scrim) scrim.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
    });

    // Hide the hint after a while
    var hint = document.getElementById('gameMapHint');
    if (hint) {
        setTimeout(function () { hint.classList.add('fade'); }, 6000);
    }

    // Reveal animations
    setTimeout(function () {
        document.querySelectorAll('.reveal-up').forEach(function (el) {
            el.classList.add('visible');
        });
    }, 200);
})();
