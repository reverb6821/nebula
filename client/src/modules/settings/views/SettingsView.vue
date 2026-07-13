<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useSettingsStore,
  type FontSize,
  type FontFamily,
  type LineHeight
} from '@/modules/settings/store'
import {
  availableLocales,
  setLocale,
  type LocaleCode
} from '@/i18n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SharedSwitch } from '@/components/shared'
import { Separator } from '@/components/ui/separator'

const { t, locale } = useI18n()
const settings = useSettingsStore()
const s = computed(() => settings.state)

// ─── Language ────────────────────────────────────────────────────────────────

function onLocaleChange(code: string) {
  setLocale(code as LocaleCode)
}

// ─── Font size options ───────────────────────────────────────────────────────

const fontSizeOptions: { value: FontSize; labelKey: string }[] = [
  { value: 'sm',   labelKey: 'settings.fontSizeSmall'   },
  { value: 'base', labelKey: 'settings.fontSizeDefault' },
  { value: 'lg',   labelKey: 'settings.fontSizeLarge'   },
  { value: 'xl',   labelKey: 'settings.fontSizeXL'      },
]

// ─── Font family options ─────────────────────────────────────────────────────

const fontFamilyOptions: { value: FontFamily; labelKey: string }[] = [
  { value: 'system',   labelKey: 'settings.fontDefault'  },
  { value: 'inter',    labelKey: 'settings.fontSans'     },
  { value: 'mono',     labelKey: 'settings.fontMono'     },
  { value: 'dyslexic', labelKey: 'settings.fontDyslexic' },
]

// ─── Line height options ─────────────────────────────────────────────────────

const lineHeightOptions: { value: LineHeight; labelKey: string }[] = [
  { value: 'normal',  labelKey: 'settings.lineHeightNormal'  },
  { value: 'relaxed', labelKey: 'settings.lineHeightRelaxed' },
  { value: 'loose',   labelKey: 'settings.lineHeightLoose'   },
]
</script>

<template>
  <div class="flex h-full flex-col overflow-y-auto">
    <div class="mx-auto w-full max-w-2xl space-y-8 p-6">

      <!-- Header -->
      <div>
        <h1 class="text-lg font-semibold text-zinc-100">{{ t('settings.title') }}</h1>
        <p class="mt-0.5 text-sm text-zinc-500">{{ t('settings.subtitle') }}</p>
      </div>

      <!-- ── LANGUAGE ──────────────────────────────────────────────────────── -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-600">
            {{ t('settings.sectionLanguage') }}
          </h2>
          <Separator class="mt-2 bg-zinc-800" />
        </div>

        <div class="flex items-center justify-between gap-8">
          <div>
            <p class="text-sm font-medium text-zinc-200">{{ t('settings.language') }}</p>
            <p class="text-xs text-zinc-500">{{ t('settings.languageHint') }}</p>
          </div>
          <Select :model-value="locale" @update:model-value="onLocaleChange">
            <SelectTrigger class="w-52 border-zinc-700 bg-zinc-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="border-zinc-800 bg-zinc-900">
              <SelectItem
                v-for="loc in availableLocales"
                :key="loc.code"
                :value="loc.code"
                class="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                {{ loc.flag }} {{ loc.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <!-- ── APPEARANCE ────────────────────────────────────────────────────── -->
      <section class="space-y-6">
        <div>
          <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-600">
            {{ t('settings.sectionAppearance') }}
          </h2>
          <Separator class="mt-2 bg-zinc-800" />
        </div>

        <!-- Font size -->
        <div class="flex items-center justify-between gap-8">
          <div>
            <p class="text-sm font-medium text-zinc-200">{{ t('settings.fontSize') }}</p>
          </div>
          <div class="flex gap-1.5">
            <button
              v-for="opt in fontSizeOptions"
              :key="opt.value"
              :class="[
                'rounded-md border px-3 py-1.5 text-xs transition-colors',
                s.fontSize === opt.value
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
              ]"
              @click="settings.set('fontSize', opt.value)"
            >
              {{ t(opt.labelKey) }}
            </button>
          </div>
        </div>

        <!-- Font family -->
        <div class="flex items-start justify-between gap-8">
          <div>
            <p class="text-sm font-medium text-zinc-200">{{ t('settings.fontFamily') }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <button
              v-for="opt in fontFamilyOptions"
              :key="opt.value"
              :class="[
                'rounded-md border px-3 py-2 text-left text-xs transition-colors',
                s.fontFamily === opt.value
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
              ]"
              @click="settings.set('fontFamily', opt.value)"
            >
              <span :style="opt.value === 'dyslexic' ? 'font-family: system-ui' : ''">
                {{ t(opt.labelKey) }}
              </span>
            </button>
          </div>
        </div>

        <!-- Line height -->
        <div class="flex items-center justify-between gap-8">
          <div>
            <p class="text-sm font-medium text-zinc-200">{{ t('settings.lineHeight') }}</p>
          </div>
          <div class="flex gap-1.5">
            <button
              v-for="opt in lineHeightOptions"
              :key="opt.value"
              :class="[
                'rounded-md border px-3 py-1.5 text-xs transition-colors',
                s.lineHeight === opt.value
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
              ]"
              @click="settings.set('lineHeight', opt.value)"
            >
              {{ t(opt.labelKey) }}
            </button>
          </div>
        </div>

        <!-- Reduced motion -->
        <div class="flex items-center justify-between gap-8">
          <div>
            <p class="text-sm font-medium text-zinc-200">{{ t('settings.reducedMotion') }}</p>
            <p class="text-xs text-zinc-500">{{ t('settings.reducedMotionHint') }}</p>
          </div>
          <SharedSwitch
            :model-value="s.reducedMotion"
            @update:model-value="settings.set('reducedMotion', $event)"
          />
        </div>

        <!-- High contrast -->
        <div class="flex items-center justify-between gap-8">
          <div>
            <p class="text-sm font-medium text-zinc-200">{{ t('settings.highContrast') }}</p>
            <p class="text-xs text-zinc-500">{{ t('settings.highContrastHint') }}</p>
          </div>
          <SharedSwitch
            :model-value="s.highContrast"
            @update:model-value="settings.set('highContrast', $event)"
          />
        </div>

      </section>

      <!-- Reset -->
      <div class="flex justify-end pt-2">
        <button
          class="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          @click="settings.reset()"
        >
          {{ t('common.reset') }} to defaults
        </button>
      </div>

    </div>
  </div>
</template>