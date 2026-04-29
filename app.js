const baseUrl = "https://sairootsmusic.com";
let indexedUrls = [];
let notIndexedUrls = [];

// 1. FUNGSI KATA SANDI
function checkPassword() {
    const pass = document.getElementById('password-input').value;
    const error = document.getElementById('login-error');
    if (pass === "220599") {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-dashboard').classList.remove('hidden');
        loadDatabase();
    } else {
        error.classList.remove('hidden');
        setTimeout(() => error.classList.add('hidden'), 2000);
    }
}

// 2. FUNGSI GANTI TAB
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    document.querySelectorAll('button[id^="btn-"]').forEach(btn => {
        btn.classList.remove('tab-active'); btn.classList.add('tab-inactive');
    });
    document.getElementById('btn-' + tabId.replace('tab-', '')).classList.replace('tab-inactive', 'tab-active');
}

// 3. TARIK DATA DARI WEBSITE
async function loadDatabase() {
    const listAll = document.getElementById('list-all');
    listAll.innerHTML = '<p class="text-xs text-yellow-500 italic">Menarik database...</p>';
    try {
        const res = await fetch(baseUrl + '/database.js');
        const text = await res.text();
        const dbMatch = text.match(/const sairootsDB = ([\s\S]*?);\s*\/\//);
        const db = eval('(' + dbMatch[1] + ')');
        
        let urls = [];
        db.articles.forEach(a => urls.push({ url: `${baseUrl}/article/${a.id}`, title: a.title, type: 'ART' }));
        db.lyrics.forEach(a => urls.push({ url: `${baseUrl}/lyric/${a.id}`, title: a.title, type: 'LYR' }));
        db.discography.forEach(a => urls.push({ url: `${baseUrl}/discography/${a.id}`, title: a.title, type: 'MSC' }));

        listAll.innerHTML = '';
        urls.forEach((item, i) => {
            listAll.innerHTML += `
                <div class="flex justify-between items-center bg-black border border-white/5 p-3 rounded" id="item-${i}">
                    <div class="w-2/3"><p class="text-xs font-bold truncate">${item.title}</p><p class="text-[9px] text-gray-600 truncate">${item.url}</p></div>
                    <button onclick="autoCheck('${item.url}', ${i}, '${item.title}')" class="bg-blue-600 text-[10px] px-3 py-1 rounded">Cek</button>
                </div>`;
        });
    } catch(e) { listAll.innerHTML = '<p class="text-red-500">Gagal load database.</p>'; }
}

// 4. CEK OTOMATIS DAN PINDAHKAN TAB
async function autoCheck(url, index, title) {
    const log = document.getElementById('output');
    log.innerHTML = `Mengecek: ${title}...`;
    const result = await executeApi(url, 'check', true);

    if(result && result.data && result.data.inspectionResult) {
        const verdict = result.data.inspectionResult.indexStatusResult.verdict;
        if(verdict === "PASS") {
            log.innerHTML = `✔ TERINDEKS: ${title}`;
            if(!indexedUrls.includes(url)) {
                indexedUrls.push(url);
                document.getElementById('list-indexed').innerHTML += `
                    <div class="flex justify-between items-center bg-black p-3 border border-green-900/30 rounded">
                        <div class="w-2/3"><p class="text-xs text-green-500">${title}</p></div>
                        <button onclick="executeApi('${url}', 'delete')" class="bg-red-600 text-[9px] px-2 py-1 rounded">Hapus Index</button>
                    </div>`;
            }
        } else {
            log.innerHTML = `✖ BELUM INDEKS: ${title}`;
            if(!notIndexedUrls.includes(url)) {
                notIndexedUrls.push(url);
                document.getElementById('list-not-indexed').innerHTML += `
                    <div class="flex justify-between items-center bg-black p-3 border border-red-900/30 rounded">
                        <div class="w-2/3"><p class="text-xs text-red-500">${title}</p></div>
                        <button onclick="executeApi('${url}', 'update')" class="bg-green-600 text-[9px] px-2 py-1 rounded">Minta Indeks</button>
                    </div>`;
            }
        }
    }
}

// 5. EKSEKUSI API KE GOOGLE SCRIPT
async function executeApi(url, action, silent = false) {
    const gas = document.getElementById('gas-url').value;
    const log = document.getElementById('output');
    if(!gas || !url) return alert("Lengkapi URL!");

    if(!silent) log.innerHTML = `Memproses ${action}... ⏳`;
    try {
        const res = await fetch(`${gas}?action=${action}&url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if(!silent) log.innerHTML = JSON.stringify(json, null, 2);
        return json;
    } catch(e) { log.innerHTML = "Error: " + e.message; return null; }
}
