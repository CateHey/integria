# Research: Claude Skills + WebGL/3D Tools Behind Awwwards-Level Sites

*Compiled October 2026*

---

## Part 1 — Claude Skills (Agent Skills)

### What a skill is
A **skill** is a folder that teaches Claude how to do one kind of task. At minimum it has a `SKILL.md` file. It can also hold scripts, templates, and reference docs. Anthropic introduced skills in late 2025. They work in **Claude.ai, Claude Code, the Claude Agent SDK, and the API**.

```
my-skill/
├── SKILL.md          # required: frontmatter + instructions
├── references/       # optional: docs Claude reads only when needed
├── scripts/          # optional: code Claude can run
└── assets/           # optional: templates, fonts, images
```

### SKILL.md anatomy
```markdown
---
name: premium-3d-website
description: Build award-quality 3D websites with Three.js/R3F, GSAP and Lenis. Use when the user asks for a WebGL, 3D, immersive or "Awwwards-style" site.
---

# Premium 3D Website

## Workflow
1. Set up the render loop and resize handling...
2. ...
```
- **`name`** and **`description`** are the two required frontmatter fields.
- The **description does the routing.** Claude reads only the descriptions of all installed skills and decides which one fits the task. A vague description means the skill never triggers.

### How loading works (progressive disclosure)
1. **Metadata only.** Claude always sees each skill's name and description. That costs very few tokens.
2. **Body on demand.** When a task matches, Claude loads the full `SKILL.md`.
3. **Extra files as needed.** Reference files and scripts are read or run only when the instructions point to them.

So you can install many skills without filling the context window. This beats pasting a long system prompt on every run.

### Where skills live (Claude Code)
| Location | Scope |
|---|---|
| `~/.claude/skills/<name>/SKILL.md` | Personal, all projects |
| `.claude/skills/<name>/SKILL.md` | Project, shared via git |
| Plugins (marketplaces) | Installed bundles of skills/commands |

### Official and community sources
- **`anthropics/skills`** (GitHub): Anthropic's reference skills. Includes document skills (docx, pdf, pptx, xlsx), creative skills (algorithmic art, canvas design), and developer skills (MCP builder, webapp testing).
- **`anthropics/claude-plugins-official`**: the official plugin marketplace.
- **`frontend-design`**: a first-party skill/plugin that makes Claude pick a bold design direction (typography, color, layout) before writing UI code, so the result looks less like generic AI output. It is reported as the most-installed official plugin (1.1M+ installs).
- **Community 3D skills**, for example `premium-3d-website`, `3d-web-experience`, and `cinematic-gsap-lenis-motion-system`. Install one with:
  ```
  npx skills add sickn33/agentic-awesome-skills --skill premium-3d-website --agent claude-code
  ```
  Read any community skill before you install it, because it is code and instructions from a third party.

### Tips for writing a good skill
- Write the description as **"what it does + when to use it"**, and include the words a user would actually type ("3D", "WebGL", "immersive", "Awwwards").
- Keep `SKILL.md` short and procedural. Move long API notes into `references/`.
- Put deterministic steps, such as compressing GLB files or generating a scaffold, in `scripts/`.
- Use the `skill-creator` skill to draft and test new skills, including trigger evals.

---

## Part 2 — What Makes Awwwards Sites Win

### How Awwwards judges
Jurors score each site on **Design (40%)**, **Usability (30%)**, **Creativity (20%)**, and **Content (10%)**. There is also a separate **Developer Award** for code quality, performance, and semantics. A stunning WebGL scene that stutters or hurts usability loses points.

### The recurring formula
1. **One strong concept.** WebGL serves as the identity, not decoration. Examples: an underwater descent, a liquid light brand system.
2. **Choreographed motion.** Every reveal, hover, and transition shares the same eases and timings.
3. **Smooth, scroll-driven storytelling.** The camera and scenes respond to scroll.
4. **Polished details.** Preloader, custom cursor, page transitions, and sound when it fits.
5. **Ruthless performance.** It feels instant even with heavy visuals.

