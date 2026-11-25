<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { Check } from '@lucide/vue'
import { useSettingsStore, type AccentColor, type FontSize, type LineHeight } from '@/modules/settings/store'
import SettingsSection from '@/modules/settings/components/SettingsSection.vue'
import SettingsRow from '@/modules/settings/components/SettingsRow.vue'
import SettingsButtonGroup from '@/modules/settings/components/SettingsButtonGroup.vue'

const { t } = useI18n()
const settings = useSettingsStore()
const s = computed(() => settings.state)

// Colori dei campioni: stessi valori di --primary per ogni [data-accent].
const accentOptions = computed<{ value: AccentColor; label: string; color: string }[]>(() => [
  { value: 'blue',   label: t('settings.accentBlue'),   color: '#1c71d8' },
  { value: 'teal',   label: t('settings.accentTeal'),   color: '#2a7a6f' },
  { value: 'purple', label: t('settings.accentPurple'), color: '#813d9c' },
  { value: 'orange', label: t('settings.accentOrange'), color: '#c64600' },
  { value: 'slate',  label: t('settings.accentSlate'),  color: '#5e5c64' },
])

const fontSizeOptions = computed<{ value: FontSize; label: string }[]>(() => [
  { value: 'sm',   label: t('settings.fontSizeSmall')   },
  { value: 'base', label: t('settings.fontSizeDefault') },
  { value: 'lg',   label: t('settings.fontSizeLarge')   },
  { value: 'xl',   label: t('settings.fontSizeXL')      },
])

const lineHeightOptions = computed<{ value: LineHeight; label: string }[]>(() => [
  { value: 'normal',  label: t('settings.lineHeightNormal')  },
  { value: 'relaxed', label: t('settings.lineHeightRelaxed') },
  { value: 'loose',   label: t('settings.lineHeightLoose')   },
])

function onAccent(value: unknown) {
  const match = accentOptions.value.find((option) => option.value === value)
  if (match) settings.set('accent', match.value)
}
</script>

<template lang="pug">
SettingsSection(:title="t('settings.sectionAppearance')")
  SettingsRow(:label="t('settings.accentColor')" :hint="t('settings.accentColorHint')")
    template(#default="{ labelId }")
      RadioGroupRoot(
        :model-value="s.accent"
        :aria-labelledby="labelId"
        orientation="horizontal"
        class="flex gap-1"
        @update:model-value="onAccent"
      )
        RadioGroupItem(
          v-for="option in accentOptions"
          :key="option.value"
          :value="option.value"
          :aria-label="option.label"
          class="group inline-flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        )
          span(
            class="inline-flex size-7 items-center justify-center rounded-full group-data-[state=checked]:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--swatch)]"
            :style="{ background: option.color, '--swatch': option.color }"
          )
            Check(class="hidden size-3.5 text-white group-data-[state=checked]:block" :stroke-width="3" aria-hidden="true")

  SettingsRow(:label="t('settings.fontSize')")
    template(#default="{ labelId }")
      SettingsButtonGroup(
        :options="fontSizeOptions"
        :model-value="s.fontSize"
        :aria-labelledby="labelId"
        @update:model-value="settings.set('fontSize', $event)"
      )

  SettingsRow(:label="t('settings.lineHeight')")
    template(#default="{ labelId }")
      SettingsButtonGroup(
        :options="lineHeightOptions"
        :model-value="s.lineHeight"
        :aria-labelledby="labelId"
        @update:model-value="settings.set('lineHeight', $event)"
      )
</template>
