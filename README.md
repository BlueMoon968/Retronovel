# 🎮 Retronovel

**Editor di Visual Novel in stile GBA/NDS**

Crea visual novel retro direttamente nel browser con l'estetica delle console portatili Nintendo degli anni 2000.

![Risoluzione: 256x192 (Nintendo DS)](https://img.shields.io/badge/Risoluzione-256x192-blue)
![Stile: GBA/NDS](https://img.shields.io/badge/Stile-GBA%2FNDS-green)
![Status: Alpha](https://img.shields.io/badge/Status-Alpha-yellow)

## ✨ Features

### Versione Corrente (v0.1.0)
- ✅ **Editor Scene Multiplo** - Crea e gestisci scene illimitate
- ✅ **Sistema Dialoghi** - Aggiungi dialoghi con speaker e testo
- ✅ **Anteprima Live** - Vedi i cambiamenti in tempo reale
- ✅ **Modalità Play** - Testa la tua visual novel
- ✅ **Export HTML** - Esporta come file standalone
- ✅ **Export/Import JSON** - Salva e condividi i tuoi progetti
- ✅ **Rendering Pixel-Perfect** - Estetica retro autentica

### 🚧 In Sviluppo
- 🔲 Sprite Editor integrato per personaggi
- 🔲 Background Manager con upload immagini
- 🔲 Sistema di scelte (branching narrativo)
- 🔲 Effetti di transizione tra scene
- 🔲 Sound effects e musica
- 🔲 Animazioni personaggi
- 🔲 Text effects (typewriter, shake, etc.)

## 🚀 Quick Start

### Requisiti
- Node.js 16+ e npm/yarn

### Installazione

```bash
# Clona o scarica il progetto
cd retronovel-project

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

Il progetto sarà disponibile su `http://localhost:5173`

### Build per Produzione

```bash
npm run build
```

I file compilati saranno in `dist/`

## 📖 Come Usare

### 1. Creare una Scena
- Clicca su **"+ Nuova"** nel pannello Scene
- Personalizza il colore di background
- Abilita/disabilita il personaggio placeholder
- Scegli la posizione del personaggio

### 2. Aggiungere Dialoghi
- Clicca su **"+ Dialogo"** 
- Inserisci il nome dello speaker
- Scrivi il testo del dialogo
- Il word-wrapping è automatico!

### 3. Testare
- Premi il pulsante **"▶ Play"**
- Clicca sulla preview per avanzare nei dialoghi
- Naviga tra le scene

### 4. Esportare
Vai alla tab **Export** e scegli:
- **📦 Esporta HTML** - File standalone da pubblicare su web
- **💾 Esporta JSON** - Salva il progetto per continuare dopo
- **📁 Importa JSON** - Carica un progetto salvato

## 🎨 Specifiche Tecniche

### Risoluzione
- **256×192 pixel** (Nintendo DS single screen)
- Aspect ratio 4:3
- Rendering pixelato autentico

### Formato Dati (JSON)
```json
{
  "title": "Nome Visual Novel",
  "resolution": [256, 192],
  "scenes": [
    {
      "id": 1,
      "background": "#2d5a3d",
      "character": null,
      "characterPosition": "center",
      "dialogues": [
        {
          "speaker": "Nome",
          "text": "Testo del dialogo..."
        }
      ],
      "choices": []
    }
  ],
  "characters": [],
  "backgrounds": []
}
```

### Export HTML
L'export HTML genera un file **completamente standalone**:
- Nessuna dipendenza esterna
- Funziona offline
- Canvas rendering ottimizzato
- Responsive (si adatta a mobile)

## 🎯 Ispirazione

Retronovel è ispirato a classici GBA/NDS come:
- Love Hina Advance
- Phoenix Wright: Ace Attorney
- Hotel Dusk: Room 215
- 999: Nine Hours, Nine Persons, Nine Doors
- Time Hollow
- Silent Hill: Play Novel (GBA)

## 🛠 Struttura Progetto

```
retronovel-project/
├── src/
│   ├── App.jsx           # Componente principale editor
│   └── main.jsx          # Entry point React
├── public/               # File statici
├── index.html            # HTML principale
├── package.json          # Dipendenze
├── vite.config.js        # Configurazione Vite
└── README.md             # Questo file
```

## 📝 Formato File Supportati

### Import
- `.json` - Progetti Retronovel

### Export  
- `.html` - Visual Novel standalone
- `.json` - Progetto salvato

## 🤝 Contribuire

Questo è un progetto alpha! Idee per miglioramenti:

1. **Sistema di asset**
   - Upload sprite personaggi
   - Upload background
   - Libreria asset riutilizzabili

2. **Branching narrativo**
   - Sistema di scelte multiple
   - Tracking variabili
   - Endings multipli

3. **Audio**
   - BGM (background music)
   - Sound effects
   - Voice acting (?)

4. **Effetti visivi**
   - Transizioni scene (fade, slide, etc.)
   - Shake/tremor effects
   - Character animations
   - Text effects (typewriter)

5. **Publishing**
   - Export per itch.io
   - Export come app standalone
   - Condivisione online

## 📜 Licenza

MIT License - Sentiti libero di usare, modificare e distribuire!

## 🙏 Credits

Sviluppato con:
- React 18
- Vite
- HTML5 Canvas
- Tanto ❤️ per le visual novel retro

---

**Buona creazione! 🎮✨**

Per domande, suggerimenti o bug reports, apri una issue!
