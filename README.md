# Supply Chain Transparency Graph Content Repo

This repository stores the public question bank for the Supply Chain Transparency Graph. Human editors work in edge-specific YAML files, and the UI consumes the compiled JSON output from `dist/questions.json`.

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
