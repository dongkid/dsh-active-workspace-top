# dsh-active-workspace-top 维护规则（AGENTS）

> 本文件只约束本目录，面向继续维护这个插件的 agent。

## DSH 升级：先查官方有没有同类功能

1. 每次升级 DSH 或调整行为前，先确认官方是否已经内置「活动工作区/最近使用工作区自动置顶」或「工作区按最近使用排序」一类能力。检查官方 changelog、DSH 源码里的 packages/client/ui-workspace 与 packages/workspace，以及设置页新增的排序选项。
2. 如果官方已内置：**不要默认保留本插件**。先向用户说明官方实现与本插件的行为差异，询问是否保留；默认建议停用或卸载本插件，避免重复排序、互相覆盖或以后打架。
3. 再按 docs/dsh-dependencies.md 逐项复查事件、服务与 Loader 契约；接口有变化时先更新文档，再改代码与测试。

## 硬约束

- 不改 DSH 源码或安装目录；挂载只走 cordis.patch.yml + profile。
- 只改工作区顺序：不新增前端界面、不改会话排序、不改分组方式、不加自动展开或滚动。
- 行为变化必须同步更新 README.md、docs/dsh-dependencies.md 和 tests/。
- 提交前跑 npm test（即 node --test "tests/**/*.spec.mjs"）。
