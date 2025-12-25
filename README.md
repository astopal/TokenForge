# TokenForge
A simple token-based template builder with a visual editor and automation-ready output.
Users can define their own tokens, insert them into a template, and generate a filled result.

---

## What is this?

Template Builder lets users:
- Create custom tokens (name + value)
- Insert tokens into a text template
- Generate final text where tokens are replaced with values

The focus is on **simplicity and control**.

---

## How it works

### 1. Create tokens
- Click **Add token**
- Give the token a **Name** (e.g. `Company`)
- Give the token a **Value** (e.g. `X Company`)

The token name is used to:
- Show a small bubble in the editor
- Automatically generate a placeholder like `{{company}}`

---

### 2. Write the template
- Write your own text in the **Template** editor
- Drag or click a token to insert it
- Tokens appear as small bubbles (visual only)

Example:

```text
Hello,

I am applying for a position at {{company}}.
```
---

### 3. Generate output
- Click **Generate output**
- The app replaces all placeholders with their values
- The final text appears in the **Output** section
- Use **Copy** to copy the result

---

## Features

- Unlimited custom tokens
- Drag & drop token insertion
- Clean and minimal UI

---

## Tech stack

- ASP.NET Core (Razor Pages)
- Vanilla JavaScript
- CSS Grid + Glassmorphism UI
- No external libraries

---

```md
## Run locally

```bash
dotnet restore
dotnet run
https://localhost:5001 (example, your port may differ)
