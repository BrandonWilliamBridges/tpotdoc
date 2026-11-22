# Brandon's Bible games

Copies of three games from the `linkbridges-games` repo (last copied at commit `0e64656`, November 22, 2026), so they play on tpotdoc.com without sending visitors to linkbridges.org. They are linked from the "For youth (& young @ heart!)" list on the churches page, the Friends, Family, & Mentors section of the About page, and the "Where should I start reading the Bible?" answer.

| File | Served at |
| --- | --- |
| `lamp-unto-my-feet.html` | https://tpotdoc.com/games/lamp-unto-my-feet/ |
| `armor-of-light.html` | https://tpotdoc.com/games/armor-of-light/ |
| `watchmen-on-the-walls.html` | https://tpotdoc.com/games/watchmen-on-the-walls/ |

The `.html` files here are kept exactly as they are in `linkbridges-games`. `build.py` (`GAMES` and `build_games()`) makes these changes when it copies them into `docs/games/`:

- Adds this site's tags: canonical URL, robots (noindex until launch), Open Graph, `VideoGame` JSON-LD, favicon and the cookie-free Cloudflare analytics.
- Replaces the Google Fonts links with the self-hosted copies in `fonts/`, because the Privacy page promises no Google Fonts.
- Points the games' home and "all games" links at TPOTDOC instead of `/`, and changes "Made for linkbridges.org" to "Made by Brandon Bridges".
- Keeps the games on the device: on linkbridges.org they offer Sign In (a username and 4-digit passcode) to save progress to its game server at `/api`. This site has no game server, and an account would break the Privacy page's promise that only the Ask & Pray form collects anything, so the build makes the one call to `/api` answer "no connection" without sending anything and hides the Sign In buttons (and changes Watchmen's "Your saved game" note to match). Progress still saves in the browser.
- Adds a visually hidden `<h1>` with the game's name when the page has none (screen readers and search).

## Updating a game

Copy the new file over the old one, then run `./build.sh`. If the build stops with "expected text not found" or "still has", the game's home link, credit line or account wording changed: update that game's `swap` list in `GAMES`. If it stops with "expected one call to the game server", the way the game talks to `/api` changed: re-check `build_games()`. Saved progress on tpotdoc.com is separate from linkbridges.org (each site keeps its own browser storage).

The fonts in `fonts/` are latin subsets of EB Garamond, UnifrakturMaguntia, Baloo 2 and Nunito from Google Fonts (SIL Open Font License).
