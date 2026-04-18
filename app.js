const state = {
  channels: [],
};

// --- tab switching ---
document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('tab-' + t.dataset.tab).classList.add('active');
  });
});

// --- builder ---
document.getElementById('channel-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const ch = {
    name: document.getElementById('ch-name').value.trim(),
    streamUrl: document.getElementById('ch-stream').value.trim(),
    logoUrl: document.getElementById('ch-logo').value.trim() || null,
    group: document.getElementById('ch-group').value.trim() || null,
  };
  if (!ch.name || !ch.streamUrl) return;
  state.channels.push(ch);
  renderList();
  e.target.reset();
  document.getElementById('ch-name').focus();
  revealExport();
});

function renderList() {
  const list = document.getElementById('channel-list');
  list.innerHTML = '';
  state.channels.forEach((c, i) => {
    const li = document.createElement('li');
    li.className = 'channel-row';
    li.innerHTML = `
      <img src="${c.logoUrl || ''}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="meta">
        <div class="name"></div>
        <div class="url"></div>
      </div>
      <button class="remove" data-i="${i}">Remove</button>
    `;
    li.querySelector('.name').textContent = c.name + (c.group ? ' · ' + c.group : '');
    li.querySelector('.url').textContent = c.streamUrl;
    list.appendChild(li);
  });
  list.querySelectorAll('.remove').forEach((b) => {
    b.addEventListener('click', () => {
      state.channels.splice(Number(b.dataset.i), 1);
      renderList();
      if (state.channels.length === 0) hideExport();
    });
  });
}

function revealExport() {
  document.getElementById('export-panel').hidden = false;
}

function hideExport() {
  document.getElementById('export-panel').hidden = true;
}

// --- pro tab: parse m3u ---
document.getElementById('pro-fetch').addEventListener('click', async () => {
  const url = document.getElementById('pro-url').value.trim();
  if (!url) return;
  try {
    const res = await fetch(url);
    const text = await res.text();
    document.getElementById('pro-input').value = text;
  } catch (err) {
    alert('Fetch failed: ' + err.message);
  }
});

document.getElementById('pro-parse').addEventListener('click', () => {
  const text = document.getElementById('pro-input').value;
  const parsed = parseM3u(text);
  if (parsed.length === 0) {
    alert('No channels found');
    return;
  }
  state.channels = parsed;
  renderList();
  revealExport();
  // bounce to the builder tab so the user can see / edit the import
  document.querySelector('.tab[data-tab="builder"]').click();
});

function parseM3u(text) {
  const out = [];
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let pending = null;
  for (const line of lines) {
    if (line.startsWith('#EXTM3U')) continue;
    if (line.startsWith('#EXTINF')) {
      pending = parseExtInf(line);
      continue;
    }
    if (line.startsWith('#')) continue;
    if (pending) {
      out.push({
        name: pending.name,
        streamUrl: line,
        logoUrl: pending.logo || null,
        group: pending.group || null,
      });
      pending = null;
    }
  }
  return out;
}

function parseExtInf(line) {
  const comma = line.lastIndexOf(',');
  const name = comma >= 0 ? line.slice(comma + 1).trim() : '';
  const attrs = {};
  const re = /([\w-]+)="([^"]*)"/g;
  let m;
  const scope = comma >= 0 ? line.slice(0, comma) : line;
  while ((m = re.exec(scope))) attrs[m[1]] = m[2];
  return {
    name,
    logo: attrs['tvg-logo'],
    group: attrs['group-title'],
  };
}

// --- m3u text generator ---
function buildM3u() {
  const lines = ['#EXTM3U'];
  for (const c of state.channels) {
    const attrs = [];
    if (c.logoUrl) attrs.push(`tvg-logo="${c.logoUrl}"`);
    if (c.group) attrs.push(`group-title="${c.group}"`);
    const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
    lines.push(`#EXTINF:-1${attrStr},${c.name}`);
    lines.push(c.streamUrl);
  }
  return lines.join('\n') + '\n';
}

// --- download + copy ---
document.getElementById('download-m3u').addEventListener('click', () => {
  const blob = new Blob([buildM3u()], { type: 'application/vnd.apple.mpegurl' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'playlist.m3u';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('copy-m3u').addEventListener('click', async () => {
  await navigator.clipboard.writeText(buildM3u());
  const btn = document.getElementById('copy-m3u');
  const old = btn.textContent;
  btn.textContent = 'Copied';
  setTimeout(() => (btn.textContent = old), 1200);
});

// --- QR generation ---
let qrInstance = null;
document.getElementById('make-qr').addEventListener('click', () => {
  const url = document.getElementById('host-url').value.trim();
  if (!url) return;
  const container = document.getElementById('qr-container');
  container.innerHTML = '';
  qrInstance = new QRCode(container, {
    text: url,
    width: 260,
    height: 260,
    colorDark: '#0b0b0f',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
});
