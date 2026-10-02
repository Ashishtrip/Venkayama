# Push Venkayam site into the user's Stitch project

## Context
The user built the Venkayam India site (React/Vite, `src/App.tsx`) and wants it to replace the contents of their Stitch project `1837821238257896082`. They gave a Stitch API key in chat. Stitch can't import HTML or React. The documented SDK (`@google/stitch-sdk`) and MCP server (`https://stitch.googleapis.com/mcp`) generate screens from text prompts or from an uploaded image. I found no documented tool for deleting a screen.

## Approach (recommended)
1. **Secret handling:** read the key from the `STITCH_API_KEY` env var only. Never write it to a file, the repo or a commit. Tell the user to rotate the key afterwards, since it was pasted in chat.
2. **Screenshots:** capture full-page desktop (1440w) and mobile (390w) screenshots of the running Vite app and save them outside the repo (`/tmp`). Use a headless browser with a short wait so the onion animation has loaded.
3. **Tooling:** run a one-off script in `/tmp` (not committed) that installs `@google/stitch-sdk` there.
   - Connect with `STITCH_API_KEY` and call `stitch.listTools()` first to confirm the real tool names. This includes any delete or import tool newer than the docs I found.
   - Open project `1837821238257896082` by ID. Do not create a new project.
4. **Replace:**
   - If `listTools()` shows a delete-screen tool, delete the old screens first.
   - Otherwise add the new screens with `project.uploadImage()` (desktop and mobile).
   - Optionally refine them with `screen.edit()` prompts (monochrome brutalist, Anton/Chivo/Space Mono, onion logo).
   - Tell the user that old screens must be deleted by hand in the Stitch UI if no delete tool exists.
5. **Report:** list the screen IDs created, whether the old screens were removed, and the project URL.

## Open question
The user declined the clarifying question on method. I'm defaulting to the screenshot upload, which is the closest to the real design. A text-prompt generation is the fallback if upload fails.

## Critical files
- No repo changes. `src/App.tsx` and `public/assets/*` are only read, through the running app.
- Temporary script and screenshots stay in `/tmp`.

## Verification
- `listTools()` succeeds with the key, which confirms authentication.
- The project ID resolves and the new screens appear in it. Check with `project.screens()`, or ask the user to open the project.
- Confirm that `git status` shows no new files and that the key appears nowhere on disk.

Sources: https://github.com/google-labs-code/stitch-sdk, https://sotaaz.com/post/stitch-mcp-api-en
