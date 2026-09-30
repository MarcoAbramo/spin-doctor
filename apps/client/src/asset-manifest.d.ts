declare module 'virtual:asset-manifest' {
  /** Paths below `public/assets` that exist in this build, e.g. `sprites/player.png`. */
  const files: ReadonlySet<string>
  export default files
}
