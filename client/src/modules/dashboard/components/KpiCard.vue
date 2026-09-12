<script setup lang="ts">
import type { Component } from 'vue'
import type { Severity } from '../utils/severity'

// Prima: `accent` era una classe Tailwind grezza passata dal chiamante
// (stesso problema visto altrove nell'app — colori hardcoded scelti
// fuori dal componente). Ora KpiCard riceve solo il dato semantico
// (severity) e decide da sé come colorarsi: un solo posto sa come si
// presenta una KPI "in allerta".
withDefaults(defineProps<{
  icon: Component
  label: string
  value: string
  sub?: string
  /**
   * Omesso = metrica senza soglia di allerta (es. throughput di rete):
   * card neutra, nessun pallino. Passalo solo per metriche con un
   * significato "va bene / attenzione / critico" (CPU, RAM, disco).
   */
  severity?: Severity
}>(), {
  severity: undefined,
})

const DOT_CLASS: Record<Severity, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

// Il numero resta neutro (text-foreground) quando va tutto bene: il
// colore è riservato a quando c'è davvero qualcosa da notare. Prima
// era colorato sempre, anche per valori del tutto normali — risultato
// "tutto verde", rumore visivo invece di un segnale.
const NUMBER_CLASS: Record<Severity, string> = {
  success: 'text-foreground',
  warning: 'text-warning',
  destructive: 'text-destructive',
}
</script>

<template lang="pug">
div(class="rounded-lg border border-border bg-card p-3")
  div(class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground")
    component(:is="icon" class="h-3 w-3 shrink-0" aria-hidden="true")
    span(class="truncate") {{ label }}
    //-
      Pallino di stato: indicatore costante, sempre presente (anche
      quando tutto va bene), ma piccolo — non compete visivamente col
      numero come faceva prima colorare l'intero valore.
    span(
      v-if="severity"
      class="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
      :class="DOT_CLASS[severity]"
      aria-hidden="true"
    )
  div(class="mt-1 font-mono text-xl" :class="severity ? NUMBER_CLASS[severity] : 'text-foreground'") {{ value }}
  div(v-if="sub" class="text-[10px] text-muted-foreground/70") {{ sub }}
</template>