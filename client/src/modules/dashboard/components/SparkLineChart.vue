<script setup lang="ts">
import { computed } from 'vue'

export interface ChartSeries {
  id: string | number
  color: string
  values: number[]
}

const props = withDefaults(defineProps<{
  series: ChartSeries[]
  max: number
  height?: number
  windowSeconds?: number
  xLabelStep?: number
  formatY?: (v: number) => string
}>(), {
  height: 90,
  windowSeconds: 60,
  xLabelStep: 10,
  formatY: (v: number) => String(Math.round(v)),
})

const WIDTH = 700

function pointsFor(values: number[]): string {
  const n = props.windowSeconds
  const start = Math.max(0, n - values.length)
  return values
    .map((v, i) => {
      const x = ((start + i) / Math.max(1, n - 1)) * WIDTH
      const y = props.height - Math.min(1, Math.max(0, v / props.max)) * props.height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function formatXLabel(secondsAgo: number): string {
  if (secondsAgo >= 60 && secondsAgo % 60 === 0) return `${secondsAgo / 60} min`
  return `${secondsAgo} sec`
}

const xLabels = computed(() => {
  const labels: string[] = []
  for (let s = props.windowSeconds; s >= props.xLabelStep; s -= props.xLabelStep) {
    labels.push(formatXLabel(s))
  }
  return labels
})

const gridLines = [0, 0.5, 1]
</script>

<template>
  <div>
    <div class="relative" :style="{ height: `${height}px` }">
      <svg :viewBox="`0 0 ${WIDTH} ${height}`" preserveAspectRatio="none" class="h-full w-full">
        <line
          v-for="g in gridLines"
          :key="g"
          x1="0"
          :y1="g * height"
          :x2="WIDTH"
          :y2="g * height"
          stroke="#3f3f46"
          stroke-width="1"
        />
        <polyline
          v-for="s in series"
          :key="s.id"
          :points="pointsFor(s.values)"
          fill="none"
          :stroke="s.color"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      <div class="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-between py-0.5 text-[10px] text-zinc-600">
        <span>{{ formatY(max) }}</span>
        <span>{{ formatY(max / 2) }}</span>
        <span>{{ formatY(0) }}</span>
      </div>
    </div>

    <div class="mt-1 flex justify-between text-[10px] text-zinc-600">
      <span v-for="label in xLabels" :key="label">{{ label }}</span>
    </div>
  </div>
</template>