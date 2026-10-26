import { test } from 'node:test'
import assert from 'node:assert/strict'
import { workspaceOwning, promotionPlan } from '../lib/rules.js'

const workspace = (id, sessionIds) => ({ id, sessionIds })

test('workspaceOwning finds the workspace that accounts for a Session', () => {
  const workspaces = [workspace('a', ['s1']), workspace('b', ['s2', 's3'])]
  assert.equal(workspaceOwning(workspaces, 's3')?.id, 'b')
  assert.equal(workspaceOwning(workspaces, 's9'), undefined)
})

test('promotionPlan moves a non-first workspace before the current first', () => {
  const workspaces = [workspace('a', ['s1']), workspace('b', ['s2'])]
  assert.deepEqual(promotionPlan(workspaces, 's2'), { workspaceId: 'b', beforeWorkspaceId: 'a' })
})

test('promotionPlan is a no-op when the owning workspace is already first', () => {
  const workspaces = [workspace('a', ['s1']), workspace('b', ['s2'])]
  assert.equal(promotionPlan(workspaces, 's1'), undefined)
})

test('promotionPlan is a no-op for an empty registry or an unaccounted Session', () => {
  assert.equal(promotionPlan([], 's1'), undefined)
  assert.equal(promotionPlan([workspace('a', ['s1'])], 's9'), undefined)
})
