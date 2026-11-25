import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// I token tipografici custom di main.css (--text-13, --text-kpi...) vanno
// dichiarati come font-size: altrimenti tailwind-merge li tratta come
// colori `text-*` e li scarta quando nella stessa lista c'e' un colore.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["3xs", "2xs", "13", "15", "stat", "kpi"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
