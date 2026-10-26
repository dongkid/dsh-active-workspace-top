# 依赖的 DSH 官方接口

本插件是纯宿主插件，只使用下面这些官方契约；没有自定义协议，也没有浏览器端代码。

基线：DSH 0.2.1-rc.2（Web profile）。

| 依赖 | 用途 | 升级时检查 |
| --- | --- | --- |
| Host 事件 api-session/activity | 「一条用户创作的持久消息推进了会话列表活动」。签名 (sessionId, updatedAt)；触发点是 session/event 里的 user/message 且 source.kind 为 user。 | 事件仍存在、名字与参数不变；仍只对用户消息触发，不会被模型回复或后台任务触发。 |
| Host 服务 workspaceRegistry.list() | 按持久顺序返回 Workspace[]，每个含 id、path、title、sessionIds；sessionIds 是按 canonical cwd 过滤后的成员。 | 仍然同步可用；返回顺序仍是侧栏显示顺序；sessionIds 的成员语义不变。 |
| Host 服务 workspaceRegistry.insertBefore(id, beforeId?) | 把工作区移到 beforeId 之前；省略 beforeId 是追加到末尾（不能用来置顶）。 | 方法名、参数、DOM-insertBefore 语义与持久化行为不变。 |
| 工作区顺序的消费者 | 官方侧栏在「按工作区」分组下直接按注册表顺序渲染；「按工作区树」先按层级、再按同级顺序。 | 侧栏没有换数据源（例如改成浏览器本地顺序或独立排序模式），否则插件改的顺序可能不再被显示。 |
| Cordis 插件契约 | export function apply(ctx)、export const inject、ctx.on；Loader bundle patch（dsh.bundle.patch、manifestVersion: 1）。 | Loader 仍接受该 patch 形状；Host-only 插件仍可挂载；事件监听仍随插件卸载一起释放。 |
| 官方同类功能 | 本插件成立的假设是官方没有「工作区按最近使用/活动自动排序」或「工作区置顶」。 | 若官方已内置，先停用或卸载本插件再评估，避免两套排序互相覆盖。 |

## 重新验证

1. 单元测试：node --test "tests/**/*.spec.mjs"。
2. 装进 profile 后，在一个**不是第一位**的工作区的会话里发一条用户消息，确认该工作区跳到第一位。
3. 也可以直接读 ~/.dsh/storages/workspace.json 的 global.workspaceIds，看顺序是否变化（宿主在内存里更新后持久化）。
4. 停用插件行，再发一条消息，确认顺序不再变化。
