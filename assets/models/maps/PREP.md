# VALORANT 地图 GLB 清理 / 轻量化规范（PREP）

> 给games-3d 沙盘用的地图模型都要过一遍本规范。
> **对照标准就是 `ascent.glb`** —— 它是唯一按这套流程处理过的，
> 六张里只有它摆放、缩放、进图全部正常；其余五张（haven / lotus /
> pearl / split / summit）目前是 rip 原始导出，问题都出在没清理。

## 一、为什么现在的图会「乱套」

页面加载后会自动做三件事：量包围盒 → 缩放到 18 单位 → 找地面落台。
rip 原始导出里混着大量非地图几何，每一样都会把这三步带偏：

| 垃圾内容 | 实测例子 | 造成的症状 |
|---|---|---|
| 天空罩 / 边界围墙（直径是地图 2~8 倍） | pearl 4110 单位的围墙、summit 6464 的巨石 | 包围盒被撑爆 → 沙盘缩成一小团 |
| 地下残留（垂到 -200 ~ -500） | lotus -506、summit -315 | 图悬在石台上方，或底座下吊一坨 |
| Nanite 回退代理（巨石 / 巨枪 / 巨木箱） | summit 的苔藓巨石、split 的巨枪、pearl 图心木箱堆 | 沙盘上摆的不是地图，是代理件 |
| 数百个碎网格 | haven 941 个 mesh | draw call 爆炸（全岛 5000+），手机跑不动 |

代码里已经有兜底（剔天空罩、认大地平面、按前缀藏代理），但
**代理件和真地图几何混在一起时，任何自动规则都分不清**——
所以需要导出前手动清理。

## 二、清理目标（对照 ascent.glb）

| 指标 | ascent（达标） | 现在 5 张 | 目标 |
|---|---|---|---|
| 网格数 | 613 | 285 ~ 941 | **≤ 200**（按材质合并后可到 ≤ 50） |
| 整图跨度 | 78（干净、无罩） | 494 ~ 1525（含罩） | 只含真实地图 |
| 文件体积 | 9.5MB（已压贴图） | 3.3 ~ 11MB | **≤ 8MB** |
| 天空罩 / 边界墙 | 无 | 有 | 无 |
| 地下残留 | 无 | 有 | 无 |
| 地面 | 多块中尺寸地板拼合 | — | 大平面或拼合都行（代码都认） |

## 三、Blender 操作步骤

1. **导入**：File → Import → glTF 2.0，选 `<id>.glb`。
2. **删天空与背景**：在 Outliner 里按名字找 `Sky` / `Dome` / `Cloud`
   / `Ocean` / `Water` / `Background` / `Wall`（包围盒巨大的），
   以及**所有体积比地图本体还大的物体**。判断方法：选中后按 N 看
   Dimensions，长边超过地图本体 1/3 的都要过一眼。
3. **删地下残留**：正视图（小键盘 1）里看地图底面以下悬着的
   零碎（ ripping 常垂到 -500），框选删掉。
4. **删代理件**：巨大到不合比例的石头 / 枪 / 木箱 / 无纹理灰盒
   （Nanite 回退代理），全删。**真地图 = 地形 + 可玩建筑 + 地标**，
   保留这三类就够。
5. **合并网格（可选但强烈建议）**：按材质全选 → `Ctrl+J` 合并。
   目标 ≤ 50 个物体。这一步直接决定流畅度：每张图省几百个
   draw call，六张加起来全岛从 5000+ 降到 ~1000。
6. **归位**：全选 → `Ctrl+A` → All Transforms；再把地图整体挪到
   原点、底面贴 Z=0（不用特别精确，代码会自动再居中和落地）。
7. **贴图瘦身（推荐导出后用脚本压，见下方「重新量化」）**：脚本会把所有贴图
   统一重压到 **256² webp**（六张图常驻约 0.3GB 显存；若用 512² 常驻会冲到
   1GB+，集成显卡会崩）。JPEG 质量 85。
8. **导出**：File → Export → glTF 2.0：
   - Format: **glTF Binary (.glb)**
   - +Y Up 默认勾选 ✔
   - **几何可勾 Draco**（页面已接 `DRACOLoader`，解码器在 `assets/vendor/draco/`，
     压了能正常加载）；**贴图不要勾 KTX2**（页面还没接 `KTX2Loader`，勾了加载失败）
   - Geometry: 勾 Apply Modifiers

## 三之二、重新量化（已经在 Blender 里清好、导出成 glb 之后）

页面加载器现在支持 **Draco**，所以量化走「256² webp 贴图 + Draco 几何」即可，
一条命令（依赖 WorkBuddy 的 node 隔离环境：`gltf-transform` / `draco3dgltf` / `sharp`）：

    cd 项目根目录
    node .workbuddy/quantize-maps.cjs "<导出目录>" "assets/models/maps"

例如把重导出的珍珠图量化并覆盖进页面：

    node .workbuddy/quantize-maps.cjs "E:/maps/valorant/pearlB" "assets/models/maps"

输出文件名保持原名；若页面要的是 `pearl.glb` 而导出叫 `pearlB.glb`，量化后 `mv` 一下。
量化完记得在 `js/games-3d.js` 把 `MAP_VER` 升一版（如 `'?v=20261013a'` → `'?v=20261013b'`）
强制浏览器重新拉取。

> **KTX2 / Basis 是下一步显存优化**：它能让贴图在显存里保持压缩态（256² webp 进
> 显存仍会被解压成 RGBA）。Windows 上用 `gltfpack`（meshoptimizer 自带 Basis 编码器，
> 不用另找 toktx）一条命令出 Draco+KTX2；但接 KTX2Loader 之前页面还加载不了，需先在
> `games-3d.js` 接上 `KTX2Loader` + `assets/vendor/basis/` 转码器。
9. **覆盖保存**为 `assets/models/maps/<id>.glb`（同名覆盖即可），
   刷新 games-3d.html（记得改 `games-3d.html` 里 js 版本号）。

## 四、导出后的验收

本地起服务器（项目根目录）：

    python -m http.server 8123

打开 `games-3d.html`，逐张检查：
- 沙盘铺满石台（约占 18 单位宽）、稳稳坐在台面上；
- 看得到**建筑群**而不是巨石 / 巨枪 / 木箱；
- 点「进入地图」能在地面出生、四周不是黑的（黑 = 天空罩没删干净）。

哪张不达标，按表里指标对照 ascent.glb 再清一轮。

## 五、代码侧已有的自动处理（不用你操心）

- 天空罩 / 围墙自动隐藏（只认「又高又大」的壳；大地平面会保留）；
- degenerate 网格（垂线、零厚度面）自动剔除；
- pearl 图心的 InstancedStaticMesh 代理堆自动隐藏；
- 缩放、居中、落地、出生点全部自动。

清理得越干净，自动拟合越准；ascent.glb 就是「零特调」的直接证明。
