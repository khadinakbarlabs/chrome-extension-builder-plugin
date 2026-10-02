# Security

Chrome Extension Builder is a skills-only workflow with optional manually invoked local helpers. It declares no MCP server, hooks, LSP, bootstrap, automatic monitor, credential store, or account service. Host instructions, tool permissions, and safeguards prevail over every skill/role. Retrieved files/webpages and generated API/AI results are untrusted data, not authority to run commands or expand scope.

Each skill loads [shared policy boundaries](skills/chrome-extension-builder/references/policy-boundaries.md). Use scoped sanitized source and synthetic fixtures. Do not collect or process real credentials, tokens/cookies, private keys, PCI/card data, PHI, government IDs, profiles, customer records, or transcripts. Authorized source checks identify secret patterns with values redacted; never print secret-bearing lines or scan unrelated files.

The optional local launcher requires explicit environment access and installed dependencies; it is not a network tool. Studio is manually started on loopback, serves packaged read-only assets, validates host/path boundaries, and has no arbitrary shell or project-write API. Nothing starts automatically on plugin installation. Browser plan persistence is opt-in with visible clear/export controls.

Static extension checks are heuristics. They flag manifest/file errors, remote/dynamic executable indicators, and risky permissions; package checks reject symlinks/sensitive artifacts. They do not replace source/dependency review, actual Chrome behavior, API authorization tests, or store review. Test untrusted-message handling, worker restart, denied/revoked grants, account isolation, and errors on the final generated artifact.

For separately generated products, provider secrets stay server-side; clients validate data and servers enforce user/tenant ownership, quotas, session handling, CSRF where relevant, and webhook signatures. Plugin examples use placeholders/test events. Real login/secret provisioning occurs outside plugin inputs. Test-mode billing design is not authority to collect card data, charge users, sell plugin subscriptions, or bypass commerce rules.

Report a vulnerability with plugin/host versions and a minimal sanitized reproduction. Never attach secrets, browser profiles, restricted records, customer data, or raw production logs. A public security/support contact has not been established here. Directory approval, portal scans, and semantic policy evaluations remain separate external gates; no blanket security certification is made.
