import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { Plugin } from 'vite'

const ID = 'virtual:asset-manifest'
const RESOLVED = `\0${ID}`

function list(dir: string, root = dir): string[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  const out: string[] = []
  for (const name of names) {
    if (name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...list(path, root))
    else out.push(relative(root, path).split(sep).join('/'))
  }
  return out.sort()
}

/**
 * `virtual:asset-manifest` lists every file under `public/assets` at build time, so the
 * client knows which optional art exists without probing the server (ADR 0004). In dev
 * the list is rebuilt and the page reloaded whenever a file is added or removed.
 */
export function assetManifest(assetsDir: string): Plugin {
  return {
    name: 'spin-doctor:asset-manifest',
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load(id) {
      if (id !== RESOLVED) return
      return `export default new Set(${JSON.stringify(list(assetsDir))})`
    },
    configureServer(server) {
      server.watcher.add(assetsDir)
      const refresh = (file: string) => {
        if (!file.startsWith(assetsDir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}
