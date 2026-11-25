import type { DockerContainer, DockerImage } from '@/types/docker'

// Spostate qui da ImageItem.vue (rimosso nel redesign) per riusarle in
// lista immagini e stat card.
export function formatImageSize(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function formatImageDate(unixSeconds: number): string {
  if (!unixSeconds) return '–'
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function splitRepoTag(repoTag: string | undefined): { repo: string; tag: string } {
  if (!repoTag || repoTag === '<none>:<none>') return { repo: '<none>', tag: 'none' }
  const index = repoTag.lastIndexOf(':')
  // I due punti di una porta di registry (host:5000/img) non sono un tag
  if (index === -1 || repoTag.slice(index).includes('/')) return { repo: repoTag, tag: 'latest' }
  return { repo: repoTag.slice(0, index), tag: repoTag.slice(index + 1) }
}

// Container che usano l'immagine: confronto su repo:tag (con :latest
// implicito) e sull'ID abbreviato, come lo riporta `docker ps`.
export function containersUsingImage(image: DockerImage, containers: DockerContainer[]): DockerContainer[] {
  const tags = new Set(image.repoTags.flatMap((tag) => [tag, tag.endsWith(':latest') ? tag.slice(0, -':latest'.length) : tag]))
  const shortId = image.id.replace(/^sha256:/, '').slice(0, 12)
  return containers.filter((c) => tags.has(c.image) || (shortId.length > 0 && c.image.replace(/^sha256:/, '').startsWith(shortId)))
}
