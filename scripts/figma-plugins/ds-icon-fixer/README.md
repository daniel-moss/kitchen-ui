# DS Icon Fixer — private Figma plugin

Fixes DS Icons whose glyph name (or icon token) sits on the **text layer**
instead of the Icon's **name** property. That happens whenever icons are
written by a script through the Figma MCP: those scripts run in Figma's cloud,
which cannot see Font Awesome 7 Pro (installed only on Daniel's Mac), so they
cannot set the property. Symptom: the property panel shows "diamonds-4" and
changing the name does nothing.

The plugin runs inside Daniel's own Figma app, where the font exists, and for
each such icon:

- a DS token bound on the layer (`public`, `context-menu`…) → the **name
  property** is bound to that token;
- a plain name, or a LOCAL helper variable → the property gets the plain name;
- the layer edit is cleared, so the property is in control again;
- other edits on the icon are kept (its component properties, a colour change
  on the glyph). An icon with any other edit is **skipped and listed**, never
  guessed.

## Install (once)

Figma desktop app → menu **Plugins → Development → Import plugin from
manifest…** → pick `manifest.json` in this folder.

## Run

1. Open the page (or select the frames to fix).
2. **Plugins → Development → DS Icon Fixer**.
3. **Check** lists what it would change — nothing is written.
4. **Fix** applies it and reports fixed / skipped / failed.

Undo (⌘Z) reverts a Fix like any other edit.
