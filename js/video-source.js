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
        // VALORANT 六张地图：作者给了抖音链接的走抖音，
        // 其余用拷进 assets/videos/ 的本地文件（两页通用，格式自动识别）
        ascent: { vid: '7667074254554438897' },
        haven: { src: 'assets/videos/haven.mp4' },
        lotus: { src: 'assets/videos/lotus.mp4' },
        pearl: { src: 'assets/videos/pearl.mp4' },
        split: { vid: '7687958764095682213' },
        summit: { vid: '7679181559971339505' }
    };

    /** 渲染集锦面板的内容区；有封面就先出封面 + 播放按钮。 */
    function bodyHtml(spot) {
        var cfg = (spot && spot.video && (spot.video.src || spot.video.vid || spot.video.bvid || spot.video.type))
            ? spot.video
            : CLIPS[spot && spot.id];
        var r = resolve(cfg);
        var cls = 'game-video-body' + (r.portrait ? ' is-portrait' : '');

        if (r.kind === 'none') {
            return '<div class="' + cls + '">' +
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
        }

        var cover = cfg && cfg.cover;
        if (cover) {
            return '<div class="' + cls + '">' +
                       '<button class="game-video-cover" type="button" data-src="' + esc(r.url) + '"' +
                               (r.referrer ? ' data-referrer="' + r.referrer + '"' : '') +
                               ' style="background-image:url(\'' + esc(cover) + '\')" ' +
                               'aria-label="播放 ' + esc(spot.name) + ' 集锦">' +
                           '<span class="game-video-play" aria-hidden="true"></span>' +
                           '<span class="game-video-cover-hint">' + esc(LABEL[r.provider] || '视频') + '</span>' +
                       '</button>' +
                   '</div>';
        }

        return '<div class="' + cls + '">' + playerHtml(r) + '</div>';
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
        bindCovers: bindCovers,
        CLIPS: CLIPS
    };
    bindCovers();
})();
