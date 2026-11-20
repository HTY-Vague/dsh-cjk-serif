# 字体选择（dsh-cjk-serif）

给 DSH 的正文与界面分别选一款西文和一款中文字体。两个下拉在 **设置 → 通用设置**；西文内置 Inter 与 Source Serif 4，中文内置思源宋体与思源黑体，其余选项使用系统字体。

## 为什么是“写设置”而不是“强制覆盖”

1.x 直接改写页面字体 CSS 变量并加 `!important`，一旦有第二个插件也想管字体就变成层叠竞争：谁赢取决于优先级和样式表顺序，用户自己在设置里选的字体会被遮住。

2.0 起只往**宿主自己的「文本字体」设置**里写：字体只有一个值，谁最后设置以谁为准，而且用户在设置页能直接看到、直接改。4.0 沿用这条规则——两个下拉只是把这个值编辑得更顺手，没有任何覆盖。

## 功能

- **西文字体**：跟随默认 / Inter / Source Serif 4 / Times New Roman / Consolas / Cascadia Code
- **中文字体**：跟随默认 / 思源宋体 / 思源黑体 / 楷体 / 仿宋
- **内置字体不需要系统安装**：思源宋体、思源黑体随插件分发，选中即可用；楷体、仿宋用系统字体（Windows 自带）
- **选项即字体预览**：下拉里每一款字体都用它自身渲染，收起的控件也按当前字体显示，选之前就能看出差别
- **立即生效**：切换写回宿主设置，页面随即重绘；状态由宿主设置派生，刷新、换会话都保持
- **不动代码字体**：代码、终端仍用宿主的等宽字体栈（Consolas、Cascadia Code 选项只作用于正文，不接管代码）

## 中西文怎么分开

- 内置的西文字体只声明拉丁区块（`unicode-range`），不会碰中文
- 内置的中文字体按 unicode-range 切成 101 个分片，汉字命中分片、拉丁字符落到西文字体
- 楷体/仿宋声明成只覆盖 CJK 区块的 `@font-face`，`local()` 指向系统里那款字体
- 所以中文选项抢不走拉丁字母，西文字体也不会把汉字画成缺字方块；列表里西文在前、中文在后

## 内置字体与许可

| 字体 | 用途 | 授权 | 分发方式 |
| --- | --- | --- | --- |
| Inter（latin 可变字重，正体 + 斜体） | 西文无衬线 | SIL OFL 1.1 | base64 内嵌在 `client.js` |
| Source Serif 4（latin 可变字重，正体 + 斜体） | 西文衬线 | SIL OFL 1.1 | base64 内嵌在 `client.js` |
| Noto Serif SC（101 个 unicode-range 分片） | 中文宋体 | SIL OFL 1.1 | `fonts/cjk/`，由宿主路由按需提供 |
| Noto Sans SC（101 个 unicode-range 分片） | 中文黑体 | SIL OFL 1.1 | `fonts/cjk/`，由宿主路由按需提供 |

西文字面小（约 200KB），直接内嵌进 `client.js`；中文分片合计约 10MB，走插件自己的只读路由 `/dsh-cjk-serif/fonts/<文件>`，浏览器只下载页面用到的分片，并缓存一年。许可文本随字体一起放在 `fonts/LICENSE-*.txt` 与 `fonts/cjk/LICENSE-*.txt`。

## 安装

```sh
dsh plugin --profile desktop add github:HTY-Vague/dsh-cjk-serif
```

也可以在插件管理器里从本仓库目录安装。**4.x 首次安装或从 3.x 升级后需要重启一次 DSH**（宿主路由在插件激活时注册），之后刷新页面即可。

## 使用

1. 打开 设置 → 通用设置，找到「西文字体」和「中文字体」两行（在主题字体行下面）。
2. 两个下拉各选一项；「跟随默认」表示这一侧不干预，交还给宿主自己的字体栈。
3. 想精确控制时，宿主的「字体 → 文本字体」输入框里能看到同样的值，也可以直接改。

## 开发

```sh
node scripts/embed-fonts.mjs      # 西文字面 → client.js 的 [font binaries]
node scripts/embed-cjk-fonts.mjs  # 中文字面 → fonts/cjk/ 与 client.js 的 [cjk font css]
node tests/font-list.test.mjs     # 字体目录、列表合成、样式与 bundle 规则
node tests/font-route.test.mjs     # 宿主字体路由（分片、304、HEAD、404、越权、405）
```

