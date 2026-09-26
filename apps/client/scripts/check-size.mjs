// Fails when the initial JS (entry chunk + its static imports) exceeds the gzip budget.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const BUDGET = 300 * 1024
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const html = readFileSync(join(dist, 'index.html'), 'utf8')
const entries = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="\/?([^"]+\.js)"/g)].map(
  (m) => m[1],
)

const seen = new Set()
function walk(file) {
  if (seen.has(file)) return
  seen.add(file)
  const code = readFileSync(join(dist, file), 'utf8')
  // Static imports only — dynamic import() chunks (e.g. PixiJS) are lazy.
  for (const m of code.matchAll(
    /(?:^|[;\n}])\s*import\s*(?:[\w*{}\s,$]+from\s*)?["']\.\/([^"']+\.js)["']/g,
  )) {
    walk(join(file, '..', m[1]))
  }
}
entries.forEach(walk)

let total = 0
for (const file of seen) {
  const size = gzipSync(readFileSync(join(dist, file))).length
  total += size
  console.log(`${(size / 1024).toFixed(1).padStart(8)} kB  ${file}`)
}
console.log(
  `${(total / 1024).toFixed(1).padStart(8)} kB  initial JS (gzip), budget ${BUDGET / 1024} kB`,
)
if (total > BUDGET) {
  console.error('Initial bundle exceeds budget!')
  process.exit(1)
}
