/* ============================================
   Games — 3D island (preview)
   Procedural low-poly island, custom orbit camera,
   HTML pin overlay projected onto world positions.
   Desktop / mobile quality tiers.
   ============================================ */

(function () {
    'use strict';

    var stage = document.getElementById('world3dStage');
    var pinsLayer = document.getElementById('world3dPins');
    var loadingEl = document.getElementById('world3dLoading');
    var fallbackEl = document.getElementById('world3dFallback');
    if (!stage) return;

    function showFallback() {
        if (loadingEl) loadingEl.hidden = true;
        if (fallbackEl) fallbackEl.hidden = false;
        if (pinsLayer) pinsLayer.style.display = 'none';
    }

    if (typeof THREE === 'undefined') { showFallback(); return; }

    var isMobile = window.matchMedia('(max-width: 820px)').matches ||
                   (navigator.maxTouchPoints || 0) > 1;

    /* --------------------------------------------
       Game spots — x/z are island coordinates

       想要换成真的 3D 模型：把 .glb 文件放进 assets/models/
       并用该处的 id 命名（例如 cs2.glb），刷新即可自动替换
       掉程序生成的占位水晶。可选参数：
         modelSize  模型最长边缩放到多少（默认 6）
         modelRotY  绕 Y 轴初始旋转（弧度）
         modelY     垂直微调
         modelSpin  是否缓慢自转（默认 true，设 false 关闭）
       -------------------------------------------- */
    var spots = [
        { id: 'cs2',      name: 'CS2',      zh: '反恐精英2', icon: '\uD83D\uDCA3', color: 0xf08a3c, x: -22, z:  -8, base: 2.6 },
        // valorant: 整张 Ascent 地图（大模型）—— 关自转、关阴影，避免拖垮帧率
        // dive:true → 点图钉不再弹集锦，而是直接飞进地图内部自由漫游
        { id: 'valorant', name: 'VALORANT', zh: '无畏契约',  icon: '\uD83C\uDFAF', color: 0xff4655, x:  -6, z: -22, base: 3.2,
          modelSize: 30, modelSpin: false, modelShadow: false, modelOpaque: true, modelY: 2.5, dive: true },
        { id: 'hok',      name: 'HONOR',    zh: '王者荣耀',  icon: '\uD83D\uDC51', color: 0xffd166, x:  13, z: -21, base: 2.8 },
        { id: 'pubg',     name: 'PUBG',     zh: '绝地求生',  icon: '\uD83C\uDF73', color: 0x7fa86b, x:  27, z:  -3, base: 2.4 },
        { id: 'apex',     name: 'APEX',     zh: 'Apex 英雄', icon: '\u26A1',       color: 0xd96a4e, x:  21, z:  17, base: 2.6 },
        { id: 'roco',     name: 'ROCO',     zh: '洛克王国',  icon: '\uD83D\uDC3E', color: 0x8f7bd6, x:   3, z:  25, base: 2.2 },
        { id: 'repo',     name: 'REPO',     zh: 'R.E.P.O.',  icon: '\uD83D\uDC7E', color: 0x5fd3c4, x: -15, z:  20, base: 2.4 },
        { id: 'fishing',  name: 'FISHING',  zh: '渔力全开',  icon: '\uD83D\uDC1F', color: 0x4aa8d8, x: -27, z:   5, base: 2.0 }
    ];

    /* --------------------------------------------
       Terrain height field
       -------------------------------------------- */
    var ISLAND_R = 46;

    function baseHeight(x, z) {
        var r = Math.sqrt(x * x + z * z);
        var f = 1 - r / ISLAND_R;
        if (f <= 0) return -2.4 - (r - ISLAND_R) * 0.26;      // sea floor drops away
        var n = Math.sin(x * 0.16) * Math.cos(z * 0.19) * 2.2 +
                Math.sin((x + z) * 0.11) * 1.6 +
                Math.cos(x * 0.31 - z * 0.27) * 0.9 +
                Math.sin(x * 0.55 + z * 0.5) * 0.35;
        return f * f * (7.4 + n) - 0.55;
    }

    // Spots sit on flattened pads so no marker ends up in the water
    function terrainY(x, z) {
        var y = baseHeight(x, z);
        for (var i = 0; i < spots.length; i++) {
            var s = spots[i];
            var d = Math.sqrt((x - s.x) * (x - s.x) + (z - s.z) * (z - s.z));
            if (d < 7) {
                var lift = (s.base - y) * (1 - d / 7);
                if (lift > 0) y += lift;
            }
        }
        return y;
    }

    function colorForY(y) {
        var c = new THREE.Color();
        var sand = new THREE.Color(0xe4d0a0);
        var grass = new THREE.Color(0x77ab58);
        var deep = new THREE.Color(0x4d8049);
        var rock = new THREE.Color(0x8d8779);
        var seabed = new THREE.Color(0x3d5c62);
        if (y < -0.6) return c.copy(sand).lerp(seabed, Math.min(1, (-y - 0.6) / 5));
        if (y < 0.15) return c.copy(sand);
        if (y < 1.6) return c.copy(sand).lerp(grass, (y - 0.15) / 1.45);
        if (y < 4.6) return c.copy(grass).lerp(deep, (y - 1.6) / 3);
        if (y < 7.6) return c.copy(deep).lerp(rock, (y - 4.6) / 3);
        return c.copy(rock).lerp(new THREE.Color(0xb9b2a6), Math.min(1, (y - 7.6) / 3));
    }

    /* --------------------------------------------
       Renderer / scene
       -------------------------------------------- */
    var renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            antialias: !isMobile,
            alpha: true,
            powerPreference: 'high-performance'
        });
    } catch (err) {
        showFallback();
        return;
    }

    var SEG = isMobile ? 46 : 72;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2));
    renderer.setClearColor(0x000000, 0);
    if (!isMobile) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
    stage.insertBefore(renderer.domElement, stage.firstChild);
    renderer.domElement.className = 'world3d-canvas';

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8a5a72, 95, 265);

    // Everything that belongs to the island lives here, so dive mode can
    // pull the whole island off stage in one move.
    var islandRoot = new THREE.Group();
    scene.add(islandRoot);

    var camera = new THREE.PerspectiveCamera(48, 1, 1, 500);

    /* --- Lights --- */
    scene.add(new THREE.HemisphereLight(0xc9b3e8, 0x4a3a2c, 0.75));

    var sun = new THREE.DirectionalLight(0xffe6c4, 1.15);
    sun.position.set(38, 52, 26);
    if (!isMobile) {
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        sun.shadow.camera.left = -60;
        sun.shadow.camera.right = 60;
        sun.shadow.camera.top = 60;
        sun.shadow.camera.bottom = -60;
        sun.shadow.camera.far = 180;
        sun.shadow.bias = -0.0008;
    }
    scene.add(sun);

    var rim = new THREE.DirectionalLight(0xa48cc4, 0.35);
    rim.position.set(-30, 18, -34);
    scene.add(rim);

    /* --- Terrain --- */
    var geo = new THREE.PlaneGeometry(150, 150, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    geo = geo.toNonIndexed();

    var pos = geo.attributes.position;
    var colors = new Float32Array(pos.count * 3);
    var tmpC = new THREE.Color();

    for (var i = 0; i < pos.count; i += 3) {
        for (var k = 0; k < 3; k++) {
            var idx = i + k;
            pos.setY(idx, terrainY(pos.getX(idx), pos.getZ(idx)));
        }
        var cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
        tmpC = colorForY(cy);
        for (var k2 = 0; k2 < 3; k2++) {
            colors[(i + k2) * 3] = tmpC.r;
            colors[(i + k2) * 3 + 1] = tmpC.g;
            colors[(i + k2) * 3 + 2] = tmpC.b;
        }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    var terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
        vertexColors: true,
        flatShading: true
    }));
    terrain.receiveShadow = !isMobile;
    islandRoot.add(terrain);

    /* --- Water --- */
    var wSeg = isMobile ? 18 : 32;
    var waterGeo = new THREE.PlaneGeometry(420, 420, wSeg, wSeg);
    waterGeo.rotateX(-Math.PI / 2);
    var water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
        color: 0x2f7f9e,
        transparent: true,
        opacity: 0.8,
        roughness: 0.22,
        metalness: 0.2,
        flatShading: true
    }));
    water.position.y = 0;
    islandRoot.add(water);
    var waterPos = waterGeo.attributes.position;
    var waterBase = waterPos.array.slice();

    /* --- Deterministic randomness --- */
    var seed = 20261007;
    function rnd() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    }

    /* --- Trees --- */
    var treeCount = isMobile ? 30 : 62;
    var leafGeo = new THREE.ConeGeometry(1.5, 4.4, 6);
    var trunkGeo = new THREE.CylinderGeometry(0.26, 0.34, 1.7, 5);
    var leafMat = new THREE.MeshLambertMaterial({ color: 0x4f9152, flatShading: true });
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a34, flatShading: true });
    var leaves = new THREE.InstancedMesh(leafGeo, leafMat, treeCount);
    var trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    leaves.castShadow = !isMobile;
    trunks.castShadow = !isMobile;

    var dummy = new THREE.Object3D();
    var placed = 0, guard = 0;
    while (placed < treeCount && guard < 900) {
        guard++;
        var tx = (rnd() - 0.5) * 78;
        var tz = (rnd() - 0.5) * 78;
        var ty = terrainY(tx, tz);
        if (ty < 1.1 || ty > 6.4) continue;
        var tooClose = false;
        for (var si = 0; si < spots.length; si++) {
            if (Math.sqrt((tx - spots[si].x) * (tx - spots[si].x) + (tz - spots[si].z) * (tz - spots[si].z)) < 5.5) {
                tooClose = true; break;
            }
        }
        if (tooClose) continue;

        var sc = 0.7 + rnd() * 0.6;
        dummy.position.set(tx, ty + 1.6 * sc, tz);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        trunks.setMatrixAt(placed, dummy.matrix);

        dummy.position.y = ty + (1.6 + 2.2) * sc;
        dummy.updateMatrix();
        leaves.setMatrixAt(placed, dummy.matrix);
        placed++;
    }
    leaves.count = placed;
    trunks.count = placed;
    islandRoot.add(leaves);
    islandRoot.add(trunks);

    /* --- Rocks --- */
    var rockCount = isMobile ? 8 : 16;
    var rocks = new THREE.InstancedMesh(
        new THREE.DodecahedronGeometry(1.15, 0),
        new THREE.MeshLambertMaterial({ color: 0x8d8779, flatShading: true }),
        rockCount
    );
    rocks.castShadow = !isMobile;
    for (var r = 0; r < rockCount; r++) {
        var rx = (rnd() - 0.5) * 82, rz = (rnd() - 0.5) * 82;
        var ry = terrainY(rx, rz);
        var rs = 0.6 + rnd() * 1.1;
        dummy.position.set(rx, Math.max(ry, -0.4) + rs * 0.3, rz);
        dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        dummy.scale.set(rs, rs * (0.6 + rnd() * 0.5), rs);
        dummy.updateMatrix();
        rocks.setMatrixAt(r, dummy.matrix);
    }
    islandRoot.add(rocks);

    /* --- Spot pads, light columns, rings --- */
    var rings = [];
    var totems = [];
    var modelStates = [];
    var mixers = [];
    var MODEL_DIR = 'assets/models/';
    var modelLoader = (typeof THREE.GLTFLoader === 'function') ? new THREE.GLTFLoader() : null;

    // 换了整岛模型后，程序化地形高度不再可靠：
    // 在 spot 上直接写 y: <高度> 即可手动对齐平台位置
    function spotGroundY(s) {
        return (typeof s.y === 'number') ? s.y : terrainY(s.x, s.z);
    }
    spots.forEach(function (s) {
        var y = spotGroundY(s);
        var col = new THREE.Color(s.color);

        var pad = new THREE.Mesh(
            new THREE.CylinderGeometry(2.7, 3.1, 0.55, 14),
            new THREE.MeshStandardMaterial({
                color: col.clone().multiplyScalar(0.42),
                emissive: col,
                emissiveIntensity: 0.32,
                roughness: 0.55,
                flatShading: true
            })
        );
        pad.position.set(s.x, y + 0.25, s.z);
        pad.receiveShadow = !isMobile;
        islandRoot.add(pad);

        var beam = new THREE.Mesh(
            new THREE.CylinderGeometry(1.4, 2.1, 8, 12, 1, true),
            new THREE.MeshBasicMaterial({
                color: col,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        beam.position.set(s.x, y + 4.2, s.z);
        islandRoot.add(beam);

        var ring = new THREE.Mesh(
            new THREE.TorusGeometry(2.5, 0.075, 6, 28),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(s.x, y + 1.5, s.z);
        islandRoot.add(ring);
        rings.push(ring);

        s.world = new THREE.Vector3(s.x, y, s.z);

        // --- Holder: procedural totem first, swapped for a real model if one exists
        var holder = new THREE.Group();
        holder.position.set(s.x, y + 0.5, s.z);
        islandRoot.add(holder);

        var stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.3, 1.9, 6),
            new THREE.MeshStandardMaterial({
                color: col.clone().multiplyScalar(0.5),
                emissive: col, emissiveIntensity: 0.18,
                roughness: 0.6, flatShading: true
            })
        );
        stem.position.y = 0.95;
        holder.add(stem);

        var crystal = new THREE.Mesh(
            new THREE.OctahedronGeometry(1.35, 0),
            new THREE.MeshStandardMaterial({
                color: col, emissive: col, emissiveIntensity: 0.42,
                roughness: 0.28, metalness: 0.15, flatShading: true
            })
        );
        crystal.position.y = 2.9;
        crystal.userData.baseY = 2.9;
        crystal.castShadow = !isMobile;
        holder.add(crystal);
        totems.push(crystal);

        installModel(s, holder, [stem, crystal]);
    });

    /* --------------------------------------------
       Optional GLB models — drop files into assets/models/
       Naming: <spot id>.glb   (e.g. cs2.glb, valorant.glb)
       Missing files are silently ignored: the totem stays.
       -------------------------------------------- */
    function installModel(s, holder, placeholder) {
        if (!modelLoader) return;
        if (location.protocol === 'file:') return;   // file:// blocks XHR — keep totems
        var url = MODEL_DIR + (s.model || (s.id + '.glb'));

        modelLoader.load(url, function (gltf) {
            var obj = gltf.scene || (gltf.scenes && gltf.scenes[0]);
            if (!obj) return;

            // Normalise: centre on X/Z, sit feet on y = 0, fit into a footprint
            var box = new THREE.Box3().setFromObject(obj);
            var size = box.getSize(new THREE.Vector3());
            var center = box.getCenter(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z) || 1;
            var k = (s.modelSize || 6) / maxDim;

            obj.position.sub(center);
            obj.position.y += size.y / 2;

            var wrap = new THREE.Group();
            wrap.add(obj);
            wrap.scale.setScalar(k);
            if (s.modelRotY) wrap.rotation.y = s.modelRotY;
            if (s.modelY) wrap.position.y = s.modelY;
            wrap.userData.baseY = wrap.position.y;
            var wantShadow = (s.modelShadow !== false) && !isMobile;
            wrap.traverse(function (n) {
                if (n.isMesh) { n.castShadow = wantShadow; n.receiveShadow = wantShadow; }
            });

            // Game-map rips come with translucent/depth-sorted materials that read
            // as "hollow" in a free-orbit viewer — force them solid unless asked not to.
            if (s.modelOpaque) {
                wrap.traverse(function (n) {
                    if (!n.isMesh) return;
                    var ms = Array.isArray(n.material) ? n.material : [n.material];
                    ms.forEach(function (m) {
                        if (!m) return;
                        m.side = THREE.DoubleSide;   // 单面剔除 → 从背面看穿墙体
                        m.transparent = false;        // 透明 + 关深度写入 → 幽灵半透明
                        m.opacity = 1;
                        m.depthWrite = true;
                        m.alphaTest = 0;
                        m.fog = false;                // 不吃小岛的场景雾
                        // 游戏地图 rip 常把金属度写成 1：没有环境贴图时
                        // 全金属面只剩灯光高光，整片渲染成死黑（地板/建筑）。
                        // 压到 0.2 保留一点光泽，让漫反射把表面照亮。
                        if (m.metalness !== undefined && m.metalness > 0.5) m.metalness = 0.2;
                        m.needsUpdate = true;
                    });
                });
            }

            for (var i = 0; i < placeholder.length; i++) holder.remove(placeholder[i]);
            holder.add(wrap);

            // Big dioramas (whole maps) get a dedicated display-case fill light —
            // they're authored for bright daylight and go muddy under our dusk sun.
            if ((s.modelSize || 6) >= 20) {
                var fill = new THREE.PointLight(0xfff2e0, 2.4, (s.modelSize || 6) * 2.4, 1.0);
                fill.position.set(0, size.y * k * 0.9, 0);
                wrap.add(fill);
                var back = new THREE.PointLight(0xd9c8ff, 0.8, (s.modelSize || 6) * 2.0, 1.2);
                back.position.set(-size.x * k * 0.5, size.y * k * 0.5, size.z * k * 0.5);
                wrap.add(back);
            }

            s.hasModel = true;
            s.pinY = size.y * k + 3.4;
            s.modelNode = wrap;                       // dive mode re-parents this
            s.modelBox = { size: size.clone(), k: k };
            markDivePin(s);
            modelStates.push({ node: wrap, spin: s.modelSpin !== false, phase: Math.random() * 6.28 });

            if (gltf.animations && gltf.animations.length) {
                var mixer = new THREE.AnimationMixer(obj);
                mixer.clipAction(gltf.animations[0]).play();
                mixers.push(mixer);
            }
            if (window.console) console.info('[island] 模型已载入: ' + url);
        }, undefined, function () { /* no file — keep the totem */ });
    }

    /* --------------------------------------------
       Whole-island model (Meatopia style) —
       放一个 assets/models/island.glb 进来，程序化地形整套退场，
       整个小岛换成你自己的大场景模型。
       -------------------------------------------- */
    var WORLD_MODEL = {
        size: 96,          // 岛在水平面上的直径（世界单位）
        y: 0,              // 垂直微调
        hideTerrain: true, // 隐藏程序化地形
        hideTrees: true,   // 隐藏程序化树木
        hideRocks: true,   // 隐藏程序化岩石
        keepWater: true    // 通常保留内置水面（有波动动画）
    };

    function loadWorldModel() {
        if (!modelLoader || location.protocol === 'file:') return;
        modelLoader.load(MODEL_DIR + 'island.glb', function (gltf) {
            var obj = gltf.scene || (gltf.scenes && gltf.scenes[0]);
            if (!obj) return;

            var box = new THREE.Box3().setFromObject(obj);
            var size = box.getSize(new THREE.Vector3());
            var center = box.getCenter(new THREE.Vector3());
            var span = Math.max(size.x, size.z) || 1;   // 按水平占地对齐岛直径
            var k = WORLD_MODEL.size / span;

            obj.position.sub(center);
            obj.position.y -= box.min.y;

            var wrap = new THREE.Group();
            wrap.add(obj);
            wrap.scale.setScalar(k);
            wrap.position.y = WORLD_MODEL.y;
            wrap.traverse(function (n) {
                if (n.isMesh) { n.castShadow = !isMobile; n.receiveShadow = !isMobile; }
            });
            islandRoot.add(wrap);

            if (WORLD_MODEL.hideTerrain) terrain.visible = false;
            if (WORLD_MODEL.hideTrees) { leaves.visible = false; trunks.visible = false; }
            if (WORLD_MODEL.hideRocks) rocks.visible = false;
            if (!WORLD_MODEL.keepWater) water.visible = false;

            window.__world3d.worldModel = true;
            if (window.console) console.info('[island] 大场景模型已载入: island.glb（' + Math.round(size.x) + 'x' + Math.round(size.z) + ' → ' + WORLD_MODEL.size + '）');
        }, undefined, function () { /* 没有模型 — 保持程序化小岛 */ });
    }
    loadWorldModel();

    /* --------------------------------------------
       Camera control (custom orbit + damping)
       -------------------------------------------- */
    var cam = {
        theta: 0.72, phi: 0.98, dist: 92,
        tx: 0, ty: 5, tz: 0
    };
    var goal = { theta: cam.theta, phi: cam.phi, dist: cam.dist, tx: 0, ty: 5, tz: 0 };
    var HOME = { theta: 0.72, phi: 0.98, dist: 92, tx: 0, ty: 5, tz: 0 };

    var PHI_MIN = 0.22, PHI_MAX = 1.34;
    var DIST_MIN = 42, DIST_MAX = 175;

    var pointers = {};
    var pCount = 0;
    var mode = null;
    var last = null;
    var lastInteraction = performance.now();
    var autoSpin = true;

    function snapshot() {
        var arr = [];
        for (var id in pointers) arr.push(pointers[id]);
        return arr;
    }

    stage.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.world3d-pin') ||
            e.target.closest('.world3d-controls') ||
            e.target.closest('.world3d-roam')) return;
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        pCount++;
        if (MODE === 'roam') {
            mode = (pCount > 1) ? 'pinch' : 'look';       // 地图里：拖动 = 转头
        } else {
            mode = (pCount === 1 && (e.button === 2 || e.shiftKey)) ? 'pan' : (pCount > 1 ? 'pinch' : 'orbit');
        }
        last = snapshot();
        lastInteraction = performance.now();
        stage.classList.add('dragging');
    });

    function onMove(e) {
        if (!pointers[e.pointerId]) return;
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        var pts = snapshot();
        lastInteraction = performance.now();

        if (mode === 'look' && pts.length === 1) {
            roam.yaw -= (pts[0].x - last[0].x) * 0.0032;
            roam.pitch -= (pts[0].y - last[0].y) * 0.0028;
            roam.pitch = Math.max(-1.35, Math.min(1.35, roam.pitch));
        } else if (mode === 'orbit' && pts.length === 1) {
            goal.theta -= (pts[0].x - last[0].x) * 0.005;
            goal.phi -= (pts[0].y - last[0].y) * 0.004;
            goal.phi = Math.max(PHI_MIN, Math.min(PHI_MAX, goal.phi));
        } else if (mode === 'pan' && pts.length === 1) {
            var k = goal.dist * 0.0016;
            var sinT = Math.sin(goal.theta), cosT = Math.cos(goal.theta);
            goal.tx -= ((pts[0].x - last[0].x) * cosT) * k;
            goal.tz += ((pts[0].x - last[0].x) * sinT) * k;
            goal.ty += (pts[0].y - last[0].y) * k;
            goal.tx = Math.max(-45, Math.min(45, goal.tx));
            goal.tz = Math.max(-45, Math.min(45, goal.tz));
            goal.ty = Math.max(-4, Math.min(24, goal.ty));
        } else if (mode === 'pinch' && pts.length >= 2) {
            var d0 = Math.hypot(last[0].x - last[1].x, last[0].y - last[1].y) || 1;
            var d1 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
            if (MODE === 'roam') {
                roam.mul = Math.max(0.25, Math.min(4, roam.mul * (d1 / d0)));   // 捏合 = 调速
            } else {
                goal.dist = Math.max(DIST_MIN, Math.min(DIST_MAX, goal.dist * (d0 / d1)));
                goal.theta -= ((pts[0].x + pts[1].x) / 2 - (last[0].x + last[1].x) / 2) * 0.005;
                goal.phi -= ((pts[0].y + pts[1].y) / 2 - (last[0].y + last[1].y) / 2) * 0.004;
                goal.phi = Math.max(PHI_MIN, Math.min(PHI_MAX, goal.phi));
            }
        }
        last = snapshot();
    }

    function endPointer(e) {
        if (!pointers[e.pointerId]) return;
        delete pointers[e.pointerId];
        pCount = Math.max(0, pCount - 1);
        lastInteraction = performance.now();
        if (pCount === 0) {
            stage.classList.remove('dragging');
            mode = null;
        } else {
            mode = 'orbit';
            last = snapshot();
        }
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    stage.addEventListener('wheel', function (e) {
        e.preventDefault();
        if (MODE === 'roam') {
            roam.mul = Math.max(0.25, Math.min(4, roam.mul * (1 - e.deltaY * 0.0012)));
        } else {
            goal.dist = Math.max(DIST_MIN, Math.min(DIST_MAX, goal.dist * (1 + e.deltaY * 0.0012)));
        }
        lastInteraction = performance.now();
    }, { passive: false });

    /* --- Controls --- */
    var controlBar = stage.querySelector('.world3d-controls');
    if (controlBar) {
        controlBar.addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (!b) return;
            var act = b.getAttribute('data-act');
            if (act === 'reset') {
                goal.theta = HOME.theta; goal.phi = HOME.phi; goal.dist = HOME.dist;
                goal.tx = HOME.tx; goal.ty = HOME.ty; goal.tz = HOME.tz;
            } else if (act === 'spin') {
                autoSpin = !autoSpin;
                b.classList.toggle('active', autoSpin);
            }
            lastInteraction = performance.now();
        });
        var spinBtn = controlBar.querySelector('[data-act="spin"]');
        if (spinBtn) spinBtn.classList.toggle('active', autoSpin);
    }

    /* --------------------------------------------
       Pin overlay
       -------------------------------------------- */
    var pinEls = [];
    spots.forEach(function (s) {
        var el = document.createElement('button');
        el.className = 'world3d-pin';
        el.type = 'button';
        var hex = '#' + ('000000' + s.color.toString(16)).slice(-6);
        el.style.setProperty('--pin-color', hex);
        el.setAttribute('aria-label', s.zh + ' ' + s.name);
        el.innerHTML =
            '<span class="w3-pin-head">' + s.icon + '</span>' +
            '<span class="w3-pin-tag"><strong>' + s.name + '</strong><em>' + s.zh + '</em></span>';
        el.addEventListener('click', function () {
            if (canDive(s)) enterDive(s);   // 整张地图的据点 → 直接飞进去
            else openSpot(s);
        });
        pinsLayer.appendChild(el);
        pinEls.push({ el: el, spot: s });
    });

    var projected = new THREE.Vector3();
    var camDir = new THREE.Vector3();
    var tmpA = new THREE.Vector3();

    function updatePins() {
        var w = stage.clientWidth, h = stage.clientHeight;
        camera.getWorldDirection(camDir);

        for (var i = 0; i < pinEls.length; i++) {
            var p = pinEls[i];

            // Visibility from real distance + facing — NDC depth hovers near 1
            // with a large far plane, so it makes a poor test on its own.
            var pinH = p.spot.pinY || 9.5;
            tmpA.copy(p.spot.world);
            tmpA.y += pinH;
            tmpA.sub(camera.position);
            var dist = tmpA.length();
            var inFront = tmpA.dot(camDir) > 0;

            projected.copy(p.spot.world);
            projected.y += pinH;
            projected.project(camera);
            var sx = (projected.x * 0.5 + 0.5) * w;
            var sy = (-projected.y * 0.5 + 0.5) * h;

            var fade = !inFront ? 0 : (dist < 230 ? 1 : 0.4);
            p.el.style.transform = 'translate(-50%, -100%) translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
            p.el.style.opacity = fade;
            p.el.style.pointerEvents = fade > 0.5 ? 'auto' : 'none';
        }
    }

    /* --------------------------------------------
       Video lightbox (same behaviour as the 2D map)
       -------------------------------------------- */
    var lightbox = document.getElementById('gameVideoLightbox');
    var panel = document.getElementById('gameVideoPanel');
    var closeBtn = document.getElementById('gameVideoClose');
    var scrim = document.getElementById('gameVideoScrim');

    function videoBodyHtml(spot) {
        return (
            '<div class="game-video-placeholder">' +
                '<span class="game-video-placeholder-icon">\uD83C\uDFAC</span>' +
                '<strong>' + spot.name + ' 的精彩集锦还在路上</strong>' +
                '<p>把视频文件放到 <code>assets/videos/' + spot.id + '.mp4</code>，' +
                '然后在 <code>js/games-3d.js</code> 里把这项的 video 改成 ' +
                '<code>{ type: "file", src: "assets/videos/' + spot.id + '.mp4" }</code>；' +
                '或者直接填入 B 站 / YouTube 的嵌入链接。</p>' +
            '</div>'
        );
    }

    function openSpot(spot) {
        if (!lightbox || !panel) return;
        panel.innerHTML =
            '<div class="game-video-head">' +
                '<span class="game-video-icon" style="--pin-color:#' + ('000000' + spot.color.toString(16)).slice(-6) + '">' + spot.icon + '</span>' +
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
        if (!lightbox || lightbox.hidden) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(function () {
            if (lightbox.hidden) return;
            lightbox.hidden = true;
            panel.innerHTML = '';
        }, 320);
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (scrim) scrim.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (MODE === 'roam' && !warp.active) { exitDive(); return; }   // 地图里：Esc 撤离
        closeLightbox();
    });

    /* --------------------------------------------
       Dive mode — 小岛退场，飞进地图内部自由漫游
       -------------------------------------------- */
    var warpEl = document.getElementById('world3dWarp');
    var roamUI = document.getElementById('world3dRoam');
    var roamIconEl = document.getElementById('w3RoamIcon');
    var roamNameEl = document.getElementById('w3RoamName');
    var roamSubEl = document.getElementById('w3RoamSub');

    var MODE = 'island';                  // 'island' | 'roam'
    var dive = null;                      // 当前潜行状态
    var savedPose = null;                 // 回到小岛时恢复的相机姿态
    var warp = { active: false, t: 0, dur: 1.5, swapped: false, out: false, high: null, low: null };

    var roam = {
        pos: new THREE.Vector3(), yaw: 0, pitch: 0,
        vel: new THREE.Vector3(), base: 14, mul: 1,
        bounds: null
    };
    var desired = new THREE.Vector3();
    var keys = {};
    var hold = { fwd: false, back: false, up: false, down: false };

    // Map interiors are authored for daylight; lift the ambient a little
    // once we're inside so walls don't read as black boxes.
    var diveLight = new THREE.HemisphereLight(0xfff4e2, 0x3a3348, 0.55);
    diveLight.visible = false;
    scene.add(diveLight);

    camera.rotation.order = 'YXZ';

    function canDive(s) {
        return !!(s && s.dive && s.modelNode);
    }

    function markDivePin(s) {
        if (!pinEls || !s.dive) return;
        for (var i = 0; i < pinEls.length; i++) {
            if (pinEls[i].spot === s) pinEls[i].el.classList.add('is-dive');
        }
    }

    // Drop a ray from above the map at a few candidate spots and stand the
    // camera on whatever surface it hits — otherwise we can spawn inside a wall.
    function pickSpawn(node) {
        var box = new THREE.Box3().setFromObject(node);
        var size = box.getSize(new THREE.Vector3());
        var span = Math.max(size.x, size.z) || 1;
        var eyeH = Math.min(3.2, Math.max(1.2, span * 0.022));
        var ray = new THREE.Raycaster();
        ray.far = size.y + 40;
        var down = new THREE.Vector3(0, -1, 0);
        var cands = [[0, 0], [0, -0.34], [0, 0.34], [-0.34, 0], [0.34, 0], [0.28, 0.28]];
        var found = null;

        for (var i = 0; i < cands.length && !found; i++) {
            var x = size.x * cands[i][0];
            var z = size.z * cands[i][1];
            ray.set(new THREE.Vector3(x, box.max.y + 4, z), down);
            var hits = ray.intersectObject(node, true);
            for (var h = 0; h < hits.length; h++) {
                var p = hits[h].point;
                if (p.y < box.min.y + 0.05) continue;
                found = new THREE.Vector3(x, p.y + eyeH, z);
                break;
            }
        }
        if (!found) found = new THREE.Vector3(0, box.max.y * 0.55, 0);
        return { pos: found, box: box, size: size, span: span, eyeH: eyeH };
    }

    function enterDive(s) {
        if (MODE !== 'island' || warp.active || !canDive(s)) return;
        var node = s.modelNode;

        savedPose = {
            theta: goal.theta, phi: goal.phi, dist: goal.dist,
            tx: goal.tx, ty: goal.ty, tz: goal.tz
        };

        dive = {
            spot: s, node: node, parent: node.parent,
            pos: node.position.clone(),
            scale: node.scale.clone(),
            rot: node.rotation.clone()
        };

        // Lift the diorama out of the island and blow it up to real size.
        scene.add(node);
        node.rotation.set(0, s.diveRotY || 0, 0);
        node.scale.setScalar(s.diveScale || 1);
        node.position.set(0, 0, 0);

        var sp = pickSpawn(node);
        roam.pos.copy(sp.pos);
        roam.bounds = {
            x0: sp.box.min.x - sp.span * 0.35, x1: sp.box.max.x + sp.span * 0.35,
            z0: sp.box.min.z - sp.span * 0.35, z1: sp.box.max.z + sp.span * 0.35,
            y0: sp.box.min.y - 1.5, y1: sp.box.max.y + sp.span * 0.8
        };
        roam.base = Math.max(6, sp.span * 0.16);
        roam.mul = 1;
        roam.vel.set(0, 0, 0);
        roam.yaw = Math.atan2(sp.pos.x, sp.pos.z);   // face the middle of the map
        roam.pitch = -0.05;

        // Fly-in: start high above the spawn, drop to eye level as the curtain lifts.
        warp.high = sp.pos.clone().setY(sp.box.max.y + sp.span * 0.55);
        warp.low = sp.pos.clone();

        MODE = 'roam';
        warp.active = true; warp.t = 0; warp.swapped = false; warp.out = false;

        if (roamIconEl) roamIconEl.textContent = s.icon;
        if (roamNameEl) roamNameEl.textContent = s.name;
        if (roamSubEl) roamSubEl.textContent = (s.zh || '') + ' \u00B7 \u81EA\u7531\u6f2b\u6e38';
        if (roamUI) roamUI.hidden = false;
        if (pinsLayer) pinsLayer.style.display = 'none';
        stage.classList.add('diving');
        if (window.console) console.info('[island] 进入地图模式: ' + s.id);
    }

    function exitDive() {
        if (MODE !== 'roam' || warp.active || !dive) return;
        warp.active = true; warp.t = 0; warp.swapped = false; warp.out = true;
    }

    function finishExit() {
        var d = dive;
        if (d) {
            d.parent.add(d.node);          // 放回它在小岛上的据点
            d.node.position.copy(d.pos);
            d.node.scale.copy(d.scale);
            d.node.rotation.copy(d.rot);
        }
        islandRoot.visible = true;
        diveLight.visible = false;
        camera.near = 1;
        camera.updateProjectionMatrix();
        MODE = 'island';
        dive = null;

        if (savedPose) {
            goal.theta = savedPose.theta; goal.phi = savedPose.phi; goal.dist = savedPose.dist;
            goal.tx = savedPose.tx; goal.ty = savedPose.ty; goal.tz = savedPose.tz;
            savedPose = null;
        }
        lastInteraction = performance.now();
        if (roamUI) roamUI.hidden = true;
        if (pinsLayer) pinsLayer.style.display = '';
        stage.classList.remove('diving');
    }

    /* --- roam keyboard --- */
    var MOVE_CODES = {
        KeyW: 1, ArrowUp: 1, KeyS: 1, ArrowDown: 1, KeyA: 1, ArrowLeft: 1,
        KeyD: 1, ArrowRight: 1, Space: 1, KeyE: 1, KeyQ: 1, KeyC: 1,
        ShiftLeft: 1, ShiftRight: 1
    };
    window.addEventListener('keydown', function (e) {
        keys[e.code] = true;
        if (MODE !== 'roam') return;
        if (MOVE_CODES[e.code]) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });
    window.addEventListener('blur', function () { keys = {}; clearHold(); });

    function clearHold() {
        hold.fwd = hold.back = hold.up = hold.down = false;
        if (!roamUI) return;
        roamUI.querySelectorAll('.w3-roam-btn.held').forEach(function (b) {
            b.classList.remove('held');
        });
    }

    /* --- roam HUD --- */
    if (roamUI) {
        roamUI.addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (!b) return;
            var act = b.getAttribute('data-roam');
            if (act === 'exit') exitDive();
            else if (act === 'clip' && dive) openSpot(dive.spot);
        });
        roamUI.addEventListener('pointerdown', function (e) {
            var b = e.target.closest('[data-hold]');
            if (!b) return;
            hold[b.getAttribute('data-hold')] = true;
            b.classList.add('held');
        });
        window.addEventListener('pointerup', clearHold);
        window.addEventListener('pointercancel', clearHold);
    }

    function updateWarp(dt) {
        if (!warp.active) return;
        warp.t += dt;
        var p = Math.min(1, warp.t / warp.dur);
        if (warpEl) warpEl.style.opacity = (Math.sin(Math.PI * p) * 0.98).toFixed(3);

        if (!warp.swapped && p >= 0.5) {
            warp.swapped = true;
            if (warp.out) {
                finishExit();
            } else {
                islandRoot.visible = false;
                diveLight.visible = true;
                camera.near = 0.15;
                camera.updateProjectionMatrix();
                roam.pos.copy(warp.high);
                roam.pitch = -0.55;
                camera.position.copy(roam.pos);
                camera.rotation.set(roam.pitch, roam.yaw, 0);
            }
        }

        if (!warp.out && warp.swapped && warp.high && warp.low) {
            var u = (p - 0.5) / 0.5;
            var e = 1 - Math.pow(1 - u, 3);
            roam.pos.lerpVectors(warp.high, warp.low, e);
            roam.pitch = -0.55 * (1 - e) + (-0.05) * e;
            camera.position.copy(roam.pos);
            camera.rotation.set(roam.pitch, roam.yaw, 0);
        }

        if (p >= 1) {
            warp.active = false;
            if (warpEl) warpEl.style.opacity = 0;
        }
    }

    function updateRoam(dt) {
        var blocked = lightbox && !lightbox.hidden;
        var f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0)
              + (hold.fwd ? 1 : 0) - (hold.back ? 1 : 0);
        var st = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
        var vt = (keys.Space || keys.KeyE ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight || keys.KeyQ || keys.KeyC ? 1 : 0)
               + (hold.up ? 1 : 0) - (hold.down ? 1 : 0);
        if (blocked) { f = st = vt = 0; }

        var sp = roam.base * roam.mul;
        var sy = Math.sin(roam.yaw), cy = Math.cos(roam.yaw);
        var cp = Math.cos(roam.pitch), sp2 = Math.sin(roam.pitch);

        // forward = where you're looking (so you can fly up a tower), right = flat strafe
        desired.set(
            (-sy * cp) * f + cy * st,
            sp2 * f + vt,
            (-cy * cp) * f + (-sy) * st
        );
        if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(sp);

        roam.vel.lerp(desired, 1 - Math.pow(0.0006, dt));
        if (roam.vel.lengthSq() < 0.0004) roam.vel.set(0, 0, 0);
        roam.pos.addScaledVector(roam.vel, dt);

        var b = roam.bounds;
        if (b) {
            roam.pos.x = Math.max(b.x0, Math.min(b.x1, roam.pos.x));
            roam.pos.z = Math.max(b.z0, Math.min(b.z1, roam.pos.z));
            roam.pos.y = Math.max(b.y0, Math.min(b.y1, roam.pos.y));
        }

        camera.position.copy(roam.pos);
        camera.rotation.set(roam.pitch, roam.yaw, 0);
    }

    /* --------------------------------------------
       Resize
       -------------------------------------------- */
    function resize() {
        var w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    resize();

    /* --------------------------------------------
       Loop
       -------------------------------------------- */
    var target = new THREE.Vector3();
    var clock = new THREE.Clock();
    var elapsed = 0;

    function animate() {
        requestAnimationFrame(animate);
        // Read the clock ONCE — a second getDelta() in the same frame returns ~0
        var dt = Math.min(0.05, clock.getDelta());
        elapsed += dt;
        var t = elapsed;

        // idle auto-spin (island only)
        if (MODE === 'island' && autoSpin && performance.now() - lastInteraction > 4000) {
            goal.theta += 0.045 * dt * 3;
        }

        if (MODE === 'island') {
            // damping
            var k = 1 - Math.pow(0.0015, dt);
            cam.theta += (goal.theta - cam.theta) * k;
            cam.phi += (goal.phi - cam.phi) * k;
            cam.dist += (goal.dist - cam.dist) * k;
            cam.tx += (goal.tx - cam.tx) * k;
            cam.ty += (goal.ty - cam.ty) * k;
            cam.tz += (goal.tz - cam.tz) * k;

            target.set(cam.tx, cam.ty, cam.tz);
            camera.position.set(
                cam.tx + cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta),
                cam.ty + cam.dist * Math.cos(cam.phi),
                cam.tz + cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta)
            );
            camera.lookAt(target);
        }

        // Dive transition — curtain up/down, camera swap happens at the peak
        updateWarp(dt);
        if (MODE === 'roam' && !warp.active) updateRoam(dt);

        // Island animation only matters while the island is on screen
        if (islandRoot.visible) {
            // water ripple
            var arr = waterPos.array;
            for (var i = 0; i < arr.length; i += 3) {
                var bx = waterBase[i], bz = waterBase[i + 2];
                arr[i + 1] = Math.sin(bx * 0.07 + t * 1.1) * 0.32 + Math.cos(bz * 0.09 + t * 0.9) * 0.26;
            }
            waterPos.needsUpdate = true;

            for (var r2 = 0; r2 < rings.length; r2++) {
                rings[r2].rotation.z += dt * 0.6;
                rings[r2].position.y += Math.sin(t * 1.4 + r2) * 0.004;
            }

            // Placeholder crystals float + spin
            for (var c2 = 0; c2 < totems.length; c2++) {
                var cr = totems[c2];
                if (!cr.parent) continue;                 // replaced by a real model
                cr.rotation.y += dt * 0.55;
                cr.rotation.x = Math.sin(t * 0.8 + c2) * 0.12;
                cr.position.y = cr.userData.baseY + Math.sin(t * 1.3 + c2 * 1.7) * 0.2;
            }
        }

        // Loaded models: slow turntable + gentle bob (paused while inside a map)
        if (MODE === 'island') {
            for (var m2 = 0; m2 < modelStates.length; m2++) {
                var ms = modelStates[m2];
                if (ms.spin) ms.node.rotation.y += dt * 0.22;
                ms.node.position.y = (ms.node.userData.baseY || 0) + Math.sin(t * 1.1 + ms.phase) * 0.16;
            }
        }

        for (var x2 = 0; x2 < mixers.length; x2++) mixers[x2].update(dt);

        if (MODE === 'island') updatePins();
        renderer.render(scene, camera);
    }

    // Hide the loading badge once the first frame is on screen
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            if (loadingEl) loadingEl.classList.add('done');
        });
    });

    // Reveal the page
    setTimeout(function () {
        document.querySelectorAll('.reveal-up').forEach(function (el) {
            el.classList.add('visible');
        });
    }, 200);

    // Exposed for debugging / smoke tests
    window.__world3d = {
        renderer: renderer, scene: scene, camera: camera,
        spots: spots, cam: cam, goal: goal,
        isMobile: isMobile,
        modelLoader: !!modelLoader,
        modelsLoaded: function () { return modelStates.length; },
        mixers: mixers,
        mode: function () { return MODE; },
        roam: roam,
        diveInfo: function () {
            return { mode: MODE, spot: dive ? dive.spot.id : null, pos: roam.pos.toArray() };
        },
        enterDive: function (id) {
            for (var i = 0; i < spots.length; i++) if (spots[i].id === id) { enterDive(spots[i]); return true; }
            return false;
        },
        exitDive: exitDive
    };

    animate();
})();
