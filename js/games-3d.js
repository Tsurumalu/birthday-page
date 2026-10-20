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
    var mapLoadEl = document.getElementById('world3dMapLoad');
    var mapLoadNameEl = document.getElementById('world3dMapLoadName');
    var mapLoadBarEl = document.getElementById('world3dMapLoadBar');
    var mapLoadPctEl = document.getElementById('world3dMapLoadPct');
    if (!stage) return;

    function showFallback() {
        if (loadingEl) loadingEl.hidden = true;
        if (fallbackEl) fallbackEl.hidden = false;
        if (pinsLayer) pinsLayer.style.display = 'none';
    }

    if (typeof THREE === 'undefined') { showFallback(); return; }

    var isMobile = window.matchMedia('(max-width: 820px)').matches ||
                   (navigator.maxTouchPoints || 0) > 1;

    // 触屏没有滚轮：提示文案换成双指缩放
    var hintEl = document.getElementById('world3dHint');
    if (hintEl && (navigator.maxTouchPoints || 0) > 1) {
        hintEl.textContent = '✦ 拖动环绕 · 双指缩放 · 点击圆圈看集锦';
    }

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
    /* 群岛：一片海上散落着几座小岛，每个游戏占一块地盘。
       - kind 省略 = 程序生成地形；写了 model = 用 GLB 当整座岛
       - nseed 决定地形起伏的图案（主岛固定 0，保证老地形一模一样） */
    var islands = [
        // 主岛要同时摆下六张 18 米宽的地图，所以做成「中央山峰 + 环形大平台」：
        // r=62（原 46），mesa 剖面让半径 13~46 这一圈几乎是平的（3.5→3.2），
        // 六张地图（据点环半径 32，占地半对角 12）整张都落在平台上，
        // 不会再出现「地图内侧贴着一堵通往山顶的土墙、外侧悬在半山腰」。
        // nAmp 0.35：平台上噪声压小，否则 ±1 米的起伏又会把地图边缘埋掉。
        { id: 'home',  label: 'HOME',    x:    0, z:   0, r: 62, h: 7.4, nseed: 0, mesa: true, nAmp: 0.35, camDist: 126 },
        // modelY = 模型底面所在高度（负值 = 沉在水下）。调它就能升降整座岛，
        // 让沙滩刚好压在水线附近。
        { id: 'fish',  label: 'FISHING', x:  116, z: -52, r: 30,
          model: 'assets/models/fishIsland.glb?v=20261011b', modelSize: 68, modelY: -11.5, camDist: 100 },
        { id: 'shoot', label: 'BATTLE',  x:  -96, z:  76, r: 30, h: 6.2, nseed: 41.3,  camDist: 90 },
        { id: 'magic', label: 'HONOR',   x:   98, z:  96, r: 27, h: 5.6, nseed: 88.7,  camDist: 86 },
        { id: 'spook', label: 'SPOOK',   x: -108, z: -62, r: 22, h: 4.8, nseed: 123.1, camDist: 78 },
        // CS:GO 岛：整座 de_dust2 当地皮铺一遍，比主岛还大一圈。
        // tint = 沙色染色：rip 的 albedo 是引擎灯光调过的浅色，不染会白成一片
        // modelY -2：实测地图主地面离水面只剩 2.6（底座沉水下 7.6），
        // 整座岛看着泡在海里 —— 抬到地面 5.6、基座吃水 2。
        { id: 'csgo',  label: 'CS:GO',   x:   10, z: 168, r: 70,
          model: 'assets/models/islands/dust2.glb?v=20261013f', modelSize: 132, modelY: -2, camDist: 178,
          tint: [0.92, 0.74, 0.50] },
        // Apex 岛：整张地图场景当地皮
        // modelY 0：实测主地面水上 4.0、最低点还在水下 2.5，抬 3.5 全露出
        { id: 'apexw', label: 'APEX',    x:  -48, z:-146, r: 44,
          model: 'assets/models/islands/apexScene.glb?v=20261013b', modelSize: 62, modelY: 0, camDist: 112 }
    ];

    function islandById(id) {
        for (var i = 0; i < islands.length; i++) if (islands[i].id === id) return islands[i];
        return null;
    }

    // 六张地图的瘦身 GLB：贴图压到 256² webp + Draco 几何压缩后，
    // 六张一起常驻约 0.3GB 显存（原尺寸六张要 2.9GB，一次全加载会拖死）。
    // 解码器见 assets/vendor/draco/，由下方 DRACOLoader 接上。
    var MAP_VER = '?v=20261013a';
    function mapModel(id) { return 'assets/models/maps/' + id + '.glb' + MAP_VER; }

    var spots = [
        // ---- 主岛：VALORANT 六张地图，摆成一圈沙盘 ----
        // 每张都是整张地图的缩微沙盘。flat: true = 不要石台，直接坐在削平的
        // 台地上（地就是它的底座）；modelSpin: false = 定住不转，像一张摊开的
        // 立体地图。点圆圈看集锦，点「进入地图」飞进这张沙盘里面自由漫游。
        //   flatR    削平范围（半径）：flatCore 以内绝对水平，之外 5 米内落回原地形
        //   flatCore 必须 ≥ 地图的半对角线（最大 lotus 12.0），否则地图四角悬空
        //   base     台地高度，六张统一在 3 米上下，整圈读起来是同一层台地
        { id: 'ascent', name: 'ASCENT', zh: '亚述',   icon: '\uD83C\uDFAF', color: 0xff4655, x:     0, z: -32,   base: 3.2, island: 'home',
          model: mapModel('ascent'), modelSize: 18, modelOpaque: true, modelShadow: false, bigModel: true, dive: true,
          flat: true, flatR: 22, flatCore: 12.6, modelSpin: false, groundLift: 0.06, clearance: 14.5 },
        { id: 'haven',  name: 'HAVEN',  zh: '避风港', icon: '\uD83D\uDD31', color: 0xff6b5c, x:  27.7, z: -16,   base: 3.0, island: 'home',
          model: mapModel('haven'),  modelSize: 18, modelOpaque: true, modelShadow: false, bigModel: true, dive: true,
          flat: true, flatR: 22, flatCore: 12.6, modelSpin: false, groundLift: 0.06, clearance: 14.5 },
        { id: 'lotus',  name: 'LOTUS',  zh: '莲花',   icon: '\uD83C\uDF38', color: 0xff8a6b, x:  27.7, z:  16,   base: 3.1, island: 'home',
          model: mapModel('lotus'),  modelSize: 18, modelOpaque: true, modelShadow: false, bigModel: true, dive: true,
          flat: true, flatR: 22, flatCore: 12.6, modelSpin: false, groundLift: 0.06, clearance: 14.5 },
        { id: 'pearl',  name: 'PEARL',  zh: '珍珠',   icon: '\uD83D\uDC1A', color: 0xffa36b, x:     0, z:  32,   base: 3.0, island: 'home',
          model: mapModel('pearl'),  modelSize: 18, modelOpaque: true, modelShadow: false, bigModel: true, dive: true,
          flat: true, flatR: 22, flatCore: 12.6, modelSpin: false, groundLift: 0.06, clearance: 14.5,
          // junk 规则已于 20261015 撤除：它按 prefix 'InstancedStaticMesh' + 图心
          // 半径 5 删件，本意是清掉图心的 Nanite 占位代理；但 InstancedStaticMesh
          // 是 UE 里极通用的类名（灌木、栏杆、路灯、地砖装饰都用它），实测一删
          // 就是 221 块。而现在 hideOutlierMeshes / isShellMesh 已经能处理残留，
          // 关掉这条规则后隐藏数 221→1，包围盒和落地高度分毫未变 —— 纯误删。
          // spot.junk 机制本身保留，将来真遇到占位堆还能用（prefix 要写具体名）。
          _junkRemoved: true },
        { id: 'split',  name: 'SPLIT',  zh: '裂口',   icon: '\uD83D\uDD00', color: 0xff5c7d, x: -27.7, z:  16,   base: 3.2, island: 'home',
          model: mapModel('split'),  modelSize: 18, modelOpaque: true, modelShadow: false, bigModel: true, dive: true,
          flat: true, flatR: 22, flatCore: 12.6, modelSpin: false, groundLift: 0.06, clearance: 14.5 },
        { id: 'summit', name: 'SUMMIT', zh: '巅峰',   icon: '\uD83C\uDFD4', color: 0xff7043, x: -27.7, z: -16,   base: 3.3, island: 'home',
          model: mapModel('summit'), modelSize: 18, modelOpaque: true, modelShadow: false, bigModel: true, dive: true,
          flat: true, flatR: 22, flatCore: 12.6, modelSpin: false, groundLift: 0.06, clearance: 14.5 },
        // ---- 战斗岛 ----
        { id: 'pubg',     name: 'PUBG',     zh: '绝地求生',  icon: '\uD83C\uDF73', color: 0x7fa86b, x:  -84, z:  86, base: 2.4, island: 'shoot' },
        // ---- 战斗岛上的 PUBG 院子：山顶削出一块平台，房子 + 两台车 + 售货机 ----
        // prop: true = 纯布景：不生成图钉/石台/光环/水晶，直接坐在平整过的地面上。
        // flatR  = 这块布景要削平多大一圈地（核心 72% 是真平台，外圈留一道短坡）；
        //          房子的 11 会把整座山头削成台地，车子的 6 只在自己脚下垫一小块。
        // base   = 平台高度，四件统一 3.6，整组才像同一个院子。
        // modelRotY 让门脸/车头朝院子中间，别齐刷刷朝同一个方向。
        { id: 'pubg-house', name: 'HOUSE', zh: '海景民宿', icon: '\uD83C\uDFE0', color: 0x7fa86b, x:  -97, z:  74, base: 3.6, island: 'shoot', prop: true,
          flatR: 11, model: 'assets/models/pubg/building.glb?v=20261013a', modelSize: 11, modelRotY: 0.42, modelSpin: false },
        { id: 'pubg-uaz',   name: 'UAZ',   zh: 'UAZ-469',  icon: '\uD83D\uDE99', color: 0x7fa86b, x: -104, z:  79, base: 3.6, island: 'shoot', prop: true,
          flatR: 6, model: 'assets/models/pubg/uaz.glb?v=20261013a', modelSize: 6, modelRotY: -0.55, modelSpin: false },
        { id: 'pubg-dacia', name: 'DACIA', zh: '达契亚',   icon: '\uD83C\uDFCE', color: 0x7fa86b, x:  -89, z:  79, base: 3.6, island: 'shoot', prop: true,
          flatR: 6, model: 'assets/models/pubg/dacia.glb?v=20261013a', modelSize: 6, modelRotY: 2.35, modelSpin: false },
        { id: 'pubg-shop',  name: 'SHOP',  zh: '自动售货机', icon: '\uD83C\uDF6A', color: 0x7fa86b, x: -90.5, z: 70.5, base: 3.6, island: 'shoot', prop: true,
          flatR: 3, model: 'assets/models/pubg/machine.glb?v=20261013a', modelSize: 2.4, modelRotY: 0.42, modelSpin: false },
        // ---- CS:GO 岛：整座 dust2 就是这座岛的地皮 ----
        { id: 'cs2',      name: 'DUST II',  zh: '炙热沙城 II', icon: '\uD83D\uDCA3', color: 0xf08a3c, x:   10, z: 168, base: 2.6, island: 'csgo' },
        // ---- Apex 岛 ----
        { id: 'apex',     name: 'APEX',     zh: 'Apex 英雄', icon: '\u26A1',       color: 0xd96a4e, x:  -48, z:-146, base: 2.6, island: 'apexw' },
        // ---- 王者岛：两位英雄直接站在岛上（洛克王国已移除） ----
        // 两人 worldH 实测都是 7.0（fitIgnore 排除水母后按本体归一）。
        // 挪成并肩站位：相距太远时拉近一个，另一个会被透视压小，看着就像不一样大。
        { id: 'hok',      name: 'WANG ZHAOJUN', zh: '王昭君', icon: '\uD83D\uDC51', color: 0xffd166, x: 103.5, z: 100.5, base: 2.6, island: 'magic',
          model: 'assets/models/kings/wangzhaojun.glb?v=20261012a', modelSize: 7.85, modelSpin: true, modelShadow: false, clearance: 10,
          fitIgnore: 'GCshuimu' },
        { id: 'shouyue',  name: 'SHOU YUE',  zh: '百里守约',  icon: '\uD83C\uDFF9', color: 0x7fc8ff, x: 106, z:  90, base: 2.5, island: 'magic',
          model: 'assets/models/kings/shouyue.glb?v=20261012a', modelSize: 7, modelSpin: true, modelShadow: false, clearance: 10 },
        // ---- 惊魂岛 ----
        // repo: 玩家小人（自带 23 段动画，默认播第一段 Stand 待机）
        { id: 'repo',     name: 'REPO',     zh: 'R.E.P.O.',  icon: '\uD83D\uDC7E', color: 0x5fd3c4, x: -108, z: -62, base: 2.4, island: 'spook',
          modelSize: 8, modelSpin: true, modelY: 0.6, modelShadow: false },
        // ---- 渔岛：整座岛由 fishIsland.glb 提供 ----
        { id: 'fishing',  name: 'FISHING',  zh: '渔力全开',  icon: '\uD83D\uDC1F', color: 0x4aa8d8, x: 116, z: -52, base: 2.0, island: 'fish' }
    ];

    /* --------------------------------------------
       Terrain height field
       -------------------------------------------- */
    var ISLAND_R = 46;

    // 桌状山剖面（主岛 mesa:true 专用）：普通小岛是 f^p 锥形，越往岛心越高；
    // 主岛要在一圈上摆六张 18 米宽的地图，锥形意味着据点全坐在半山腰的斜坡上
    // —— 地图朝岛心那侧紧贴一堵 3 米高的土墙，看着就像陷在地里。
    // 所以主岛改成：中央一座陡峭的山 + 四周一圈很大的缓平台，
    // 表里的数对是「距岛心的比例 t = r/R」→「相对高度系数」。
    var MESA = [[0, 1.0], [0.21, 0.55], [0.74, 0.50], [1, 0.0]];
    function mesaG(t) {
        for (var i = 1; i < MESA.length; i++) {
            if (t <= MESA[i][0]) {
                var a = MESA[i - 1], b = MESA[i];
                var u = (t - a[0]) / (b[0] - a[0]);
                u = u * u * (3 - 2 * u);            // smoothstep，免得关键点上出现折角
                return a[1] + (b[1] - a[1]) * u;
            }
        }
        return 0;
    }

    function islandHeight(x, z, isl) {
        var dx = x - isl.x, dz = z - isl.z;
        var r = Math.sqrt(dx * dx + dz * dz);
        var f = 1 - r / isl.r;
        if (f <= 0) return -2.4 - (r - isl.r) * 0.26;         // sea floor drops away
        var s = isl.nseed || 0;
        var n = Math.sin((dx + s) * 0.16) * Math.cos((dz + s * 1.7) * 0.19) * 2.2 +
                Math.sin((dx + dz + s * 0.6) * 0.11) * 1.6 +
                Math.cos((dx + s) * 0.31 - (dz + s) * 0.27) * 0.9 +
                Math.sin((dx + s) * 0.55 + (dz + s) * 0.5) * 0.35;
        // p = 山体坡度指数：默认 2（陡锥形小岛）；主岛写 1.35 变成缓坡大岛，
        // 好让六张地图各自有一块天然高度合适的地皮。
        // mesa = 桌状山（见 mesaG），nAmp = 噪声幅度（平台要平，噪声得压小）。
        var prof = isl.mesa ? mesaG(r / isl.r)
                            : (isl.p ? Math.pow(f, isl.p) : f * f);
        var amp = isl.nAmp === undefined ? 1 : isl.nAmp;
        return prof * ((isl.h || 7.4) + n * amp) - 0.55;
    }

    // 群岛里取最高的那座岛的地形——岛之间的空隙自然是海
    function baseHeight(x, z) {
        var h = -99;
        for (var i = 0; i < islands.length; i++) {
            if (islands[i].model) continue;                   // 模型岛自带地形
            var v = islandHeight(x, z, islands[i]);
            if (v > h) h = v;
        }
        return h;
    }

    // 据点的「削平半径」：大沙盘要把一整圈地削平成台地，
    // 否则 18 米宽的地图会一半悬在斜坡上、一半插进水里。
    // 布景道具自带 flatR（按实际占地给），没给就按模型大小折半算。
    function padRadius(s) {
        if (s.flatR) return s.flatR;
        if (s.prop) return Math.max(2, (s.modelSize || 6) * 0.5);
        return Math.max(7, (s.modelSize || 6) * 0.64);
    }

    // 「平台半径」：这一圈以内地面绝对水平。
    // 只有直接坐地的据点（flat 沙盘 / prop 布景）需要 —— 它们没有石台遮丑，
    // 地图/房子的整个底面都得踩在同一高度上，否则一角悬空、一角埋进土里。
    function flatCore(s) {
        if (s.flatCore) return s.flatCore;
        return padRadius(s) * 0.72;
    }

    // 削平权重：1 = 全额推到 base，0 = 完全不动。
    // 普通据点有石台盖住接缝，线性缓坡就够（也保留老地形的手感）；
    // 坐地的据点则 core 以内全平、外面 smoothstep 成一道短坡回到原地形。
    function padWeight(s, d) {
        var rad = padRadius(s);
        if (d >= rad) return 0;
        if (!s.prop && !s.flat) return 1 - d / rad;
        var core = flatCore(s);
        if (d <= core) return 1;
        var u = 1 - (d - core) / Math.max(0.001, rad - core);
        return u * u * (3 - 2 * u);
    }

    // 直接坐地的据点允许「削低」：山头那截也要跟着削到平台高度，
    // 不然平台边上戳着个山尖，地图看着像被土埋了一半。
    function padLift(s, y, d) {
        return (s.base - y) * padWeight(s, d);
    }

    // Spots sit on flattened pads so no marker ends up in the water
    function terrainY(x, z) {
        var y = baseHeight(x, z);
        // 相邻台地的削平圈会相交：只听「影响最强」的那一个，别把抬升叠加起来
        // （叠加会在两台地之间鼓出一座莫名其妙的山包）。
        var best = null, bestF = 0, bestD = 0;
        for (var i = 0; i < spots.length; i++) {
            var s = spots[i];
            var dx = x - s.x, dz = z - s.z;
            var d = Math.sqrt(dx * dx + dz * dz);
            var rad = padRadius(s);
            if (d >= rad) continue;
            var f = 1 - d / rad;
            if (f > bestF) { bestF = f; best = s; bestD = d; }
        }
        if (!best) return y;
        var lift = padLift(best, y, bestD);
        if (best.prop || best.flat || lift > 0) y += lift;
        return y;
    }

    function colorForY(y) {
        var c = new THREE.Color();
        // 黄昏暖调统一提亮一档：整体抬高亮度、压低冷暖反差，
        // 让六据点的传送门和周围的地形读起来是同一套配色。
        var sand   = new THREE.Color(0xf2dfae);
        var grass  = new THREE.Color(0x8ebd69);
        var deep   = new THREE.Color(0x6b9a5f);
        var rock   = new THREE.Color(0xa89c8a);
        var peak   = new THREE.Color(0xcfc7b8);
        var seabed = new THREE.Color(0x4e7180);
        if (y < -0.6) return c.copy(sand).lerp(seabed, Math.min(1, (-y - 0.6) / 5));
        if (y < 0.15) return c.copy(sand);
        if (y < 1.6) return c.copy(sand).lerp(grass, (y - 0.15) / 1.45);
        if (y < 4.6) return c.copy(grass).lerp(deep, (y - 1.6) / 3);
        if (y < 7.6) return c.copy(deep).lerp(rock, (y - 4.6) / 3);
        return c.copy(rock).lerp(peak, Math.min(1, (y - 7.6) / 3));
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

    // 桌面 96：台地边缘要切得干净（主岛变大了，格子太粗会把台地切成锯齿）
    var SEG = isMobile ? 46 : 96;
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
    scene.fog = new THREE.Fog(0x8a5a72, 230, 880);

    // Everything that belongs to the island lives here, so dive mode can
    // pull the whole island off stage in one move.
    var islandRoot = new THREE.Group();
    scene.add(islandRoot);

    var camera = new THREE.PerspectiveCamera(48, 1, 1, 500);

    /* --- Lights --- */
    scene.add(new THREE.HemisphereLight(0xc9b3e8, 0x4a3a2c, 0.75));

    var sun = new THREE.DirectionalLight(0xffe6c4, 1.0);
    sun.position.set(38, 52, 26);
    if (!isMobile) {
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.left = -140;
        sun.shadow.camera.right = 140;
        sun.shadow.camera.top = 140;
        sun.shadow.camera.bottom = -140;
        sun.shadow.camera.far = 420;
        sun.shadow.bias = -0.0008;
    }
    scene.add(sun);

    var rim = new THREE.DirectionalLight(0xa48cc4, 0.35);
    rim.position.set(-30, 18, -34);
    scene.add(rim);

    // 展台顶光：地图 rip 是按游戏里的正午调的，只靠黄昏的太阳会闷成黑块。
    // 六张沙盘共用这一盏（而不是每张挂两盏），省掉反复重编译着色器的开销。
    var exhibitLight = new THREE.PointLight(0xfff2e0, 2.2, 110, 1.0);
    exhibitLight.position.set(0, 34, 0);
    islandRoot.add(exhibitLight);

    /* --- Terrain: 每座程序化岛各一块，岛之间留出海面 --- */
    var terrainMat = new THREE.MeshLambertMaterial({
        vertexColors: true,
        flatShading: true
    });
    var terrainMeshes = [];

    function buildTerrainMesh(isl) {
        if (isl.model) return;                       // 模型岛自带地形

        var size = isl.r * 3.1;                      // 比岛略大，留出浅滩
        var seg = Math.max(16, Math.round(SEG * (isl.r / ISLAND_R)));
        var geo = new THREE.PlaneGeometry(size, size, seg, seg);
        geo.rotateX(-Math.PI / 2);
        geo = geo.toNonIndexed();
        geo.translate(isl.x, 0, isl.z);

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

        var mesh = new THREE.Mesh(geo, terrainMat);
        mesh.receiveShadow = !isMobile;
        islandRoot.add(mesh);
        terrainMeshes.push(mesh);
    }

    /* --- Sea floor: 岛与岛之间不露底 --- */
    var seabed = new THREE.Mesh(
        new THREE.PlaneGeometry(1100, 1100, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0x2c4a52, flatShading: true })
    );
    seabed.rotation.x = -Math.PI / 2;
    seabed.position.y = -7;
    islandRoot.add(seabed);

    /* --- Water --- */
    var wSeg = isMobile ? 22 : 40;
    var waterGeo = new THREE.PlaneGeometry(860, 860, wSeg, wSeg);
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

    /* --- Trees: 按岛分摊，每岛一组实例化网格 --- */
    var leafGeo = new THREE.ConeGeometry(1.5, 4.4, 6);
    var trunkGeo = new THREE.CylinderGeometry(0.26, 0.34, 1.7, 5);
    var leafMat = new THREE.MeshLambertMaterial({ color: 0x4f9152, flatShading: true });
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a34, flatShading: true });

    var dummy = new THREE.Object3D();
    var treeMeshes = [];        // 便于整岛模型接管时统一隐藏

    // 岛越大植被越多；模型岛交给模型自己。
    // 主岛台地之间的缝只有几米宽，树多了会挤成森林 —— 减半种。
    function floraCount(isl, base) {
        if (isl.model) return 0;
        return Math.max(3, Math.round(base * (isl.r / ISLAND_R) * (isl.id === 'home' ? 0.45 : 0.9)));
    }

    // 大沙盘的台面要整片留空：树和石头不能长在地图里面。
    function farFromSpots(x, z, min) {
        for (var i = 0; i < spots.length; i++) {
            var dx = x - spots[i].x, dz = z - spots[i].z;
            // 角色模型（裙摆/披风展宽超过石台）用 clearance 单独声明净空
            var need = Math.max(min, spots[i].clearance || padRadius(spots[i]) * 0.95);
            if (Math.sqrt(dx * dx + dz * dz) < need) return false;
        }
        return true;
    }

    function buildTrees(isl) {
        var n = floraCount(isl, isMobile ? 30 : 62);
        if (n <= 0) return;

        var lf = new THREE.InstancedMesh(leafGeo, leafMat, n);
        var tk = new THREE.InstancedMesh(trunkGeo, trunkMat, n);
        lf.castShadow = !isMobile;
        tk.castShadow = !isMobile;

        var placed = 0, guard = 0;
        while (placed < n && guard < 900) {
            guard++;
            var tx = isl.x + (rnd() - 0.5) * isl.r * 1.7;
            var tz = isl.z + (rnd() - 0.5) * isl.r * 1.7;
            var ty = terrainY(tx, tz);
            if (ty < 1.1 || ty > 6.4) continue;
            if (!farFromSpots(tx, tz, 5.5)) continue;

            var sc = 0.7 + rnd() * 0.6;
            dummy.position.set(tx, ty + 1.6 * sc, tz);
            dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            tk.setMatrixAt(placed, dummy.matrix);

            dummy.position.y = ty + (1.6 + 2.2) * sc;
            dummy.updateMatrix();
            lf.setMatrixAt(placed, dummy.matrix);
            placed++;
        }
        lf.count = placed;
        tk.count = placed;
        islandRoot.add(tk);
        islandRoot.add(lf);
        treeMeshes.push(tk, lf);
    }

    /* --- Rocks: 同样按岛分摊 --- */
    var rockGeo = new THREE.DodecahedronGeometry(1.15, 0);
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x8d8779, flatShading: true });
    var rockMeshes = [];

    function buildRocks(isl) {
        var n = floraCount(isl, isMobile ? 8 : 16);
        if (n <= 0) return;

        var rocks = new THREE.InstancedMesh(rockGeo, rockMat, n);
        rocks.castShadow = !isMobile;
        var placed = 0, guard = 0;
        while (placed < n && guard < 500) {
            guard++;
            var rx = isl.x + (rnd() - 0.5) * isl.r * 1.8;
            var rz = isl.z + (rnd() - 0.5) * isl.r * 1.8;
            var ry = terrainY(rx, rz);
            if (!farFromSpots(rx, rz, 4.2)) continue;
            var rs = 0.6 + rnd() * 1.1;
            dummy.position.set(rx, Math.max(ry, -0.4) + rs * 0.3, rz);
            dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
            dummy.scale.set(rs, rs * (0.6 + rnd() * 0.5), rs);
            dummy.updateMatrix();
            rocks.setMatrixAt(placed, dummy.matrix);
            placed++;
        }
        rocks.count = placed;
        islandRoot.add(rocks);
        rockMeshes.push(rocks);
    }

    // 程序化岛 = 地形 + 树 + 岩石；模型岛由 GLB 自己提供，
    // 只有当 GLB 加载失败时才退化成程序化地形。
    function buildProceduralIsland(isl) {
        buildTerrainMesh(isl);
        buildTrees(isl);
        buildRocks(isl);
    }

    islands.forEach(function (isl) {
        if (!isl.model) buildProceduralIsland(isl);
    });

    /* --- Spot pads, light columns, rings --- */
    var rings = [];
    var totems = [];
    var modelStates = [];
    var mixers = [];
    var MODEL_DIR = 'assets/models/';
    // 底座/传送门的统一基调色：暖砂岩。据点自己的颜色只轻微染一点，
    // 让六个 VALORANT 据点看起来是一套，而不是六种互不相干的塑料。
    var BASE_STONE = new THREE.Color(0xa59074);
    /* --------------------------------------------
       国内镜像 + 停滞自动转移（20261020）

       站点静态部分挂在 GitHub Pages 上。国内访问 Pages 拉大模型
       （六张地图 24MB、DUST II 单文件 20MB）时经常下到一半就卡住 ——
       既不触发 error 也不会完成，页面就一直挂着水晶。所以这里做两件事：

         ① 盯字节进展：超过 STALL_MS 没有新字节进来就判定这个源已死；
         ② 换源重取：改从已备案的腾讯云镜像（lzteddy.cn）取同一路径。

       主源始终是页面同域 —— 海外照旧吃 Pages 的 CDN，只有卡住/失败才
       动用镜像。一旦有模型卡过一次，后续模型直接先走镜像（preferMirror），
       免得每张地图都先白等一轮超时。
       -------------------------------------------- */
    // ?mirror=1 强制开启（本地验证用）；?mirror=<url> 可指定别的镜像基址
    var MIRROR_ARG = decodeURIComponent((location.search.match(/[?&]mirror=([^&]*)/) || [])[1] || '');
    var MIRROR_BASE = (/^https?:\/\//i.test(MIRROR_ARG))
        ? MIRROR_ARG.replace(/\/+$/, '')
        : 'https://lzteddy.cn';
    var STALL_MS = 10000;        // 多久没有新字节算卡死
    var TICK_MS = 2000;          // 盯进度的时间片
    var MIRROR_ON = !!MIRROR_ARG ||
                    (location.protocol === 'https:' && location.hostname.indexOf('lzteddy.cn') < 0);
    var preferMirror = false;    // 卡过一次之后，后续优先走镜像

    function mirrorOf(url) {
        if (!MIRROR_ON) return null;
        if (/^https?:/i.test(url) || /^\/\//.test(url)) return null;   // 已经是绝对地址
        return MIRROR_BASE + '/' + String(url).replace(/^\.?\/*/, '');
    }

    /** 按当前偏好排出候选源（镜像优先或主源优先）。 */
    function sourceList(url) {
        var m = mirrorOf(url);
        if (!m) return [url];
        return preferMirror ? [m, url] : [url, m];
    }

    /**
     * 取模型字节：主源卡住或失败就换下一个源。
     * onDone(bytes|null, usedUrl) —— bytes 为 null 表示所有源都失败了。
     */
    function fetchAny(url, onDone, onProgress) {
        var urls = sourceList(url);

        function attempt(i) {
            if (i >= urls.length) { onDone(null, url); return; }
            var u = urls[i];
            var xhr = new XMLHttpRequest();
            var settled = false;
            var lastTick = Date.now();

            var timer = setInterval(function () {
                if (settled || Date.now() - lastTick < STALL_MS) return;
                settled = true;
                clearInterval(timer);
                try { xhr.abort(); } catch (e) {}
                preferMirror = true;                 // 这一轮已经证明主源不行了
                if (window.console) console.warn('[island] 下载停滞，转镜像: ' + u);
                if (onProgress) onProgress(-1);       // -1 = 换源重来，进度归零
                attempt(i + 1);
            }, TICK_MS);

            try { xhr.open('GET', u, true); } catch (e) { clearInterval(timer); attempt(i + 1); return; }
            xhr.responseType = 'arraybuffer';

            xhr.addEventListener('progress', function (e) {
                lastTick = Date.now();
                if (onProgress && e.lengthComputable && e.total) onProgress(e.loaded / e.total);
            });
            xhr.addEventListener('load', function () {
                if (settled) return;
                settled = true; clearInterval(timer);
                var ok = xhr.status >= 200 && xhr.status < 400 &&
                         xhr.response && xhr.response.byteLength > 0;
                if (ok) { onDone(xhr.response, u); return; }
                preferMirror = true;
                if (onProgress) onProgress(-1);
                attempt(i + 1);
            });
            var fail = function () {
                if (settled) return;
                settled = true; clearInterval(timer);
                preferMirror = true;
                if (onProgress) onProgress(-1);
                attempt(i + 1);
            };
            xhr.addEventListener('error', fail);
            xhr.addEventListener('abort', fail);
            xhr.addEventListener('timeout', fail);
            xhr.send();
        }
        attempt(0);
    }

    // GLTF 加载器：接上 Draco 解码器（地图 GLB 已用 Draco 压缩，不接则加载失败）。
    // 非 Draco 的模型（如王者英雄 / 岛屿地皮）也能正常加载，DRACOLoader 是叠加的。
    function makeLoader(decoderPath) {
        if (typeof THREE.GLTFLoader !== 'function') return null;
        var l = new THREE.GLTFLoader();
        if (typeof THREE.DRACOLoader === 'function') {
            l.setDRACOLoader(new THREE.DRACOLoader().setDecoderPath(decoderPath));
        }
        return l;
    }
    var modelLoader = makeLoader('assets/vendor/draco/');
    // 解码器本身也可能取不到：备一台指向镜像解码器的加载器，解析失败时重试用
    var mirrorLoader = null;
    function getMirrorLoader() {
        if (!mirrorLoader) mirrorLoader = makeLoader(MIRROR_BASE + '/assets/vendor/draco/');
        return mirrorLoader;
    }

    // 换了整岛模型后，程序化地形高度不再可靠：
    // 在 spot 上直接写 y: <高度> 即可手动对齐平台位置
    function spotGroundY(s) {
        return (typeof s.y === 'number') ? s.y : terrainY(s.x, s.z);
    }
    spots.forEach(function (s) {
        var y = spotGroundY(s);
        var col = new THREE.Color(s.color);
        var big = !!s.bigModel;
        var pr = padRadius(s);

        s.world = new THREE.Vector3(s.x, y, s.z);

        // 纯布景：只要一块削平的地 + 模型本体，没有石台、光环、水晶和图钉
        if (s.prop) {
            var ph = new THREE.Group();
            ph.position.set(s.x, y, s.z);
            s.holder = ph;
            s.placeholder = [];
            islandRoot.add(ph);
            return;
        }

        // 大沙盘原本配一块大石台，台面比地图略宽一圈（像博物馆展台）。
        // 现在六张地图改成 flat：地就是底座，直接坐在削平的台地上，不垫石台。
        if (!s.flat) {
            var pad = new THREE.Mesh(
                new THREE.CylinderGeometry(big ? pr * 0.9 : 2.8, big ? pr : 3.15, big ? 0.9 : 0.55, big ? 28 : 14),
                new THREE.MeshStandardMaterial({
                    // 大石台压暗一档：不然被顶光打得跟奶油蛋糕一样，和沙盘糊成一片
                    color: BASE_STONE.clone().lerp(col, 0.2).multiplyScalar(big ? 0.66 : 1),
                    emissive: col,
                    emissiveIntensity: big ? 0.1 : 0.22,
                    roughness: 0.62,
                    flatShading: true
                })
            );
            pad.position.set(s.x, y + (big ? 0.4 : 0.25), s.z);
            pad.receiveShadow = !isMobile;
            islandRoot.add(pad);
            s.pad = pad;
        }

        // 光柱会直接穿过整张地图，大沙盘不要
        if (!big) {
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
            s.beam = beam;
        }

        // 坐地的地图不留石台，发光环就贴着地面画一圈，标出这张地图的边界
        var ringR = s.flat ? flatCore(s) + 0.5 : (big ? pr * 0.94 : 2.5);
        var ring = new THREE.Mesh(
            new THREE.TorusGeometry(ringR, s.flat ? 0.15 : (big ? 0.11 : 0.075), 6, s.flat ? 72 : (big ? 44 : 28)),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: s.flat ? 0.5 : (big ? 0.45 : 0.75) })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(s.x, y + (s.flat ? 0.14 : (big ? 0.92 : 1.5)), s.z);
        islandRoot.add(ring);
        rings.push(ring);

        s.world = new THREE.Vector3(s.x, y, s.z);
        s.ring = ring;

        // --- Holder: procedural totem first, swapped for a real model if one exists
        var holder = new THREE.Group();
        // flat = 模型底面就贴在台地面（y）上，不再抬到石台面上
        holder.position.set(s.x, y + (s.flat ? 0 : (big ? 0.8 : 0.5)), s.z);
        s.holder = holder;
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
            new THREE.OctahedronGeometry(big ? 2.2 : 1.35, 0),
            new THREE.MeshStandardMaterial({
                color: col, emissive: col, emissiveIntensity: 0.42,
                roughness: 0.28, metalness: 0.15, flatShading: true
            })
        );
        crystal.position.y = big ? 3.4 : 2.9;
        crystal.userData.baseY = crystal.position.y;
        crystal.castShadow = !isMobile;
        holder.add(crystal);
        totems.push(crystal);

        s.placeholder = [stem, crystal];
    });

    /* --------------------------------------------
       Optional GLB models — drop files into assets/models/
       Naming: <spot id>.glb   (e.g. cs2.glb, valorant.glb)
       Missing files are silently ignored: the totem stays.
       -------------------------------------------- */
    function installModel(s, onDone, prefetched) {
        var holder = s.holder;
        var placeholder = s.placeholder || [];
        var finish = function () { if (onDone) onDone(); };
        if (s.modelTried) { finish(); return; }        // 兜底定时器可能重复触发，别装两遍
        s.modelTried = true;
        if (!modelLoader) { finish(); return; }
        if (location.protocol === 'file:') return;   // file:// blocks XHR — keep totems
        var url = s.model || (MODEL_DIR + s.id + '.glb');

        var run = function (gltf) {
            var obj = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
            if (!obj) { finish(); return; }

            // rip 自带的灯一律禁用（平行光是全局的，一盏就白幕全岛）
            killModelLights(obj);

            // 地图 rip 有 AssetRipper 残留的退化网格：一条垂到 -800 的线
            // 就能把包围盒撑爆，缩微后整张图只剩一个小点。先剔掉再量尺寸。
            if (s.bigModel) hideJunkMeshes(obj);
            if (s.bigModel) {
                var nOutlier = hideOutlierMeshes(obj);
                if (nOutlier && window.console)
                    console.warn('[fit] 隐藏丢变换的离群碎片 ' + nOutlier + ' 块: ' + s.id);
            }

            // 有些模型自带横向铺开的特效件（比如王昭君旁边那串水母），
            // 它们比人物还宽两三倍，而 fit 归一的是「最长边」—— 结果人物
            // 被压成半截。fitIgnore 让这些件只负责好看、不参与量尺寸：
            // 量完包围盒就恢复显示，人物照样居中，特效挂在旁边。
            var ignored = [];
            if (s.fitIgnore) {
                var pats = Array.isArray(s.fitIgnore) ? s.fitIgnore : [s.fitIgnore];
                obj.traverse(function (n) {
                    if (!n.isMesh || n.visible === false) return;
                    var nm = (n.name || '').toLowerCase();
                    for (var pi = 0; pi < pats.length; pi++) {
                        if (nm.indexOf(String(pats[pi]).toLowerCase()) >= 0) { n.visible = false; ignored.push(n); return; }
                    }
                });
            }

            // Normalise: centre on X/Z, sit the main ground on y = 0, fit a footprint
            obj.updateMatrixWorld(true);
            var box = visibleBox(obj);          // 剔天空罩/围墙、保留大地平面
            var size = box.getSize(new THREE.Vector3());
            var center = box.getCenter(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z) || 1;
            var k = (s.modelSize || 6) / maxDim;
            var span = Math.max(size.x, size.y, size.z);
            var floorY = s.bigModel ? estimateFloorEx(obj, span).y : 0;

            obj.position.sub(center);
            obj.position.y += size.y / 2 - floorY;

            // 特效件量完尺寸就放回来（visibleBox 认 visible，所以必须放在 fit 之后）
            for (var ig = 0; ig < ignored.length; ig++) ignored[ig].visible = true;

            // 天空罩 / 围墙（直径常是整张图两倍的背景壳）：只在显示上隐藏，
            // 不参与上面的拟合 —— 让它影响盒子会把落位带偏（haven 沉进石台、
            // PEARL 被连锁误删只剩一颗木箱，都是这么来的）。
            if (s.bigModel) {
                var fb = fullBox(obj);
                var fsz = fb.getSize(new THREE.Vector3());
                var sp = Math.max(fsz.x, fsz.y, fsz.z) || 1;
                var my = (fb.min.y + fb.max.y) * 0.5;
                obj.traverse(function (o) {
                    if (!o.isMesh || o.visible === false) return;
                    if (isShellMesh(o, sp, my)) o.visible = false;
                });
            }

            // 占位代理隐藏（pearl 图心的 Nanite 回退木箱堆会把真地图整个
            // 盖住）。必须在分位地面采样**之前**做——木箱顶点会把地面
            // 分位压低，沙盘反而越修越沉。near 以沙盘单位计，换算回
            // 原模型坐标要除以 k。
            if (s.bigModel && s.junk && s.junk.prefix) {
                var jn = (s.junk.near || 8) / k;
                obj.traverse(function (n) {
                    if (!n.isMesh || n.visible === false) return;
                    if ((n.name || '').indexOf(s.junk.prefix) !== 0) return;
                    if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
                    var c = n.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(n.matrixWorld);
                    if (Math.hypot(c.x, c.z) < jn) n.visible = false;
                });
            }

            // 分位地面落地：fit 的 estimateFloorEx 只是「直方图峰值下沿」，
            // 普遍比真实地面偏高 0.2~1.6 个沙盘单位，六张沙盘实测全部
            // 陷进石台；haven 相反，地下通道把盒底拖低 2 个单位，整张图
            // 悬空。所以改采「可见顶点高度的 groundQ 分位」当真地面，
            // 直接把它钉在 wrap 原点（= 石台面）—— 不依赖 floorY 的估计值。
            var groundY = floorY;
            if (s.bigModel) {
                obj.updateMatrixWorld(true);
                var ysG = [];
                var gv = new THREE.Vector3();
                obj.traverse(function (o) {
                    if (!o.isMesh || o.visible === false || !o.geometry) return;
                    var gpos = o.geometry.attributes.position;
                    if (!gpos) return;
                    var gstep = Math.max(1, Math.floor(gpos.count / 6));
                    for (var gi = 0; gi < gpos.count; gi += gstep) {
                        gv.fromBufferAttribute(gpos, gi).applyMatrix4(o.matrixWorld);
                        ysG.push(gv.y);
                    }
                });
                if (ysG.length > 40) {
                    ysG.sort(function (a, b) { return a - b; });
                    var gq = Math.min(Math.max(s.groundQ || 0.03, 0.005), 0.2);
                    groundY = ysG[Math.floor(ysG.length * gq)];
                }
                // 注意 groundY 是「含 fit 偏移的世界/父系高度」：
                // 把这条线挪到父系原点要用减法（写成 obj.position.y = -groundY
                // 会漏掉 fit 那一截，等于把沙盘整体抬起来）。
                obj.position.y -= groundY - (s.groundLift || 0) / k;
            }

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

            // 沙盘是静止的：几百个网格每帧重算矩阵纯属浪费，
            // 关掉子节点自动更新（父级 wrap 仍然要动，好让它自转/浮动）。
            if (s.bigModel) {
                wrap.updateMatrixWorld(true);
                wrap.traverse(function (n) { if (n !== wrap) n.matrixAutoUpdate = false; });
            }

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

            // 整岛级的大模型（比如渔岛）才单独配展台补光；
            // 六张沙盘共用场景里那盏 exhibitLight，避免一堆灯反复重编译着色器。
            if (!s.bigModel && (s.modelSize || 6) >= 20) {
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
            s.modelK = k;
            s.modelBox = { size: size.clone(), k: k };
            // 进图用的坐标回补：沙盘把模型居中了，但飞进地图时要还原成
            // rip 本来的坐标系（出生点探测、相机漫游都按原坐标工作）。
            // y 分量：地面已钉在 obj 局部 groundY（obj.position.y=-groundY+lift/k），
            // dive 时主地面要压回世界 y=0，所以偏移正好抵消 lift/k。
            s.diveOrigin = new THREE.Vector3(
                center.x, -(s.groundLift || 0) / k, center.z
            );
            markDivePin(s);
            // 定住的沙盘/布景连上下浮动也停掉：几厘米的下沉会让地图底边切进地面
            modelStates.push({
                node: wrap, phase: Math.random() * 6.28,
                spin: s.modelSpin !== false, bob: s.modelSpin !== false
            });

            if (gltf.animations && gltf.animations.length) {
                var mixer = new THREE.AnimationMixer(obj);
                mixer.clipAction(gltf.animations[0]).play();
                mixers.push(mixer);
            }
            if (window.console) console.info('[island] 模型已载入: ' + url);
            finish();
        };

        var onProgress = function (xhr) {
            if (!s.bigModel || !xhr || !xhr.total) return;
            var p = Math.min(0.99, xhr.loaded / xhr.total);
            bigParts[s.id] = p;
            showMapLoad(s.name, bigProgress());
        };
        var onFail = function () { finish(); /* 没有这个文件 — 保留水晶 */ };

        // 解析 GLB。Draco 解码器本身也可能取不到（尤其国内），
        // 失败一次就换指向镜像解码器的加载器再解一遍。
        function parseBuf(loader, buf, tried) {
            if (!loader || !loader.parse) { finish(); return; }
            var onParseFail = function () {
                if (!tried) {
                    var ml = getMirrorLoader();
                    if (ml && ml !== loader) { parseBuf(ml, buf, 1); return; }
                }
                finish();
            };
            try { loader.parse(buf, '', run, onParseFail); }
            catch (e) { onParseFail(); }
        }

        // 已经预取到 ArrayBuffer 就不用再走一遍网络了
        if (prefetched) { parseBuf(modelLoader, prefetched, 0); return; }
        // 预取阶段已经把主源和镜像都试过了 —— 不要再等一轮超时
        if (s.fetchTried) { finish(); return; }

        // 其余据点小模型自己取字节，同样带镜像转移
        fetchAny(url, function (buf, usedUrl) {
            if (buf) { parseBuf(modelLoader, buf, 0); return; }
            modelLoader.load(usedUrl || url, run, onProgress, onFail);   // 兜底：走一次常规下载
        }, s.bigModel ? function (p) {
            bigParts[s.id] = p < 0 ? 0 : Math.min(0.99, p);
            showMapLoad(s.name, bigProgress());
        } : null);
    }

    /* --------------------------------------------
       沙盘批量入场

       六张地图一起下载会同时解压 1500 张贴图，主线程会卡死几秒。
       所以排成一队，一张加载完再拉下一张，右上角那枚进度条跟着走。
       手机上显存放不下六张，干脆不摆，据点保留发光水晶（视频照常能看）。
       -------------------------------------------- */
    var bigQueue = [];
    var bigTotal = 1;
    var bigDone = 0;
    var bigPrefetching = false;
    var bigParts = {};        // 预取阶段各张的进度（0~1）

    // 下载 / 解包分离（20261020）：
    // 旧流程是「下载一张 → 解包进场 → 再拉下一张」的严格串行，
    // 实测两张之间白白空转 30 秒 —— CPU 在解包贴图时网络闲着，
    // 网络在下载时 CPU 又闲着。现在：
    //   ① 六张同时 XHR 拉到内存（进度条前半段）
    //   ② 再一张张 parse 进场（后半段）
    // 两个阶段彻底重叠，总耗时约等于「纯下载 + 一次解包」。
    var PREFETCH_PHASE = 0.55;   // 下载占进度条的比例

    function settleModelLoad() {
        if (bigDone) flashMapLoad(bigDone + ' / ' + bigTotal + ' 沙盘已就位');
        else hideMapLoad();
        // 主岛六张全部落地 → 稍歇一口气，再在后台补齐其余各岛
        if (!isMobile && bigQueue.length && bigDone >= bigTotal) {
            setTimeout(startBackgroundLoad, 1500);
        }
    }

    function bigProgress() {
        if (bigPrefetching) {
            var extra = 0, k;
            for (k in bigParts) {
                if (Object.prototype.hasOwnProperty.call(bigParts, k)) extra += bigParts[k];
            }
            return Math.min(0.99, extra / bigTotal) * PREFETCH_PHASE;
        }
        return PREFETCH_PHASE + (1 - PREFETCH_PHASE) * Math.min(1, bigDone / bigTotal);
    }

    function fetchModel(s, cb) {
        fetchAny(s.model, function (buf) {
            delete bigParts[s.id];
            s.fetchTried = true;              // 所有源都试过了，别在 installModel 里再来一轮
            cb(buf || null);
        }, function (p) {
            bigParts[s.id] = p < 0 ? 0 : Math.min(0.99, p);
            showMapLoad(s.name, bigProgress());
        });
    }

    function pumpModels() {
        if (!bigQueue.length) { settleModelLoad(); return; }
        var pending = bigQueue.length;
        bigPrefetching = true;
        showMapLoad(bigQueue[0].name, 0.01);
        bigQueue.forEach(function (s) {
            fetchModel(s, function (buf) {
                s.prefetched = buf;
                pending--;
                showMapLoad(s.name, bigProgress());
                if (pending <= 0) startInstalls();
            });
        });
    }

    function startInstalls() {
        bigPrefetching = false;
        var i = 0;
        function step() {
            if (i >= bigQueue.length) { settleModelLoad(); return; }
            var s = bigQueue[i++];
            installModel(s, function () {
                bigDone++;
                s.prefetched = null;                 // 解析完就把 ArrayBuffer 放掉
                showMapLoad(s.name, bigProgress());
                // 让出一帧再补下一张：解码贴图的空档里页面还能拖动
                requestAnimationFrame(function () { setTimeout(step, 60); });
            }, s.prefetched);
        }
        step();
    }

    // 地图 rip 常带 AssetRipper 残留的退化网格（单顶点、线段），
    // 一条垂到 y=-800 的线就能把整张图的包围盒撑上天。直接隐藏。
    function hideJunkMeshes(node) {
        var n = 0;
        node.traverse(function (o) {
            if (!o.isMesh || !o.geometry) return;
            var pos = o.geometry.attributes.position;
            if (!pos || pos.count < 3) { o.visible = false; n++; return; }
            var b = new THREE.Box3().setFromObject(o);
            if (!isFinite(b.min.y)) { o.visible = false; n++; return; }
            var sz = b.getSize(new THREE.Vector3());
            // 只有「三个方向都缩成尘埃」的才是真垃圾。
            // 千万别拿最短边当判据：地板、墙体、贴面在游戏模型里本来就是
            // 零厚度平面（正好一个维度 = 0），用 min < 阈值会把 A 包点地板、
            // 储藏室地板、塔内墙、A 点围墙整片删光 —— 表现就是「地图缺墙少地板」。
            if (Math.max(sz.x, sz.y, sz.z) < 0.02) { o.visible = false; n++; }
        });
        return n;
    }

    // 丢变换的离群碎片（20261013 重导出的 lotus/pearl/split/summit 都有）：
    // 一批真建筑 mesh 掉到了 y=-1000~-2800 的深处或几千远的地方。
    // 它们不是「高于中位面的罩子」，isShellMesh 剔不掉，反而被当成
    // 大地平面保留进包围盒——跨度被撑到 4363~6671，按它缩放后
    // 真地图只剩 0.2 个单位，沙盘直接缩没。
    // 思路：mesh 中心做中位数聚类，75 分位距离为主体的自然半径，
    // 中心跑出 1.6 倍之外的按离群隐藏（对干净的图零影响）。
    function hideOutlierMeshes(node) {
        var items = [];
        var tmp = new THREE.Box3();
        node.updateMatrixWorld(true);
        node.traverse(function (o) {
            if (!o.isMesh || o.visible === false || !o.geometry) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            if (!o.geometry.boundingBox) return;
            tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
            items.push({ mesh: o, c: tmp.getCenter(new THREE.Vector3()), box: tmp.clone() });
        });
        if (items.length < 8) return 0;   // 太少没有统计意义
        var med = new THREE.Vector3();
        ['x', 'y', 'z'].forEach(function (ax) {
            var arr = items.map(function (e) { return e.c[ax]; })
                           .sort(function (a, b) { return a - b; });
            med[ax] = arr[Math.floor(arr.length / 2)];
        });

        // 水平方向：取 90 分位当主体的自然半径，超出 1.6 倍才按离群隐藏。
        // 用 75 分位时，像 lotus 这种「内容堆在中心、边缘散着零星道具」的图，
        // 半径 8~9 的灌木路灯会被当成离群删掉（地图半对角其实有 11.4）。
        var hds = items.map(function (e) {
                       return Math.hypot(e.c.x - med.x, e.c.z - med.z);
                   }).sort(function (a, b) { return a - b; });
        var dQuota = hds[Math.floor(hds.length * 0.9)] || 0;
        var limitH = Math.max(dQuota * 1.6, 1);

        // 垂直方向要分两头看：
        //   往下掉 —— 掉到图底下几百上千单位的残留，才是要清的目标；
        //   往上长 —— 塔楼、屋顶、船屋上层都是合法的高处结构，
        //            曾经因为「三维距离」把 ascent 船屋屋顶整个判成离群删掉了
        //            （表现就是屋顶/阁楼凭空消失）。所以向上完全不限制。
        var ys = items.map(function (e) { return e.c.y; })
                      .sort(function (a, b) { return a - b; });
        var y05 = ys[Math.floor(ys.length * 0.05)];
        var y95 = ys[Math.floor(ys.length * 0.95)];
        var yr = (y95 - y05) || 1;
        var yFloor = y05 - yr * 1.5;        // 允许主体自身再往下探一倍半

        var hidden = 0;
        items.forEach(function (e) {
            var dh = Math.hypot(e.c.x - med.x, e.c.z - med.z);
            if (dh > limitH || e.c.y < yFloor) { e.mesh.visible = false; hidden++; }
        });
        return hidden;
    }

    // 巨型网格（世界长边超过整图跨度 1.2 倍）——只是粗筛，别直接拿它剔除。
    // 两个历史坑：
    //   ① 阈值 0.6 会把「跨度被清理紧凑」的图里的普通建筑当壳删掉
    //      （天空罩直径是整图 2~8 倍，普通建筑 ≤1 倍，1.2 分得开）；
    //   ② 必须用「世界空间」的尺寸判定：geometry.boundingBox 是模型
    //      局部坐标，rip 图的 node 矩阵动辄把局部几千缩放到世界几十
    //      （lotus/pearl/split/summit 20261013 版），拿局部几千对比
    //      世界几十，全场 mesh 全部「超巨型」，70~90% 被误删。
    function isGiantMesh(o, span) {
        if (!o.isMesh || !o.geometry || o.visible === false) return false;
        o.updateWorldMatrix(true, false);
        var b = new THREE.Box3().setFromObject(o);
        if (!isFinite(b.min.y)) return false;
        var s = b.getSize(new THREE.Vector3());
        return Math.max(s.x, s.y, s.z) > span * 1.2;
    }

    // 巨型网格其实分两类，混为一谈会让沙盘的大小和落位全错：
    //   ① 天空罩 / 围墙：又高又大、罩住整张图 → 必须从包围盒、地面统计、
    //      出生射线里剔除（否则玩家「站」在穹顶底面上，四周一片黑）。
    //   ② 大地平面：同样超大，但极薄（厚度不到长边的 12%）且躺在图底 →
    //      它是「这张图到底多大」的唯一真实依据，剔掉它之后缩放基准只剩
    //      建筑碎块，沙盘会缩成一团还悬在半空（lotus / pearl / split /
    //      summit 全栽在这条上）。判定：薄板 + 中心低于全场中位面 = 地面，留。
    function isShellMesh(o, span, midY) {
        if (!isGiantMesh(o, span)) return false;
        var bb = o.geometry.boundingBox;
        var s = bb.getSize(new THREE.Vector3());
        var long = Math.max(s.x, s.y, s.z);
        if (s.y >= long * 0.12) return true;                  // 又高又大 = 罩子/围墙
        if (midY === undefined || midY === null) return false; // 没有参照就当地面留着
        var c = bb.getCenter(new THREE.Vector3()).applyMatrix4(o.matrixWorld);
        return c.y > midY;                                     // 高于中位面 = 天空板/天花板
    }

    // 全场包围盒：所有可见网格，一个不剔。用来拿跨度和中位面。
    function fullBox(root) {
        var full = new THREE.Box3();
        var tmp = new THREE.Box3();
        root.updateMatrixWorld(true);
        root.traverse(function (o) {
            if (!o.isMesh || o.visible === false || !o.geometry) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            if (!o.geometry.boundingBox) return;
            tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
            full.union(tmp);
        });
        if (full.isEmpty()) full.setFromObject(root);
        return full;
    }

    // Box3.setFromObject 会把隐藏掉的残留网格也算进去，这里只量看得见的那部分；
    // 先粗算一次拿跨度和中位面，再剔除「天空罩」（保留大地平面），
    // 用剩下的「真实内容」定包围盒 —— 这张盒子决定沙盘的缩放与落位。
    function visibleBox(root) {
        var full = fullBox(root);
        if (full.isEmpty()) return full;
        var span = full.getSize(new THREE.Vector3());
        span = Math.max(span.x, span.y, span.z);
        var midY = (full.min.y + full.max.y) * 0.5;
        var box = new THREE.Box3();
        var tmp = new THREE.Box3();
        root.traverse(function (o) {
            if (!o.isMesh || o.visible === false || !o.geometry) return;
            if (isShellMesh(o, span, midY)) return;
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            if (!o.geometry.boundingBox) return;
            tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
            box.union(tmp);
        });
        if (box.isEmpty()) box.copy(full);
        return box;
    }

    // 地面参考 = 顶点高度分布的主簇（直方图最高峰的下沿）。
    // rip 地图的大地平面顶点最多、聚得最紧；地下残留和天空罩只是
    // 零星离群点。「取全模型最低点」会被垂到 -800 的残留线带偏。
    // 同时给出 tol：主簇的展开宽度，就是「多高以内还算地面」的自然尺度
    // ——六张图原始比例差了 20 倍，固定容差必然翻车。
    function estimateFloorEx(node, span, midY) {
        var ys = [];
        var v = new THREE.Vector3();
        node.traverse(function (o) {
            if (!o.isMesh || !o.geometry || o.visible === false) return;
            // 只剔「长边超大」的穹顶/围墙；大地平面和普通建筑都要进统计
            //（用 isShellMesh 会把直方图过滤成只剩薄板，屋顶峰值会盖过地面）
            if (span && isGiantMesh(o, span)) return;
            var pos = o.geometry.attributes.position;
            if (!pos) return;
            var step = Math.max(1, Math.floor(pos.count / 10));
            for (var i = 0; i < pos.count; i += step) {
                v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
                ys.push(v.y);
            }
        });
        if (!ys.length) return { y: 0, tol: 2 };
        ys.sort(function (a, b) { return a - b; });
        var ymin = ys[0], ymax = ys[ys.length - 1];
        var bins = 40, hist = new Array(bins).fill(0);
        for (var k = 0; k < ys.length; k++) {
            var bi = Math.min(bins - 1, Math.floor((ys[k] - ymin) / (ymax - ymin + 1e-6) * bins));
            hist[bi]++;
        }
        var best = 0;
        for (var k2 = 1; k2 < bins; k2++) if (hist[k2] > hist[best]) best = k2;
        // 从峰值向两侧扩簇：低于峰值 15% 的 bin 算离群
        var lo = best, hi = best;
        while (lo > 0 && hist[lo - 1] > hist[best] * 0.15) lo--;
        while (hi < bins - 1 && hist[hi + 1] > hist[best] * 0.15) hi++;
        var y = ymin + (best / bins) * (ymax - ymin);
        var tol = Math.min(Math.max((hi - lo + 1) / bins * (ymax - ymin) * 0.5, 1.5), (span || 100) * 0.04);
        return { y: y, tol: tol };
    }

    var mapLoadTimer = null;
    function showMapLoad(name, p) {
        if (!mapLoadEl) return;
        clearTimeout(mapLoadTimer);
        var pct = Math.max(1, Math.round(p * 100));
        if (mapLoadNameEl) mapLoadNameEl.textContent = name;
        if (mapLoadBarEl) mapLoadBarEl.style.width = pct + '%';
        if (mapLoadPctEl) mapLoadPctEl.textContent = pct + '%';
        mapLoadEl.hidden = false;
    }
    function hideMapLoad() { if (mapLoadEl) mapLoadEl.hidden = true; }
    function flashMapLoad(msg) {
        if (!mapLoadEl) return;
        clearTimeout(mapLoadTimer);
        if (mapLoadNameEl) mapLoadNameEl.textContent = msg;
        if (mapLoadBarEl) mapLoadBarEl.style.width = '100%';
        if (mapLoadPctEl) mapLoadPctEl.textContent = '';
        mapLoadEl.hidden = false;
        mapLoadTimer = setTimeout(hideMapLoad, 2800);
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

            if (WORLD_MODEL.hideTerrain) terrainMeshes.forEach(function (m) { m.visible = false; });
            if (WORLD_MODEL.hideTrees) treeMeshes.forEach(function (m) { m.visible = false; });
            if (WORLD_MODEL.hideRocks) rockMeshes.forEach(function (m) { m.visible = false; });
            if (!WORLD_MODEL.keepWater) water.visible = false;

            window.__world3d.worldModel = true;
            if (window.console) console.info('[island] 大场景模型已载入: island.glb（' + Math.round(size.x) + 'x' + Math.round(size.z) + ' → ' + WORLD_MODEL.size + '）');
        }, undefined, function () { /* 没有模型 — 保持程序化小岛 */ });
    }
    loadWorldModel();

    /* --------------------------------------------
       群岛里的模型岛：整座岛由一个 GLB 提供（例如渔力全开的 fishIsland）
       —— 不生成地形，直接放进海里。加载失败会自动退化成程序化小岛，
       据点不会悬空。
       -------------------------------------------- */
    // rip 自带的灯光必须全部禁用：three.js 的平行光/半球光是全局的，
    // 模型里嵌一盏 intensity 1700 的 Source2 环境灯会把整个群岛照成白幕。
    // 场景布光只认我们自己的黄昏三灯 + 展台顶光。
    function killModelLights(node) {
        var killed = 0;
        node.traverse(function (n) {
            if (n.isLight) { n.visible = false; n.intensity = 0; killed++; }
        });
        return killed;
    }

    function tuneMaterials(node, tint) {
        node.traverse(function (n) {
            if (!n.isMesh) return;
            var ms = Array.isArray(n.material) ? n.material : [n.material];
            ms.forEach(function (m) {
                if (!m) return;
                // 没有环境贴图时全金属面会渲成死黑
                if (m.metalness !== undefined && m.metalness > 0.5) m.metalness = 0.2;
                // 整岛染色：rip 的 albedo 是引擎灯光调过的浅色，直接渲会白成一片；
                // 乘一层主题色恢复地图本来的氛围（如 dust2 的黄沙）
                if (tint && m.color && m.color.isColor) m.color.multiply(tint);
                m.needsUpdate = true;
            });
        });
    }

    // 把一个据点整体抬/降到新的地面高度
    function applySpotY(s, y) {
        s.y = y;
        s.world.set(s.x, y, s.z);
        if (s.pad) s.pad.position.y = y + 0.25;
        if (s.beam) s.beam.position.y = y + 4.2;
        if (s.ring) s.ring.position.y = y + (s.flat ? 0.14 : 1.5);
        if (s.holder) s.holder.position.y = y + (s.flat ? 0 : 0.5);
    }

    // 模型岛落地后，用垂直射线测定据点真正站立的表面
    function settleSpots(isl) {
        if (!isl.node) return;
        isl.node.updateMatrixWorld(true);      // 刚 add 进场景，先刷新世界矩阵再发射线
        var ray = new THREE.Raycaster();
        ray.far = 600;
        var down = new THREE.Vector3(0, -1, 0);
        spots.forEach(function (s) {
            if (s.island !== isl.id) return;
            ray.set(new THREE.Vector3(s.x, 260, s.z), down);
            var hits = ray.intersectObject(isl.node, true);
            if (hits.length) applySpotY(s, hits[0].point.y);
        });
    }

    function loadIslandModels(onAllDone) {
        var done = function () { if (onAllDone) onAllDone(); };
        if (!modelLoader || location.protocol === 'file:') { done(); return; }
        var list = islands.filter(function (isl) { return !!isl.model; });
        var i = 0;
        // 串行加载：整岛 GLB 一个 10~20MB，并行解析会把主线程卡成一坨
        function next() {
            if (i >= list.length) { done(); return; }
            var isl = list[i++];
            var url = isl.model;

            // 文件缺失 / 全部源都失败 → 退化成程序化小岛
            var degrade = function () {
                isl.model = null;
                if (isl.h === undefined) isl.h = 5.2;
                if (isl.nseed === undefined) isl.nseed = 57.9;
                buildProceduralIsland(isl);
                if (window.console) console.warn('[island] 模型缺失，退化成程序化小岛: ' + isl.id);
                next();
            };
            // 解码器取不到时换镜像解码器重试一次
            var tryParse = function (loader, buf, tried) {
                if (!loader || !loader.parse) { degrade(); return; }
                var onErr = function () {
                    if (!tried) {
                        var ml = getMirrorLoader();
                        if (ml && ml !== loader) { tryParse(ml, buf, 1); return; }
                    }
                    degrade();
                };
                try {
                    loader.parse(buf, '', function (gltf) { landed(gltf); }, onErr);
                } catch (e) { onErr(); }
            };

            // 走 fetchAny：主源卡住就自动转镜像
            fetchAny(url, function (buf) {
                if (!buf) { degrade(); return; }
                tryParse(modelLoader, buf, 0);
            });

            function landed(gltf) {
            var obj = gltf && (gltf.scene || (gltf.scenes && gltf.scenes[0]));
            if (!obj) { next(); return; }              // 空场景也要续上，别把后面几座岛卡死
            killModelLights(obj);
            tuneMaterials(obj, isl.tint ? new THREE.Color(isl.tint[0], isl.tint[1], isl.tint[2]) : null);

                var box = new THREE.Box3().setFromObject(obj);
                var size = box.getSize(new THREE.Vector3());
                var span = Math.max(size.x, size.z) || 1;
                var k = (isl.modelSize || 60) / span;

                obj.scale.setScalar(k);
                // 水平居中到岛心，垂直让模型底面落在 modelY（负值 = 沉在水下）
                var c = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
                var foot = (isl.modelY === undefined ? -3 : isl.modelY) - box.min.y * k;
                obj.position.set(isl.x - c.x, foot, isl.z - c.z);
                obj.traverse(function (n) {
                    if (n.isMesh) { n.castShadow = !isMobile; n.receiveShadow = !isMobile; }
                });
                islandRoot.add(obj);
                isl.node = obj;
                settleSpots(isl);

                if (window.console) {
                    console.info('[island] 整岛模型已载入: ' + url +
                                 '（' + Math.round(size.x) + '×' + Math.round(size.z) + ' → ' + Math.round(span * k) + '）');
                }
                next();
            }
        }
        next();
    }

    /* --------------------------------------------
       Camera control (custom orbit + damping)
       -------------------------------------------- */
    var cam = {
        theta: 0.72, phi: 0.98, dist: 92,
        tx: 0, ty: 5, tz: 0
    };
    var goal = { theta: cam.theta, phi: cam.phi, dist: cam.dist, tx: 0, ty: 5, tz: 0 };
    var HOME = { theta: 0.72, phi: 0.98, dist: 128, tx: 0, ty: 5, tz: 0 };

    var PHI_MIN = 0.22, PHI_MAX = 1.34;
    var DIST_MIN = 42, DIST_MAX = 285;

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
       Island navigation — 岛散在海上，一键飞过去
       -------------------------------------------- */
    var isleNav = document.getElementById('world3dIsleNav');
    var isleButtons = [];
    var activeIsland = islands[0].id;

    if (isleNav) {
        islands.forEach(function (isl) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'w3-isle-btn';
            b.setAttribute('role', 'tab');
            b.innerHTML = '<em>' + isl.label + '</em>';
            b.addEventListener('click', function () { focusIsland(isl.id); });
            isleNav.appendChild(b);
            isleButtons.push({ el: b, id: isl.id });
        });
    }

    function updateIsleNav() {
        for (var i = 0; i < isleButtons.length; i++) {
            isleButtons[i].el.classList.toggle('active', isleButtons[i].id === activeIsland);
        }
    }

    updateIsleNav();

    function focusIsland(id) {
        var isl = islandById(id);
        if (!isl) return;
        activeIsland = id;
        updateIsleNav();
        goal.tx = isl.x;
        goal.tz = isl.z;
        goal.ty = 4;
        goal.dist = isl.camDist || 92;
        lastInteraction = performance.now();
    }

    /* --------------------------------------------
       Pin overlay
       -------------------------------------------- */
    var pinEls = [];
    spots.forEach(function (s) {
        if (s.prop) return;                 // 布景不挂图钉：点了也没集锦可看
        var el = document.createElement('button');
        el.className = 'world3d-pin';
        el.type = 'button';
        var hex = '#' + ('000000' + s.color.toString(16)).slice(-6);
        el.style.setProperty('--pin-color', hex);
        el.setAttribute('aria-label', s.zh + ' ' + s.name);
        el.innerHTML =
            '<span class="w3-pin-head">' + s.icon + '</span>' +
            '<span class="w3-pin-tag"><strong>' + s.name + '</strong><em>' + s.zh + '</em></span>' +
            (s.dive ? '<span class="w3-pin-dive">\u2935 进入地图</span>' : '');
        el.addEventListener('click', function (e) {
            // 圆圈 = 看集锦；只有下面那颗「进入地图」按钮才飞进地图内部
            var diveBtn = e.target.closest ? e.target.closest('.w3-pin-dive') : null;
            if (diveBtn) { enterDive(s); return; }
            openSpot(s);
        });
        pinsLayer.appendChild(el);
        pinEls.push({ el: el, spot: s });
    });

    // 图钉都建好了再开始拉模型：markDivePin 要给对应的图钉挂上「进入地图」按钮
    // 两阶段加载（20261020）：首屏只拉主岛六张地图（~23MB），其余 60MB
    // （三座整岛 GLB + 王者/PUBG/REPO 据点模型）等地图就位后在后台慢慢补，
    // 别让还没点开的岛拖慢第一眼。
    var idleSpots = [];
    spots.forEach(function (s) {
        if (s.bigModel) { if (!isMobile) bigQueue.push(s); }
        else if (isMobile) installModel(s);          // 手机不摆沙盘，小模型照旧立即装
        else idleSpots.push(s);
    });
    bigTotal = Math.max(1, bigQueue.length);

    var bgStarted = false;
    function startBackgroundLoad() {
        if (bgStarted) return;
        bgStarted = true;
        // 先整岛（大块头，串行逐座），再据点小模型。
        // tail 只跑一次；另挂一枚 90 秒的兜底定时器 —— 整岛链万一卡住
        // （网络中断、某个 GLB 解不出场景），据点模型也不能跟着一起悬着。
        var tailFired = false;
        var tail = function () {
            if (tailFired) return;
            tailFired = true;
            idleSpots.forEach(function (s) { installModel(s); });
        };
        loadIslandModels(tail);
        setTimeout(tail, 90000);
    }

    if (bigQueue.length) pumpModels();
    else if (isMobile) loadIslandModels();           // 手机没有地图队列，整岛照旧立即拉
    else startBackgroundLoad();                      // 桌面没有地图队列（极端情况）就直接补

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

            var fade = !inFront ? 0 : (dist < 260 ? 1 : 0.45);
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
        if (window.VideoSource) return window.VideoSource.bodyHtml(spot);
        return '<div class="game-video-placeholder"><strong>' + spot.name + ' 的集锦还在路上</strong></div>';
    }

    function openSpot(spot) {
        if (!lightbox || !panel) return;
        var VS = window.VideoSource || {};
        var grid = VS.isGrid ? VS.isGrid(spot) : false;
        var photos = VS.hasPhotos ? VS.hasPhotos(spot) : false;
        panel.classList.toggle('has-grid', grid);
        panel.classList.toggle('is-photos', photos);
        panel.innerHTML =
            '<div class="game-video-head">' +
                '<span class="game-video-icon" style="--pin-color:#' + ('000000' + spot.color.toString(16)).slice(-6) + '">' + spot.icon + '</span>' +
                '<div class="game-video-titles">' +
                    '<h2 class="game-video-name">' + spot.name + '</h2>' +
                    '<p class="game-video-zh">' + spot.zh + ' \u00B7 HIGHLIGHTS</p>' +
                '</div>' +
            '</div>' +
            '<div class="game-video-body' + (photos ? ' is-photos' : '') + '">' + videoBodyHtml(spot) + '</div>';
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
    var diveLight = new THREE.HemisphereLight(0xfff4e2, 0x4a4258, 0.8);
    diveLight.visible = false;
    scene.add(diveLight);

    // 漫游时跟着相机走的暖光：地图内部是按它们游戏自己的日光调的，
    // 只靠室外那盏黄昏太阳，墙面和走廊会闷成黑块。
    var roamLamp = new THREE.PointLight(0xfff1de, 1.3, 54, 1.05);
    roamLamp.visible = false;
    scene.add(roamLamp);

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
    // 从主地面正上方往下的射线只接受「贴着主地面」的命中——
    // 天空罩顶、高塔顶、悬空平台的 y 都会偏离主地面很远，直接排除，
    // 否则玩家会出生在半空的罩子上看一片白。
    function pickSpawn(node) {
        var box = visibleBox(node);
        var size = box.getSize(new THREE.Vector3());
        var span = Math.max(size.x, size.y, size.z) || 1;
        // 每张图用自己的尺度：地面高度、地面容差、人眼高度、头顶净空
        // 全部按跨度换算 —— 六张图的原始比例差了 20 倍，固定值必然翻车
        var est = estimateFloorEx(node, span);
        var floorY = est.y, tol = est.tol;
        var eyeH = Math.min(30, Math.max(1.2, span * 0.0172));
        var skyMin = Math.min(15, Math.max(2.5, span * 0.012));
        var ray = new THREE.Raycaster();
        var drop = Math.max(60, span * 0.45);
        ray.far = drop + 10;
        var down = new THREE.Vector3(0, -1, 0);
        var up = new THREE.Vector3(0, 1, 0);
        var skyRay = new THREE.Raycaster();
        skyRay.far = skyMin * 4;
        var cands = [
            [0, 0], [0, -0.3], [0, 0.3], [-0.3, 0], [0.3, 0], [0.26, 0.26],
            [-0.26, -0.26], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5],
            [0.42, -0.42], [-0.42, 0.42], [0.62, -0.3], [-0.3, 0.62], [0.3, 0.62], [-0.62, -0.3]
        ];
        var best = null, bestScore = 1e9;
        for (var i = 0; i < cands.length; i++) {
            var x = size.x * cands[i][0];
            var z = size.z * cands[i][1];
            ray.set(new THREE.Vector3(x, floorY + drop, z), down);
            var hits = ray.intersectObject(node, true);
            for (var h = 0; h < hits.length; h++) {
                if (hits[h].object.visible === false) continue;   // 隐藏的天空罩不参与
                if (isGiantMesh(hits[h].object, span)) continue;  // 别站到穹顶上
                var p = hits[h].point;
                var d = Math.abs(p.y - floorY);
                if (d > tol) continue;                         // 罩子/塔顶/箱子底 → 不要
                // 头顶要有天：贴脸高度内还有东西 = 站在屋里/棚子下，不要；
                // 净空越高的候选越优先（加分制），空地永远赢过屋檐下
                skyRay.set(new THREE.Vector3(p.x, p.y + eyeH * 0.3, p.z), up);
                var ups = skyRay.intersectObject(node, true);
                var clear = skyMin * 4;
                for (var u2 = 0; u2 < ups.length; u2++) {
                    if (ups[u2].object.visible === false) continue;
                    clear = ups[0].distance; break;
                }
                if (clear < skyMin) continue;
                var score = d - 0.2 * Math.min(clear, skyMin * 2);
                if (score < bestScore) { bestScore = score; best = { x: x, y: p.y, z: z }; }
            }
        }
        var found = best
            ? new THREE.Vector3(best.x, best.y + eyeH, best.z)
            : new THREE.Vector3(0, floorY + eyeH, 0);          // 兜底：站主地面中心
        return { pos: found, box: box, size: size, span: span, eyeH: eyeH };
    }

    // 点「进入地图」→ 直接把岛上那座沙盘放大到原始尺寸飞进去（模型已经在内存里）
    function enterDive(s) {
        if (MODE !== 'island' || warp.active || !canDive(s)) return;
        startDive(s);
    }

    function startDive(s) {
        var node = s.modelNode;
        if (!node) return;

        savedPose = {
            theta: goal.theta, phi: goal.phi, dist: goal.dist,
            tx: goal.tx, ty: goal.ty, tz: goal.tz
        };

        // 沙盘平时是缩微的（scale = k）；进图时把它从小岛上摘下来、
        // 挂到场景根并还原成 1:1，玩家走的才是真实尺度的地图。
        dive = {
            spot: s, node: node, parent: node.parent,
            k: s.modelK || 1, baseY: node.userData.baseY || 0
        };
        scene.add(node);
        node.rotation.set(0, 0, 0);
        node.scale.setScalar(1);
        // 还原 rip 原始坐标系：主地面压回 y=0，x/z 回到原点，
        // 出生点探测和漫游边界都按原图坐标工作
        var o = s.diveOrigin || new THREE.Vector3();
        node.position.copy(o);
        node.updateMatrixWorld(true);

        var sp = pickSpawn(node);        // 地面与出生点按本图自己的尺度探测
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
        // 大图限高 150：转场 1.5s 内俯冲得完，也不会越过雾的可视范围。
        warp.high = sp.pos.clone().setY(Math.min(sp.box.max.y + sp.span * 0.35, 150));
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
            // 挂回岛上的石台，缩回沙盘尺寸——下一秒就能再点进去
            d.parent.add(d.node);
            d.node.scale.setScalar(d.k);
            d.node.position.set(0, d.baseY, 0);
            d.node.rotation.set(0, 0, 0);
            d.node.updateMatrixWorld(true);
        }
        islandRoot.visible = true;
        diveLight.visible = false;
        roamLamp.visible = false;
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
                roamLamp.visible = true;
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
        if (MODE === 'roam') roamLamp.position.copy(camera.position);   // 跟着相机走的补光

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
                if (ms.bob) ms.node.position.y = (ms.node.userData.baseY || 0) + Math.sin(t * 1.1 + ms.phase) * 0.16;
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
        islands: islands,
        focusIsland: focusIsland,
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
        exitDive: exitDive,
        // 调试：复算某张图的出生点判定（不动相机）
        debugSpawn: function (id) {
            for (var i = 0; i < spots.length; i++) if (spots[i].id === id) {
                var node = spots[i].modelNode;
                if (!node) return null;
                var full = fullBox(node);
                var fsz = full.getSize(new THREE.Vector3());
                var span = Math.max(fsz.x, fsz.y, fsz.z) || 1;
                var midY = (full.min.y + full.max.y) * 0.5;
                var est = estimateFloorEx(node, span, midY);
                return { span: +span.toFixed(1), midY: +midY.toFixed(1), minY: +full.min.y.toFixed(1), maxY: +full.max.y.toFixed(1), floorY: +est.y.toFixed(2), tol: +est.tol.toFixed(2) };
            }
            return null;
        }
    };

    animate();
})();
