---
version: "alpha"
name: "nebula-pc-manager"
description: "Tema scuro atmosferico ottimizzato per la diagnostica di sistema e la gestione del PC su desktop."
colors:
  primary: "#5A7A9A"
  secondary: "#3A4A5C"
  tertiary: "#1E2830"
  neutral: "#C8CDD3"
  surface: "#141A22"
typography:
  h1:
    fontFamily: Gothic Display
    fontSize: 2.25rem
    fontWeight: 700
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
  label-caps:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
rounded:
  sm: 8px
  md: 12px
  lg: 16px
spacing:
  sm: 1.0rem
  md: 1.5rem
  lg: 2.0rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: 12px
---

## Panoramica

Tema scuro atmosferico riadattato per applicazioni di ottimizzazione del sistema e monitoraggio hardware. Le superfici blu-grigio scuro offrono un ambiente privo di distrazioni e antiriflesso, ideale per lunghe sessioni di monitoraggio, dashboard in background e strumenti di gestione delle risorse del PC.



## Colori
- **Sfondo:** #0A0E14 (nero-blu profondo)
- **Superficie:** #141A22 (pannello rialzato)
- **Testo:** #C8CDD3 (bianco opaco ad alta leggibilità per ridurre l'affaticamento visivo)
- **Accento:** #5A7A9A (blu acciaio per stati attivi, indicatori e interruttori)
- **Secondario:** #3A4A5C (blu-grigio opaco per barre di stato del sistema)
- **Bordo:** #1E2830 (linee sottili di separazione dei componenti)


## Tipografia
- **Display:** Tipografia rovinata/gotica per l'intestazione della dashboard e le statistiche d'impatto
- **Corpo:** Inter / Sans-serif pulito per i log di sistema e le tabelle dei processi
- **Codice:** SF Mono / JetBrains Mono per percorsi di file, righe di comando e metriche
- **Scala:** base 14px (0.875rem), rapporto 1.2


## Layout
- **Struttura:** Barra di navigazione laterale + griglia dashboard principale (widget CPU, GPU, memoria e archiviazione)
- **Scala spaziature:** 0/2/4/6/8/12/16/20/24/28/32/36/40/44/48 px
- **Raggio angoli:** interno 8px, elemento 12px, contenitore 16px, finestra 32px
- **Dimensioni elementi:** piccolo 28px, medio 32px, grande 36px


## Elevazione e Profondità
- Sfumature scure e discrete per separare visivamente le sezioni hardware (CPU/RAM/Disco).
- Bagliore minimo sugli indicatori di stato e sui grafici in tempo reale.
- Nessuna ombra tradizionale — separazione visiva basata sul contrasto di luminosità tra le superfici.


## Forme

Raggio d'angolo di base: 8px per le schede di monitoraggio. Consulta i token `rounded` per la scala completa.


## Componenti
- **Indicatori di sistema e Grafici:** Monitoraggio dell'hardware con accento blu acciaio (#5A7A9A)
- **Lista processi e Tabelle:** Schede e righe con superficie #141A22 e bordi #1E2830
- **Pulsanti principali:** Azioni rapide (es. "Pulisci RAM", "Ottimizza") in blu acciaio con testo chiaro
- **Testo Display:** Titoli di sezione e metriche principali con stile rovinato/gotico


## Cose da fare e da evitare
- ✓ Mantieni un alto contrasto per la lettura rapida di log e metriche
- ✓ Usa il font rovinato/gotico solo per numeri grandi o intestazioni principali
- ✗ Non implementare una modalità chiara (impatto visivo eccessivo su desktop)
- ✗ Non usare colori saturi o neon per evitare di affaticare la vista durante il monitoraggio


## Casi d'uso

Gestione del sistema desktop, strumenti di diagnostica hardware, ottimizzatori PC, analizzatori di disco e pannelli di controllo tecnici.