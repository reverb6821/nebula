<script setup lang="ts">
import { onMounted } from 'vue'
// Importa il namespace filesystem da @neutralinojs/lib
import { filesystem } from "@neutralinojs/lib"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

// Questo codice viene eseguito automaticamente quando il componente viene montato
onMounted(() => {
  filesystem.readDirectory('./')
    .then((data) => {
      // Se vedi la lista dei file nella console dei devtools, funziona tutto!
      console.log("File trovati:", data)
    })
    .catch((err) => {
      console.error("Errore di lettura:", err)
    })
})
</script>

<template>
   <Card class="border border-md bg-red-300">
    <CardHeader>
      <CardTitle>{{t("demo.title")}}</CardTitle>
      <CardDescription>{{t("demo.subtitle")}}</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Card Content</p>
    </CardContent>
    <CardFooter>
      <p>Card Footer</p>
    </CardFooter>
  </Card>
</template>

<style scoped></style>
