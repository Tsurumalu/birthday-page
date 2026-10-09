(function () {
    'use strict';
    var places = {
        tanglang: { date: '2026.03', place: '塘朗山', city: '深圳', icon: '⛰', color: 'linear-gradient(135deg,#203b39,#84b7a8)', memory: '第一次一起爬山。山不高，路不长，但从此以后，每一段路都想和你一起走。', note: '汗水、风，还有山顶那句“下次去哪儿”。' },
        guangming: { date: '2026.04', place: '光明', city: '深圳', icon: '🌿', color: 'linear-gradient(135deg,#52785c,#d2bf70)', memory: '春天的光明，草木茂盛，阳光正好。我们走过的小路，现在想起来都在发光。', note: '慢慢走，也是一种抵达。' },
        xiamen: { date: '2026.05', place: '厦门', city: '福建', icon: '🌊', color: 'linear-gradient(135deg,#146082,#9bd4d6)', memory: '海风、鼓浪屿、和你。这座城市的味道，大概就是我们旅行最初的样子。', note: '把海风装进行李箱，带回我们的日常。' },
        zhuhai: { date: '2026.06', place: '珠海', city: '广东', icon: '🌅', color: 'linear-gradient(135deg,#9d4e2f,#f1c06f)', memory: '情侣路上慢慢走，海对面就是澳门。那天的夕阳，美得让人不想回家。', note: '日落没有催我们回去。' },
        macau: { date: '2026.06', place: '澳门', city: '中国澳门', icon: '🏛', color: 'linear-gradient(135deg,#4e2f69,#d1a5ce)', memory: '走过大三巴，吃过蛋挞，赌场没赢钱，但赢了一个和你在一起的下午。', note: '城市很吵，我们有自己的安静。' },
        hongkong: { date: '2026.08', place: '香港', city: '中国香港', icon: '🌃', color: 'linear-gradient(135deg,#172b59,#71add1)', memory: '维多利亚港的灯火，太平山顶的风，还有你。这座城市的拥挤里，藏着我们最安静的时光。', note: '灯亮起来的时候，我只看见你。' },
        chengdu: { date: '2026.08', place: '成都', city: '四川', icon: '🐼', color: 'linear-gradient(135deg,#7d2e29,#ef9e69)', memory: '火锅、熊猫、和你。在成都的慢节奏里，第一次觉得时间可以这么温柔。', note: '辣度刚好，陪伴刚好。' },
        singapore: { date: '2026.10', place: '新加坡', city: 'Singapore', icon: '🦁', color: 'linear-gradient(135deg,#15534f,#8cd0af)', memory: '鱼尾狮、环球影城、滨海湾的灯光秀。这是我们一起走得最远的一次，也是你生日前最后一次旅行。', note: '下一站，还要和你一起写。' }
    };
    var id = new URLSearchParams(window.location.search).get('id') || 'tanglang';
    var item = places[id] || places.tanglang;
    var root = document.getElementById('momentDetail');
    root.innerHTML = '<a class="detail-back" href="moments.html">← Back to the line</a>' +
        '<div class="detail-index">MOMENT / ' + String(Object.keys(places).indexOf(id) + 1).padStart(2, '0') + '</div>' +
        '<section class="detail-layout">' +
            '<div class="detail-poster" style="--detail-gradient:' + item.color + '"><span class="detail-poster-top">FOR YOU · ROUTE 02</span><span class="detail-poster-icon">' + item.icon + '</span><strong>' + item.place + '</strong><span class="detail-poster-bottom">' + item.date + ' / ' + item.city + '</span></div>' +
            '<article class="detail-copy"><p class="detail-kicker">' + item.date + ' · ' + item.city + '</p><h1>' + item.place + '</h1><p class="detail-memory">' + item.memory + '</p><div class="detail-rule"></div><p class="detail-note">' + item.note + '</p><p class="detail-caption">A small ticket from the journey we keep making.</p></article>' +
        '</section>' +
        '<nav class="detail-footer"><a href="moments.html#journeyTimeline">View the whole line</a><span>✦</span><a href="card.html">Back to the gift</a></nav>';
})();
