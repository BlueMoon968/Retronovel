# UI Graphics - NinePatch Format

## Required Files

Place these files in this directory:

- **msgbox.png** (16×16) - Message box NinePatch
- **namebox.png** (16×16) - Name box NinePatch

## NinePatch Format

Both files should be 16×16 PNG images divided into 9 patches:

```
[Corner] [Edge] [Corner]
  5×5     6×6     5×5

[Edge]  [Center] [Edge]
 5×6      6×6     5×6

[Corner] [Edge] [Corner]
  5×5     6×6     5×5
```

### How It Works:
- **Corners** (4): Fixed size, never stretch
- **Edges** (4): Stretch in one direction
- **Center** (1): Stretches in both directions

## Phoenix Wright Style

The included example files are inspired by Phoenix Wright: Ace Attorney's UI style.

## Usage

- **msgbox.png**: Used for dialogue text box (fixed size)
- **namebox.png**: Used for speaker name (adapts to name length)

## Custom Graphics

Users can upload custom msgbox/namebox through the Assets tab in the editor.
All custom graphics should follow the 16×16 NinePatch format.

## Example Structure

Your graphics folder should look like:
```
public/graphics/
├── msgbox.png    ← Add this!
├── namebox.png   ← Add this!
└── README.md     (this file)
```
