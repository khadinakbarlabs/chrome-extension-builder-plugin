# Chrome Extension Builder metadata

Release 2.2.1, updated 2026-10-02. Plugin identity stays `chrome-extension-builder`; all nineteen skill identifiers now share this native namespace. Earlier generic skill identifiers have been renamed: reload an updated package and use the current names below. Shared policy boundaries and workflow behavior are retained.

## Skill catalog

| Native display name | Skill identifier |
| --- | --- |
| Chrome Extension Builder | [chrome-extension-builder](../skills/chrome-extension-builder/SKILL.md) |
| Chrome Extension Builder: Architecture | [chrome-extension-builder-architecture](../skills/chrome-extension-builder-architecture/SKILL.md) |
| Chrome Extension Builder: Audit | [chrome-extension-builder-audit](../skills/chrome-extension-builder-audit/SKILL.md) |
| Chrome Extension Builder: Backend | [chrome-extension-builder-backend](../skills/chrome-extension-builder-backend/SKILL.md) |
| Chrome Extension Builder: Build | [chrome-extension-builder-build](../skills/chrome-extension-builder-build/SKILL.md) |
| Chrome Extension Builder: Debugging | [chrome-extension-builder-debugging](../skills/chrome-extension-builder-debugging/SKILL.md) |
| Chrome Extension Builder: Evolution | [chrome-extension-builder-evolution](../skills/chrome-extension-builder-evolution/SKILL.md) |
| Chrome Extension Builder: Frontend | [chrome-extension-builder-frontend](../skills/chrome-extension-builder-frontend/SKILL.md) |
| Chrome Extension Builder: Improve | [chrome-extension-builder-improve](../skills/chrome-extension-builder-improve/SKILL.md) |
| Chrome Extension Builder: Integrations | [chrome-extension-builder-integrations](../skills/chrome-extension-builder-integrations/SKILL.md) |
| Chrome Extension Builder: Maintenance | [chrome-extension-builder-maintenance](../skills/chrome-extension-builder-maintenance/SKILL.md) |
| Chrome Extension Builder: Performance | [chrome-extension-builder-performance](../skills/chrome-extension-builder-performance/SKILL.md) |
| Chrome Extension Builder: Prepare Release | [chrome-extension-builder-prepare-release](../skills/chrome-extension-builder-prepare-release/SKILL.md) |
| Chrome Extension Builder: Release | [chrome-extension-builder-release](../skills/chrome-extension-builder-release/SKILL.md) |
| Chrome Extension Builder: Research | [chrome-extension-builder-research](../skills/chrome-extension-builder-research/SKILL.md) |
| Chrome Extension Builder: Security | [chrome-extension-builder-security](../skills/chrome-extension-builder-security/SKILL.md) |
| Chrome Extension Builder: Studio | [chrome-extension-builder-studio](../skills/chrome-extension-builder-studio/SKILL.md) |
| Chrome Extension Builder: Testing | [chrome-extension-builder-testing](../skills/chrome-extension-builder-testing/SKILL.md) |
| Chrome Extension Builder: UX Design | [chrome-extension-builder-ux-design](../skills/chrome-extension-builder-ux-design/SKILL.md) |

## Presentation

The portable OpenAI interface and compatibility overlays use the same display name, subtitle, detailed description, developer identity, default prompts and icon. Three plugin-level starter prompts retain their value and order. Every skill has a matching branded title, a role-specific summary, a default prompt referencing its exact new identifier, contained relative icon paths and the blue accent color. Native Claude preload references and portable role routing point to the renamed skills.

Subtitle: **Build for Google Chrome™**. Publisher: **Khadin Akbar**. The user requested Chrome branding; the selected private-package icon now combines the recognizable Chrome emblem with the custom browser-window and extension motif. Descriptions include compatibility wording, independent publisher identity and trademark attribution. No public homepage/support/privacy/terms URLs or account/region/approval facts have been fabricated.

## Icon asset and generation

The user explicitly selected the attached icon on 2026-10-02. That exact PNG is copied without regeneration or pixel changes to both referenced assets. Final plugin icon: [chrome-extension-builder-icon.png](../assets/chrome-extension-builder-icon.png). The skill metadata copy is [icon.png](../skills/chrome-extension-builder/assets/icon.png). Both copies are byte-identical. PNG RGBA, 1254 × 1254 pixels, 916,381 bytes, with transparent pixels outside the tile. Palette: midnight navy and white, blue extension piece, and Chrome red/yellow/green/blue. Plugin and skill metadata now reference these assets; the earlier source composer icon is retained for history and is no longer referenced.

