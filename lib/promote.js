/**
 * Serialized promoter: one registry write at a time, each task re-reads the
 * current order, so a burst of messages leaves the last-messaged workspace
 * first even when writes complete out of order.
 *
 * @typedef {{ readonly id: string, readonly sessionIds: readonly string[] }} WorkspaceLike
 * @typedef {{
 *   list: () => readonly WorkspaceLike[],
 *   insertBefore: (id: string, beforeId?: string) => Promise<unknown>,
 * }} WorkspaceRegistryLike
 * @module dsh-active-workspace-top/promote
 */
import { promotionPlan } from './rules.js'

/**
 * Create the promoter shared by one plugin instance.
 * @param {WorkspaceRegistryLike} registry - durable workspace registry.
 * @param {(error: unknown) => void} report - failure sink; a failed promotion never blocks later ones.
 * @returns {(sessionId: string) => Promise<void>} serialized promotion.
 */
export function createPromoter(registry, report) {
  /** @type {Promise<void>} */
  let tail = Promise.resolve()
  return (sessionId) => {
    tail = tail.then(async () => {
      const plan = promotionPlan(registry.list(), sessionId)
      if (plan !== undefined) await registry.insertBefore(plan.workspaceId, plan.beforeWorkspaceId)
    }).catch((error) => { report(error) })
    return tail
  }
}
