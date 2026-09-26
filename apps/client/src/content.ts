import { type Content, loadContent } from '@spin-doctor/shared'
import de from '../../../packages/shared/locales/de.json'

// Every JSON under packages/shared/content is a content pack — adding a file is enough.
const modules = import.meta.glob<unknown>('../../../packages/shared/content/**/*.json', {
  eager: true,
  import: 'default',
})

export const content: Content = loadContent(
  Object.entries(modules).map(([path, data]) => ({
    source: path.replace(/^.*\/content\//, ''),
    data,
  })),
)

export const baseTexts: Record<string, string> = de
