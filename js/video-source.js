/* ------------------------------------------------------------------
   Video source resolver — 被 2D 地图 (games.js) 与 3D 小岛 (games-3d.js) 共用

   一个据点只要配 video 字段，链接怎么填都能自动认出来：

     { type: 'douyin',   vid: '7357934509125389631' }
     { src: 'https://www.douyin.com/video/7357934509125389631' }
     { type: 'bilibili', bvid: 'BV1xx411c7mD' }
     { src: 'https://www.bilibili.com/video/BV1xx411c7mD' }
     { type: 'youtube',  src: 'https://www.youtube.com/watch?v=xxxx' }
     { type: 'file',     src: 'assets/videos/valorant.mp4' }

   可选字段：
     cover    —— 封面图路径，填了就先显示封面 + 播放按钮，
                 点一下才加载播放器（省流量、不拖慢 3D 页面）
     portrait —— true 强制竖版 9:16（抖音默认就是竖版，一般不用填）

   注意：抖音 / B 站的**短链**（v.douyin.com/xxxx、b23.tv/xxxx）在浏览器里
   没法直接解析出视频 ID，请在浏览器打开短链后，复制地址栏里的**长链接**。
------------------------------------------------------------------ */
(function () {
    'use strict';

    function grab(text, re) {
        var m = String(text || '').match(re);
        return m ? m[1] : null;
    }

    function douyinPlayer(vid) {
        return 'https://open.douyin.com/player/video?vid=' + encodeURIComponent(vid) + '&autoplay=1';
    }

    function bilibiliPlayer(bvid, page) {
        return 'https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(bvid) +
               (page ? '&page=' + page : '') + '&autoplay=1&high_quality=1&danmaku=0';
    }

    function youtubePlayer(id) {
        return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
    }

    /**
     * 把 spot.video 解析成统一的播放器描述。
     * @returns {{kind:string, provider:string, url:string, portrait:boolean, referrer:string|null, warn:string|null}}
     */
    function resolve(v) {
        v = v || {};
        var src = v.src || '';
        var type = (v.type || '').toLowerCase();
        var warn = null;

        /* --- 本地文件 ------------------------------------------------ */
        if (type === 'file' || (/\.mp4(\?|$)/i.test(src) && type !== 'embed')) {
            return { kind: 'file', provider: 'file', url: src, portrait: !!v.portrait, referrer: null, warn: null };
        }

        /* --- 抖音 ---------------------------------------------------- */
        if (type === 'douyin' || v.vid || /douyin\.com/i.test(src)) {
            var vid = v.vid || grab(src, /(?:player\/video\?.*?vid=|douyin\.com\/video\/)(\d+)/i);
            if (vid) {
                return { kind: 'embed', provider: 'douyin', url: douyinPlayer(vid),
                         portrait: v.portrait !== false, referrer: 'unsafe-url', warn: null };
            }
            warn = '这是抖音短链，浏览器没法直接解析。请在浏览器里打开它，复制地址栏中的长链接（形如 https://www.douyin.com/video/7357…）';
            return { kind: 'none', provider: 'douyin', url: '', portrait: true, referrer: null, warn: warn };
        }

        /* --- 哔哩哔哩 ------------------------------------------------ */
        if (type === 'bilibili' || v.bvid || /bilibili\.com|b23\.tv/i.test(src)) {
            var bvid = v.bvid || grab(src, /(BV[0-9A-Za-z]{10})/);
            if (bvid) {
                var pg = grab(src, /[?&]p=(\d+)/);
                return { kind: 'embed', provider: 'bilibili', url: bilibiliPlayer(bvid, pg),
                         portrait: !!v.portrait, referrer: null, warn: null };
            }
            warn = '这是 B 站短链（b23.tv），请复制浏览器地址栏里的长链接（形如 https://www.bilibili.com/video/BV…）';
            return { kind: 'none', provider: 'bilibili', url: '', portrait: false, referrer: null, warn: warn };
        }

        /* --- YouTube ------------------------------------------------- */
        var yt = grab(src, /(?:youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/)|youtu\.be\/)([0-9A-Za-z_-]{11})/);
        if (type === 'youtube' || yt) {
            if (yt) {
                return { kind: 'embed', provider: 'youtube', url: youtubePlayer(yt),
                         portrait: !!v.portrait, referrer: null, warn: null };
            }
            warn = '没认出 YouTube 视频 ID';
        }

        /* --- 已经是完整嵌入地址 -------------------------------------- */
        if (/^https?:\/\//i.test(src) || /^\/\//.test(src)) {
            var isDouyin = /open\.douyin\.com/i.test(src);
            return { kind: 'embed', provider: isDouyin ? 'douyin' : (type || 'embed'), url: src,
                     portrait: v.portrait !== undefined ? !!v.portrait : isDouyin,
                     referrer: isDouyin ? 'unsafe-url' : null, warn: null };
        }

        return { kind: 'none', provider: type || 'none', url: '', portrait: false, referrer: null, warn: warn };
    }

    var LABEL = {
        douyin:   '抖音',
        bilibili: '哔哩哔哩',
        youtube:  'YouTube',
        file:     '本地文件'
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function playerHtml(r) {
        if (r.kind === 'file') {
            return '<video class="game-video-player" src="' + esc(r.url) + '" controls playsinline preload="metadata"></video>';
        }
        return '<iframe class="game-video-player" src="' + esc(r.url) + '"' +
               (r.referrer ? ' referrerpolicy="' + r.referrer + '"' : '') +
               ' frameborder="0" scrolling="no" allow="autoplay; encrypted-media; picture-in-picture"' +
               ' allowfullscreen></iframe>';
    }

    /* ----------------------------------------------------------------
       集中配置表 —— 想偷懒就只改这里，按据点 id 填即可，
       2D 地图和 3D 小岛会同时生效。

         CLIPS['valorant'] = {
             vid:   '7357934509125389631',   // 抖音：只填这一串数字就行
             cover: 'assets/covers/valorant.jpg'
         };
         CLIPS['cs2'] = { bvid: 'BV1xx411c7mD' };              // B站
         CLIPS['hok'] = { type:'youtube', src:'https://…' };   // YouTube
         CLIPS['pubg'] = { type:'file', src:'assets/videos/pubg.mp4', cover:'…' };

       cover 填了就先显示封面 + 播放按钮，点一下才加载播放器。
    ---------------------------------------------------------------- */
    var CLIPS = {
        // 单机小品
        repo: { src: 'assets/videos/repo.mp4' },
        fishing: { src: 'assets/videos/fish.mp4' },
        // CS（DUST II 据点）：四条集锦做成 2×2 四宫格
        cs2: {
            grid: [
                { src: 'assets/videos/cs/cs-1.mp4', cover: 'assets/covers/cs-1.jpg', label: 'CLIP 01' },
                { src: 'assets/videos/cs/cs-2.mp4', cover: 'assets/covers/cs-2.jpg', label: 'CLIP 02' },
                { src: 'assets/videos/cs/cs-3.mp4', cover: 'assets/covers/cs-3.jpg', label: 'CLIP 03' },
                { src: 'assets/videos/cs/cs-4.mp4', cover: 'assets/covers/cs-4.jpg', label: 'CLIP 04' }
            ]
        },
        // VALORANT 六张地图：作者给了抖音链接的走抖音，
        // 其余用拷进 assets/videos/ 的本地文件（两页通用，格式自动识别）
        ascent: { vid: '7667074254554438897' },
        haven: { src: 'assets/videos/haven.mp4' },
        lotus: { src: 'assets/videos/lotus.mp4' },
        pearl: { src: 'assets/videos/pearl.mp4' },
        split: { vid: '7687958764095682213' },
        summit: { vid: '7679181559971339505' }
    };

    /** 取据点的集锦配置（spot.video 优先，其次 CLIPS 表）。 */
    function cfgOf(spot) {
        var own = spot && spot.video;
        if (own && (own.grid || own.src || own.vid || own.bvid || own.type)) return own;
        return CLIPS[spot && spot.id] || null;
    }

    /** 据点是否配置了多片段宫格（供面板加宽等用）。 */
    function isGrid(spot) {
        var cfg = cfgOf(spot);
        return !!(cfg && cfg.grid && cfg.grid.length);
    }

    /* ----------------------------------------------------------------
       照片墙 —— 没有集锦视频、但有值得晒的截图/照片的据点。
         PHOTOS['apex'] = [{ src: 'assets/photos/apex-1.jpg', label: '…' }, …];
       spot.photos 数组优先于这张表。视频和照片可共存：都配则视频在上、照片在下。
    ---------------------------------------------------------------- */
    var PHOTOS = {
        apex: [
            { src: 'assets/photos/apex-1.jpg', label: '小队亮相' },
            { src: 'assets/photos/apex-2.jpg', label: '捍卫者' }
        ],
        pubg: [
            { src: 'assets/photos/pubg-1.jpg', label: '大吉大利，今晚吃鸡！' }
        ]
    };

    function photosOf(spot) {
        var own = spot && spot.photos;
        if (own && own.length) return own;
        return PHOTOS[spot && spot.id] || null;
    }

    /** 据点是否带照片墙（供面板切布局用）。 */
    function hasPhotos(spot) {
        var p = photosOf(spot);
        return !!(p && p.length);
    }

    /** 渲染照片墙：整宽堆叠，圆角卡片 + 底部小标签。 */
    function photosHtml(list, spot) {
        var items = list.map(function (p) {
            return '<figure class="photo-item">' +
                       '<img src="' + esc(p.src) + '" alt="' + esc((spot && spot.name || '') + ' ' + (p.label || '')) + '" loading="lazy">' +
                       (p.label ? '<figcaption class="photo-item-label">' + esc(p.label) + '</figcaption>' : '') +
                   '</figure>';
        }).join('');
        return '<div class="photo-list">' + items + '</div>';
    }

    /** 渲染 2×2 四宫格：每格封面 + 播放按钮，点击才加载视频。 */
    function gridHtml(cfg, spot) {
        var cells = cfg.grid.map(function (item) {
            var r = resolve(item);
            if (r.kind === 'none') return '';
            var label = item.label || (r.kind === 'file' ? '视频' : (LABEL[r.provider] || '视频'));
            return '<div class="clip-cell">' +
                       '<button class="game-video-cover" type="button" data-src="' + esc(r.url) + '"' +
                               (r.referrer ? ' data-referrer="' + r.referrer + '"' : '') +
                               (item.cover ? ' style="background-image:url(\'' + esc(item.cover) + '\')"' : '') +
                               ' aria-label="播放 ' + esc(spot && spot.name || '') + ' ' + esc(label) + '">' +
                           '<span class="game-video-play" aria-hidden="true"></span>' +
                           '<span class="game-video-cover-hint">' + esc(label) + '</span>' +
                       '</button>' +
                   '</div>';
        }).join('');
        return '<div class="game-video-body is-grid"><div class="clip-grid">' + cells + '</div></div>';
    }

    /** 渲染集锦面板的内容区：宫格 / 单条视频 / 照片墙，可叠加，全空才出占位。 */
    function bodyHtml(spot) {
        var cfg = cfgOf(spot);
        var photos = photosOf(spot);
        var parts = '';

        if (cfg && cfg.grid && cfg.grid.length) {
            parts += gridHtml(cfg, spot);
        } else if (cfg) {
            var r = resolve(cfg);
            var cls = 'game-video-body' + (r.portrait ? ' is-portrait' : '');

            if (r.kind === 'none') {
                parts += '<div class="' + cls + '">' +
                             '<div class="game-video-placeholder">' +
                                 '<span class="game-video-placeholder-icon">\uD83C\uDFAC</span>' +
                                 '<strong>' + esc(spot.name) + ' 的精彩集锦还在路上</strong>' +
                                 (r.warn ? '<p class="game-video-warn">' + esc(r.warn) + '</p>' : '') +
                                 '<p>在 <code>js/games-3d.js</code> 里给这项填上 video：<br>' +
                                 '抖音 <code>{ type:"douyin", vid:"7357…" }</code>　' +
                                 'B站 <code>{ bvid:"BV…" }</code>　' +
                                 'YouTube <code>{ type:"youtube", src:"…" }</code><br>' +
                                 '本地文件放 <code>assets/videos/' + esc(spot.id) + '.mp4</code> 后填 ' +
                                 '<code>{ type:"file", src:"…" }</code>。' +
                                 '加 <code>cover:"assets/covers/…"</code> 可先显示封面。</p>' +
                             '</div>' +
                         '</div>';
            } else {
                var cover = cfg && cfg.cover;
                if (cover) {
                    parts += '<div class="' + cls + '">' +
                                 '<button class="game-video-cover" type="button" data-src="' + esc(r.url) + '"' +
                                         (r.referrer ? ' data-referrer="' + r.referrer + '"' : '') +
                                         ' style="background-image:url(\'' + esc(cover) + '\')" ' +
                                         'aria-label="播放 ' + esc(spot.name) + ' 集锦">' +
                                     '<span class="game-video-play" aria-hidden="true"></span>' +
                                     '<span class="game-video-cover-hint">' + esc(LABEL[r.provider] || '视频') + '</span>' +
                                 '</button>' +
                             '</div>';
                } else {
                    parts += '<div class="' + cls + '">' + playerHtml(r) + '</div>';
                }
            }
        }

        if (photos && photos.length) parts += photosHtml(photos, spot);

        if (!parts) {
            return '<div class="game-video-body"><div class="game-video-placeholder">' +
                       '<span class="game-video-placeholder-icon">\uD83C\uDFAC</span>' +
                       '<strong>' + esc(spot.name) + ' 的精彩集锦还在路上</strong>' +
                   '</div></div>';
        }
        return parts;
    }

    /** 封面 → 真实播放器（事件委托，两个页面只需调用一次）。 */
    var delegated = false;
    function bindCovers() {
        if (delegated) return;
        delegated = true;
        document.addEventListener('click', function (e) {
            var btn = e.target.closest ? e.target.closest('.game-video-cover') : null;
            if (!btn) return;
            var box = btn.parentElement;
            var url = btn.getAttribute('data-src');
            var ref = btn.getAttribute('data-referrer');
            if (!box || !url) return;
            var kind = /\.mp4(\?|$)/i.test(url) ? 'file' : 'embed';
            box.innerHTML = playerHtml({
                kind: kind, provider: kind, url: url,
                portrait: box.classList.contains('is-portrait'),
                referrer: ref
            });
        });
    }

    window.VideoSource = {
        resolve: resolve,
        bodyHtml: bodyHtml,
        isGrid: isGrid,
        hasPhotos: hasPhotos,
        bindCovers: bindCovers,
        CLIPS: CLIPS,
        PHOTOS: PHOTOS
    };
    bindCovers();
})();
