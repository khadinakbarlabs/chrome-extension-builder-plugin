# Policy alignment audit

Inspected 2026-10-02 for target 2.2.1. This is an evidence ledger, not a claim of blanket compliance, directory acceptance, or legal approval. `Verified source` means the named local control was inspected; `pending` means external or semantic evidence is absent. Final packaging/test results belong in the release validation report.

| Requirement | Local implementation/evidence | Status | Primary basis |
| --- | --- | --- | --- |
| Skills-only architecture | Main skill and architecture specify no MCP/account/credential service | Verified source; extracted-package validation separately required | [OpenAI conversion](https://developers.openai.com/plugins/guides/submit-claude-plugin) |
| Portable behavior | Nineteen skills include all fourteen lifecycle roles and five command intents; canonical team references stay inside main skill | Verified source; clean-host loading pending | [Conversion](https://developers.openai.com/plugins/guides/submit-claude-plugin) |
| Host instruction priority | Shared policy loaded before every skill; untrusted retrieval cannot authorize changes | Verified source; semantic evaluation unrun | [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines) |
| Narrow inputs/restricted-data controls | Synthetic fixtures; no plugin credentials/PCI/PHI/IDs/profile/transcript intake | Verified source; misuse cases unrun | [Guidelines](https://developers.openai.com/plugins/plugin-guidelines) |
| Permitted use and third-party rights | No abuse/circumvention; scoped integrations must respect authorization/terms | Verified source; model enforcement unrun | [OpenAI policies](https://openai.com/policies/usage-policies/), [Anthropic AUP](https://www.anthropic.com/legal/aup) |
| Commerce boundary | No plugin subscription/upsell/checkout; separate generated-product test design | Verified source; semantic case unrun | [Guidelines](https://developers.openai.com/plugins/plugin-guidelines) |
| Local privacy description | PRIVACY.md lists categories, purpose, recipients, retention, clear/export and host limits | Verified local draft; published URL pending | [Guidelines](https://developers.openai.com/plugins/plugin-guidelines) |
| Progressive skills | Short frontmatter/body, relevant references only, optional tools checked before use | Source structure inspected; automated validation separately required | [Skill practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) |
| Native Claude adapter | Supported text agents/commands only; no hooks/MCP/LSP/bootstrap; root bin excluded by package contract | Source architecture verified; native load pending | [Claude manifest](https://code.claude.com/docs/en/plugins-reference) |
| Truthful capability/evidence claims | Chat fallback; local/static/browser/deployed/submitted/accepted states separate | Verified source; clean-host scenarios unrun | [Conversion](https://developers.openai.com/plugins/guides/submit-claude-plugin) |
| Functionality evaluations | Runnable scenarios in policy-evaluations.md with expected outcomes | Specified; host semantic execution unrun | [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines) |
| Chrome trademark/logo publication rights | User-requested Chrome-logo composite; compatibility attribution and independent publisher identity present; written brand-use permission not verified | Pending before public use; original builder icon preserved | [Chrome branding](https://developer.chrome.com/docs/webstore/branding), [Google brand guidance](https://about.google/brand-resource-center/guidance/) |
| Public homepage URL | No verified listing URL supplied | Pending; do not invent | Portal/listing review |
| Public privacy URL | Local PRIVACY.md only | Pending | [Guidelines](https://developers.openai.com/plugins/plugin-guidelines) |
| Public terms URL | Local TERMS.md only | Pending | Portal/listing review |
| Public support URL/contact | Local SUPPORT.md; no public contact configured | Pending | [Guidelines](https://developers.openai.com/plugins/plugin-guidelines) |
| Developer identity and Apps Management write access | No portal/account evidence inspected | Unknown/pending | [Conversion](https://developers.openai.com/plugins/guides/submit-claude-plugin) |
| Supported countries/regions and listing scope | No portal selection or eligibility confirmation | Unknown/pending | Actual portal/provider requirements |
| Core local-workflow eligibility | Chat-first core with optional local tools; no partner decision obtained | Pending product-specific directory determination | [Conversion](https://developers.openai.com/plugins/guides/submit-claude-plugin) |
| Portal scan/review/approval | No draft scan or acceptance result observed | Pending | [Guidelines](https://developers.openai.com/plugins/plugin-guidelines) |
| MCP endpoint/OAuth domain challenge/demo credentials | This package declares no MCP | Not applicable to package; do not request demo credentials | [Conversion](https://developers.openai.com/plugins/guides/submit-claude-plugin) |

Release evidence must identify exact package/version/digest and environment. Before directory submission, verify public links and account/region fields, run clean-host skills and functional policy scenarios, inspect every portal scan, resolve findings, and observe review status. Partner review may still be needed if evaluators regard local execution as core value. Do not add a cloud/MCP connection to hide this eligibility gate.

The user's preferred public-page host is Cloudflare with khadinakbar.dev. The domain choice/availability and Cloudflare access are unresolved; no deployed homepage/privacy/terms/support URLs are established. A separate static page draft does not change these pending statuses or turn this package into a hosted plugin service.

Generated extensions/backends have separate platform/security/data/payment/store obligations. The plugin's local audit cannot attest those products. Real account credentials, private customer records, or protected review context must not be copied into this ledger.
