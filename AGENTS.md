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
  你需要一点时间。
2. skins/neos 为别人参考实现。其实 neos-base 为基础的样式。当你不知道替换图标时可以参考其设计

## 工作准则
- 你的css应写在 src/skins/base.css 中。启动 html 时，以 src 为根目录。把 base.css 嵌入到几个 HTML 中。
- 你的在开发中的分析结果应保存到 docs/agent 目录下。
- 先页面结构分析，后写代码。先分析当前网页的 DOM 和 结构和对应的 CSS 文件。 AO3 使用了大量的 float 布局。在现代设计中，应该使用 Flexbox 和 CSS Grid 来实现布局。你需要排除原有 CSS 的影响
- 如果有需要，可以使用 `pnpm` 进行包管理
- 需要待确认的设计问题，首先询问我
