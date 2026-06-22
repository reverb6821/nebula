# ai-context-cleaner

# 📋 Specifiche Funzionali: AI Context Cleaner & Squeezer

Questo documento descrive lo scopo, il problema risolto, le funzionalità e il comportamento atteso dell'estensione **AI Context Cleaner & Squeezer** progettata per VS Code e Cursor.

---

## 🎯 Obiettivo dell'Estensione
Ridurre drasticamente il consumo di token e azzerare le allucinazioni dei Modelli di Linguaggio (LLM) come GPT-4, Claude o gli agenti nativi di Cursor quando viene fornito loro il contesto di file di codice lunghi o complessi.

L'estensione prende un file sorgente e ne genera una versione **scheletrica (skeletal structure)**, mantenendo intatte solo le informazioni strutturali (firme, tipi, interfacce) ed eliminando il "rumore" della logica interna.

---

## 🛠️ Il Problema che Risolve

Quando uno sviluppatore usa la chat di Cursor (es. con `@NomeFile.ts`) o copia il codice per passarlo a un LLM:
1. **Spreco di Token (e denaro):** Centinaia di righe di algoritmi interni inutili vengono inviate all'IA, saturando la finestra di contesto.
2. **Allucinazioni:** L'IA si perde nei dettagli implementativi di funzioni secondarie e perde il focus sulla richiesta principale dell'utente.
3. **Lentezza:** Prompt massivi richiedono più tempo per essere processati dal modello.

---

## ✨ Funzionalità Principali

### 1. Attivazione Istantanea (Zero Attrito)
* L'utente fa click con il **tasto destro** in un punto qualsiasi del file aperto nell'editor oppure usa la Command Palette (`Cmd/Ctrl + Shift + P`).
* Seleziona il comando: **`AI Context: Squeeze File to Clipboard`**.

### 2. Compressione Intelligente (Squeeze Engine)
L'estensione analizza localmente il file riga per riga (senza inviare dati a server esterni) ed esegue i seguenti passaggi di pulizia in base al linguaggio:

* **Rimozione del corpo delle funzioni:** Il codice interno a funzioni, metodi e hooks viene rimosso e sostituito con un commento esplicativo compatto (es. `/* ... logica interna rimossa ... */`).
* **Preservazione dell'Architettura:** Vengono mantenuti intatti i nomi delle funzioni, i parametri accettati, i tipi di ritorno, le classi, le interfacce TypeScript e gli enum.
* **Collassamento degli Import:** Se un file inizia con decine di righe di `import`, l'estensione le nasconde e le riassume in un'unica riga commentata (es. `// [18 import compressi per ottimizzare lo spazio dei token]`).
* **Eliminazione dei commenti:** Rimuove i commenti a riga singola (`//`) o i blocchi (`/* ... */`) non strutturali per alleggerire ulteriormente il testo.
* **Normalizzazione degli Spazi:** Rimuove le righe vuote consecutive generate dalla rimozione del codice per restituire un testo denso e pulito.

### 3. Output Diretto negli Appunti
Il codice "spremuto" non sporca il file originale sull'editor. Viene generato al volo e copiato direttamente negli **appunti del sistema operativo (Clipboard)**. Una notifica Toast a comparsa avvisa lo sviluppatore dell'avvenuta operazione.

---

## 📊 Esempio di Comportamento (Prima vs Dopo)

### File Originale (`user-controller.ts` - 60 righe)
```typescript
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { LogHelper } from '../utils/logger';
import { validateEmail } from '../utils/validators';

export interface UserResponse {
  id: string;
  email: string;
  active: boolean;
}

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id;
    LogHelper.info(`Fetching profile for user ${userId}`);
    
    if (!userId) {
      res.status(400).json({ error: "Missing ID" });
      return;
    }

    const user = await UserService.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ id: user.id, email: user.email, active: user.isActive });
  } catch (error) {
    LogHelper.error("Error in getUserProfile", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
