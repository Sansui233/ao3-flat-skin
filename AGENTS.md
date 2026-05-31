# AO3 Skin design

## Task

AO3 网页可以设置不同的皮肤，用户可以选择喜欢的皮肤来改变网页的外观。设计一个新的皮肤，要求满足以下条件：

1. 由于 DOM 结构无法修改，因此需要在现有的 HTML 结构上进行设计。你只能使用一个单一的 CSS 文件来实现新的皮肤设计，不能使用 JavaScript 或其他技术来修改网页结构或行为。
2. UI上，使用更加现代、扁平的设计风格。以清爽、干净、易读为主。排版上以网格进行区分。
3. 内容上，注重长文的排版与阅读体验。对于单列布局，需要限制文本宽度。
4. 使用响应式设计。但减少 media query 的使用，转而使用 CSS Grid 和 Flexbox 来实现响应式布局。
5. 不要使内容溢出，适当 wrap

## 设计

1. 使用 CSS 变量设计颜色
2. 使用 CSS 变量设计字体，font-sans, font-serif, font-mono。均 fallback 到 Windows, Mac, IOS 平台内置字体
3. 对于 UI，以 font-sans 为主，对于统计信息、数据等，使用 font-mono 和 numeric 的 style。
4. 图标替换：对于登录后的页面，使用 CSS 替换文字一些常见的图标，例如用户头像、收藏夹、评论等。可以使用 Unicode 字符或者 SVG 图标来实现。图标库使用 Feather PNG。注意你需要对图标进行上色处理，你可以参考 neo 的上色方案来设计图标的颜色。
5. 设计风格
  - 原 AO 3 有很强的边线和投影，你需要减少其影响。
  - button 采用 5px 的圆角，卡片采用 0.5rem 或 1rem 的圆角
  - dropdown、浮层等 有很浅色的 box shadow，背景色嵌套
  - hover 和 active 状态有明显的视觉反馈，例如颜色变化或者阴影、下划线等

## 文件结构

1. src 下为 ao3 的网页源文件与对应目录的的 CSS、 JS 文件。几乎所有页面共享同一套 CSS 文件，如
  - Admin Posts
    - HTML： `C:\Users\lingn\Developer\web\ao3-theme\src/Admin Posts _ Archive of Our Own.html`
    - CSS, JS, LOGO: `C:\Users\lingn\Developer\web\ao3-theme\src/Admin Posts _ Archive of Our Own_files`
  你需要一点时间排除原 css 的干扰。
2. ./skins/neos 为别人参考实现。其实 neos-base 为基础的样式。当你不知道替换图标时可以参考其设计

## 工作准则
- 你的css应写在 src/skins/base.css 中。启动 html 时，以 src 为根目录。把 base.css 嵌入到几个 HTML 中。
- 先页面结构分析，后写代码。先分析当前网页的 DOM 和 结构和对应的 CSS 文件。 AO3 使用了大量的 float 布局。在现代设计中，应该使用 Flexbox 和 CSS Grid 来实现布局。你需要排除原有 CSS 的影响
- 如果有需要，可以使用 `pnpm` 进行包管理
- 需要待确认的设计问题，首先询问我
- **你必须记录各种开发文档，包括计划/分析/设计标准等，保存到 docs/agent 目录下，来确保工作的一致性。**

## 开发环境
- 你主要使用的是 powershell。但是 bash.exe 是可用的。
- cmd 实用工具：
 - `rg`：ripgrep，快速搜索文本
 - `fzf`：快速模糊搜索文件
 - `bash`: 可以使用 bash 来执行一些脚本或者命令
 - `uv`: python 3.12。如果要用 python，就使用 uv。不要污染系统的 Python 包环境。

## 开发 PLAN 与 ROADMAP

### 设计基准

1. 默认主题采用清爽浅色系。色彩系统以白色、浅灰、低饱和蓝灰、柔和红色强调色为主，减少 AO3 原始样式中的强边线、重阴影和高对比红黑组合。深色主题不进入首轮开发，只保留 CSS 变量扩展空间。
2. 图标替换策略保持灵活。可以参考 `skins/neos` 的 `content` 方案，也可以使用 Unicode 字符、CSS 伪元素、mask、background-image 或 Feather PNG。首轮优先处理统计、用户、评论、收藏、作品状态等高频区域。
3. 所有实现必须集中在 `src/skins/base.css`。HTML 仅用于嵌入该 CSS 进行本地验证，不通过 JavaScript 或 DOM 修改改变页面结构。

### 实施阶段

1. Phase 0 - 页面结构审计
   分析 `Home`、`Home Logged in`、`Latest Works`、`Search Works`、`Fandoms`、`Tags`、`Uncategorized Fandoms` 等页面的 DOM 结构，记录 `#outer`、`#header`、`#inner`、`#main`、`#footer`、`.navigation`、`.work.blurb`、`.tags`、`.meta`、`.userstuff` 等选择器的实际层级与页面差异。