两个脚本都支持 `--check`（`npm run fonts:check`）用于校验 `client.js` 是否与 `fonts/` 同步；结果需要提交。字体取自 npmmirror 上的 `@fontsource-variable/*`，下载缓存在 `.font-cache/`（已 gitignore）。

## 已知限制

- 组件如果把 `font-family` 写死在自己的样式里，不受文本字体设置影响（与主题字体设置的限制一致）
- 楷体/仿宋是系统字体：换到没有这些字体的机器上会回退到默认中文字体
- 「文本字体」只有一个值：如果另一个插件也写它，以最后一次写入为准，本插件不会覆盖别人的值
- 停用或移除插件后，宿主「文本字体」里可能留下本插件写过的字体族；浏览器会跳过不存在的族并回退到后面的字体，到「字体 → 文本字体」里清掉即可

## 兼容性

- 需要 DSH `>=0.2.2-rc.1`（`package.json` 的 `engines.dsh`）
- 宿主没有 web server 时字体路由不会注册，内置中文字体不可用（西文与系统字体不受影响）
- 若主题服务没有 `setFontFamily`（更老的 DSH），两行不会出现；仍可在「文本字体」里手动输入家族名
- 客户端只依赖 React 与插槽、本地化、主题服务，不引入 `@deepseek-ai/dsh-client-ui-*` 包

## 许可

代码以 MIT 授权，见 [LICENSE](LICENSE)。

内置字体按 SIL Open Font License 1.1 分发，每个字体文件旁都附有许可全文与版权行：

| 字体 | 版权 | 许可文件 |
| --- | --- | --- |
| Inter | The Inter Project Authors | `fonts/LICENSE-Inter.txt` |
| Source Serif 4 | Google Inc. | `fonts/LICENSE-SourceSerif4.txt` |
| Noto Serif SC | Google Inc. | `fonts/cjk/LICENSE-NotoSerifSC.txt` |
| Noto Sans SC | Google Inc. | `fonts/cjk/LICENSE-NotoSansSC.txt` |

字体文件取自 npmmirror 镜像上的 `@fontsource-variable/*` 发布包，未做任何修改；Noto 两款保持 Google Fonts 的 unicode-range 分片形式。系统字体选项（Times New Roman、Consolas、Cascadia Code、楷体、仿宋）不随插件分发，只按名称引用用户机器上已装字体。

版本变更见 [CHANGELOG.md](CHANGELOG.md)。

---

## English

Pick the Latin and the Chinese font for DSH text from two dropdowns in **Settings → General**. Inter and Source Serif 4 ship for Latin; Noto Serif SC and Noto Sans SC ship for Chinese; the remaining choices use installed system fonts.

The plugin **does not override CSS**. Both dropdowns edit the Host's own text-font setting (`Settings → Fonts → Text font`), which stays the single source of truth and remains visible and editable.

- **Latin**: Host default, Inter, Source Serif 4, Times New Roman, Consolas, Cascadia Code
- **Chinese**: Host default, Noto Serif SC (bundled), Noto Sans SC (bundled), KaiTi, FangSong
- **Split by script**: bundled Latin faces declare a Latin `unicode-range`; both bundled Chinese faces are sliced by unicode-range (101 slices each) and the system choices are CJK-only `@font-face` rules resolved through `local()`
- **Scope**: the text role only; the monospace Latin choices do not take over code or terminal fonts
- **Preview**: every option renders in its own face (Latin and Chinese), and the closed control shows the current choice in that font

Bundled Latin faces are small enough to inline as base64 in `client.js`; the Chinese slices (~10 MiB) ship in `fonts/cjk/` and are served read-only by the plugin's host route `/dsh-cjk-serif/fonts/<file>`, so the browser downloads only the slices it needs and caches them for a year. Rebuild with `node scripts/embed-fonts.mjs` and `node scripts/embed-cjk-fonts.mjs`; run the two test files for the guards.

Restart DSH once after installing 4.x (the host route registers at activation), then reload the page.

MIT for the code. The bundled fonts ship under the SIL Open Font License 1.1 with their copyright lines: Inter (The Inter Project Authors), Source Serif 4, Noto Serif SC and Noto Sans SC (Google Inc.). The license texts sit next to the files (`fonts/LICENSE-*.txt`, `fonts/cjk/LICENSE-*.txt`). System-font choices are referenced by name only and are not redistributed.

MIT © HTY-Vague
