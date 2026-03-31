// generate.js — reads all data/*.json and builds pages/*.html + index.html
const fs   = require('fs');
const path = require('path');

const dataDir  = path.join(__dirname, 'data');
const pagesDir = path.join(__dirname, 'pages');

if (!fs.existsSync(dataDir)) { console.error('No data/ folder found.'); process.exit(1); }

// Collect all JSON files
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
const teachings = files.map(f => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')));

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Wipe and recreate /pages/
if (fs.existsSync(pagesDir)) fs.rmSync(pagesDir, { recursive: true });
fs.mkdirSync(pagesDir);

teachings.forEach(ch => {
  const defaultView = ch.default_view || 'hi';
  const rows = ch.paragraphs && ch.paragraphs.length
    ? ch.paragraphs.map((p, i) => `
        <tr>
          <td class="para-cell en-cell">${esc(p.en)}</td>
          <td class="para-cell hi-cell">${esc(p.hi)}</td>
        </tr>`).join('')
    : `<tr><td colspan="2" class="empty">Content coming soon...</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(ch.title)}</title>
  <link rel="stylesheet" href="../style.css">
  <meta property="og:title" content="${esc(ch.title)}">
  <meta property="og:description" content="${esc(ch.hinglish_title)}">
  <meta property="og:type" content="article">
</head>
<body>
  <header>
    <a class="back-link" href="../index.html">&larr; Back to Index</a>
    <h1>${esc(ch.title)}</h1>
    <h2 class="hi-heading">${esc(ch.hinglish_title)}</h2>
  </header>

  <div class="toggle-bar">
    <button class="tog-btn" id="btn-en"  onclick="setView('en')">English</button>
    <button class="tog-btn" id="btn-hi"  onclick="setView('hi')">Hinglish</button>
    <button class="tog-btn" id="btn-both" onclick="setView('both')">Both</button>
  </div>

  <main>
    <table id="content-table">
      <thead>
        <tr>
          <th class="en-cell">English</th>
          <th class="hi-cell">Hinglish</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </main>

  <script>
    var _defaultView = '${defaultView}';
    function setView(v) {
      var enCells  = document.querySelectorAll('.en-cell');
      var hiCells  = document.querySelectorAll('.hi-cell');
      enCells.forEach(function(el) { el.style.display = (v === 'hi')   ? 'none' : ''; });
      hiCells.forEach(function(el) { el.style.display = (v === 'en')   ? 'none' : ''; });
      ['btn-en','btn-hi','btn-both'].forEach(function(id) {
        document.getElementById(id).classList.remove('active');
      });
      document.getElementById('btn-' + v).classList.add('active');
    }
    setView(_defaultView);
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(pagesDir, ch.id + '.html'), html);
  console.log('Generated: pages/' + ch.id + '.html');
});

// Rebuild index.html
const navCards = teachings.map(ch => `
  <a class="card" href="pages/${ch.id}.html">
    <span class="card-title">${esc(ch.title)}</span>
    <span class="card-hindi">${esc(ch.hinglish_title)}</span>
  </a>`).join('');

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teachings</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header><h1>Teachings</h1></header>
  <main class="card-grid">${navCards}</main>
</body>
</html>`;

fs.writeFileSync('index.html', indexHtml);
console.log('Rebuilt index.html with ' + teachings.length + ' teachings');
