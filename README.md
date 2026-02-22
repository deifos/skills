# Skills

A collection of Claude Code skills (plugins) by [Deifos](https://github.com/deifos).

## Available Skills

### Image Generation (`image-gen`)

Generate and edit images using Google's Gemini image models. Smart-routes between two models based on text density to optimize cost:

- **Nano Banana** (`gemini-2.0-flash-exp-image-generation`) — fast and cheap (~$0.039/image), best for images with little or no text
- **Nano Banana Pro** (`gemini-2.5-pro-exp-03-25`) — higher quality text rendering (~$0.13/image), best for text-heavy images

## Installation

```bash
claude plugin add deifos/skills
```

## Setup

1. Get a free Gemini API key at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create a `.env` file in your project root:

```
GEMINI_API_KEY=your-key-here
```

That's it. The script automatically reads from `.env` — no need to export anything.

**No dependencies to install** — the script uses Node.js built-in `fetch` (requires Node 18+).

## Usage

### Generate an image

```
/image-gen a red fox sitting in a snowy forest
```

Claude will ask for your preferred resolution and aspect ratio, then generate the image.

### Generate a text-heavy image

```
/image-gen a poster that says "GRAND OPENING - Come celebrate with us this Saturday"
```

Claude automatically detects the text density and routes to Nano Banana Pro for better text rendering.

### Edit an existing image

```
/image-gen edit ./hero.png to make the sky more dramatic
```

### Auto-detection

Claude can also detect when an image would be helpful during other tasks (e.g., building a landing page) and offer to generate one.

## License

MIT
