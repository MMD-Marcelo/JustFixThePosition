# Templates

This folder contains visual example projects for JUST fix the position.

Each template has:

- `layout.json`: a complete JSON export that follows `schema/layout-builder.schema.json`.
- `assets/`: PNG screenshots referenced by the JSON.

The images are intentionally split by page region instead of being one full screenshot. They are captured from HTML/CSS mockups with `capture-template-assets.mjs`, which lets the JSON teach an LLM where each visual block belongs, how it is layered, and what role it plays in the interface.

Current templates:

- `desktop-app`
- `landing-page`
- `mobile-app`
- `dashboard`
