# 自定义 3D 模型（GLB）使用说明

3D 小岛（games-3d.html）支持两级模型替换：
据点小模型（水晶 → 你的模型）和整岛大场景（程序化地形 → 你的地图）。

## 一、整岛大场景（Meatopia 效果的路径）

参考站 visitmeatopia.com 的做法：整个小岛就是一个手工建模的
GLB 文件（约 16MB，Draco + KTX2 压缩）。想复刻那种质感，
核心是拿到/做出一个高质量的整岛模型。

1. 把整岛模型命名为 `island.glb` 放进本目录
2. 刷新页面 —— 程序化地形、树木、岩石自动隐藏，换成你的场景；
   内置水面（带波动）默认保留
3. 微调在 `js/games-3d.js` 的 `WORLD_MODEL` 配置：

| 参数        | 默认  | 说明                              |
|-------------|-------|-----------------------------------|
| size        | 96    | 场景水平直径（世界单位）           |
| y           | 0     | 垂直位置微调                       |
| hideTerrain | true  | 隐藏程序化地形                     |
| hideTrees   | true  | 隐藏程序化树木                     |
| hideRocks   | true  | 隐藏程序化岩石                     |
| keepWater   | true  | 保留内置水面                       |

4. 图钉对位：换岛后程序化地形高度失效，给每个 spot 写
   `y: <高度>` 手动对齐平台，必要时用 `pinY` 调图钉悬浮高度，
   `x / z` 调平面位置。

整岛模型的来源（按质量排序）：
- **Synty Studios POLYGON 系列**（syntystudios.com）：就是 Meatopia
  那种风格化质感，游戏级资产包，按主题买（城市/自然/游乐园）
- **委托建模**（Blender 美术，Bo wolai / 米画师 / Fiverr 都能找）
- **AI 生成 3D**（Meshy / Tripo）：适合单件道具，整场景质量尚不稳定

## 二、据点小模型

1. 模型放进本目录，用据点 id 命名：`cs2.glb`、`valorant.glb` 等
2. 刷新即可 —— 找得到文件就替换占位水晶，找不到就保留水晶

当前 8 个据点的 id：
`cs2` `valorant` `hok`(王昭君) `shouyue`(百里守约，在 `kings/` 子目录) `pubg` `apex` `repo` `fishing`
（`roco` 洛克王国已于 2026-10-13 移除）

据点模型可选参数（写在 `js/games-3d.js` 的 spots 对应项里）：

| 参数       | 默认  | 说明                             |
|-----------|-------|----------------------------------|
| modelSize | 6     | 模型最长边缩放到多少世界单位       |
| modelRotY | 0     | 初始朝向（弧度，如 Math.PI/2）    |
| modelY    | 0     | 垂直位置微调                      |
| modelSpin | true  | 是否缓慢自转展示（false 关闭）    |

示例：

    { id: 'cs2', ..., modelSize: 8, modelRotY: 0.5, modelSpin: false },

## 哪里找免费模型

- **Sketchfab**（sketchfab.com）：筛选 Downloadable + 免费授权
- **Poly Pizza**（poly.pizza）：大量 CC0 低多边形模型，免费商用
- **Kenney.nl**（kenney.nl）：完全 CC0 的游戏资产包
- **Quaternius**（quaternius.com）：免费低多边形角色与场景包

优先选 **glTF Binary (.glb)** 格式（单文件、含贴图）。

## 两个重要提醒

1. **版权**：从 CS2 / VALORANT / 王者荣耀 等游戏里直接提取（rip）的
   地图和角色模型属于各厂商的版权资产，公开分享的网站使用有法律风险，
   建议只用同风格的免费/购买授权的替代模型。
2. **file:// 打不开模型**：直接双击 HTML 时浏览器会拦截本地模型读取
   （占位水晶不受影响）。要看模型请用本地服务器或部署后的线上地址。

## 技术约束

- 据点单模型建议 < 5MB、面数 < 5 万；整岛模型建议 10–30MB 起、
  参考 Meatopia 用 Draco/KTX2 压缩，手机端才能流畅
- 支持骨骼动画：模型自带动画时自动播放第一段（如待机动作）
- 贴图需嵌入模型内部（.glb 默认就是嵌入的）

