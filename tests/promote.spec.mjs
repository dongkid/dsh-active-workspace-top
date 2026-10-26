import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPromoter } from '../lib/promote.js'

/**
 * Minimal in-memory stand-in for workspaceRegistry.
 * @param {{ id: string, sessionIds: string[] }[]} initial - initial durable order.
 * @param {{ failFirst?: boolean }} options - make the first write reject.
 */
function fakeRegistry(initial, options = {}) {
  let workspaces = initial.map(item => ({ ...item, sessionIds: [...item.sessionIds] }))
  let failNext = options.failFirst === true
  const writes = []
  return {
    writes,
    list: () => workspaces,
    async insertBefore(id, beforeId) {
      writes.push([id, beforeId])
      if (failNext) {
        failNext = false
        throw new Error('registry write failed')
      }
      const moved = workspaces.find(item => item.id === id)
      if (moved === undefined) throw new Error('unknown workspace ' + id)
      const without = workspaces.filter(item => item !== moved)
      const at = without.findIndex(item => item.id === beforeId)
      if (at < 0) throw new Error('unknown anchor ' + beforeId)
      without.splice(at, 0, moved)
      workspaces = without
    },
  }
}

test('a promotion moves the owning workspace first', async () => {
  const registry = fakeRegistry([{ id: 'a', sessionIds: ['s1'] }, { id: 'b', sessionIds: ['s2'] }])
  const promote = createPromoter(registry, () => {})
  await promote('s2')
  assert.deepEqual(registry.list().map(item => item.id), ['b', 'a'])
  assert.deepEqual(registry.writes, [['b', 'a']])
})

test('a burst is serialized and leaves the last-messaged workspace first', async () => {
  const registry = fakeRegistry([
    { id: 'a', sessionIds: ['s1'] },
    { id: 'b', sessionIds: ['s2'] },
    { id: 'c', sessionIds: ['s3'] },
  ])
  const promote = createPromoter(registry, () => {})
  await Promise.all([promote('s2'), promote('s3'), promote('s2')])
  assert.deepEqual(registry.list().map(item => item.id), ['b', 'c', 'a'])
})

test('an unaccounted Session writes nothing', async () => {
  const registry = fakeRegistry([{ id: 'a', sessionIds: ['s1'] }])
  const promote = createPromoter(registry, () => {})
  await promote('s9')
  assert.deepEqual(registry.writes, [])
})

test('a rejected write is reported and does not block the next promotion', async () => {
  const registry = fakeRegistry([{ id: 'a', sessionIds: ['s1'] }, { id: 'b', sessionIds: ['s2'] }], { failFirst: true })
  const errors = []
  const promote = createPromoter(registry, error => { errors.push(error) })
  await promote('s2')
  assert.equal(errors.length, 1)
  assert.deepEqual(registry.list().map(item => item.id), ['a', 'b'])
  await promote('s2')
  assert.deepEqual(registry.list().map(item => item.id), ['b', 'a'])
  assert.equal(errors.length, 1)
})
