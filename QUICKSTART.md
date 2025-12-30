# 🚀 RETRONOVEL - Quick Start Guide

## Setup Veloce (5 minuti)

### 1. Prerequisiti
Assicurati di avere installato:
- **Node.js** (versione 16 o superiore) - [Scarica qui](https://nodejs.org/)
- Un editor di codice (consigliato: VS Code)

### 2. Installazione

```bash
# Estrai lo zip
unzip retronovel-v0.1.0.zip
cd retronovel-project

# Installa le dipendenze
npm install
```

### 3. Avvia il progetto

```bash
npm run dev
```

Si aprirà automaticamente il browser su `http://localhost:5173`

### 4. Build per produzione (opzionale)

```bash
npm run build
```

I file compilati saranno in `dist/` e potrai caricarli su qualsiasi hosting.

---

## 🎮 Come Usare l'Editor

### Creare Scene
1. Clicca "**+ Nuova**" nel pannello Scene
2. Seleziona la scena dalla lista
3. Personalizza:
   - Colore background
   - Posizione personaggio
   - Visibilità personaggio

### Aggiungere Dialoghi
1. Clicca "**+ Dialogo**"
2. Inserisci nome speaker
3. Scrivi il testo (word-wrap automatico!)

### Testare
1. Premi "**▶ Play**"
2. Clicca sulla preview per avanzare

### Esportare
- **📦 HTML** → File standalone da pubblicare
- **💾 JSON** → Salva progetto
- **📁 Import** → Carica progetto salvato

---

## 📁 Esempi Inclusi

Nella cartella `examples/` trovi:
- `mystery-demo.json` - Giallo investigativo
- `school-demo.json` - Slice of life scolastico

**Per caricarli:**
1. Vai alla tab "Export"
2. Clicca "📁 Importa JSON"
3. Seleziona un file .json

---

## 🐛 Problemi Comuni

### "npm: command not found"
→ Node.js non è installato. Scaricalo da nodejs.org

### La porta 5173 è occupata
→ Vite userà automaticamente 5174, 5175, etc.

### L'editor non si apre
→ Controlla la console del browser (F12) per errori

---

## 📚 Prossimi Passi

1. Leggi il **README.md** completo
2. Esplora gli esempi in `examples/`
3. Crea la tua prima visual novel!
4. Esporta e condividi

---

## 💬 Supporto

Per domande o problemi:
- Leggi il README.md
- Controlla il CHANGELOG.md
- Apri una issue su GitHub (se disponibile)

**Buona creazione! 🎮✨**
