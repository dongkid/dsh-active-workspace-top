/**
 * Pure ordering decisions for the active-workspace-front rule. Kept free of
 * Cordis and DSH imports so unit tests can exercise them directly.
 *
 * @typedef {{ readonly id: string, readonly sessionIds: readonly string[] }} WorkspaceLike
 * @module dsh-active-workspace-top/rules
 */

/**
 * Find the workspace whose account owns one Session.
 * @param {readonly WorkspaceLike[]} workspaces - durable registry order.
 * @param {string} sessionId - Session that just received a user message.
 * @returns {WorkspaceLike | undefined} owning workspace, or undefined when the Session is unaccounted.
 */
export function workspaceOwning(workspaces, sessionId) {
  return workspaces.find(workspace => workspace.sessionIds.includes(sessionId))
}

/**
 * Decide the one insertion that puts the Session's workspace first.
 * @param {readonly WorkspaceLike[]} workspaces - durable registry order.
 * @param {string} sessionId - Session that just received a user message.
 * @returns {{ workspaceId: string, beforeWorkspaceId: string } | undefined} undefined when there is nothing to move.
 */
export function promotionPlan(workspaces, sessionId) {
  const first = workspaces[0]
  if (first === undefined) return undefined
  const owner = workspaceOwning(workspaces, sessionId)
  if (owner === undefined || owner.id === first.id) return undefined
  return { workspaceId: owner.id, beforeWorkspaceId: first.id }
}
