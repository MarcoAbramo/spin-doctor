import files from 'virtual:asset-manifest'

/**
 * Whether an optional asset file exists (see docs/ASSET_GUIDE.md). The list is built
 * from `public/assets` at build time, so missing art falls back to placeholders
 * without a single network request.
 */
export function hasAsset(path: string): boolean {
  return files.has(path)
}
