# Supply Chain Transparency Graph Content Repo

This repository stores the public question bank for the Supply Chain Transparency Graph. Questions live in edge-specific YAML files, and the UI consumes the compiled JSON output from `dist/questions.json`.

## Structure

```text
questions/          Stakeholder-pair YAML files
dist/questions.json Compiled UI payload
schema.json         Validation contract for each YAML file
scripts/            Build utility
```

Each edge file follows this shape:

```yaml
id: buyer-to-dsp
origin: "Buyer"
destination: "DSP"
questions:
  - id: buyer-to-dsp-under-which-legal-basis-are-you-storing-cookies-in-line-with-gdpr-and-national-legislation
    text: "Under which legal basis are you storing cookies in line with GDPR and national legislation?"
    tags: ["gdpr", "consent"]
```

## Question Assignment Rules

These rules define how to assign questions to stakeholder nodes in this repository.

1. Always define a destination

Every question must have a clear destination stakeholder.
Ask yourself: Who is this question being asked to?
If that is unclear, rewrite the question.

2. Use “Any Stakeholder” when the asker doesn’t matter

If a question could reasonably be asked by multiple stakeholders, set
`origin: Any Stakeholder`. Do not duplicate the same question across multiple origin nodes.

3. Specify origin only when it adds meaning

Use a specific origin (e.g. Buyer → DSP) only if the question is genuinely role-dependent.
If the question reads the same regardless of who is asking, set `origin: Any Stakeholder`.

4. Duplicate questions across destinations when needed

If the same question should be asked to multiple stakeholder types (e.g. DSP and SSP), create separate entries for each destination. Do not force a question into a single destination if responsibility is shared.

5. Validate the edge as a real interaction

Each question should form a natural interaction:
“Does it make sense for this origin to ask this destination this question?”
If not, reassign or rewrite.

## Add Or Edit Questions

1. Open the relevant file in `questions/`.
2. Keep `id`, `origin`, and `destination` unchanged unless you are creating a new edge.
3. Add or edit `questions` entries using quoted strings for `text`.
4. Keep `tags` to 1-3 lowercase values.
5. Run `npm run build` and commit the updated `dist/questions.json`.

## Tagging Guidance

Use simple, reusable tags. Preferred examples include:

- `gdpr`
- `consent`
- `identity`
- `ads-txt`
- `sellers-json`
- `fraud`
- `spo`
- `carbon`
- `cost`
- `inventory`
- `measurement`
- `data`

Avoid inventing near-duplicate tags unless the existing set cannot express the question cleanly.

## Build Locally

```bash
npm install
npm run build
```

Validation only:

```bash
npm run validate
```

`npm run validate` checks both the YAML structure and whether `dist/questions.json` is current.