### Real examples and their stacks
| Site | Recognition | Stack / technique |
|---|---|---|
| **Iventions** | Awwwards SOTD + Developer, Site of the Year 2025 finalist, CSSDA WOTM | Next.js, headless WordPress, Three.js, GSAP. WebGL layered with GSAP choreography and fed by an editable CMS |
| **Mat Voyce** | GSAP Site of the Year nominee | Next.js, Strapi, GSAP-led motion system with WebGL accents |
| **fromanother** | FWA | Three.js with custom GLSL shaders driving a fluid, light-based identity |
| **DeepSee Commerce** | Awwwards Honorable Mention | Three.js scroll-driven camera descent, depth fog. Capped DPR, compressed assets, renders only when visible |
| **Minh Pham portfolio** | Awwwards SOTD (dev score 7.77) | GSAP, Three.js, WebGL |

---

## Part 3 — The Toolkit

### 3D rendering
| Tool | What it's for |
|---|---|
| **Three.js** | The default WebGL/WebGPU engine. Most award sites use it |
| **React Three Fiber (R3F)** + **drei** | Three.js written as React components. Best for React/Next.js apps |
| **OGL** | Minimal WebGL library. Small bundle, good for shader-only effects |
| **Babylon.js / PlayCanvas** | Game-style engines for heavier interactive experiences |
| **Spline** | Visual, browser-based 3D design tool with exports for the web and R3F. Fastest path for designers |
| **Needle Engine** | Unity/Blender to web pipeline built on Three.js |

### WebGPU (the 2026 shift)
- WebGPU now ships by default in **Chrome 113+, Firefox 147+, and Safari 26+** (iOS too, since September 2025).
- The Three.js **`WebGPURenderer`** became production-ready around r171. It needs no bundler tweaks and **falls back to WebGL 2 automatically**.
- **TSL (Three Shading Language)** lets you write a shader once in JavaScript and compile it to both WGSL and GLSL.
- Reported gains are about **3–5x faster** rendering on complex scenes, plus compute shaders for particles and simulations.
- **Gaussian splatting** is replacing meshes for scanned, photoreal scenes.

### Motion and scroll
| Tool | Role |
|---|---|
| **GSAP** + **ScrollTrigger** | Industry standard for timelines and scroll-linked animation. All plugins are free since the Webflow acquisition |
| **Lenis** (~7 kb) | Smooth, interpolated scrolling: the signature "buttery" Awwwards feel. Respects `prefers-reduced-motion` |
| **Theatre.js** | Visual timeline editor for keyframing 3D camera and object motion |
| **Barba.js / View Transitions API** | Seamless page transitions without a full reload |
| **Motion (Framer Motion)** | React UI motion |
| **SplitType / GSAP SplitText** | Per-letter and per-line text reveals |

**Key pattern:** run Lenis, GSAP, and the Three.js render from **one `requestAnimationFrame` loop** so they share a single clock and never fight each other.

```js
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => { lenis.raf(t * 1000); renderer.render(scene, camera); });
gsap.ticker.lagSmoothing(0);
```

### Effects
- **Custom GLSL/TSL shaders**: distortion on hover, noise, fluid, image transitions.
- **Post-processing**: `postprocessing` / `@react-three/postprocessing` (bloom, chromatic aberration, film grain, depth of field).
- **Physics**: Rapier (`@react-three/rapier`) or Cannon-es for tactile interaction.
- **Audio**: Howler.js for ambient or interaction sounds.

### Asset pipeline
- **Blender** for modeling and baking lighting into textures (this is cheaper than real-time shadows).
- **glTF/GLB** with **Draco** or **Meshopt** mesh compression.
- **KTX2/Basis** texture compression, via `gltf-transform` or `gltfjsx`.
- **Substance** for materials.

### Framework and hosting
- **Next.js** (most common), **Nuxt**, or **Astro**.
- A headless CMS (WordPress, Strapi, Sanity) so the content stays editable.
- **Vercel / Netlify** for hosting.

---

