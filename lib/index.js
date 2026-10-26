/**
 * dsh-active-workspace-top — Host half.
 *
 * DSH already broadcasts one event per user-authored durable message
 * ('api-session/activity'). This plugin uses it to move the workspace that
 * owns the addressed Session to the front of the durable workspace order —
 * the same registry order the sidebar drag writes — so the order persists and
 * every connected client sees it. Nothing here touches the browser bundle,
 * the sidebar's own ordering, or Session order.
 *
 * @module dsh-active-workspace-top
 */
import { createPromoter } from './promote.js'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-active-workspace-top'

/** Wait for the durable registry the promotion writes to. */
export const inject = ['workspaceRegistry']

/**
 * Promote the workspace that owns a Session whenever that Session appends a
 * user-authored message.
 * @param {object} ctx - Cordis Host context.
 */
export function apply(ctx) {
  const report = (error) => {
    const message = 'active-workspace-top: promotion failed: ' + String(error)
    if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(message)
    else console.warn(message)
  }
  const promoter = createPromoter(ctx.workspaceRegistry, report)
  // The event carries no cancelable work; failures surface through the report.
  ctx.on('api-session/activity', (sessionId) => { void promoter(sessionId) })
}
