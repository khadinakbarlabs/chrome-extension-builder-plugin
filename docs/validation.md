# OpenAI release verification

Version 2.2.4 fixes provider isolation: only native host metadata is shipped. The reproducible release builder tests actual extracted archives for foreign manifests/components, secret exclusions, referenced resources and exact byte integrity. Icon bytes are checked against the artwork selected for that build. Optional local helpers and Studio retain their behavior tests; plugin maintenance helpers are source-only.

Local structural validation is not policy approval. Confirm exact release test counts, ZIP hashes and native-manifest results from the release matrix and external submission ledger. Semantic model and clean-host cross-surface evaluations remain unverified. Review findings are never cleared by declaring a pass in this document.