## Part 4 — Performance Checklist (the Developer Award differentiator)
- [ ] Cap the device pixel ratio at about 2: `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- [ ] Turn off antialiasing when you use post-processing (use SMAA/FXAA passes instead).
- [ ] Bake lighting and avoid real-time shadows where possible.
- [ ] Compress every asset (Draco/Meshopt + KTX2) and lazy-load scenes.
- [ ] Render only when the canvas is visible, and pause when the tab is hidden.
- [ ] Show a real preloader tied to asset loading progress.
- [ ] Provide a mobile-specific quality tier and a static fallback.
- [ ] Respect `prefers-reduced-motion` and keep the content accessible underneath the canvas.

---

## Part 5 — Putting It Together: Claude Skill + 3D Stack
A practical workflow for building Awwwards-style sites with Claude Code:
1. Install **`frontend-design`** for the art direction and typography layer.
2. Add or write a **3D skill**, for example `.claude/skills/premium-3d-website/`, that encodes:
   - your stack (Next.js + R3F/Three.js + GSAP + Lenis),
   - the single-rAF loop pattern,
   - the performance checklist above,
   - asset pipeline scripts (`gltf-transform` compression).
3. Keep shader snippets and API notes in `references/` so Claude loads them only when it writes shaders.
4. Iterate visually by running the app and checking it in a browser.

---

## Sources
- [What are Claude Skills – Verdent guide 2026](https://www.verdent.ai/guides/what-are-claude-skills-guide-2026)
- [Anthropic Claude Agent Skills – Nimbleway](https://www.nimbleway.com/blog/anthropic-claude-agent-skills)
- [Claude Skills: How Anthropic's Agent Skills Work – Maxim](https://www.getmaxim.ai/articles/claude-skills-how-anthropics-agent-skills-work/)
- [Claude Skills Explained: SKILL.md – Evomap](https://evomap.ai/es/blog/claude-skills-skill-md-vs-agent-capability)
- [Anthropic Skills official guide – Skillselion](https://skillselion.com/guides/anthropic-skills-official-guide)
- [What is the Frontend Design Skill – ClaudeLog](https://claudelog.com/faqs/what-is-frontend-design-skill-in-claude-code/)
- [frontend-design plugin – claude-plugins-official](https://www.remoteopenclaw.com/plugins/anthropics-claude-plugins-official/frontend-design)
- [Anthropic skills collection – VibeIndex](https://vibeindex.ai/collection/anthropics/skills)
- [premium-3d-website skill](https://claudeskills.info/skills/sickn33/agentic-awesome-skills/premium-3d-website/)
- [3d-web-experience skill](https://mcp.directory/skills/3d-web-experience)
- [Cinematic GSAP + Lenis motion system skill](https://www.claudecodehq.com/playbooks/cinematic-gsap-lenis-motion-system)
- [WebGL website examples – hontran.dev](https://www.hontran.dev/blog/webgl-website-examples)
- [Iventions case study – hontran.dev](https://www.hontran.dev/blog/iventions-award-winning-events-website-case-study)
- [Next.js smooth scroll with GSAP + Lenis – hontran.dev](https://www.hontran.dev/blog/nextjs-smooth-scroll-gsap-lenis)
- [3D design tools 2026 – Svilenkovic](https://svilenkovic.com/3d/3d-design-tools-2026)
- [Lenis smooth scroll tutorial – Svilenkovic](https://svilenkovic.com/3d/lenis-smooth-scroll-tutorial)
- [3D websites & vibe coding – Till Freitag](https://till-freitag.com/en/blog/3d-websites-vibe-coding-en)
- [Awwwards-winning animation techniques – Medium](https://medium.com/design-bootcamp/awwward-winning-animation-techniques-for-websites-cb7c6b5a86ff)
- [What's New in Three.js 2026 – Utsubo](https://www.utsubo.com/blog/threejs-2026-what-changed)
- [WebGPU + Three.js Migration Guide – Utsubo](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- [Three.js Complete Guide 2026 – Oflight](https://www.oflight.co.jp/en/columns/threejs-webgpu-tsl-r3f-2026)
- [mesh3d – curated 3D interactive websites](https://peerlist.io/broncekandrej/project/mesh3d--curated-3d--interactive-websites)
