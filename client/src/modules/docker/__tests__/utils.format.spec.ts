import { describe, expect, it } from 'vitest'
import { containersUsingImage, formatImageSize, splitRepoTag } from '../utils/format'
import type { DockerContainer, DockerImage } from '@/types/docker'

function container(image: string): DockerContainer {
  return { id: image, shortId: image, name: image, image, status: 'running', state: '', ports: [], created: 0 }
}

describe('docker format utils', () => {
  it('splitRepoTag separa repository e tag', () => {
    expect(splitRepoTag('postgres:17')).toEqual({ repo: 'postgres', tag: '17' })
    expect(splitRepoTag('ghcr.io/open-webui/open-webui:main')).toEqual({ repo: 'ghcr.io/open-webui/open-webui', tag: 'main' })
  })

  it('splitRepoTag non scambia la porta del registry per un tag', () => {
    expect(splitRepoTag('localhost:5000/app')).toEqual({ repo: 'localhost:5000/app', tag: 'latest' })
  })

  it('splitRepoTag gestisce le immagini senza tag', () => {
    expect(splitRepoTag(undefined)).toEqual({ repo: '<none>', tag: 'none' })
    expect(splitRepoTag('<none>:<none>')).toEqual({ repo: '<none>', tag: 'none' })
  })

  it('formatImageSize sceglie l\'unita\' corretta', () => {
    expect(formatImageSize(512 * 1024)).toBe('512 KB')
    expect(formatImageSize(2.5 * 1024 ** 2)).toBe('2.5 MB')
    expect(formatImageSize(3 * 1024 ** 3)).toBe('3.00 GB')
  })

  it('containersUsingImage trova i container per tag, tag latest implicito e ID', () => {
    const image: DockerImage = { id: 'sha256:abcdef1234567890', repoTags: ['hello-world:latest', 'postgres:17'], size: 1, created: 0 }
    const used = containersUsingImage(image, [container('hello-world'), container('postgres:17'), container('abcdef123456'), container('nginx')])
    expect(used.map((c) => c.image)).toEqual(['hello-world', 'postgres:17', 'abcdef123456'])
  })
})
