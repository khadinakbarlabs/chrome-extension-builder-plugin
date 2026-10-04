# Feedback and reviewed lessons

Feedback is optional usefulness input, not installed telemetry. At a useful milestone offer useful / partly useful / blocked if it helps the next action. Do not interrupt work with repeated surveys, record traits, or infer satisfaction from silence.

`builder` identifies plugin workflow/explanation/tooling/claim quality. `extension` identifies the separately generated Chrome product. Keep records distinct. Capture host/package version/task category/outcome/issue category and a minimal sanitized note. Reported issues are not reproduced; feature requests are not defects or measured demand.

Categories: reproducible defect, confusing experience, context failure, inaccurate claim, feature request. Prioritize observed impact/frequency with known sample size, reproducibility, security consequences, effort, and acceptance value. Label uncertain estimates. Deduplicate underlying issues without merging product identities.

Default is local project state or chat note. Never collect transcripts, source/page contents, uploads, private URLs, credentials, identities, or customer records. Aggregate builder feedback omits project identity/data; preview a minimized payload and destination before explicitly requested sharing. No collector endpoint, automatic transmission, or self-training exists.

1. Separate observed defect, reported experience, hypothesis.
2. Reproduce exact artifact with synthetic fixtures when possible.
3. Bounded repair/candidate against frozen incumbent/acceptance/rubric.
4. Re-run affected checks; independent review only when it occurs.
5. Retain one sanitized scoped lesson/decision with provenance and limits; no automatic global skill/preference rewrite.
6. State benefit as demonstrated, provisional, or unmeasured. A 10x ambition requires comparable baseline and human usefulness evidence before becoming a claim.

After tool/help check:

```sh
python3 "$PLUGIN_ROOT/skills/chrome-extension-builder/scripts/intelligence.py" feedback PROJECT --input feedback-input.json
```

Input: `{id, product: "builder"|"extension", package_version, host, task_category, outcome: "useful"|"partly-useful"|"blocked", issue_category: "reproducible-defect"|"confusing-experience"|"context-failure"|"inaccurate-claim"|"feature-request", note?}`. Use actual observations or explicit unknown values permitted by live help. Absent denominators mean unknown, not zero interest.

For a minimized aggregate **builder-only** local export, the dedicated helper is:

```sh
python3 "$PLUGIN_ROOT/skills/chrome-extension-builder/scripts/intelligence.py" feedback-export PROJECT --output builder-feedback
```

It creates local JSON/Markdown, not an upload. Review output before any expressly requested sharing. A normal project/feedback report can contain project-local context and is not the aggregate export. The builder export selects builder feedback metadata, including recorded feedback dates, while omitting extension feedback, project identity, and raw notes. Inspect actual output, consider date granularity and re-identification risk for the intended audience, and do not add private project details back.
