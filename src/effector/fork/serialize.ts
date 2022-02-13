import type {Scope, Store} from '../unit.h'
import {forIn, includes} from '../collection'
import {assert} from '../throw'
import {traverseStores} from './util'
import {getGraph, getMeta} from '../getter'

/**
 serialize state on server
 */
export function serialize(
  scope: Scope,
  config: {ignore?: Array<Store<any>>; onlyChanges?: boolean} = {},
) {
  if (scope.warnSerialize) {
    console.error("provided scope cannot be serialized in a reliable way because some stores are missing sid. Please, check that babel-plugin is working or provide sid manually");
  }
  const ignoredStores = config.ignore ? config.ignore.map(({sid}) => sid) : []
  const result = {} as Record<string, any>
  forIn(scope.sidValuesMap, (value, sid) => {
    if (includes(ignoredStores, sid)) return
    const id = scope.sidIdMap[sid]
    // if (!scope.changedStores.has(id)) return
    if (id && id in scope.reg) {
      result[sid] = scope.reg[id].current
    } else {
      result[sid] = value
    }
  })
  if ('onlyChanges' in config && !config.onlyChanges) {
    assert(scope.cloneOf, 'scope should be created from domain')
    traverseStores(getGraph(scope.cloneOf), (node, sid) => {
      if (
        !(sid in result) &&
        !includes(ignoredStores, sid) &&
        !getMeta(node, 'isCombine') &&
        getMeta(node, 'serialize') !== 'ignore'
      )
        result[sid] = scope.getState(node as any)
    })
  }
  return result
}
