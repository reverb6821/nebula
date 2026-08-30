<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore, type FontSize, type FontFamily, type LineHeight } from '@/modules/settings/store'
import { SharedSwitch } from '@/components/shared'
import SettingsSection from '@/modules/settings/components/SettingsSection.vue'
import SettingsRow from '@/modules/settings/components/SettingsRow.vue'
import SettingsButtonGroup from '@/modules/settings/components/SettingsButtonGroup.vue'

const { t } = useI18n()
const settings = useSettingsStore()
const s = computed(() => settings.state)

// Prima queste tre erano const calcolate una sola volta al setup con
// t() già "congelato": cambiando lingua a runtime le etichette restavano
// quelle del primo render (stesso bug corretto in DockerToolbar.vue).
// Un computed() richiama t() ogni volta che locale cambia.
const fontSizeOptions = computed<{ value: FontSize; label: string }[]>(() => [
  { value: 'sm',   label: t('settings.fontSizeSmall')   },
  { value: 'base', label: t('settings.fontSizeDefault') },
  { value: 'lg',   label: t('settings.fontSizeLarge')   },
  { value: 'xl',   label: t('settings.fontSizeXL')      },
])

const fontFamilyOptions = computed<{ value: FontFamily; label: string; previewFont?: string }[]>(() => [
  { value: 'system',   label: t('settings.fontDefault'),  previewFont: 'system-ui' },
  { value: 'inter',    label: t('settings.fontSans'),     previewFont: 'Inter' },
  { value: 'mono',     label: t('settings.fontMono'),     previewFont: 'monospace' },
  { value: 'dyslexic', label: t('settings.fontDyslexic'), previewFont: 'system-ui' },
])

const lineHeightOptions = computed<{ value: LineHeight; label: string }[]>(() => [
  { value: 'normal',  label: t('settings.lineHeightNormal')  },
  { value: 'relaxed', label: t('settings.lineHeightRelaxed') },
  { value: 'loose',   label: t('settings.lineHeightLoose')   },
])
</script>

<template>
  <SettingsSection :title="t('settings.sectionAppearance')">

    <!-- Font size -->
    <SettingsRow :label="t('settings.fontSize')">
      <template #default="{ labelId }">
        <SettingsButtonGroup
          :options="fontSizeOptions"
          :model-value="s.fontSize"
          :aria-labelledby="labelId"
          @update:model-value="settings.set('fontSize', $event)"
        />
      </template>
    </SettingsRow>

    <!-- Font family -->
    <SettingsRow :label="t('settings.fontFamily')">
      <template #default="{ labelId }">
        <SettingsButtonGroup
          :options="fontFamilyOptions"
          :model-value="s.fontFamily"
          :aria-labelledby="labelId"
          vertical
          @update:model-value="settings.set('fontFamily', $event)"
        >
          <!-- Slot per mostrare ogni font nel suo stile -->
          <template #default="{ option }">
            <span :style="`font-family: ${option.previewFont}`">
              {{ option.label }}
            </span>
            <span class="ml-2 text-[10px] opacity-50">Aa</span>
          </template>
        </SettingsButtonGroup>
      </template>
    </SettingsRow>

    <!-- Line height -->
    <SettingsRow :label="t('settings.lineHeight')">
      <template #default="{ labelId }">
        <SettingsButtonGroup
          :options="lineHeightOptions"
          :model-value="s.lineHeight"
          :aria-labelledby="labelId"
          @update:model-value="settings.set('lineHeight', $event)"
        />
      </template>
    </SettingsRow>

    <!-- Reduced motion -->
    <SettingsRow
      :label="t('settings.reducedMotion')"
      :hint="t('settings.reducedMotionHint')"
    >
      <template #default="{ labelId }">
        <SharedSwitch
          :model-value="s.reducedMotion"
          :aria-labelledby="labelId"
          @update:model-value="settings.set('reducedMotion', $event)"
        />
      </template>
    </SettingsRow>

    <!-- High contrast -->
    <SettingsRow
      :label="t('settings.highContrast')"
      :hint="t('settings.highContrastHint')"
    >
      <template #default="{ labelId }">
        <SharedSwitch
          :model-value="s.highContrast"
          :aria-labelledby="labelId"
          @update:model-value="settings.set('highContrast', $event)"
        />
      </template>
    </SettingsRow>

  </SettingsSection>
</template>