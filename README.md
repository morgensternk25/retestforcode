# Eyewitness Memory & Social Media Experiment — Team 4

This is the revised static GitHub Pages project for **Team 4**, the **FIRST** project in **Chain B**.

## Files to keep together in the repository root

- `index.html`
- `styles.css`
- `script.js`
- `accident_stop.mp4`
- `accident_yield.mp4`

The two MP4 files are unchanged and must remain in the repository root with these exact names.

## Team 4 chain and DataPipe configuration

- Team ID: `4`
- Chain ID: `B`
- Position: FIRST
- DataPipe experiment ID: `gZZ1nvUDsmz4`
- Next project: `https://laurenbier.github.io/Memory-on-trial/`

At the beginning of this FIRST project, the page creates one random anonymous session ID. The same ID is written to both CSV files and passed to Team 5 as `sid`, with `chain=B`.

## Automatic saving

When a participant submits the final confidence response, the app:

1. Scores the four memory responses and creates the participant summary and four-row trial CSV.
2. Displays a saving status and posts both CSVs to `https://pipe.jspsych.org/api/data/`.
3. Waits for both files to be accepted (`201` or `202`) before redirecting.
4. If an upload fails, stays on the page and provides a retry button and local CSV backup downloads.

On a manual retry, an HTTP `400` response with `FILE_EXISTS` is treated as success for that file. This supports the case where DataPipe stored a file during an earlier attempt but the browser did not receive the successful response.

Filenames are `summary_<sid>.csv` and `trials_<sid>.csv`. Both CSVs contain `session_id`, `team_id`, and `chain_id`. No participant names, email addresses, passwords, or other direct identifiers are collected.

## Testing and deployment

1. Replace the existing `index.html`, `styles.css`, and `script.js` in the Team 4 GitHub repository with the revised versions.
2. Keep both supplied MP4 files in the repository root.
3. Publish using GitHub Pages from the repository root.
4. Test the live GitHub Pages URL, not only a local file.
5. Complete a test run and confirm that **both** CSV files appear in the Team 4 DataPipe destination.
6. Confirm that the browser redirects to Team 5 with the same `sid` and `chain=B`.
7. Coordinate an end-to-end chain test with Teams 5 and 6 before recruitment.

For local testing, run `python3 -m http.server 8000` from the project folder and open `http://localhost:8000`.

## Experimental design retained

Participants are independently randomized to accurate or misleading post-event information, confirming or neutral feedback, and the STOP-sign or YIELD-sign clip. The four original memory questions, scoring, confidence slider, debrief, and visual design are retained.
