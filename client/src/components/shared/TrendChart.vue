<script setup lang="ts">
import { computed } from 'vue'

// Grafico SVG semplice (linea o area) come nel design: viewBox fisso,
// preserveAspectRatio none, stroke non scalato. Nessuna animazione.
export interface TrendSeries {
  id: string
  values: number[]
  color: string
  area?: boolean
  dashed?: boolean
  fillOpacity?: number
  fill?: string
}

const props = withDefaults(defineProps<{
  series: TrendSeries[]
  max: number
  height: number
  points?: number
  width?: number
  label?: string
  grid?: number
}>(), { width: 600, grid: 0 })

function path(values: number[], area: boolean): string {
  const n = props.points ?? values.length
  if (values.length === 0 || n < 2) return ''
  const offset = Math.max(0, n - values.length)
  const max = props.max > 0 ? props.max : 1
  const line = values
    .map((v, i) => {
      const x = ((offset + i) * props.width) / (n - 1)
      const y = props.height - (Math.min(Math.max(v, 0), max) / max) * props.height
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  if (!area) return line
  const startX = ((offset * props.width) / (n - 1)).toFixed(1)
  return `${line} L${props.width} ${props.height} L${startX} ${props.height} Z`
}

const paths = computed(() => props.series.map((s) => ({
  ...s,
  linePath: path(s.values, false),
  areaPath: s.area ? path(s.values, true) : '',
})))

const gridStyle = computed(() => props.grid > 0
  ? {
      backgroundImage: 'linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px)',
      backgroundSize: `100% ${props.height / props.grid}px`,
    }
  : undefined)
</script>

<template lang="pug">
div(:style="gridStyle")
  svg(
    width="100%"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    class="block"
  )
    template(v-for="s in paths" :key="s.id")
      path(
        v-if="s.area && s.areaPath"
        :d="s.areaPath"
        :fill="s.fill ?? s.color"
        :fill-opacity="s.fillOpacity ?? 0.25"
      )
      path(
        :d="s.linePath"
        fill="none"
        :stroke="s.color"
        stroke-width="2"
        :stroke-dasharray="s.dashed ? '5 4' : undefined"
        vector-effect="non-scaling-stroke"
      )
</template>
