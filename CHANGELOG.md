# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] - 2024-12-30

### 🎨 NINEPATCH UI SYSTEM - Phoenix Wright Style!
- ✨ **NEW:** NinePatch rendering system for dialogue boxes
- ✨ **NEW:** Custom msgbox.png support (16×16 NinePatch)
- ✨ **NEW:** Custom namebox.png support (16×16 NinePatch)
- 📦 Namebox adapts automatically to speaker name length
- 🎮 Phoenix Wright-inspired UI aesthetic
- 📁 UI Graphics section in Assets tab
- 🔧 Fallback rendering if NinePatch images not loaded

### Technical
- Implemented drawNinePatch() function for 9-slice rendering
- NinePatch divides 16×16 into corners (5×5), edges (6×), center (6×6)
- msgbox: fixed size dialogue box
- namebox: dynamic width based on text measurement
- Default graphics loaded from `/public/graphics/`
- Custom graphics uploadable and base64 encoded in JSON

### File Structure
- `/public/graphics/msgbox.png` - Message box (user adds)
- `/public/graphics/namebox.png` - Name box (user adds)
- Both files should be 16×16 PNG in NinePatch format

---

## [0.3.0] - 2024-12-30

### 🎨 THE FONT FIX - PIXEL PERFECT TEXT!
- ✨ **NEW:** Dogica bitmap font for crystal-clear text
- ✨ **NEW:** Viewport scale selector (1×, 2×, 3×, 4×)
- ✨ **NEW:** Custom font upload in Settings tab
- ✨ **NEW:** Settings tab for global preferences
- 🎯 Text is now TRULY pixel-perfect with proper bitmap font
- 📐 User can choose display scale (affects editor + export)
- 🎨 Font settings persist in JSON export/import

### Technical
- Added @font-face for dogica.ttf in index.html
- New `settings` object in project structure
- Scale setting affects canvas CSS dimensions
- Custom font support via base64 encoding
- Backward compatible with old project files

---

## [0.2.1] - 2024-12-30

### Fixed
- 🐛 **MAJOR FIX:** Crisp pixel-perfect rendering at native resolution
- 🎨 Canvas now renders at native 256×192 and scales via CSS to 768×576 (3×)
- 📐 Removed all internal scaling logic for cleaner code
- 🖼️ Added proper `image-rendering: pixelated` CSS for all browsers
- ✨ Text is now sharp and perfectly readable

### Technical Changes
- Canvas native resolution: 256×192
- Display size: 768×576 (3× scale via CSS)
- Removed `ctx.scale()` complexity
- Added cross-browser image-rendering CSS

---

## [0.2.0] - 2024-12-30

### Added
- ✨ Asset Manager with image upload (sprites & backgrounds)
- ✨ Sprite library for character management
- ✨ Background library for scene backgrounds
- 🌍 Full English localization

### Fixed
- 🐛 Fixed sprite rendering order (now: Background → Sprites → UI)
- 🐛 Fixed blurry text in canvas preview
- 🐛 Improved pixel-perfect rendering with `imageSmoothingEnabled = false`

### Changed
- 📝 All UI text now in English
- 🎨 Updated example projects to English

---

## [0.1.0] - 2024-12-30

### Added
- ✨ Base editor with multiple scene management
- ✨ Dialogue system with speaker and text
- ✨ Live preview at 256×192 pixels (NDS)
- ✨ Play mode to test visual novels
- ✨ Standalone HTML export
- ✨ Project export/import in JSON format
- ✨ Pixel-perfect retro rendering
- ✨ Automatic word-wrapping for dialogues
- ✨ Character position management (left/center/right)
- ✨ Custom background color per scene
- ✨ Progress indicators (current scene and dialogue)
- 📁 Example projects included (mystery-demo, school-demo)

### Technical Features
- React 18 with hooks
- Vite as build tool
- Canvas API for rendering
- Simplified JSON data format (Bitsy-style)
- Responsive UI with side panels

### Notes
This is the initial alpha release. Many features are in development.

---

## [Unreleased]

### Planned
- Branching system (choices)
- Scene transitions
- Audio (BGM + SFX)
- Character animations
- Text effects
