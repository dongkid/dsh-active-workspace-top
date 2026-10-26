import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply } from '../lib/index.js'

/**
 * Minimal Host context stand-in: listener capture plus the registry the plugin
 * injects. The real Cordis wiring is exercised in the live Host; this keeps the
 * apply-time contract (event name, one handler, promotion, failure report)
 * covered without a DSH dependency.
 */
function fakeContext(initial, options = {}) {
  let workspaces = initial.map(item => ({ ...item, sessionIds: [...item.sessionIds] }))
  let failNext = options.failFirst === true
  const writes = []
  const listeners = new Map()
  const warnings = []
  return {
    writes,
    listeners,
    warnings,
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
    ctx: {
      workspaceRegistry: undefined,
      logger: { warn: message => { warnings.push(message) } },
      on(name, listener) {
        listeners.set(name, listener)
        return () => { listeners.delete(name) }
      },
    },
  }
}

test('apply subscribes to the Host user-message event and promotes its workspace', async () => {
  const fixture = fakeContext([{ id: 'a', sessionIds: ['s1'] }, { id: 'b', sessionIds: ['s2'] }])
  fixture.ctx.workspaceRegistry = { list: fixture.list, insertBefore: fixture.insertBefore }
  apply(fixture.ctx)

  const listener = fixture.listeners.get('api-session/activity')
  assert.equal(typeof listener, 'function')
  listener('s2')
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.deepEqual(fixture.list().map(item => item.id), ['b', 'a'])
  assert.deepEqual(fixture.writes, [['b', 'a']])
})

test('a failed promotion is reported through the Host logger', async () => {
  const fixture = fakeContext([{ id: 'a', sessionIds: ['s1'] }, { id: 'b', sessionIds: ['s2'] }], { failFirst: true })
  fixture.ctx.workspaceRegistry = { list: fixture.list, insertBefore: fixture.insertBefore }
  apply(fixture.ctx)

  fixture.listeners.get('api-session/activity')('s2')
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(fixture.warnings.length, 1)
  assert.match(fixture.warnings[0], /active-workspace-top: promotion failed/)
  assert.deepEqual(fixture.list().map(item => item.id), ['a', 'b'])
})
