# WHAT THE FONT?!
*Which font does your personality scream?*

An AI-powered personality quiz that designs a custom variable font for you.
ID2116 Computing for Design · Project 02 · built with p5.js.

## Files
| File | What it does |
|---|---|
| `index.html` | Loads p5.js, the Google variable fonts and the scripts |
| `quiz-data.js` | **Model:** the 8 questions, which font parameter each controls, slider settings, font reactions |
| `fonts.js` | Turns personality specs into real variable-font CSS (`font-variation-settings`) |
| `foundry.js` | **The Foundry:** system prompt, user prompt builder, OpenAI call, offline fallback |
| `sketch.js` | **View + Controller:** the screens (landing → quiz → loading → result) and sliders |
| `style.css` | The look |

## Fonts and their real axes
| Classification | Font | Real axes |
|---|---|---|
| serif | Fraunces | weight, roundness (SOFT), contrast (opsz), casual (WONK) |
| sans | Roboto Flex | weight, width, slant, contrast (opsz) |
| slab | Roboto Slab | weight |
| script | Dancing Script | weight |
| mono | Recursive | weight, slant, casual (CASL) |

Width and slant are simulated (scaleX / skewX) on fonts without those axes.
Letter spacing works on every font.

## Put it on GitHub Pages
1. Create a new **public** repo on github.com, e.g. `what-the-font`.
2. Click **Add file → Upload files**, drag in all the files, and **Commit**.
3. Go to **Settings → Pages**. Under *Branch*, pick `main` and `/ (root)`, then **Save**.
4. After about a minute, your site is live at `https://<your-username>.github.io/what-the-font/`.

## API key
- **Never put the key in the code.** The repo is public.
- On the site, open "Add OpenAI API key", paste it and press Save. It's stored only in that browser.
- With no key, the quiz still works: an offline Foundry writes a simpler result.