Generated with the built-in image-generation tool, refined to remove an uneven interior mark, and then updated with Chrome branding at the user's explicit request. No API-key fallback or handmade substitute was used.

Initial prompt:

> Use case: logo-brand. Create one finished minimal app/plugin icon for 'Chrome Extension Builder'. No lettering or words. A single centered rounded-square midnight navy tile, with an exceptionally simple white geometric browser-window outline; its lower right edge integrates one small electric-blue extension/puzzle-tab shape. Flat crisp vector-like geometry, consistent generous stroke weight, no shading, no gradient, no texture, no glow, no 3D or mockup. Strong silhouette readable at 24 pixels; icon mark occupies roughly 65 percent of the square, generous balanced padding. Square PNG composition, genuinely transparent canvas outside the rounded tile. Original generic browser-extension symbol, do not use the Google Chrome logo, Google colors, brand marks, watermarks, captions, extra motifs or a sheet of variants. Palette midnight navy #1D2938, white, electric blue #3559E9. Deliver only the single icon.

Refinement prompt:

> Precise cleanup edit of this Chrome Extension Builder plugin icon. Keep exactly the same rounded-square tile, white browser-window outline and three dots, blue puzzle piece, composition, proportions and generous transparent padding. Remove the visible irregular dark smudge in the left-center inside the browser window. Flatten the entire navy tile including the space inside the browser to one perfectly uniform solid #1D2938 fill. Flatten all white geometry to uniform #FFFFFF and the puzzle piece to uniform #3559E9. Absolutely no gradient, light/shadow, texture, glow, mottling, bevel or 3D. Sharp smooth antialiased edges and simple flat vector-like app icon. No text, additional objects, or trademark logos. Preserve genuine transparent alpha outside the rounded tile. One square icon only.


Chrome-branding edit prompt:

> Edit this Chrome Extension Builder icon to add recognizable Chrome platform branding. Keep the centered midnight-navy rounded-square tile, the clean white browser-window outline and blue extension puzzle piece exactly as they are, with generous transparent padding and the same composition. Add one clear Chrome browser emblem centered in the empty browser-window interior, to the left of the puzzle piece: familiar circular red, yellow and green segments around a solid blue central circle, separated by a clean thin white ring. The Chrome emblem should read instantly while remaining visibly separate from the extension piece and white browser outline, roughly 25 percent of total canvas width. Keep everything clean, simple, flat, geometric, crisp and legible at small sizes. Remove any texture, smudge, gradients, bevels, shadows, glows, or decorative details. No words, no company/developer name, no 'official' or endorsement text, no badges or watermarks. Retain real transparent alpha outside the rounded navy tile. One finished square PNG icon, not a mockup or sheet of variants.

## Chrome brand-use publication gate

This requested Chrome-logo composite is a private design asset, not a Google-approved brand mark. Google's [Chrome branding guide](https://developer.chrome.com/docs/webstore/branding) restricts using its trademarks or modified marks as extension logos without written permission; its [general brand guidance](https://about.google/brand-resource-center/guidance/) also prohibits misleading affiliation and imitation. Compatibility text and attribution do not themselves establish logo permission. No such permission was provided or verified. Before publicly listing this composite, resolve that permission or choose the preserved [original builder icon](../assets/chrome-extension-builder-icon-original.png) and revalidate the final listing. This is distinct from native archive integrity and OpenAI/Anthropic platform review. No official Google affiliation, approval or store badge is claimed.

## Evidence limits

Manifest validation, matching metadata/skill identifiers, resolving resource paths, PNG bounds, archive extraction and existing automated behavior checks establish local package integrity. Native-host discovery/policy evaluations and public directory approval remain separate, unrun or pending checks.

## Claude public release

The publisher selected the preserved original custom icon for the public listing on 2026-10-02. The public repository replaces both referenced icon copies and includes .claude-plugin/icon.png for native listing discovery. The Chrome-logo composite is retained only in the separate private source/archive history; it is absent from this public repository. Earlier icon selection/generation descriptions above document private-package history, not the public asset.
