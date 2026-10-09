# Letter 房间书桌 · 交互与扩展接口说明

## 1. 页面概述

`message.html` 被改成了一整个「房间书桌」场景（原来的一屏信纸已替换）：

- **墙面 + 书架**：12 本按 VHS 录像带风格做的书脊，hover 抽出、点击固定，抽出后下方挂出一张便签卡（书名 / 一句话 / 标签）。
- **书桌**：台灯（可开关）、马克杯（冒热气）、笔筒、拍立得、便利贴。
- **显示器**：大屏（16:10），开机有 CRT 启动动画、扫描线、眩光、关机动画；屏幕里面是 **1000×625 的像素桌面**，按屏幕宽度等比缩放（`--ui-scale`），永远不会被裁切。
- **键盘 + 鼠标**：按参考图做的蝶恋花键帽键盘 + 带涂鸦和 G 标的黑色鼠标；**键盘可以真的敲**——点键帽会把字符输入到锁屏输入框里，鼠标点击有动画、滚轮可滚。
- **桌面系统**：菜单栏 / 桌面图标 / 可拖拽窗口 / 缩放 / Dock / 时钟。
- **核心流程**：双击 **Letter** 图标 → 弹出锁屏 → 回答正确 → 信封 → 信纸逐行浮现。

## 2. 文件清单

| 文件 | 说明 |
|------|------|
| `message.html` | 页面结构（房间 → 墙/书架 → 书桌 → 显示器 → 键鼠 → 道具；末尾是 `#letterFloat` 信封与 `#paper` 信纸） |
| `css/style.css` | 末尾 `LETTER — the desk room` 段落（约 6400–8800 行）：主题变量、房间、书架、键鼠、显示器、像素桌面、信纸、响应式 |
| `js/letter.js` | 全部交互；顶部即配置区（密码 / 问题 / 书 / 应用 / 链接 / 便签 / 菜单），底部导出 `window.LetterDesk` |
| 本文 | 扩展接口说明 |

依赖只有站点已有的 `js/main.js`（导航、loader、音效开关、礼花），无新增第三方库。

## 3. 改内容：最常用的几个位置

### 3.1 改解锁问题与答案

`js/letter.js` 第 34–39 行：

```js
var PASSWORD = 'TS669';
var QUESTION = '如果可以自己挑选车牌，ty 会挑选什么？';
var HINTS = [
    'Two letters, three digits. Both letters are someone you know by heart.',
    'The letters are her initials. The numbers are the luckiest kind.'
];
```

- 校验逻辑在 `normalise()`：**转大写 + 去掉所有非字母数字**，所以 `ts669` / `TS 669` / `ts-669` 都算对。
- 答错会抖动并给提示，`HINTS` 按尝试次数逐条放出。
- 答对后：`room` 加 `.unlocked` → 爱心爆开 → 关闭锁屏窗口 → `openLetter()`。

### 3.2 改信纸正文

文案是**静态 HTML**，不在 JS 里：`message.html` 第 255–272 行。

```html
<h2 class="paper-title">Dear ty,</h2>
<p class="ln">…</p>   <!-- 每行一个 <p class="ln">，按顺序逐行浮现 -->
<div class="paper-sign">…</div>
```

直接替换 `<p class="ln">` 的文字即可，行数任意（`revealLines()` 会按 `.ln` 数量排延迟）。
签名 `always yours, / me` 也在这一块。

### 3.3 改书架上的书

`js/letter.js` 第 45–87 行 `BOOKS` 数组：

```js
{ t: 'THE FATE OF OPHELIA', tag: 'VHS', bw: 2.1, bh: 11.4,
  b1:'#1d3328', b2:'#152619', b3:'#0b1710', ink:'#e6d3a0', band:'#c9b47a', bandInk:'#2b2118',
  patch: 'linear-gradient(160deg,#7d9b6a,#3d5238)',   // 可选：书脊上的小色块
  q: 'read it twice in one night, cried at page one' } // 便签卡上的一句话
```

- `bw` / `bh` 是**书脊宽 / 高的倍数**，单位是 `--u`（CSS 里 `1.42vh`，各断点会调）。
- `foil: true` 加镭射反光；`tcls: 'is-serif' | 'is-hand'` 换字体；`lean: 3` 让书倾斜。
- 书脊尺寸用 `--u` 缩放，所以**加书不会撑破布局**，但太宽的书会让书架变长（书架在桌面端是绝对定位在左侧墙上，最多到 `--u × 22` 左右）。

### 3.4 改桌面便签 / 链接

```js
var LINKS = [];                       // 第 358 行：{ label, url }
var NOTES = [                         // 第 361 行
    { h: '01', t: 'buy more sticky notes' },
    …
];
```

`LINKS` 现在为空（Links 窗口会显示空态提示）。运行时也能加：

```js
LetterDesk.addLink('我们的歌单', 'https://…');
```

## 4. 预留的扩展接口（重点）

### 4.1 `window.LetterDesk`

页面加载完成后挂载，可在控制台或任何后续脚本里直接用：

