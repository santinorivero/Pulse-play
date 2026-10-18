# PULSE — Daily Mind Challenges

A responsive static starter website for PULSE. It includes five playable mini-games, local progress, a daily challenge dashboard, an archive calendar, practice mode, and a clearly labeled PULSE ARENA interface.

## What works in this starter

- Responsive design for phones, tablets, and desktop.
- Color Recall, Time Lock, Size Sense, Reflex Rush, and Pattern Breaker.
- Practice mode for each game.
- Daily challenge score tracking (stored in this browser).
- Archive calendar UI and replay entry point.
- Personal stats and recent scores, stored in browser localStorage.
- Arena UI for private rooms and quick match, with honest messages that the backend is not connected.

## Important limitations

This is **frontend version 0.1**, not the complete online platform yet.

- PULSE ARENA is not live multiplayer. No rooms, matchmaking, synchronized rounds, or server-verified leaderboard exists until a backend is implemented.
- Progress is stored locally in this browser and does not sync between devices.
- The historical archive currently reuses the same current game definitions; it does not yet store a permanent unique set of five challenge questions for every date.
- This is a starter, not a validated production game platform. Test game scoring and improve question sets before public launch.
- No AdSense code is included. Apply only after the site has enough original content and complies with Google policies.

## Run locally

Open `index.html` in a modern browser. Some browser security settings can behave differently when opening files directly; use a static web server if available.

## Deploy with GitHub Pages from Android

1. Create or open your GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, and the `assets/` folder into the repository root.
3. Open repository **Settings → Pages**.
4. Select **Deploy from a branch**, choose branch `main` and folder `/ (root)`, then save.
5. Wait for GitHub Pages to publish and open the URL it provides.

Do not upload server secrets to GitHub. A static GitHub Pages site cannot run backend functions.

## Next development phase: real online multiplayer

Implement a secure backend (for example Supabase plus server-side functions or another authoritative game server) for:
- room creation and joining;
- room membership and authorization;
- synchronized round start/end;
- answer submission and server-side scoring;
- matchmaking queue;
- reconnect/disconnect handling;
- final results and leaderboard;
- database access policies and rate limits.

The server, not browser JavaScript, must be authoritative for competitive scores.
