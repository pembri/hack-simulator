/* ============================================
   GSC VIP MANAGER - APP.JS
   Service Account JWT Auth + Indexing API + URL Inspection
   ============================================ */

// ===== CONFIG =====
const CONFIG = {
    CORS_PROXY: 'https://corsproxy.io/?',
    SCOPES: 'https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters.readonly',
    TOKEN_URL: 'https://oauth2.googleapis.com/token',
    INDEXING_API: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
    INSPECTION_API: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    DAILY_LIMIT: 200,
    DELAY_BETWEEN_REQUESTS: 1200 // ms
};

// ===== STATE =====
let STATE = {
    serviceAccount: null,
    accessToken: null,
    tokenExpiry: 0,
    urls: [],
    quotaUsed: 0,
    quotaDate: new Date().toDateString()
};

// ===== UTILITIES =====
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function log(message, type = 'info') {
    const container = $('logContainer');
    const time = new Date().toLocaleTimeString('id-ID');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${time}]</span>${message}`;
    container.insertBefore(entry, container.firstChild);
    
    // Limit log entries
    while (container.children.length > 100) {
        container.removeChild(container.lastChild);
    }
    console.log(`[${type.toUpperCase()}]`, message);
}

function proxyUrl(url) {
    return CONFIG.CORS_PROXY + encodeURIComponent(url);
}

function generateId() {
    return 'url_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== LOCAL STORAGE =====
function saveState() {
    localStorage.setItem('gsc_urls', JSON.stringify(STATE.urls));
    localStorage.setItem('gsc_quota', JSON.stringify({
        used: STATE.quotaUsed,
        date: STATE.quotaDate
    }));
}

function loadState() {
    try {
        const urls = localStorage.getItem('gsc_urls');
        if (urls) STATE.urls = JSON.parse(urls);
        
        const quota = localStorage.getItem('gsc_quota');
        if (quota) {
            const q = JSON.parse(quota);
            // Reset quota if new day
            if (q.date === new Date().toDateString()) {
                STATE.quotaUsed = q.used;
                STATE.quotaDate = q.date;
            } else {
                STATE.quotaUsed = 0;
                STATE.quotaDate = new Date().toDateString();
                saveState();
            }
        }
    } catch (e) {
        log('Failed to load saved state: ' + e.message, 'error');
    }
}

// ===== QUOTA =====
function updateQuotaUI() {
    const percent = (STATE.quotaUsed / CONFIG.DAILY_LIMIT) * 100;
    $('quotaBar').style.width = Math.min(percent, 100) + '%';
    $('quotaUsed').textContent = STATE.quotaUsed;
    $('quotaLimit').textContent = CONFIG.DAILY_LIMIT;
}

function incrementQuota() {
    STATE.quotaUsed++;
    saveState();
    updateQuotaUI();
}

function checkQuota() {
    if (STATE.quotaUsed >= CONFIG.DAILY_LIMIT) {
        log('Daily quota limit reached (200/day)!', 'error');
        return false;
    }
    return true;
}

// ===== JWT SIGNING (RS256) =====
async function getAccessToken() {
    if (!STATE.serviceAccount) {
        throw new Error('Service Account JSON belum diupload!');
    }
    
    // Return cached token if still valid (with 60s buffer)
    if (STATE.accessToken && Date.now() < STATE.tokenExpiry - 60000) {
        return STATE.accessToken;
    }
    
    log('Generating new Access Token via JWT...', 'info');
    
    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: STATE.serviceAccount.private_key_id
    };
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: STATE.serviceAccount.client_email,
        scope: CONFIG.SCOPES,
        aud: CONFIG.TOKEN_URL,
        exp: now + 3600,
        iat: now
    };
    
    // Sign JWT with RS256 using jsrsasign
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const privateKey = STATE.serviceAccount.private_key;
    
    const jwt = KJUR.jws.JWS.sign('RS256', sHeader, sPayload, privateKey);
    
    // Exchange JWT for Access Token
    const response = await fetch(proxyUrl(CONFIG.TOKEN_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });
    
    if (!response.ok) {
        const err = await response.text();
        throw new Error('Token request failed: ' + err);
    }
    
    const data = await response.json();
    STATE.accessToken = data.access_token;
    STATE.tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    log('Access Token berhasil di-generate ✅', 'success');
    return STATE.accessToken;
}

// ===== SERVICE ACCOUNT UPLOAD =====
$('jsonFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const json = JSON.parse(text);
        
        // Validate
        if (!json.private_key || !json.client_email || json.type !== 'service_account') {
            throw new Error('File JSON bukan Service Account yang valid!');
        }
        
        STATE.serviceAccount = json;
        STATE.accessToken = null; // Reset token
        
        const status = $('authStatus');
        status.className = 'status-text success';
        status.innerHTML = `✅ Authenticated: <strong>${json.client_email}</strong>`;
        
        log(`Service Account loaded: ${json.client_email}`, 'success');
        
        // Test token generation
        await getAccessToken();
        
    } catch (err) {
        const status = $('authStatus');
        status.className = 'status-text error';
        status.innerHTML = `❌ Error: ${err.message}`;
        log('Auth error: ' + err.message, 'error');
        STATE.serviceAccount = null;
    }
});

// ===== INDEXING API =====
async function submitToIndexing(url, type = 'URL_UPDATED') {
    if (!checkQuota()) throw new Error('Quota exceeded');
    
    const token = await getAccessToken();
    
    const response = await fetch(proxyUrl(CONFIG.INDEXING_API), {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url, type: type })
    });
    
    incrementQuota();
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
}

// ===== URL INSPECTION API =====
async function inspectUrl(url) {
    if (!checkQuota()) throw new Error('Quota exceeded');
    
    const token = await getAccessToken();
    
    // Extract site URL (origin)
    const urlObj = new URL(url);
    const siteUrl = urlObj.origin + '/';
    
    const response = await fetch(proxyUrl(CONFIG.INSPECTION_API), {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inspectionUrl: url,
            siteUrl: siteUrl
        })
    });
    
    incrementQuota();
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const verdict = data.inspectionResult?.indexStatusResult?.verdict || 'UNKNOWN';
    const coverageState = data.inspectionResult?.indexStatusResult?.coverageState || '';
    
    return {
        verdict: verdict,
        coverage: coverageState,
        isIndexed: verdict === 'PASS'
    };
}

// ===== URL REMOVAL (via Indexing API URL_DELETED) =====
async function removeUrlFromIndex(url) {
    return await submitToIndexing(url, 'URL_DELETED');
}

// ===== TABLE MANAGEMENT =====
function addUrlToTable(url) {
    // Check duplicate
    if (STATE.urls.find(u => u.url === url)) {
        log(`URL sudah ada di tabel: ${url}`, 'warning');
        return null;
    }
    
    const item = {
        id: generateId(),
        url: url,
        apiStatus: 'pending',
        apiMessage: 'Belum disubmit',
        indexStatus: 'pending',
        indexMessage: 'Belum dicek',
        timestamp: Date.now()
    };
    
    STATE.urls.push(item);
    saveState();
    renderTable();
    return item;
}

function updateUrlItem(id, updates) {
    const item = STATE.urls.find(u => u.id === id);
    if (!item) return;
    Object.assign(item, updates);
    saveState();
    renderTable();
}

function deleteUrl(id) {
    STATE.urls = STATE.urls.filter(u => u.id !== id);
    saveState();
    renderTable();
}

function renderTable() {
    const tbody = $('tableBody');
    
    if (STATE.urls.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No URLs added yet. Use the input panels above.</td></tr>`;
        updateStats();
        return;
    }
    
    tbody.innerHTML = STATE.urls.map((item, idx) => `
        <tr data-id="${item.id}">
            <td>${idx + 1}</td>
            <td class="url-cell"><a href="${item.url}" target="_blank" rel="noopener">${item.url}</a></td>
            <td>${renderApiPill(item)}</td>
            <td>${renderIndexPill(item)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="checkSingleUrl('${item.id}')" title="Cek Index">🔍</button>
                    <button class="btn-icon" onclick="resubmitUrl('${item.id}')" title="Submit Index">📤</button>
                    <button class="btn-icon delete" onclick="deleteUrl('${item.id}'); log('URL dihapus dari tabel','info')" title="Hapus Baris">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    updateStats();
}

function renderApiPill(item) {
    const map = {
        'success': `<span class="status-pill pill-success">✅ Success</span>`,
        'error': `<span class="status-pill pill-danger" title="${item.apiMessage}">❌ Error</span>`,
        'pending': `<span class="status-pill pill-pending">⏳ Pending</span>`,
        'loading': `<span class="status-pill pill-warning loading">⏳ Processing...</span>`
    };
    return map[item.apiStatus] || map.pending;
}

function renderIndexPill(item) {
    const map = {
        'indexed': `<span class="status-pill pill-success">TERINDEX ✅</span>`,
        'not_indexed': `<span class="status-pill pill-danger" title="${item.indexMessage}">BELUM TERINDEX ❌</span>`,
        'pending': `<span class="status-pill pill-pending">⏳ Belum Dicek</span>`,
        'loading': `<span class="status-pill pill-warning loading">🔍 Checking...</span>`,
        'error': `<span class="status-pill pill-danger" title="${item.indexMessage}">⚠️ Error</span>`
    };
    return map[item.indexStatus] || map.pending;
}

function updateStats() {
    $('statTotal').textContent = STATE.urls.length;
    $('statIndexed').textContent = STATE.urls.filter(u => u.indexStatus === 'indexed').length;
    $('statNotIndexed').textContent = STATE.urls.filter(u => u.indexStatus === 'not_indexed').length;
    $('statPending').textContent = STATE.urls.filter(u => u.indexStatus === 'pending').length;
}

// ===== ROW ACTIONS =====
window.checkSingleUrl = async function(id) {
    const item = STATE.urls.find(u => u.id === id);
    if (!item) return;
    
    if (!STATE.serviceAccount) {
        log('Upload Service Account JSON terlebih dahulu!', 'error');
        return;
    }
    
    updateUrlItem(id, { indexStatus: 'loading' });
    log(`Checking index status: ${item.url}`, 'info');
    
    try {
        const result = await inspectUrl(item.url);
        updateUrlItem(id, {
            indexStatus: result.isIndexed ? 'indexed' : 'not_indexed',
            indexMessage: result.coverage || result.verdict
        });
        log(`${item.url} → ${result.isIndexed ? 'TERINDEX ✅' : 'BELUM TERINDEX ❌'}`, result.isIndexed ? 'success' : 'warning');
    } catch (err) {
        updateUrlItem(id, { indexStatus: 'error', indexMessage: err.message });
        log(`Inspection error: ${err.message}`, 'error');
    }
};

window.resubmitUrl = async function(id) {
    const item = STATE.urls.find(u => u.id === id);
    if (!item) return;
    
    if (!STATE.serviceAccount) {
        log('Upload Service Account JSON terlebih dahulu!', 'error');
        return;
    }
    
    updateUrlItem(id, { apiStatus: 'loading' });
    log(`Submitting to Indexing API: ${item.url}`, 'info');
    
    try {
        await submitToIndexing(item.url, 'URL_UPDATED');
        updateUrlItem(id, { apiStatus: 'success', apiMessage: 'Submitted successfully' });
        log(`Submitted: ${item.url}`, 'success');
    } catch (err) {
        updateUrlItem(id, { apiStatus: 'error', apiMessage: err.message });
        log(`Submit error: ${err.message}`, 'error');
    }
};

window.deleteUrl = deleteUrl;

// ===== EVENT HANDLERS =====

// Manual Indexing
$('submitManualBtn').addEventListener('click', async () => {
    const url = $('manualUrl').value.trim();
    if (!url) return alert('Masukkan URL terlebih dahulu!');
    if (!STATE.serviceAccount) return alert('Upload Service Account JSON dulu!');
    
    const item = addUrlToTable(url);
    if (!item) return;
    
    $('manualUrl').value = '';
    await window.resubmitUrl(item.id);
});

// Sitemap Bulk Load
$('loadSitemapBtn').addEventListener('click', async () => {
    const sitemapUrl = $('sitemapUrl').value.trim();
    if (!sitemapUrl) return alert('Masukkan URL sitemap!');
    
    log(`Loading sitemap: ${sitemapUrl}`, 'info');
    
    try {
        const response = await fetch(proxyUrl(sitemapUrl));
        if (!response.ok) throw new Error('Failed to fetch sitemap');
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Check if it's a sitemap index
        const sitemapElements = xmlDoc.querySelectorAll('sitemap > loc');
        let allUrls = [];
        
        if (sitemapElements.length > 0) {
            log(`Sitemap index detected, scanning ${sitemapElements.length} sub-sitemaps...`, 'info');
            for (const loc of sitemapElements) {
                try {
                    const subResp = await fetch(proxyUrl(loc.textContent.trim()));
                    const subText = await subResp.text();
                    const subDoc = parser.parseFromString(subText, 'text/xml');
                    const subUrls = subDoc.querySelectorAll('url > loc');
                    subUrls.forEach(u => allUrls.push(u.textContent.trim()));
                } catch (e) {
                    log(`Failed sub-sitemap: ${e.message}`, 'error');
                }
            }
        } else {
            const urlElements = xmlDoc.querySelectorAll('url > loc');
            urlElements.forEach(u => allUrls.push(u.textContent.trim()));
        }
        
        if (allUrls.length === 0) {
            log('Tidak ada URL ditemukan di sitemap', 'warning');
            return;
        }
        
        let added = 0;
        allUrls.forEach(url => {
            if (addUrlToTable(url)) added++;
        });
        
        log(`Sitemap loaded: ${added} URL baru ditambahkan (total ${allUrls.length} ditemukan)`, 'success');
        $('sitemapUrl').value = '';
        
    } catch (err) {
        log(`Sitemap error: ${err.message}`, 'error');
        alert('Gagal load sitemap: ' + err.message);
    }
});

// URL Removal
$('removeUrlBtn').addEventListener('click', async () => {
    const url = $('removeUrl').value.trim();
    if (!url) return alert('Masukkan URL untuk dihapus!');
    if (!STATE.serviceAccount) return alert('Upload Service Account JSON dulu!');
    if (!confirm(`Yakin hapus URL ini dari Google Index?\n${url}`)) return;
    
    log(`Requesting URL removal: ${url}`, 'warning');
    
    try {
        await removeUrlFromIndex(url);
        log(`URL removal request submitted: ${url}`, 'success');
        alert('URL removal request berhasil dikirim ke Google!');
        $('removeUrl').value = '';
    } catch (err) {
        log(`Removal error: ${err.message}`, 'error');
        alert('Gagal: ' + err.message);
    }
});

// SCAN ALL INDEX STATUS - FITUR UTAMA (LANJUTAN)
$('scanAllBtn').addEventListener('click', async () => {
    if (!STATE.serviceAccount) return alert('Upload Service Account JSON dulu!');
    if (STATE.urls.length === 0) return alert('Tabel kosong! Tambahkan URL dulu.');
    if (!confirm(`Scan ${STATE.urls.length} URL? Ini akan menggunakan kuota API.`)) return;
    
    const btn = $('scanAllBtn');
    btn.disabled = true;
    
    const total = STATE.urls.length;
    let processed = 0;
    
    showProgress('Scanning Index Status', total);
    log(`=== Starting bulk scan: ${total} URLs ===`, 'info');
    
    for (const item of STATE.urls) {
        if (!checkQuota()) {
            log('Quota habis, scan dihentikan!', 'error');
            break;
        }
        
        updateUrlItem(item.id, { indexStatus: 'loading' });
        
        try {
            const result = await inspectUrl(item.url);
            updateUrlItem(item.id, {
                indexStatus: result.isIndexed ? 'indexed' : 'not_indexed',
                indexMessage: result.coverage || result.verdict
            });
            log(`[${processed + 1}/${total}] ${item.url} → ${result.isIndexed ? 'TERINDEX ✅' : 'BELUM TERINDEX ❌'}`, result.isIndexed ? 'success' : 'warning');
        } catch (err) {
            updateUrlItem(item.id, { indexStatus: 'error', indexMessage: err.message });
            log(`[${processed + 1}/${total}] Error: ${err.message}`, 'error');
        }
        
        processed++;
        updateProgress(processed, total);
        await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
    }
    
    hideProgress();
    btn.disabled = false;
    log(`=== Bulk scan complete: ${processed}/${total} processed ===`, 'success');
    alert(`Scan selesai! ${processed} URL telah diperiksa.`);
});

// SUBMIT ALL URLs - Bulk Indexing
$('submitAllBtn').addEventListener('click', async () => {
    if (!STATE.serviceAccount) return alert('Upload Service Account JSON dulu!');
    if (STATE.urls.length === 0) return alert('Tabel kosong!');
    if (!confirm(`Submit ${STATE.urls.length} URL ke Indexing API?`)) return;
    
    const btn = $('submitAllBtn');
    btn.disabled = true;
    
    const total = STATE.urls.length;
    let processed = 0;
    
    showProgress('Submitting to Indexing API', total);
    log(`=== Bulk submit started: ${total} URLs ===`, 'info');
    
    for (const item of STATE.urls) {
        if (!checkQuota()) {
            log('Quota habis!', 'error');
            break;
        }
        
        updateUrlItem(item.id, { apiStatus: 'loading' });
        
        try {
            await submitToIndexing(item.url, 'URL_UPDATED');
            updateUrlItem(item.id, { apiStatus: 'success', apiMessage: 'Submitted' });
            log(`[${processed + 1}/${total}] Submitted: ${item.url}`, 'success');
        } catch (err) {
            updateUrlItem(item.id, { apiStatus: 'error', apiMessage: err.message });
            log(`[${processed + 1}/${total}] Failed: ${err.message}`, 'error');
        }
        
        processed++;
        updateProgress(processed, total);
        await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
    }
    
    hideProgress();
    btn.disabled = false;
    log(`=== Bulk submit complete ===`, 'success');
    alert(`Submit selesai! ${processed}/${total} URL diproses.`);
});

// CLEAR ALL
$('clearAllBtn').addEventListener('click', () => {
    if (STATE.urls.length === 0) return;
    if (!confirm(`Hapus semua ${STATE.urls.length} URL dari tabel?`)) return;
    STATE.urls = [];
    saveState();
    renderTable();
    log('Tabel dikosongkan', 'warning');
});

// EXPORT CSV
$('exportBtn').addEventListener('click', () => {
    if (STATE.urls.length === 0) return alert('Tabel kosong!');
    
    const headers = ['No', 'URL', 'API Status', 'API Message', 'Index Status', 'Index Message', 'Timestamp'];
    const rows = STATE.urls.map((item, idx) => [
        idx + 1,
        item.url,
        item.apiStatus,
        item.apiMessage,
        item.indexStatus,
        item.indexMessage,
        new Date(item.timestamp).toISOString()
    ]);
    
    const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsc_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    log('CSV exported', 'success');
});

// RESET QUOTA
$('resetQuotaBtn').addEventListener('click', () => {
    if (!confirm('Reset counter kuota? (Hanya reset hitungan lokal, bukan kuota Google)')) return;
    STATE.quotaUsed = 0;
    STATE.quotaDate = new Date().toDateString();
    saveState();
    updateQuotaUI();
    log('Quota counter direset', 'info');
});

// ===== PROGRESS BAR =====
function showProgress(text, total) {
    $('progressContainer').classList.remove('hidden');
    $('progressText').textContent = text;
    $('progressCount').textContent = `0/${total}`;
    $('progressBar').style.width = '0%';
}

function updateProgress(current, total) {
    const percent = (current / total) * 100;
    $('progressBar').style.width = percent + '%';
    $('progressCount').textContent = `${current}/${total}`;
}

function hideProgress() {
    setTimeout(() => $('progressContainer').classList.add('hidden'), 1500);
}

// ===== ENTER KEY HANDLERS =====
$('manualUrl').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') $('submitManualBtn').click();
});
$('sitemapUrl').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') $('loadSitemapBtn').click();
});
$('removeUrl').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') $('removeUrlBtn').click();
});

// ===== INIT =====
function init() {
    loadState();
    renderTable();
    updateQuotaUI();
    log('🔥 GSC VIP Manager initialized', 'success');
    log('Upload Service Account JSON untuk mulai', 'info');
    
    // Check jsrsasign loaded
    if (typeof KJUR === 'undefined') {
        log('⚠️ jsrsasign library gagal dimuat! Cek koneksi internet.', 'error');
    }
}

// Run on load
document.addEventListener('DOMContentLoaded', init);
