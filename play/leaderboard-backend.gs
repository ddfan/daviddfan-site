/**
 * Shared leaderboard backend (Google Apps Script).
 * 1. Create a Google Sheet. Name the first tab "scores" with headers: time, game, name, score
 * 2. Extensions > Apps Script. Paste this file. Deploy > New deployment > Web app.
 *    Execute as: Me. Who has access: Anyone. Copy the web app URL.
 * 3. Put that URL in play/leaderboard.js (LB.url = '...').
 * Note: scores come from the browser, so a determined visitor could fake them.
 */
const LIMITS = { racer: [15, 900], mine: [0, 5000] };   // sane [min, max] per game

function doGet(e) {
  const game = (e.parameter.game || '').toLowerCase();
  const rows = SpreadsheetApp.getActive().getSheetByName('scores').getDataRange().getValues().slice(1)
    .filter(r => String(r[1]).toLowerCase() === game)
    .map(r => ({ name: String(r[2]), score: Number(r[3]) }));
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const game = String(d.game || '').toLowerCase();
  const score = Number(d.score);
  const name = String(d.name || 'anon').replace(/[^\w .\-]/g, '').slice(0, 12) || 'anon';
  const lim = LIMITS[game];
  if (!lim || !isFinite(score) || score < lim[0] || score > lim[1]) {
    return ContentService.createTextOutput('rejected');
  }
  SpreadsheetApp.getActive().getSheetByName('scores').appendRow([new Date(), game, name, score]);
  return ContentService.createTextOutput('ok');
}
