# 中文衬线字体

让 DSH 里的中文用宋体（衬线）。插件提供一个中文字体族 `Dsh CJK Serif`，把它加入「字体 → 文本字体」即可；西文和代码不受影响。

## 为什么是"字体"而不是"强制覆盖"

1.x 的做法是直接改写页面的字体 CSS 变量并加 `!important`。一旦有别的插件也想设置字体，这就变成层叠竞争：谁赢取决于 `!important`、选择器优先级和样式表顺序，而不是用户的意图；用户自己在设置里选的字体也会被遮住。

2.0 起只做两件事：声明 `Dsh CJK Serif` 这个字体族；把"是否使用"写进**宿主自己的「文本字体」设置**。字体设置只有一个值，谁最后设置就以谁为准，而且用户在设置页能直接看到并修改——不再有隐藏的覆盖。

## 功能

- **开关**：设置 → 通用设置 →「中文衬线字体」，把 `Dsh CJK Serif` 放到文本字体列表最前面；关掉只移除这一项，其它字体原样保留
- **也可以手动设置**：设置 → 通用设置 → 字体 → 文本字体，直接输入 `Dsh CJK Serif`
- **同一个值**：开关状态就是"文本字体列表里有没有这个字体"，两边互相同步
- **只影响文本字体**：代码、终端字体不变
- **跟随宿主设置持久化**：换会话、换设备一致

## 解决什么问题

主题给正文指定的字体通常只覆盖西文字形。中文字符缺字时会按字体栈回退到 `Noto Sans SC`、`Source Han Sans SC` 这类无衬线字体，于是「主题已经切到衬线」和「中文仍是黑体」可以同时成立——西文字体大多不含汉字，不能指望它们渲染中文。

`Dsh CJK Serif` 只覆盖 CJK 字符，会被排到字体列表最前面：中文由系统里已安装的宋体渲染，拉丁字母、数字、符号不会命中它，继续使用后面的字体。

## 安装

**方式一：插件市场 / 插件管理器**

在市场里搜索 `dsh-cjk-serif` 安装；也可以从本仓库目录安装。

**方式二：命令行**

```sh
dsh plugin --profile desktop add github:HTY-Vague/dsh-cjk-serif
```

把 `desktop` 换成你实际使用的 profile 名（例如 `web`）。首次安装后刷新一次页面。

## 使用

1. 打开 设置 → 通用设置 →「中文衬线字体」。
2. 开关打开：字体族被加到「文本字体」最前面；开关关闭：只把它移除。

关闭开关只会从字体列表里去掉 `Dsh CJK Serif`，你原有的字体设置保持不动。停用或移除插件时，字体列表里可能留下这一项；浏览器会跳过不存在的字体族，回退到后面的字体，不影响使用。

## 字体来源

按以下顺序取系统里第一个可用的字体：

`Noto Serif CJK SC` → `Noto Serif CJK TC` → `Noto Serif CJK JP` → `Source Han Serif SC` → `Source Han Serif TC` → `Source Han Serif JP` → `Noto Serif SC` → `Noto Serif TC` → `Songti SC` → `STSong` → `SimSun` → `NSimSun`

常见环境：Linux 装 `fonts-noto-cjk` 即有 Noto Serif CJK SC；macOS 自带 Songti SC；Windows 自带 SimSun。一个都没有时，开关不会报错，但中文外观不会变化。

## 实现说明

- 插件只注入一个 `<style>`：`@font-face`（`unicode-range` 限定 CJK）和设置行样式；**没有任何 `!important`**，不读写页面上的字体变量
- 开关通过主题服务的 `setFontFamily('text', …)` 修改宿主设置，和「文本字体」输入框是同一个值
- 开关状态由 `theme/change` 事件派生，插件不另存状态、不写 `localStorage`
- 只改"文本"角色，不碰代码与终端字体
- 不改包外文件，也不碰系统 fontconfig；关闭开关即恢复

## 已知限制

- DSH 目前没有字体下拉选择器：字体设置是逗号分隔的文本框，所以"选择"表现为手动输入，或由本插件的开关代填
- 组件如果把 `font-family` 写死在自己的样式里，不受文本字体设置影响（与主题字体设置的限制一致）
- 如果字体列表里 `Dsh CJK Serif` 之前已经有能显示中文的字体，中文会先用那个；开关总是把它放到最前面以避免这种情况
- 如果另一个插件也往文本字体里加字体，最终结果由列表顺序决定——本插件只负责自己这一项，不会覆盖别人的值
- 需要系统已安装中文衬线字体，否则开关打开后外观不变

## 兼容性

- 需要 DSH `>=0.2.2-rc.1`（见 `package.json` 的 `engines.dsh`）
- 若主题服务没有 `setFontFamily`（更老的 DSH），开关不会显示；仍可在「文本字体」里手动输入 `Dsh CJK Serif`
- 客户端只依赖 React 与插槽、本地化、主题服务；不引入 `@deepseek-ai/dsh-client-ui-*` 等 Harness 客户端包

## 许可

MIT

版本变更见 [CHANGELOG.md](CHANGELOG.md)。

---

## English

Chinese text in DSH often falls back to a sans-serif face because the theme's font stacks are built from Latin fonts that contain no CJK glyphs. This plugin contributes one font family, `Dsh CJK Serif`: an `@font-face` that resolves to the first installed Chinese serif family and covers only the CJK ranges, so Latin text and code never hit it.

The plugin does **not** override any CSS. Its switch edits the Host's own text font list (Settings → General → Fonts → Text font), putting the family in front on enable and removing only that entry on disable. That keeps one source of truth: whatever the user or another plugin writes to the text-font setting is what the page uses, and the value is visible and editable in the settings UI.

- **Where**: Settings → General → "Chinese serif text", right after the theme font rows.
- **Manual alternative**: type `Dsh CJK Serif` into Fonts → Text font; it only takes effect before any CJK-capable family in the list.
- **Scope**: the text role only; code and terminal fonts are untouched.
- **Fonts**: Noto Serif CJK SC/TC/JP, Source Han Serif SC/TC/JP, Noto Serif SC/TC, Songti SC, STSong, SimSun, NSimSun — whichever is installed first.
- **Limitations**: DSH has no font picker yet, so selecting means typing the family or using this switch; components that hard-code `font-family` are not covered.

Install with `dsh plugin --profile <name> add github:HTY-Vague/dsh-cjk-serif`, then reload the page once.

MIT © HTY-Vague