| 成员 | 类型 | 说明 |
|------|------|------|
| `apps` | Array | `DESKTOP_APPS` 的引用（可直接 push，但推荐用 `registerApp`） |
| `books` / `links` / `notes` | Array | `BOOKS` / `LINKS` / `NOTES` 的引用 |
| `password` | String | 当前答案 |
| `isUnlocked()` | Function | 是否已解锁 |
| `openApp(id)` / `closeApp(id)` / `closeAll()` | Function | 开关窗口 |
| `openLetter()` / `closeLetter()` | Function | 直接开/关信封 |
| `toast(msg)` | Function | 桌面右下角吐司 |
| `registerApp(app)` | Function | **新增一个桌面应用** |
| `unregisterApp(id)` | Function | 移除应用（同时关窗、删图标） |
| `addLink(label, url)` | Function | 往 Links 里加一条 |

### 4.2 新增一个桌面应用

`registerApp()` 接受的对象字段：

```js
LetterDesk.registerApp({
    id: 'snake',            // 必填，唯一
    label: 'Snake',         // 桌面图标下的文字
    title: 'Snake',         // 窗口标题（缺省用 label）
    icon: '<svg …>',        // 图标 SVG 字符串（viewBox 建议 0 0 48 44）
    w: 560, h: 360,         // 窗口初始尺寸（像素桌面坐标系，1000×625）
    locked: false,          // true 会走锁屏逻辑（目前只有 letter 用了）
    hidden: false,          // true 则不生成桌面图标，只能用 openApp 打开
    render: function (body, win) { /* 自己写 DOM */ },
    // 不写 render 就走占位模板：
    note: 'Reserved for a small game.',
    detail: '…',
    tip: '…'
});
```

**关于小游戏**：现在 `arcade` 就是按上面「不写 render」的方式留的空壳（显示图标 + 一句话 + 提示）。
真正要放游戏时，两种做法：

1. **直接给 render**：在 `render(body, win)` 里创建 canvas / DOM，自己绑事件。窗口壳（标题栏、关闭、缩放、拖拽、层级）都已处理好，你只管内容。
   ```js
   LetterDesk.registerApp({
       id: 'snake', label: 'Snake', icon: '<svg …>', w: 560, h: 360,
       render: function (body) {
           body.innerHTML = '<canvas width="520" height="300"></canvas>';
           // …游戏循环
       }
   });
   ```
2. **改 `DESKTOP_APPS` 里的 `arcade` 条目**（第 330 行），把 `type: 'placeholder'` 换成 `type: 'minigame'` 并补上 `render`，图标和入口位置都不用动。

> 注意：窗口是画在**缩放过的像素桌面**里的（`transform: scale(--ui-scale)`），
> 所以内部坐标按 1000×625 写即可；但如果你要读鼠标坐标，记得除以 `getComputedStyle(scrUi).getPropertyValue('--ui-scale')`
> （`js/letter.js` 里的 `getScale()` 就是干这个的，拖拽已经处理过）。

### 4.3 超链接

`Links` 窗口会把 `LINKS` 渲染成可点击列表（`target="_blank"`）。填充方式：

```js
// 方式一：改 js/letter.js 第 358 行
var LINKS = [{ label: '我们的照片', url: 'https://…' }];

// 方式二：运行时
LetterDesk.addLink('我们的照片', 'https://…');
```

### 4.4 菜单栏

`MENUS`（第 367 行）是菜单栏配置，每项 `{ id, label, items: [{ label, act, sep, disabled }] }`。
想给新应用加菜单入口，往对应 `items` 里加一条 `act: function(){ openApp('snake'); }`。

### 4.5 其它可挂钩的点

| 想做的事 | 位置 |
|----------|------|
| 台灯开关后的连锁反应（如解锁时自动开灯） | `bindRoom()` 里 `lampBtn` 的 click；`room.classList` 加 `.unlocked` |
| 键盘敲特定组合触发彩蛋 | `onKeyClick()`（每个键的点击回调） |
| 换桌面壁纸 | `.ui-wall` / `.ui-hills-*` / `.ui-sun`（纯 CSS 渐变 + 形状） |
| 改开机动画时长 | `boot()` |
| 信纸上「Reply…」按钮（当前 `disabled`） | `message.html` 第 271 行 `#paperReply` |

## 5. 响应式断点

| 断点 | 布局 |
|------|------|
| `>900px` | 完整房间场景：`100vh` 固定，墙上书架在左，显示器偏右，键盘鼠标在桌面 |
| `≤900px` | 重排：墙（书架）在上、书桌在下，桌面/桌裙/桌垫隐藏，显示器居中自适应（`aspect-ratio: 1.44`），窗口变成覆盖全屏的 fixed 面板 |
| `≤960px` | 书架少 3 本、墙上钉子隐藏、笔筒隐藏 |
| `≤768px` | 导航收紧、返回按钮隐藏 |
| `≤560px` | 书架只留 7 本、`--u: 1.6vh`、便利贴 / 显示器贴纸隐藏 |

已实测的视口：1600×1000、1440×900、1366×768、1280×800、820×1180、390×844 —— 均无横向溢出、无元素重叠、无控制台报错。

> 改 CSS 后记得递增 `message.html` 里的 `css/style.css?v=20261009x`（浏览器缓存很凶）。

## 6. 已知取舍

- 书架书名在 1366×768 这类矮屏上只有约 7px，是刻意的「小书脊」观感；想更清楚就把 `css/style.css` 里 `.book-title` 的 `calc(var(--u) * 0.62)` 调大。
- 桌面端键盘会遮住显示器支架（符合真实视角），已保留 10–36px 的显示器下巴到键盘的间隙。
- `letter` 图标的锁只对 `PASSWORD` 生效；如果以后要多个锁，把 `locked` 逻辑从 `renderLetterApp` 抽出来做成通用即可。
