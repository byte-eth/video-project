---
name: scoped-less-skill
description: >-
  nest_h5 Vue SFC styles: use scoped Less/CSS by default; use :deep() for child
  or Vant internals; use :global(unique-class) for teleport/body overlays when
  needed. See workspace rule nest-h5-scoped-less.mdc.
---

# Scoped Less in nest_h5

When editing or generating `nest_h5/**/*.vue` styles:

1. Use `<style lang="less" scoped>` (or `<style scoped>`) unless there is a documented global exception.
2. Pierce third-party or child DOM with **`:deep()`** — do not drop `scoped` for the whole block.
3. For nodes under **`teleport="body"`** (e.g. Vant popup overlay), use **`:global(.prefix-…)`** inside the scoped block with a **unique class prefix**, or a minimal separate unscoped block — see rule `nest-h5-scoped-less.mdc`.

Full detail: repository `.cursor/rules/nest-h5-scoped-less.mdc`.
