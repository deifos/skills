# Image Prompt Engineering Guide

## Core Principles

### 1. Be Specific and Descriptive

Bad: "a dog"
Good: "a golden retriever puppy playing in a pile of autumn leaves, soft afternoon sunlight filtering through trees"

The more specific your prompt, the closer the result will match your vision. Include details about:
- **Subject**: what is in the image
- **Setting**: where the scene takes place
- **Lighting**: time of day, light source, mood
- **Composition**: camera angle, framing, focus

### 2. Specify a Visual Style

Always include a style keyword to guide the aesthetic:

| Style | Best for |
|---|---|
| `photorealistic` | Product shots, hero images, stock-photo replacements |
| `illustration` | Blog headers, explanatory graphics |
| `flat illustration` | Icons, UI elements, minimal graphics |
| `watercolor` | Artistic, soft, editorial |
| `3D render` | Product mockups, tech visuals |
| `pencil sketch` | Draft concepts, storyboards |
| `digital painting` | Fantasy, concept art |
| `vector art` | Logos, clean graphics |
| `pixel art` | Retro, gaming aesthetics |
| `isometric` | Technical diagrams, architectural views |

### 3. Describe the Lighting

Lighting sets the mood of the entire image:

- **Golden hour** — warm, soft, romantic
- **Blue hour** — cool, calm, twilight
- **Studio lighting** — clean, professional, even
- **Dramatic side lighting** — high contrast, moody
- **Soft diffused light** — gentle, flattering
- **Backlit / silhouette** — dramatic outlines
- **Neon / colored lighting** — cyberpunk, nightlife

### 4. Mention Composition

Guide where the viewer's eye goes:

- **Close-up / macro** — detail, texture, intimacy
- **Wide angle** — environment, scale, context
- **Bird's eye view** — maps, layouts, patterns
- **Low angle** — power, grandeur, drama
- **Centered subject** — symmetry, focus
- **Rule of thirds** — natural, dynamic balance
- **Negative space** — minimalist, room for text overlay

## Text in Images

Models handle text best when you:

1. **Keep it short** — 1-3 words render most reliably
2. **Put text in quotes** — `a neon sign that says "OPEN"`
3. **Describe the text style** — font weight, color, placement
4. **Use Nano Banana Pro** for anything over 5 words of visible text

### Examples

- 1 word: `a coffee cup with "MONDAY" written on it in gold lettering`
- 3 words: `a storefront with a neon sign reading "GOOD VIBES ONLY"`
- Many words: Use Nano Banana Pro — `an infographic titled "5 Tips for Better Sleep" with numbered sections`

## Model Selection Guide

### Use Nano Banana (`gemini-2.0-flash-exp-image-generation`) when:
- Generating photos, illustrations, or scenes
- Images with no text or very little text (1-5 words)
- Quick drafts and iterations
- Cost-sensitive batch generation

### Use Nano Banana Pro (`gemini-2.5-pro-exp-03-25`) when:
- Images with paragraphs or many words of text
- Infographics, posters, presentation slides
- Signs or banners with full sentences
- Any image where text accuracy is critical

## Aspect Ratio Guide

| Ratio | Dimensions | Best for |
|---|---|---|
| `1:1` | Square | Social media posts, profile pictures, icons |
| `16:9` | Widescreen | Hero images, blog headers, presentations, YouTube thumbnails |
| `9:16` | Vertical | Instagram/TikTok stories, mobile wallpapers, Pinterest pins |
| `3:2` | Classic photo | Photography, print, editorial |
| `4:3` | Standard | Presentations, traditional displays |
| `2:3` | Portrait | Book covers, posters |
| `21:9` | Ultra-wide | Cinematic banners, website headers |

## Common Mistakes

1. **Too vague** — "a nice picture" gives random results. Be specific.
2. **Too many subjects** — Focus on one main subject. Complex multi-subject scenes often confuse the model.
3. **Negative prompts** — Don't say "without X" or "no Y". These models don't reliably handle negation. Instead, describe what you DO want.
4. **Conflicting styles** — "photorealistic watercolor" will confuse the model. Pick one style.
5. **Ignoring lighting** — Lighting is often the difference between a good and great image. Always mention it.
6. **Tiny text expectations** — Don't expect the model to render small fine print. Keep text large and prominent.
7. **Overloading the prompt** — A focused 2-sentence prompt usually outperforms a 10-sentence essay. Quality over quantity.

## Prompt Templates

### Product Shot
```
A [product] on a [surface], [style] photography, [lighting], [background], high detail
```
Example: "A matte black water bottle on a marble countertop, product photography, soft studio lighting, minimal white background, high detail"

### Hero Image
```
[scene description], [style], [lighting], [composition], [mood]
```
Example: "A mountain lake at sunrise with mist rising from the water, photorealistic, golden hour light, wide angle panoramic view, serene and peaceful"

### Icon / UI Element
```
A [object] icon, flat illustration style, [color palette], minimal, clean lines, on [background]
```
Example: "A rocket ship icon, flat illustration style, blue and orange color palette, minimal, clean lines, on transparent background"

### Infographic (use Nano Banana Pro)
```
An infographic about [topic], [style], [layout description], [color scheme]
```
Example: "An infographic about the water cycle, modern flat design, vertical layout with 5 sections connected by arrows, blue and teal color scheme"
