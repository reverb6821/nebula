<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useSettingsStore, type FontFamily } from '@/modules/settings/store'

// Righe radio con anteprima "Aa" nel font (gruppo Font del design).
const { t } = useI18n()
const settings = useSettingsStore()

const options = computed<{ value: FontFamily; label: string; hint: string; previewFont: string }[]>(() => [
  { value: 'system',   label: t('settings.fontDefault'),  hint: t('settings.fontDefaultHint'),  previewFont: 'var(--font-sans)' },
  { value: 'inter',    label: t('settings.fontSans'),     hint: t('settings.fontSansHint'),     previewFont: '"Inter Variable", Inter, sans-serif' },
  { value: 'mono',     label: t('settings.fontMono'),     hint: t('settings.fontMonoHint'),     previewFont: 'var(--font-mono)' },
])

const groupId = `settings-font-${Math.random().toString(36).slice(2, 9)}`

function onChange(value: unknown) {
  const match = options.value.find((option) => option.value === value)
  if (match) settings.set('fontFamily', match.value)
}
</script>

<template lang="pug">
section(:aria-labelledby="groupId" class="flex flex-col gap-2.5")
  h2(:id="groupId" class="pl-1 text-sm font-bold text-group-foreground") {{ t('settings.sectionFont') }}
  RadioGroup(
    :model-value="settings.state.fontFamily"
    :aria-labelledby="groupId"
    class="gap-0 overflow-hidden rounded-lg border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border"
    @update:model-value="onChange"
  )
    label(
      v-for="option in options"
      :key="option.value"
      :for="`${groupId}-${option.value}`"
      class="flex min-h-[60px] cursor-pointer items-center gap-4 px-4 py-3 hover:bg-white/3"
    )
      RadioGroupItem(
        :id="`${groupId}-${option.value}`"
        :value="option.value"
        class="size-[22px] border-2 border-white/25 bg-transparent data-[state=checked]:border-primary-text [&_svg]:size-2.5 [&_svg]:fill-primary-text [&_svg]:stroke-primary-text"
      )
      span(class="flex flex-1 flex-col gap-0.5")
        span(class="font-medium") {{ option.label }}
        span(class="text-13 text-muted-foreground") {{ option.hint }}
      span(class="text-xl text-group-foreground" :style="{ fontFamily: option.previewFont }" aria-hidden="true") Aa
</template>
