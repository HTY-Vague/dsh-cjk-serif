# 中文衬线字体

让 DSH 里的中文用宋体（衬线），西文保持主题原字体，代码保持等宽。开关在 **设置 → 通用设置**，默认开启，全局生效。

## 解决什么问题

主题给正文指定的衬线字体通常只覆盖西文字形。中文字符缺字时会按字体栈回退到 `Noto Sans SC`、`Source Han Sans SC` 这类无衬线字体，于是「主题已经切到衬线」和「中文仍是黑体」可以同时成立：问题出在中文字体回退上，与具体是哪个主题无关——西文字体大多不含汉字，不能指望它们来渲染中文。

本插件声明一个只覆盖 CJK 字符的字体族 `Dsh CJK Serif`，排在各主题的中文无衬线回退之前，让中文真正用上系统里已安装的宋体；西文字符不经过这个字体族，仍然使用主题自己的字体。

## 功能

- **全局开关**：设置 → 通用设置 →「中文衬线字体」，位于主题的字体设置之后
- **只做全局**：不按侧边栏、主区域等分区控制；一处开关，全界面生效
- **记住选择**：开关状态存在 `localStorage`，刷新后保留
- **即开即生效**：切换开关或切换主题后自动重新读取字体栈，无需刷新

关闭总开关后，界面与会话中的中文立即恢复为主题原本的字体。

## 安装

**方式一：插件市场 / 插件管理器**

在市场里搜索 `dsh-cjk-serif` 安装；也可以从本仓库目录安装。

**方式二：命令行**

```sh
dsh plugin --profile desktop add github:HTY-Vague/dsh-cjk-serif
```

把 `desktop` 换成你实际使用的 profile 名（例如 `web`）。首次安装后刷新一次页面；之后切换开关即时生效。

## 字体来源

按以下顺序取系统里第一个可用的字体：

`Noto Serif CJK SC` → `Noto Serif CJK TC` → `Noto Serif CJK JP` → `Source Han Serif SC` → `Source Han Serif TC` → `Source Han Serif JP` → `Noto Serif SC` → `Noto Serif TC` → `Songti SC` → `STSong` → `SimSun` → `NSimSun`

常见环境：Linux 装 `fonts-noto-cjk` 即有 Noto Serif CJK SC；macOS 自带 Songti SC；Windows 自带 SimSun。一个都没有时，开关不会报错，但中文外观不会变化。

## 实现说明

- 字体族通过 `@font-face` 声明，`unicode-range` 限定在 CJK 区块，所以拉丁字母、数字、符号不会命中它
- 覆盖的变量在运行时从页面实际生效的自定义属性里读取：名字匹配 `font`、`serif`、`prose`，排除名字含 `code`、`mono`、`terminal` 的变量，并且**只改写值确实是字体族列表的变量**——字号（`--dsh-content-font-size` 等）、行高、字重、字体简写 token 不会被碰
- 每次刷新前先撤掉本插件自己的覆盖声明再读取，因此重复刷新不会把字体族叠加多次，也不会把用户新选的字体读丢
- 只声明 400 字重：`local()` 源只能取到字族的常规体，声明 700 会让粗体静默丢失；只留 400，让浏览器合成粗体
- 不改包外文件，也不碰系统 fontconfig；停用插件即可完全恢复

## 已知限制

- 只做全局开关，没有分区控制
- 主题如果把 `font-family` 直接写在组件样式里（不经过自定义属性），这些组件不在覆盖范围内
- 需要系统已安装中文衬线字体，否则开关打开后外观不变
- 英文界面文案随宿主语言切换；目前提供中文和英文两套词典，其他语言回退英文

## 兼容性

- 需要 DSH `>=0.2.2-rc.1`（见 `package.json` 的 `engines.dsh`）
- 客户端只依赖 React 与插槽、本地化服务；不引入 `@deepseek-ai/dsh-client-ui-*` 等 Harness 客户端包

## 卸载

在插件管理器里停用或移除 `dsh-cjk-serif`，界面即恢复主题原始字体。

## 许可

MIT

---

## English

Chinese text in DSH often falls back to a sans-serif face: the theme's serif stacks are built from Latin fonts that contain no CJK glyphs. This plugin declares a CJK-only `@font-face` (`Dsh CJK Serif`) that resolves to the first installed Chinese serif family and prepends it to the page's font-family custom properties, so Chinese text gets a serif face while Latin text and code keep the theme's fonts.

- **Where**: Settings → General → "Chinese serif text", right below the theme font settings. On by default.
- **Scope**: one global switch; there is no per-region control.
- **Persistence**: the choice is stored in `localStorage` and survives reloads.
- **Fonts**: Noto Serif CJK SC/TC/JP, Source Han Serif SC/TC/JP, Noto Serif SC/TC, Songti SC, STSong, SimSun, NSimSun — whichever is installed first. With none installed the switch still works but the look does not change.
- **Limitations**: components that hard-code `font-family` in their own CSS (bypassing custom properties) are not covered; only the Chinese glyph range is affected, so Latin text and code stay as the theme renders them.

Install with `dsh plugin --profile <name> add github:HTY-Vague/dsh-cjk-serif`, then reload the page once.

MIT © HTY-Vague
