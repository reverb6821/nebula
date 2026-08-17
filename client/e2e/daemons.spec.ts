import { test, expect } from '@playwright/test'

test.describe('Flusso di Gestione Daemons', () => {
  
  test.beforeEach(async ({ page }) => {
    // Sostituisci con la rotta reale della tua applicazione
    await page.goto('/daemons') 
  })

  test('Dovrebbe cercare un daemon e mostrare lo stato vuoto se non trovato', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search daemons (3+ chars)…')
    
    // Scrittura parziale (< 3 caratteri): mostra il suggerimento
    await searchInput.fill('ng')
    await expect(page.getByText('Type 1 more character to search…')).toBeVisible()

    // Ricerca completa con testo inesistente
    await searchInput.fill('daemon-inesistente-xyz')
    await expect(page.getByText('No daemons match your search.')).toBeVisible()
    await expect(page.getByText('Try modifying or clearing your filters')).toBeVisible()

    // Resetta tramite la "X" sull'input di ricerca
    await page.locator('button:has(svg.lucide-x)').first().click()
    await expect(searchInput).toHaveValue('')
  })

  test('Dovrebbe gestire l\'apertura del pannello filtri e i relativi badge', async ({ page }) => {
    // Apri il pannello filtri (Collapsible)
    await page.locator('button:has(svg.lucide-sliders-horizontal)').click()

    // Clicca sulla riga o sulla checkbox del filtro "Active"
    await page.locator('#status-active').click()

    // Verifica la comparsa del Badge (Chip) sotto la barra di ricerca
    const badgeActive = page.locator('.flex-wrap').getByText('active', { exact: false })
    await expect(badgeActive).toBeVisible()

    // Rimuovi il filtro cliccando sulla "X" del chip
    await badgeActive.locator('button').click()
    await expect(badgeActive).not.toBeVisible()
  })

  test('Dovrebbe cambiare la modalità di visualizzazione tra Lista e Griglia', async ({ page }) => {
    const listButton = page.locator('button:has(svg.lucide-list)')
    const gridButton = page.locator('button:has(svg.lucide-layout-grid)')

    // Passa a griglia
    await gridButton.click()
    await expect(page.locator('.grid')).toBeVisible()

    // Torna a lista
    await listButton.click()
    await expect(page.locator('.grid')).not.toBeVisible()
  })

  test('Dovrebbe eseguire le azioni Start/Stop/Pin su un elemento della lista', async ({ page }) => {
    // Prende il primo daemon disponibile
    const firstDaemon = page.locator('.group, sl-item').first()
    await expect(firstDaemon).toBeVisible()

    // Forza l'hover per mostrare i pulsanti nascosti (opacity-0)
    await firstDaemon.hover()

    // 1. Azione di Pin / Favorite (Stella)
    await firstDaemon.locator('button:has(svg.lucide-star)').click()
    await expect(page.locator('text=Pinned')).toBeVisible()

    // 2. Controllo Start / Stop (Play / Square)
    const playButton = firstDaemon.locator('button:has(svg.lucide-play)')
    const stopButton = firstDaemon.locator('button:has(svg.lucide-square)')

    if (await stopButton.isVisible()) {
      await stopButton.click()
    } else {
      await playButton.click()
    }
  })
})