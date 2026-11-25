<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Layers, Trash2 } from '@lucide/vue'
import type { DockerContainer, DockerImage } from '@/types/docker'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatImageDate, formatImageSize, splitRepoTag } from '../utils/format'

// Riga immagine (classe .irow del design). Delete disabilitato se usata.
const props = defineProps<{
  image: DockerImage
  usedBy: DockerContainer[]
  pending: boolean
}>()

const emit = defineEmits<{ delete: [] }>()

const { t } = useI18n()

const ref = computed(() => splitRepoTag(props.image.repoTags[0]))
const shortId = computed(() => props.image.id.replace(/^sha256:/, '').slice(0, 12))
const inUse = computed(() => props.usedBy.length > 0)
const firstUser = computed(() => props.usedBy[0]?.name ?? '')
</script>

<template lang="pug">
div(class="flex min-h-16 flex-wrap items-center gap-4 py-3 pr-3 pl-5")
  span(class="inline-flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-white/7" aria-hidden="true")
    Layers(class="size-[18px]")
  div(class="flex min-w-0 flex-[1_1_260px] flex-col gap-[3px]")
    span(class="flex flex-wrap items-center gap-2")
      span(class="font-mono font-semibold break-all")
        | {{ ref.repo }}
        span(class="text-primary-text") :{{ ref.tag }}
      span(
        v-if="inUse"
        class="rounded-[6px] bg-white/7 px-2 py-0.5 text-xs font-semibold text-group-foreground"
      ) {{ t('docker.inUseBy', { name: firstUser }) }}
    span(class="font-mono text-xs text-muted-foreground") {{ shortId }} · {{ t('docker.createdOn', { date: formatImageDate(image.created) }) }}
  span(class="min-w-20 text-right font-mono font-semibold") {{ formatImageSize(image.size) }}
  Tooltip(v-if="inUse")
    TooltipTrigger(as-child)
      span(tabindex="0" class="inline-flex")
        Button(
          variant="ghost"
          size="icon"
          disabled
          :aria-label="t('docker.deleteImage', { name: image.repoTags[0] ?? shortId })"
        )
          Trash2(class="size-4" aria-hidden="true")
    TooltipContent {{ t('docker.imageInUseHint') }}
  Button(
    v-else
    variant="ghost"
    size="icon"
    class="text-destructive-text hover:text-destructive-text"
    :disabled="pending"
    :aria-label="t('docker.deleteImage', { name: image.repoTags[0] ?? shortId })"
    @click="emit('delete')"
  )
    Trash2(class="size-4" aria-hidden="true")
</template>
