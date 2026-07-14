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

const fontSizeOptions: { value: FontSize; label: string }[] = [
  { value: 'sm',   label: t('settings.fontSizeSmall')   },
  { value: 'base', label: t('settings.fontSizeDefault') },
  { value: 'lg',   label: t('settings.fontSizeLarge')   },
  { value: 'xl',   label: t('settings.fontSizeXL')      },
]

const fontFamilyOptions: { value: FontFamily; label: string; previewFont?: string }[] = [
  { value: 'system',   label: t('settings.fontDefault'),  previewFont: 'system-ui'      },
  { value: 'inter',    label: t('settings.fontSans'),     previewFont: 'Inter'          },
  { value: 'mono',     label: t('settings.fontMono'),     previewFont: 'monospace'      },
  { value: 'dyslexic', label: t('settings.fontDyslexic'), previewFont: 'system-ui'      },
]

const lineHeightOptions: { value: LineHeight; label: string }[] = [
  { value: 'normal',  label: t('settings.lineHeightNormal')  },
  { value: 'relaxed', label: t('settings.lineHeightRelaxed') },
  { value: 'loose',   label: t('settings.lineHeightLoose')   },
]
</script>

<template>
  <SettingsSection :title="t('settings.sectionAppearance')">

    <!-- Font size -->
    <SettingsRow :label="t('settings.fontSize')">
      <SettingsButtonGroup
        :options="fontSizeOptions"
        :model-value="s.fontSize"
        @update:model-value="settings.set('fontSize', $event)"
      />
    </SettingsRow>

    <!-- Font family -->
    <SettingsRow :label="t('settings.fontFamily')">
      <SettingsButtonGroup
        :options="fontFamilyOptions"
        :model-value="s.fontFamily"
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
    </SettingsRow>

    <!-- Line height -->
    <SettingsRow :label="t('settings.lineHeight')">
      <SettingsButtonGroup
        :options="lineHeightOptions"
        :model-value="s.lineHeight"
        @update:model-value="settings.set('lineHeight', $event)"
      />
    </SettingsRow>

    <!-- Reduced motion -->
    <SettingsRow
      :label="t('settings.reducedMotion')"
      :hint="t('settings.reducedMotionHint')"
    >
      <SharedSwitch
        :model-value="s.reducedMotion"
        @update:model-value="settings.set('reducedMotion', $event)"
      />
    </SettingsRow>

    <!-- High contrast -->
    <SettingsRow
      :label="t('settings.highContrast')"
      :hint="t('settings.highContrastHint')"
    >
      <SharedSwitch
        :model-value="s.highContrast"
        @update:model-value="settings.set('highContrast', $event)"
      />
    </SettingsRow>

  </SettingsSection>
</template>