2. Phase 1 - 原始样式影响排查
   抽样分析 `1_site_screen_.css`、handheld CSS、`sandbox.css` 中的 float、border、shadow、form、table、listbox、blurb、dashboard 规则，确认需要在 `base.css` 中覆盖的高风险区域。
3. Phase 2 - 基础设计系统
   创建 `src/skins/base.css`，定义颜色、字体、间距、圆角、阴影、内容宽度、阅读宽度、焦点态等 CSS 变量。字体分为 `--font-sans`、`--font-serif`、`--font-mono`，并 fallback 到 Windows、macOS、iOS 常见系统字体。
4. Phase 3 - 全局布局现代化
   使用 Grid 和 Flexbox 重写页头导航、用户导航、主内容区、页脚、作品列表、搜索表单、标签区、统计信息区。减少 media query，优先使用 `minmax()`、`auto-fit`、`flex-wrap`、`max-width`、`clamp()`、`overflow-wrap` 处理响应式布局和溢出。
5. Phase 4 - 阅读体验与内容组件
   优化 `.userstuff`、作品正文、摘要、FAQ、公告等长文区域。单列阅读区限制文本宽度，索引页和搜索页保留更宽网格。同步统一作品卡片、标签、meta、summary、blockquote、列表和代码块样式。
6. Phase 5 - 表单、浮层与交互状态
   统一按钮、输入框、select、checkbox、radio、搜索筛选、分页、dropdown、modal。按钮圆角使用 5px，卡片圆角使用 `0.5rem` 或 `1rem`，浮层使用浅色背景与轻量阴影，hover、focus、active 状态提供明确视觉反馈。
7. Phase 6 - 图标替换
   参考 `skins/neos` 的图标实现，对登录后用户导航、统计信息、评论、收藏、作品状态等区域进行 CSS 图标替换。需要上色的图标统一走变量，例如 `--icon-muted`、`--icon-accent`、`--icon-danger`、`--icon-success`。
8. Phase 7 - 嵌入 HTML 与视觉回归
   把 `base.css` 嵌入代表性 HTML，以 `src` 为根路径验证。检查桌面、平板、移动宽度下的导航换行、作品卡片、搜索表单、长文阅读、超长标签、footer、modal 是否溢出或遮挡。

### 首轮验证页面

1. `src/Home _ Archive of Our Own.html`
2. `src/Home (Logged in)_ Archive of Our Own.html`
3. `src/Latest Works _ Archive of Our Own.html`
4. `src/Search Works _ Archive of Our Own.html`
5. `src/Uncategorized Fandoms _ Archive of Our Own.html`

## 进度追踪

详细进度同步记录在 `docs/agent/development-roadmap.md`。每次完成阶段性分析、CSS 实现、HTML 嵌入或视觉验证后，必须更新该文件。

| 阶段 | 状态 | 当前记录 |
| --- | --- | --- |
| 设计基准确认 | 已完成 | 已确认默认采用清爽浅色系；图标方案可参考 `content`、Unicode、伪元素、mask 或 Feather PNG。 |
| Phase 0 - 页面结构审计 | 已完成 | 已形成关键页面结构与选择器记录，详见 `docs/agent/page-structure-audit.md`。 |
| Phase 1 - 原始样式影响排查 | 已完成 | 已明确需要覆盖的 float、border、shadow、form、listbox、blurb、dashboard 规则，详见 `docs/agent/original-css-impact-audit.md`。 |
| Phase 2 - 基础设计系统 | 已完成 | 已创建 `src/skins/base.css`，包含浅色变量系统、字体系统、基础排版和焦点态。 |
| Phase 3 - 全局布局现代化 | 已完成 | 已使用 Grid/Flex 覆盖页头、主内容、页脚、导航、作品列表、集合列表和搜索表单。 |
| Phase 4 - 阅读体验与内容组件 | 已完成 | 已完成 `.userstuff`、作品卡片、集合卡片、标签、meta、summary、blockquote、listbox 首版样式。 |
| Phase 5 - 表单、浮层与交互状态 | 已完成 | 已统一按钮、输入框、select、checkbox、radio、分页、dropdown、modal 与 hover/focus/active 状态。 |
| Phase 6 - 图标替换 | 已完成 | 已通过 CSS `content` 与伪元素完成 required tags、stats、meta 等高频区域首版图标替换。 |
| Phase 7 - 嵌入 HTML 与视觉回归 | 已完成 | 已嵌入 10 个顶层 HTML，并完成桌面与移动端渲染检查；预览图见 `docs/agent/phase-2-7-implementation.md`。 |
