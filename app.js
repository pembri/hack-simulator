// ═══════════════════════════════════════════
// HACKEROS v2.0 — app.js
// ═══════════════════════════════════════════

const CORRECT_PIN = "220599";
let pinValue = "";
let matrixOn = true;
let soundOn = false;
let uptimeSeconds = 0;
let matrixAnimId = null;
let audioCtx = null;

// ─────────────────────────────────────────
// SPLASH SCREEN
// ─────────────────────────────────────────
const splashLines = [
  { text: "Initializing HackerOS v2.0...", color: "t-green" },
  { text: "Loading kernel modules...", color: "t-dim" },
  { text: "Mounting encrypted filesystem...", color: "t-dim" },
  { text: "Establishing secure tunnel...", color: "t-cyan" },
  { text: "Bypassing firewall layer 1...", color: "t-dim" },
  { text: "Bypassing firewall layer 2...", color: "t-dim" },
  { text: "[OK] Firewall bypassed", color: "t-green" },
  { text: "Loading exploit modules...", color: "t-dim" },
  { text: "[OK] 47 modules loaded", color: "t-green" },
  { text: "Connecting to C2 server...", color: "t-cyan" },
  { text: "[OK] C2 connected: 185.220.101.47", color: "t-green" },
  { text: "Decrypting payload database...", color: "t-dim" },
  { text: "[OK] 1,337 payloads ready", color: "t-green" },
  { text: "Starting HackerOS interface...", color: "t-cyan" },
  { text: ">>> SYSTEM READY <<<", color: "t-yellow" },
];

async function runSplash() {
  const terminal = document.getElementById("splashTerminal");
  const bar = document.getElementById("splashBar");
  const pct = document.getElementById("splashPct");

  for (let i = 0; i < splashLines.length; i++) {
    await sleep(randomBetween(80, 300));
    const span = document.createElement("div");
    span.className = splashLines[i].color;
    span.textContent = splashLines[i].text;
    terminal.appendChild(span);
    terminal.scrollTop = terminal.scrollHeight;

    const progress = Math.round(((i + 1) / splashLines.length) * 100);
    bar.style.width = progress + "%";
    pct.textContent = progress + "%";
  }

  await sleep(800);
  document.getElementById("splashScreen").style.opacity = "0";
  document.getElementById("splashScreen").style.transition = "opacity 0.5s";
  await sleep(500);
  document.getElementById("splashScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
}

// ─────────────────────────────────────────
// PIN / LOGIN
// ─────────────────────────────────────────
function pinInput(num) {
  if (pinValue.length >= 6) return;
  pinValue += num;
  updateDots();
  playClick();

  if (pinValue.length === 6) {
    setTimeout(checkPin, 200);
  }
}

function pinDel() {
  pinValue = pinValue.slice(0, -1);
  updateDots();
}

function pinClear() {
  pinValue = "";
  updateDots();
  document.getElementById("pinError").textContent = "";
}

function updateDots() {
  for (let i = 0; i < 6; i++) {
    const dot = document.getElementById("dot" + i);
    dot.classList.toggle("filled", i < pinValue.length);
    dot.classList.remove("error");
  }
}

function checkPin() {
  if (pinValue === CORRECT_PIN) {
    for (let i = 0; i < 6; i++) {
      document.getElementById("dot" + i).style.background = "var(--cyan)";
      document.getElementById("dot" + i).style.borderColor = "var(--cyan)";
    }
    setTimeout(() => {
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("mainOS").style.display = "flex";
      initOS();
    }, 500);
  } else {
    for (let i = 0; i < 6; i++) {
      document.getElementById("dot" + i).classList.add("error");
    }
    document.getElementById("pinError").textContent = "// ACCESS DENIED";
    setTimeout(() => {
      pinValue = "";
      updateDots();
      document.getElementById("pinError").textContent = "";
    }, 1000);
  }
}

// ─────────────────────────────────────────
// INIT OS
// ─────────────────────────────────────────
function initOS() {
  startMatrix();
  startClock();
  startStats();
  startUptime();
  startGlitch();
}

// ─────────────────────────────────────────
// MATRIX RAIN
// ─────────────────────────────────────────
function startMatrix() {
  const canvas = document.getElementById("matrixCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const cols = Math.floor(canvas.width / 16);
  const drops = Array(cols).fill(1);

  function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ff41";
    ctx.font = "14px Share Tech Mono";

    for (let i = 0; i < drops.length; i++) {
      const char = String.fromCharCode(0x30A0 + Math.random() * 96);
      ctx.fillText(char, i * 16, drops[i] * 16);
      if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  matrixAnimId = setInterval(draw, 50);

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

function toggleMatrix() {
  const canvas = document.getElementById("matrixCanvas");
  const btn = document.getElementById("btnMatrix");
  matrixOn = !matrixOn;
  canvas.style.opacity = matrixOn ? "0.07" : "0";
  btn.classList.toggle("active", matrixOn);
}

// ─────────────────────────────────────────
// CLOCK & STATS
// ─────────────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    document.getElementById("tbClock").textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

function startStats() {
  setInterval(() => {
    document.getElementById("tbCpu").textContent = randomBetween(12, 89) + "%";
    document.getElementById("tbRam").textContent = randomBetween(34, 78) + "%";
    document.getElementById("tbNet").textContent = randomBetween(10, 999) + "kb/s";
  }, randomBetween(1500, 3000));
}

function startUptime() {
  setInterval(() => {
    uptimeSeconds++;
    const m = String(Math.floor(uptimeSeconds / 60)).padStart(2, "0");
    const s = String(uptimeSeconds % 60).padStart(2, "0");
    document.getElementById("sysUptime").textContent = `${m}:${s}`;
  }, 1000);
}

// ─────────────────────────────────────────
// GLITCH EFFECT
// ─────────────────────────────────────────
function startGlitch() {
  function triggerGlitch() {
    const overlay = document.getElementById("glitchOverlay");
    overlay.classList.add("glitch-active");
    setTimeout(() => overlay.classList.remove("glitch-active"), 150);
    setTimeout(triggerGlitch, randomBetween(3000, 12000));
  }
  setTimeout(triggerGlitch, randomBetween(3000, 8000));
}

// ─────────────────────────────────────────
// SOUND
// ─────────────────────────────────────────
function toggleSound() {
  soundOn = !soundOn;
  document.getElementById("btnSound").textContent = soundOn ? "SOUND ON" : "SOUND OFF";
  document.getElementById("btnSound").classList.toggle("active", soundOn);
  if (soundOn && !audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playClick() {
  if (!soundOn || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = randomBetween(200, 800);
  osc.type = "square";
  gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

function playBeep(freq = 440, duration = 0.1) {
  if (!soundOn || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// ─────────────────────────────────────────
// TOOL SWITCHER
// ─────────────────────────────────────────
function showTool(id, el) {
  document.querySelectorAll(".tool-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
  document.getElementById("tool-" + id).classList.add("active");
  if (el) el.classList.add("active");
}

// ─────────────────────────────────────────
// HELPER: Type lines into terminal
// ─────────────────────────────────────────
async function typeLines(containerId, lines, clearFirst = false) {
  const el = document.getElementById(containerId);
  if (clearFirst) el.innerHTML = "";

  for (const line of lines) {
    await sleep(line.delay || randomBetween(80, 400));
    const span = document.createElement("div");
    span.className = "t-line " + (line.color || "t-green");
    span.textContent = line.text;
    el.appendChild(span);
    el.scrollTop = el.scrollHeight;
    playClick();
  }
}

// ─────────────────────────────────────────
// HELPER: Animate progress bar
// ─────────────────────────────────────────
async function animateProgress(fillId, pctId, labelId, labelText, durationMs) {
  const fill = document.getElementById(fillId);
  const pct = document.getElementById(pctId);
  const label = document.getElementById(labelId);

  label.textContent = labelText;
  let current = 0;
  const steps = randomBetween(60, 120);
  const stepDelay = durationMs / steps;

  for (let i = 0; i <= steps; i++) {
    await sleep(stepDelay + randomBetween(-10, 30));
    current = Math.min(100, Math.round((i / steps) * 100));

    // Simulasi "loading macet" sesekali
    if (Math.random() < 0.08) {
      await sleep(randomBetween(300, 900));
    }

    fill.style.width = current + "%";
    pct.textContent = current + "%";
    playBeep(200 + current * 3, 0.03);
  }
}

// ─────────────────────────────────────────
// 1. AUTO TERMINAL
// ─────────────────────────────────────────
const scenarios = {
  hackserver: [
    { text: "root@hackeros:~$ ./exploit.sh --target 192.168.1.105", color: "t-cyan" },
    { text: "[*] Initializing exploit framework...", color: "t-dim" },
    { text: "[*] Scanning open ports...", color: "t-dim" },
    { text: "[+] Port 22 (SSH) OPEN", color: "t-green" },
    { text: "[+] Port 80 (HTTP) OPEN", color: "t-green" },
    { text: "[+] Port 443 (HTTPS) OPEN", color: "t-green" },
    { text: "[+] Port 3306 (MySQL) OPEN", color: "t-yellow" },
    { text: "[*] Detecting OS fingerprint...", color: "t-dim" },
    { text: "[+] Target OS: Ubuntu 20.04 LTS (Linux 5.4.0)", color: "t-green" },
    { text: "[*] Loading CVE-2023-4911 (Looney Tunables)...", color: "t-dim" },
    { text: "[*] Crafting payload...", color: "t-dim" },
    { text: "[*] Sending exploit to 192.168.1.105:22...", color: "t-cyan" },
    { text: "...", color: "t-dim", delay: 1200 },
    { text: "...", color: "t-dim", delay: 900 },
    { text: "[+] Buffer overflow triggered!", color: "t-green" },
    { text: "[+] Privilege escalation successful", color: "t-green" },
    { text: "[+] Shell obtained: root@target:~#", color: "t-yellow" },
    { text: "root@target:~# whoami", color: "t-cyan", delay: 600 },
    { text: "root", color: "t-green" },
    { text: "root@target:~# cat /etc/shadow", color: "t-cyan", delay: 400 },
    { text: "root:$6$xyz$abc123....:18000:0:99999:7:::", color: "t-dim" },
    { text: "admin:$6$def$xyz789....:18200:0:99999:7:::", color: "t-dim" },
    { text: "[+] Credentials extracted successfully", color: "t-green" },
    { text: "[+] Installing backdoor...", color: "t-yellow" },
    { text: "[+] COMPLETE — Target compromised ✓", color: "t-green" },
  ],
  crackpass: [
    { text: "root@hackeros:~$ hashcat -m 0 hash.txt wordlist.txt", color: "t-cyan" },
    { text: "[*] Initializing Hashcat v6.2.6...", color: "t-dim" },
    { text: "[*] Loading wordlist: rockyou.txt (14,344,391 words)", color: "t-dim" },
    { text: "[*] Hash type: MD5", color: "t-dim" },
    { text: "[*] Device: NVIDIA RTX 4090 (24GB)", color: "t-green" },
    { text: "[*] Speed: 45,231 MH/s", color: "t-cyan" },
    { text: "Progress: [=========>         ] 47%", color: "t-dim", delay: 800 },
    { text: "Progress: [==============>    ] 71%", color: "t-dim", delay: 1000 },
    { text: "Progress: [==================>] 99%", color: "t-dim", delay: 1200 },
    { text: "[+] CRACKED: 5f4dcc3b5aa765d61d8327deb882cf99 → password123", color: "t-green" },
    { text: "[+] CRACKED: e10adc3949ba59abbe56e057f20f883e → 123456", color: "t-green" },
    { text: "[+] CRACKED: 827ccb0eea8a706c4c34a16891f84e7b → 12345", color: "t-green" },
    { text: "[+] Session complete: 3/3 hashes cracked (100%)", color: "t-yellow" },
  ],
  traceip: [
    { text: "root@hackeros:~$ traceroute --deanon 203.0.113.42", color: "t-cyan" },
    { text: "[*] Initiating deep packet trace...", color: "t-dim" },
    { text: "1  10.0.0.1        0.412 ms", color: "t-dim" },
    { text: "2  100.64.0.1      1.234 ms", color: "t-dim" },
    { text: "3  172.16.0.1      3.891 ms", color: "t-dim" },
    { text: "4  203.0.113.1    12.445 ms", color: "t-dim" },
    { text: "5  203.0.113.42   15.882 ms  TARGET REACHED", color: "t-yellow" },
    { text: "[*] Geolocating IP...", color: "t-dim" },
    { text: "[+] IP: 203.0.113.42", color: "t-green" },
        { text: "[+] Country: United States", color: "t-green" },
    { text: "[+] City: Los Angeles, CA", color: "t-green" },
    { text: "[+] ISP: Comcast Cable", color: "t-green" },
    { text: "[+] Lat/Long: 34.0522° N, 118.2437° W", color: "t-cyan" },
    { text: "[+] Timezone: America/Los_Angeles", color: "t-dim" },
    { text: "[*] Resolving hostname...", color: "t-dim" },
    { text: "[+] Hostname: host-203-0-113-42.comcast.net", color: "t-green" },
    { text: "[*] Scanning associated accounts...", color: "t-dim" },
    { text: "[+] Email leak found: j**n.d**@gmail.com", color: "t-yellow" },
    { text: "[+] Phone leak found: +1-310-***-4521", color: "t-yellow" },
    { text: "[+] OSINT complete — Target identified ✓", color: "t-green" },
  ],
  stealthmode: [
    { text: "root@hackeros:~$ ./stealth.sh --activate", color: "t-cyan" },
    { text: "[*] Activating stealth protocols...", color: "t-dim" },
    { text: "[+] MAC address spoofed: DE:AD:BE:EF:CA:FE", color: "t-green" },
    { text: "[+] IP randomized via Tor exit node", color: "t-green" },
    { text: "[+] DNS over HTTPS enabled", color: "t-green" },
    { text: "[+] Browser fingerprint randomized", color: "t-green" },
    { text: "[*] Routing through 7-hop proxy chain...", color: "t-dim" },
    { text: "    HOP 1 → 45.33.32.156 (US)", color: "t-dim" },
    { text: "    HOP 2 → 185.220.101.3 (DE)", color: "t-dim" },
    { text: "    HOP 3 → 91.108.4.1 (NL)", color: "t-dim" },
    { text: "    HOP 4 → 194.165.16.5 (RU)", color: "t-dim" },
    { text: "    HOP 5 → 103.35.74.1 (SG)", color: "t-dim" },
    { text: "    HOP 6 → 196.216.2.1 (ZA)", color: "t-dim" },
    { text: "    HOP 7 → 200.143.32.1 (BR)", color: "t-dim" },
    { text: "[+] Identity completely masked", color: "t-green" },
    { text: "[+] Stealth mode ACTIVE ✓", color: "t-yellow" },
  ],
  databreach: [
    { text: "root@hackeros:~$ ./breach.py --target corp-db.internal", color: "t-cyan" },
    { text: "[*] Connecting to target database...", color: "t-dim" },
    { text: "[+] Connection established via SQL injection", color: "t-green" },
    { text: "[*] Enumerating tables...", color: "t-dim" },
    { text: "[+] Found: users (48,291 rows)", color: "t-green" },
    { text: "[+] Found: transactions (1,204,847 rows)", color: "t-green" },
    { text: "[+] Found: credentials (48,291 rows)", color: "t-yellow" },
    { text: "[*] Extracting data...", color: "t-dim", delay: 1000 },
    { text: "[+] Dumping users table...", color: "t-dim" },
    { text: "[+] Dumping credentials table...", color: "t-dim" },
    { text: "[+] 48,291 records extracted", color: "t-green" },
    { text: "[+] Data saved to: /tmp/breach_20240501.sql", color: "t-cyan" },
    { text: "[+] Exfiltration complete ✓", color: "t-green" },
  ],
  ransomware: [
    { text: "root@hackeros:~$ ./ransom.sh --deploy --target 10.0.0.0/24", color: "t-cyan" },
    { text: "[*] Scanning network 10.0.0.0/24...", color: "t-dim" },
    { text: "[+] Found 24 active hosts", color: "t-green" },
    { text: "[*] Deploying ransomware payload...", color: "t-dim" },
    { text: "[*] Encrypting files on 10.0.0.12...", color: "t-red" },
    { text: "[*] Encrypting files on 10.0.0.15...", color: "t-red" },
    { text: "[*] Encrypting files on 10.0.0.23...", color: "t-red" },
    { text: "[+] 24/24 hosts encrypted", color: "t-yellow" },
    { text: "[*] Dropping ransom note: README_DECRYPT.txt", color: "t-dim" },
    { text: "[+] Bitcoin wallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf", color: "t-cyan" },
    { text: "[+] Ransom: 2.5 BTC (~$97,500)", color: "t-yellow" },
    { text: "[+] Ransomware deployed successfully ✓", color: "t-red" },
  ],
};

let terminalRunning = false;

async function startTerminal() {
  if (terminalRunning) return;
  terminalRunning = true;

  const scenario = document.getElementById("termScenario").value;
  const lines = scenarios[scenario];
  const body = document.getElementById("terminalBody");
  body.innerHTML = "";

  await typeLines("terminalBody", lines);
  terminalRunning = false;
}

function clearTerminal() {
  document.getElementById("terminalBody").innerHTML =
    '<div class="placeholder-text">// Select a scenario and click RUN</div>';
  terminalRunning = false;
}

// ─────────────────────────────────────────
// 2. IP TRACER
// ─────────────────────────────────────────
const fakeGeoData = [
  { country: "United States", city: "New York, NY", isp: "Verizon Fios", lat: "40.7128° N", lon: "74.0060° W", tz: "America/New_York" },
  { country: "Germany", city: "Berlin", isp: "Deutsche Telekom", lat: "52.5200° N", lon: "13.4050° E", tz: "Europe/Berlin" },
  { country: "Japan", city: "Tokyo", isp: "NTT Communications", lat: "35.6762° N", lon: "139.6503° E", tz: "Asia/Tokyo" },
  { country: "Russia", city: "Moscow", isp: "Rostelecom", lat: "55.7558° N", lon: "37.6173° E", tz: "Europe/Moscow" },
  { country: "Brazil", city: "São Paulo", isp: "Claro Brasil", lat: "23.5505° S", lon: "46.6333° W", tz: "America/Sao_Paulo" },
  { country: "Indonesia", city: "Jakarta", isp: "Telkom Indonesia", lat: "6.2088° S", lon: "106.8456° E", tz: "Asia/Jakarta" },
  { country: "China", city: "Shanghai", isp: "China Telecom", lat: "31.2304° N", lon: "121.4737° E", tz: "Asia/Shanghai" },
  { country: "United Kingdom", city: "London", isp: "BT Group", lat: "51.5074° N", lon: "0.1278° W", tz: "Europe/London" },
];

const fakeEmails = ["j**n.d**@gmail.com","m**k.s**@yahoo.com","a**x.k**@hotmail.com","r**t@protonmail.com","u**r.h**@outlook.com"];
const fakePhones = ["+1-646-***-8821","+49-30-***-4491","+81-3-***-2210","+62-21-***-9900","+44-20-***-3341"];

let ipRunning = false;

async function startIpTrace() {
  if (ipRunning) return;
  const ip = document.getElementById("ipInput").value.trim() || "192.168." + randomBetween(1,254) + "." + randomBetween(1,254);
  ipRunning = true;

  const geo = fakeGeoData[Math.floor(Math.random() * fakeGeoData.length)];
  const hops = randomBetween(5, 9);
  const email = fakeEmails[Math.floor(Math.random() * fakeEmails.length)];
  const phone = fakePhones[Math.floor(Math.random() * fakePhones.length)];

  const lines = [
    { text: `root@hackeros:~$ traceroute --deanon ${ip}`, color: "t-cyan" },
    { text: "[*] Initiating deep packet trace...", color: "t-dim" },
  ];

  for (let i = 1; i <= hops; i++) {
    const hopIp = randomBetween(1,254)+"."+randomBetween(1,254)+"."+randomBetween(1,254)+"."+randomBetween(1,254);
    const ms = (i * randomBetween(2,15) + Math.random()).toFixed(3);
    lines.push({ text: `  ${i}  ${hopIp.padEnd(18)} ${ms} ms ${i === hops ? " TARGET REACHED" : ""}`, color: i === hops ? "t-yellow" : "t-dim" });
  }

  lines.push(
    { text: "[*] Geolocating IP...", color: "t-dim" },
    { text: `[+] IP       : ${ip}`, color: "t-green" },
    { text: `[+] Country  : ${geo.country}`, color: "t-green" },
    { text: `[+] City     : ${geo.city}`, color: "t-green" },
    { text: `[+] ISP      : ${geo.isp}`, color: "t-green" },
    { text: `[+] Lat/Long : ${geo.lat}, ${geo.lon}`, color: "t-cyan" },
    { text: `[+] Timezone : ${geo.tz}`, color: "t-dim" },
    { text: "[*] Scanning OSINT databases...", color: "t-dim" },
    { text: `[+] Email leak  : ${email}`, color: "t-yellow" },
    { text: `[+] Phone leak  : ${phone}`, color: "t-yellow" },
    { text: "[+] OSINT complete — Target identified ✓", color: "t-green" },
  );

  await typeLines("ipBody", lines, true);
  ipRunning = false;
}

// ─────────────────────────────────────────
// 3. PASSWORD CRACKER
// ─────────────────────────────────────────
const crackedPasswords = [
  "password123","123456","qwerty","letmein","monkey","dragon",
  "master","iloveyou","sunshine","princess","welcome1","admin@123",
];

const dictWords = ["rockyou.txt","darkweb2023.txt","linkedin_leak.txt","adobe_dump.txt"];

let pwRunning = false;

async function startPwCracker() {
  if (pwRunning) return;
  pwRunning = true;

  const target = document.getElementById("pwTarget").value.trim() || "admin";
  const method = document.getElementById("pwMethod").value;
  const body = document.getElementById("pwBody");
  body.innerHTML = "";

  const wrap = document.getElementById("pwProgressWrap");
  wrap.style.display = "block";

  const duration = randomBetween(6000, 14000);
  const cracked = crackedPasswords[Math.floor(Math.random() * crackedPasswords.length)];
  const fakeHash = randomHex(32);

  const initLines = [
    { text: `root@hackeros:~$ crack --user ${target} --method ${method}`, color: "t-cyan" },
    { text: `[*] Target user   : ${target}`, color: "t-dim" },
    { text: `[*] Hash extracted: ${fakeHash}`, color: "t-dim" },
    { text: `[*] Hash type     : MD5`, color: "t-dim" },
    { text: `[*] Method        : ${method.toUpperCase()}`, color: "t-dim" },
  ];

  if (method === "dictionary") {
    initLines.push({ text: `[*] Wordlist: ${dictWords[Math.floor(Math.random() * dictWords.length)]}`, color: "t-dim" });
  } else if (method === "rainbow") {
    initLines.push({ text: "[*] Loading rainbow tables (12.4 GB)...", color: "t-dim" });
  } else {
    initLines.push({ text: `[*] Charset: a-z A-Z 0-9 !@#$%`, color: "t-dim" });
    initLines.push({ text: `[*] Speed  : ${randomBetween(10000,99999)} MH/s`, color: "t-dim" });
  }

  initLines.push({ text: "[*] Starting attack...", color: "t-yellow" });

  await typeLines("pwBody", initLines);

  await animateProgress("pwProgressFill", "pwProgressPct", "pwProgressLabel", "Cracking password...", duration);

  const finalLines = [
    { text: `[+] CRACKED: ${fakeHash} → ${cracked}`, color: "t-green", delay: 200 },
    { text: `[+] Password: ${cracked}`, color: "t-yellow", delay: 100 },
    { text: "[+] Attack complete ✓", color: "t-green", delay: 200 },
  ];

  await typeLines("pwBody", finalLines);
  wrap.style.display = "none";
  pwRunning = false;
}

// ─────────────────────────────────────────
// 4. DB BREACH
// ─────────────────────────────────────────
const fakeUsers = [
  ["john.doe@gmail.com",    "192.168.1.10", "$2y$10$abc123xyz", "2024-01-15"],
  ["mary.jane@yahoo.com",   "10.0.0.45",   "$2y$10$def456uvw", "2024-02-20"],
  ["admin@corp.com",        "172.16.0.1",  "$2y$10$ghi789rst", "2024-03-01"],
  ["alex.k@hotmail.com",    "192.168.0.5", "$2y$10$jkl012mno", "2024-01-30"],
  ["root@internal.net",     "127.0.0.1",   "$2y$10$pqr345stu", "2023-12-10"],
];

let dbRunning = false;

async function startDbBreach() {
  if (dbRunning) return;
  dbRunning = true;

  const target = document.getElementById("dbTarget").value.trim() || "target-corp.com";
  const body = document.getElementById("dbBody");
  body.innerHTML = "";

  const wrap = document.getElementById("dbProgressWrap");
  wrap.style.display = "block";

  const totalRows = randomBetween(10000, 250000);
  const duration = randomBetween(7000, 15000);

  const initLines = [
    { text: `root@hackeros:~$ sqlmap -u https://${target}/api --dump`, color: "t-cyan" },
    { text: `[*] Target: https://${target}/api`, color: "t-dim" },
    { text: "[*] Testing injection points...", color: "t-dim" },
    { text: "[+] Vulnerable parameter found: ?id=", color: "t-green" },
    { text: "[*] Injection type: UNION-based blind SQLi", color: "t-dim" },
    { text: "[*] DBMS: MySQL 8.0.32", color: "t-dim" },
    { text: "[*] Enumerating databases...", color: "t-dim" },
    { text: "[+] Database: production_db", color: "t-green" },
    { text: "[+] Tables found: users, orders, credentials, logs", color: "t-green" },
    { text: `[*] Dumping 'users' table (${totalRows.toLocaleString()} rows)...`, color: "t-yellow" },
  ];

  await typeLines("dbBody", initLines);
  await animateProgress("dbProgressFill", "dbProgressPct", "dbProgressLabel", "Extracting database...", duration);

  // Render fake table
  const tableHTML = `
    <div style="color:var(--cyan);margin:8px 0 4px;">[+] Sample records extracted:</div>
    <table class="db-table">
      <thead><tr><th>EMAIL</th><th>IP</th><th>HASH</th><th>DATE</th></tr></thead>
      <tbody>
        ${fakeUsers.map(u => `<tr><td>${u[0]}</td><td>${u[1]}</td><td>${u[2].slice(0,16)}...</td><td>${u[3]}</td></tr>`).join("")}
      </tbody>
    </table>`;

  body.innerHTML += tableHTML;

  const finalLines = [
    { text: `[+] ${totalRows.toLocaleString()} records dumped successfully`, color: "t-green", delay: 300 },
    { text: `[+] Saved: /tmp/${target.replace(".","-")}_dump.sql`, color: "t-cyan", delay: 200 },
    { text: "[+] Database breach complete ✓", color: "t-green", delay: 200 },
  ];

  await typeLines("dbBody", finalLines);
  wrap.style.display = "none";
  dbRunning = false;
}

// ─────────────────────────────────────────
// 5. FIREWALL BYPASS
// ─────────────────────────────────────────
let fwRunning = false;

async function startFirewall() {
  if (fwRunning) return;
  fwRunning = true;

  const target = document.getElementById("fwTarget").value.trim() || "10.0.0.1";
  const body = document.getElementById("fwBody");
  body.innerHTML = "";

  const wrap = document.getElementById("fwProgressWrap");
  wrap.style.display = "block";

  const duration = randomBetween(8000, 16000);
  const rules = randomBetween(200, 999);
  const port = [80, 443, 8080, 22, 3389][Math.floor(Math.random() * 5)];

  const initLines = [
    { text: `root@hackeros:~$ fwbypass --host ${target}`, color: "t-cyan" },
    { text: `[*] Target host   : ${target}`, color: "t-dim" },
    { text: `[*] Detecting firewall type...`, color: "t-dim" },
    { text: `[+] Firewall: iptables + Snort IDS`, color: "t-green" },
    { text: `[*] Analyzing ${rules} firewall rules...`, color: "t-dim" },
    { text: `[+] Weak rule found at chain INPUT #${randomBetween(10,99)}`, color: "t-yellow" },
    { text: `[*] Crafting bypass packet (port ${port})...`, color: "t-dim" },
    { text: `[*] Sending fragmented packets to evade IDS...`, color: "t-dim" },
    { text: `[*] TTL manipulation active...`, color: "t-dim" },
    { text: `[*] Tunneling via ICMP echo...`, color: "t-dim" },
  ];

  await typeLines("fwBody", initLines);
  await animateProgress("fwProgressFill", "fwProgressPct", "fwProgressLabel", "Bypassing firewall...", duration);

  const finalLines = [
    { text: `[+] Firewall rules bypassed!`, color: "t-green", delay: 200 },
    { text: `[+] Tunnel established on port ${port}`, color: "t-cyan", delay: 200 },
    { text: `[+] Connection: ${target}:${port} → OPEN`, color: "t-green", delay: 200 },
    { text: `[+] Firewall bypass complete ✓`, color: "t-green", delay: 200 },
  ];

  await typeLines("fwBody", finalLines);
  wrap.style.display = "none";
  fwRunning = false;
}

// ─────────────────────────────────────────
// 6. SATELLITE HACK
// ─────────────────────────────────────────
let satRunning = false;

async function startSatellite() {
  if (satRunning) return;
  satRunning = true;

  const sat = document.getElementById("satTarget").value;
  const body = document.getElementById("satBody");
  body.innerHTML = "";

  const wrap = document.getElementById("satProgressWrap");
  wrap.style.display = "block";

  const duration = randomBetween(10000, 18000);
  const freq = (randomBetween(1200, 9800) / 100).toFixed(2);
  const alt = randomBetween(400, 36000);

  const initLines = [
    { text: `root@hackeros:~$ satlink --target ${sat}`, color: "t-cyan" },
    { text: `[*] Target satellite : ${sat}`, color: "t-dim" },
    { text: `[*] Scanning orbital frequencies...`, color: "t-dim" },
    { text: `[+] Signal detected  : ${freq} GHz`, color: "t-green" },
    { text: `[+] Altitude         : ${alt.toLocaleString()} km`, color: "t-green" },
    { text: `[+] Inclination      : ${randomBetween(20,98)}°`, color: "t-dim" },
    { text: `[*] Syncing to orbital period...`, color: "t-dim" },
    { text: `[*] Brute-forcing transponder auth...`, color: "t-dim" },
    { text: `[*] Spoofing ground station signal...`, color: "t-dim" },
    { text: `[*] Injecting command sequence...`, color: "t-yellow" },
  ];

  await typeLines("satBody", initLines);
  await animateProgress("satProgressFill", "satProgressPct", "satProgressLabel", `Connecting to ${sat}...`, duration);

  const finalLines = [
    { text: `[+] Transponder auth bypassed!`, color: "t-green", delay: 300 },
    { text: `[+] Command uplink established`, color: "t-green", delay: 200 },
    { text: `[+] Telemetry stream: ACTIVE`, color: "t-cyan", delay: 200 },
    { text: `[+] Camera feed: HIJACKED`, color: "t-yellow", delay: 300 },
    { text: `[+] ${sat} under control ✓`, color: "t-green", delay: 200 },
  ];

  await typeLines("satBody", finalLines);
  wrap.style.display = "none";
  satRunning = false;
}

// ─────────────────────────────────────────
// 7. VIRUS DEPLOY
// ─────────────────────────────────────────
let virusRunning = false;

async function startVirus() {
  if (virusRunning) return;
  virusRunning = true;

  const target = document.getElementById("virusTarget").value.trim() || "192.168.1.0/24";
  const type = document.getElementById("virusType").value;
  const body = document.getElementById("virusBody");
  body.innerHTML = "";

  const wrap = document.getElementById("virusProgressWrap");
  wrap.style.display = "block";

  const duration = randomBetween(8000, 16000);
  const hosts = randomBetween(8, 48);
  const infected = randomBetween(Math.floor(hosts * 0.6), hosts);

  const typeDesc = {
    trojan: "Remote Access Trojan (RAT)",
    worm: "Self-Replicating Network Worm",
    ransomware: "File Encryption Ransomware",
    spyware: "Keylogger + Screen Capture Spyware",
  };

  const initLines = [
    { text: `root@hackeros:~$ deploy --type ${type} --net ${target}`, color: "t-cyan" },
    { text: `[*] Payload     : ${typeDesc[type]}`, color: "t-dim" },
    { text: `[*] Target net  : ${target}`, color: "t-dim" },
    { text: `[*] Scanning for active hosts...`, color: "t-dim" },
    { text: `[+] Found ${hosts} active hosts`, color: "t-green" },
    { text: `[*] Encoding payload to evade AV...`, color: "t-dim" },
    { text: `[+] Signature obfuscated (x64 polymorphic)`, color: "t-green" },
    { text: `[*] Deploying via SMB exploit...`, color: "t-yellow" },
  ];

  await typeLines("virusBody", initLines);
  await animateProgress("virusProgressFill", "virusProgressPct", "virusProgressLabel", `Deploying ${type}...`, duration);

  const finalLines = [
    { text: `[+] ${infected}/${hosts} hosts infected`, color: "t-red", delay: 200 },
    { text: `[+] C2 callback established on ${infected} nodes`, color: "t-yellow", delay: 200 },
    { text: `[+] Persistence: registry autorun set`, color: "t-dim", delay: 200 },
    { text: `[+] Payload deployed successfully ✓`, color: "t-green", delay: 300 },
  ];

  await typeLines("virusBody", finalLines);
  wrap.style.display = "none";
  virusRunning = false;
}

// ─────────────────────────────────────────
// 8. SOCIAL ENGINEER
// ─────────────────────────────────────────
let socialRunning = false;

const phishingTemplates = {
  phishing: (name) => `
FROM    : security-noreply@${randomDomain()}
TO      : ${name.toLowerCase()}@target.com
SUBJECT : ⚠️ Urgent: Your account has been compromised

Dear ${name},

We have detected unauthorized access to your account from:
IP Address : ${randomBetween(1,254)}.${randomBetween(1,254)}.${randomBetween(1,254)}.${randomBetween(1,254)}
Location   : Unknown Device
Time       : ${new Date().toUTCString()}

To secure your account, verify your identity immediately:
→ https://secure-verify.${randomDomain()}/auth?token=${randomHex(16)}

This link expires in 15 minutes. Failure to verify will
result in permanent account suspension.

Regards,
Security Team`,

  smishing: (name) => `
[SMS TEMPLATE]
─────────────────────────────
TO: +1-XXX-XXX-XXXX

"${name}, your bank account has been locked due to 
suspicious activity. Verify now to avoid suspension:
http://bnk-verify.${randomDomain()}/s?id=${randomHex(8)}
Reply STOP to opt out."
─────────────────────────────`,

  vishing: (name) => `
[VISHING SCRIPT]
─────────────────────────────
CALLER  : "Bank Security Dept"
TARGET  : ${name}

Script:
"Hello, may I speak with ${name}? 
This is [Agent] from your bank's fraud department.
We've detected suspicious transactions on your account.

For verification, I need:
1. Your full card number
2. The 3-digit CVV on the back
3. Your online banking password

This is urgent and your card will be blocked in 10 minutes
if we cannot verify your identity."
─────────────────────────────`,
};

async function startSocial() {
  if (socialRunning) return;
  socialRunning = true;

  const target = document.getElementById("socialTarget").value.trim() || "John";
  const type = document.getElementById("socialType").value;
  const body = document.getElementById("socialBody");
  body.innerHTML = "";

  const initLines = [
    { text: `root@hackeros:~$ socialeng --type ${type} --target "${target}"`, color: "t-cyan" },
    { text: `[*] Gathering OSINT on target...`, color: "t-dim" },
    { text: `[+] Name     : ${target}`, color: "t-green" },
    { text: `[+] LinkedIn : linkedin.com/in/${target.toLowerCase().replace(" ","-")}`, color: "t-dim" },
    { text: `[*] Building ${type} template...`, color: "t-dim" },
    { text: `[+] Template generated:`, color: "t-yellow" },
  ];

  await typeLines("socialBody", initLines);
  await sleep(randomBetween(800, 1800));

  const templateDiv = document.createElement("div");
  templateDiv.style.cssText = "background:#080808;border:1px solid #1a3a1a;border-radius:6px;padding:14px;margin-top:8px;font-size:0.75rem;color:#4a9a4a;white-space:pre;line-height:1.7;overflow-x:auto;";
  templateDiv.textContent = phishingTemplates[type](target);
  body.appendChild(templateDiv);
  body.scrollTop = body.scrollHeight;

  const finalLines = [
        { text: `[+] Template ready to deploy`, color: "t-green", delay: 300 },
    { text: `[+] Social engineering attack prepared ✓`, color: "t-green", delay: 200 },
  ];

  await typeLines("socialBody", finalLines);
  socialRunning = false;
}

// ─────────────────────────────────────────
// 9. FAKE COMPILER
// ─────────────────────────────────────────
let compilerRunning = false;

const compilerOutputs = {
  python: [
    { text: "[*] Python 3.11.4 compiler initialized", color: "t-dim" },
    { text: "[*] Parsing syntax tree...", color: "t-dim" },
    { text: "[*] Resolving imports...", color: "t-dim" },
    { text: "[+] import socket — OK", color: "t-green" },
    { text: "[+] import os — OK", color: "t-green" },
    { text: "[+] import sys — OK", color: "t-green" },
    { text: "[*] Compiling bytecode (.pyc)...", color: "t-dim" },
    { text: "[+] Bytecode compiled: 2,847 instructions", color: "t-green" },
    { text: "[*] Running exploit_target()...", color: "t-yellow" },
    { text: "[+] Socket connected to target", color: "t-green" },
    { text: "[+] Payload sent: 100 bytes", color: "t-green" },
    { text: "[+] Response received: b'\\x00\\x90\\x41\\x42'", color: "t-cyan" },
    { text: "[+] Execution successful — exit code 0", color: "t-green" },
  ],
  c: [
    { text: "[*] GCC 13.2.0 compiler initialized", color: "t-dim" },
    { text: "[*] Preprocessing source files...", color: "t-dim" },
    { text: "[*] Compiling exploit.c...", color: "t-dim" },
    { text: "[*] Compiling payload.c...", color: "t-dim" },
    { text: "[*] Compiling shellcode.asm...", color: "t-dim" },
    { text: "[+] Assembly complete — 3 object files", color: "t-green" },
    { text: "[*] Linking with libpthread, libssl...", color: "t-dim" },
    { text: "[+] Binary: ./exploit (ELF 64-bit, stripped)", color: "t-green" },
    { text: "[*] Executing binary...", color: "t-yellow" },
    { text: "[+] Segmentation override successful", color: "t-green" },
    { text: "[+] Shell spawned at 0x7fff5fbff8a0", color: "t-cyan" },
    { text: "[+] Build complete — exit code 0", color: "t-green" },
  ],
  java: [
    { text: "[*] Java JDK 21 compiler initialized", color: "t-dim" },
    { text: "[*] Compiling Exploit.java...", color: "t-dim" },
    { text: "[*] Compiling Payload.java...", color: "t-dim" },
    { text: "[*] Resolving classpath dependencies...", color: "t-dim" },
    { text: "[+] commons-net-3.9.0.jar — loaded", color: "t-green" },
    { text: "[+] gson-2.10.1.jar — loaded", color: "t-green" },
    { text: "[*] Generating bytecode (.class files)...", color: "t-dim" },
    { text: "[+] 4 classes compiled successfully", color: "t-green" },
    { text: "[*] Packaging JAR: exploit.jar", color: "t-dim" },
    { text: "[*] Running: java -jar exploit.jar", color: "t-yellow" },
    { text: "[+] Remote code execution triggered", color: "t-green" },
    { text: "[+] BUILD SUCCESS — Total time: 3.421s", color: "t-green" },
  ],
  rust: [
    { text: "[*] Rust 1.78.0 (rustc) initialized", color: "t-dim" },
    { text: "[*] Checking Cargo.toml dependencies...", color: "t-dim" },
    { text: "[+] tokio = \"1.37\" — OK", color: "t-green" },
    { text: "[+] serde = \"1.0\" — OK", color: "t-green" },
    { text: "[+] reqwest = \"0.12\" — OK", color: "t-green" },
    { text: "[*] Compiling 47 crates...", color: "t-dim" },
    { text: "[*] Linking final binary...", color: "t-dim" },
    { text: "[+] Binary: target/release/exploit (3.2 MB)", color: "t-green" },
    { text: "[*] Running exploit binary...", color: "t-yellow" },
    { text: "[+] Async runtime spawned — 8 threads", color: "t-cyan" },
    { text: "[+] Target reached — payload delivered", color: "t-green" },
    { text: "[+] Finished release [optimized] — exit code 0", color: "t-green" },
  ],
  asm: [
    { text: "[*] NASM 2.16.01 assembler initialized", color: "t-dim" },
    { text: "[*] Assembling shellcode.asm...", color: "t-dim" },
    { text: "[*] Pass 1: symbol resolution...", color: "t-dim" },
    { text: "[*] Pass 2: instruction encoding...", color: "t-dim" },
    { text: "[+] 247 instructions assembled", color: "t-green" },
    { text: "[+] Output: shellcode.bin (864 bytes)", color: "t-green" },
    { text: "[*] Injecting into target process (PID: " + randomBetween(1000,9999) + ")...", color: "t-yellow" },
    { text: "[+] Memory region: 0x7f3a2b001000 — RWX", color: "t-cyan" },
    { text: "[+] Shellcode written to memory", color: "t-green" },
    { text: "[+] EIP redirected — shellcode executing", color: "t-green" },
    { text: "[+] Assembly complete ✓", color: "t-green" },
  ],
};

async function startCompiler() {
  if (compilerRunning) return;
  compilerRunning = true;

  const lang = document.getElementById("compilerLang").value;
  const body = document.getElementById("compilerBody");
  body.innerHTML = "";

  const wrap = document.getElementById("compilerProgressWrap");
  wrap.style.display = "block";

  const duration = randomBetween(4000, 10000);

  const headerLines = [
    { text: `root@hackeros:~$ compile --lang ${lang} source.${lang === "c" ? "c" : lang}`, color: "t-cyan" },
    { text: `[*] Starting ${lang.toUpperCase()} compilation...`, color: "t-dim" },
  ];

  await typeLines("compilerBody", headerLines);
  await animateProgress("compilerProgressFill", "compilerProgressPct", "compilerProgressLabel", `Compiling ${lang.toUpperCase()}...`, duration);

  await typeLines("compilerBody", compilerOutputs[lang]);
  wrap.style.display = "none";
  compilerRunning = false;
}

// ─────────────────────────────────────────
// 10. CMD TERMINAL
// ─────────────────────────────────────────
const cmdHistory = [];
let historyIndex = -1;

const cmdCommands = {
  help: () => [
    { text: "Available commands:", color: "t-cyan" },
    { text: "  help         — Show this help menu", color: "t-dim" },
    { text: "  whoami       — Show current user", color: "t-dim" },
    { text: "  ls           — List directory", color: "t-dim" },
    { text: "  pwd          — Print working directory", color: "t-dim" },
    { text: "  ifconfig     — Show network interfaces", color: "t-dim" },
    { text: "  netstat      — Show active connections", color: "t-dim" },
    { text: "  ps aux       — List running processes", color: "t-dim" },
    { text: "  nmap <host>  — Scan target host", color: "t-dim" },
    { text: "  ping <host>  — Ping target host", color: "t-dim" },
    { text: "  cat /etc/passwd — Dump passwd file", color: "t-dim" },
    { text: "  uname -a     — Show system info", color: "t-dim" },
    { text: "  history      — Show command history", color: "t-dim" },
    { text: "  clear        — Clear terminal", color: "t-dim" },
  ],
  whoami: () => [{ text: "root", color: "t-green" }],
  pwd: () => [{ text: "/root/hackeros", color: "t-green" }],
  ls: () => [
    { text: "total 48", color: "t-dim" },
    { text: "drwxr-xr-x  root root  4096 exploit/", color: "t-green" },
    { text: "drwxr-xr-x  root root  4096 payloads/", color: "t-green" },
    { text: "drwxr-xr-x  root root  4096 loot/", color: "t-yellow" },
    { text: "-rwxr-xr-x  root root  8192 exploit.sh", color: "t-cyan" },
    { text: "-rwxr-xr-x  root root  4096 breach.py", color: "t-cyan" },
    { text: "-rw-r--r--  root root  1337 config.json", color: "t-dim" },
    { text: "-rw-------  root root   512 .ssh/id_rsa", color: "t-red" },
  ],
  ifconfig: () => [
    { text: "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>", color: "t-cyan" },
    { text: "      inet 192.168.0.1  netmask 255.255.255.0", color: "t-green" },
    { text: "      inet6 fe80::1  prefixlen 64", color: "t-dim" },
    { text: "      ether DE:AD:BE:EF:CA:FE  txqueuelen 1000", color: "t-dim" },
    { text: "", color: "t-dim" },
    { text: "tun0: flags=4305<UP,POINTOPOINT,RUNNING>", color: "t-cyan" },
    { text: "      inet 10.8.0.2  netmask 255.255.255.0  (VPN)", color: "t-yellow" },
    { text: "", color: "t-dim" },
    { text: "lo: flags=73<UP,LOOPBACK,RUNNING>", color: "t-dim" },
    { text: "    inet 127.0.0.1  netmask 255.0.0.0", color: "t-dim" },
  ],
  "uname -a": () => [
    { text: "Linux hackeros 5.15.0-kali3-amd64 #1 SMP HackerOS 2.0 x86_64 GNU/Linux", color: "t-green" },
  ],
  "cat /etc/passwd": () => [
    { text: "root:x:0:0:root:/root:/bin/bash", color: "t-red" },
    { text: "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin", color: "t-dim" },
    { text: "admin:x:1000:1000::/home/admin:/bin/bash", color: "t-yellow" },
    { text: "hackeros:x:1337:1337::/home/hackeros:/bin/zsh", color: "t-green" },
  ],
  netstat: () => [
    { text: "Active Internet connections:", color: "t-cyan" },
    { text: "Proto  Local Address          Foreign Address        State", color: "t-dim" },
    { text: `tcp    0.0.0.0:4444           ${randomBetween(1,254)}.${randomBetween(1,254)}.${randomBetween(1,254)}.${randomBetween(1,254)}:${randomBetween(1024,65535)}  LISTEN`, color: "t-green" },
    { text: `tcp    192.168.0.1:443        185.220.101.47:${randomBetween(1024,65535)}  ESTABLISHED`, color: "t-yellow" },
    { text: `tcp    10.8.0.2:1337          91.108.4.1:${randomBetween(1024,65535)}     ESTABLISHED`, color: "t-green" },
  ],
  "ps aux": () => [
    { text: "USER     PID  %CPU %MEM COMMAND", color: "t-cyan" },
    { text: `root     ${randomBetween(100,999)}   2.1  0.3  /bin/bash`, color: "t-dim" },
    { text: `root     ${randomBetween(1000,2000)}  12.4  1.7  ./exploit.sh`, color: "t-yellow" },
    { text: `root     ${randomBetween(2000,3000)}   8.2  0.9  python3 breach.py`, color: "t-green" },
    { text: `root     ${randomBetween(3000,4000)}   0.1  0.1  nc -lvp 4444`, color: "t-red" },
    { text: `root     ${randomBetween(4000,5000)}   3.3  2.1  ./c2_server`, color: "t-cyan" },
  ],
  history: () => cmdHistory.length > 0
    ? cmdHistory.map((h, i) => ({ text: `  ${String(i + 1).padStart(3)} ${h}`, color: "t-dim" }))
    : [{ text: "No history yet.", color: "t-dim" }],
};

async function handleCmd(e) {
  if (e.key !== "Enter") return;

  const input = document.getElementById("cmdInput");
  const raw = input.value.trim();
  input.value = "";

  if (!raw) return;

  cmdHistory.push(raw);
  historyIndex = cmdHistory.length;

  const body = document.getElementById("cmdBody");

  // Echo command
  const echo = document.createElement("div");
  echo.className = "cmd-line cyan-text";
  echo.textContent = `root@hackeros:~$ ${raw}`;
  body.appendChild(echo);

  const cmd = raw.toLowerCase();

  if (cmd === "clear") {
    clearCmd();
    return;
  }

  // Nmap handler
  if (cmd.startsWith("nmap")) {
    const host = raw.split(" ")[1] || "192.168.1.1";
    await nmapScan(host, body);
    return;
  }

  // Ping handler
  if (cmd.startsWith("ping")) {
    const host = raw.split(" ")[1] || "8.8.8.8";
    await fakePing(host, body);
    return;
  }

  const handler = cmdCommands[cmd];
  if (handler) {
    const lines = handler();
    for (const line of lines) {
      await sleep(randomBetween(30, 120));
      const div = document.createElement("div");
      div.className = `cmd-line ${line.color}`;
      div.textContent = line.text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }
  } else {
    const div = document.createElement("div");
    div.className = "cmd-line t-red";
    div.textContent = `-bash: ${raw}: command not found`;
    body.appendChild(div);
  }

  body.scrollTop = body.scrollHeight;
}

async function nmapScan(host, body) {
  const ports = [
    { port: 22, service: "ssh", state: "open" },
    { port: 80, service: "http", state: "open" },
    { port: 443, service: "https", state: "open" },
    { port: 3306, service: "mysql", state: Math.random() > 0.5 ? "open" : "filtered" },
    { port: 8080, service: "http-proxy", state: Math.random() > 0.5 ? "open" : "closed" },
    { port: 21, service: "ftp", state: "filtered" },
    { port: 4444, service: "unknown", state: Math.random() > 0.5 ? "open" : "closed" },
  ];

  const lines = [
    `Starting Nmap 7.94 ( https://nmap.org )`,
    `Nmap scan report for ${host}`,
    `Host is up (${(Math.random() * 0.05).toFixed(4)}s latency).`,
    ``,
    `PORT      STATE     SERVICE`,
  ];

  for (const p of ports) {
    lines.push(`${String(p.port + "/tcp").padEnd(10)}${p.state.padEnd(10)}${p.service}`);
  }
  lines.push(``, `Nmap done: 1 IP address (1 host up) scanned in ${randomBetween(2, 8)}.${randomBetween(10,99)}s`);

  for (const line of lines) {
    await sleep(randomBetween(80, 250));
    const div = document.createElement("div");
    div.className = `cmd-line ${line.includes("open") ? "t-green" : line.includes("filtered") ? "t-yellow" : "t-dim"}`;
    div.textContent = line;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
}

async function fakePing(host, body) {
  const lines = [`PING ${host}: 56 data bytes`];
  for (let i = 0; i < randomBetween(4, 8); i++) {
    lines.push(`64 bytes from ${host}: icmp_seq=${i} ttl=${randomBetween(50,128)} time=${(Math.random() * 20 + 1).toFixed(3)} ms`);
  }
  lines.push(`--- ${host} ping statistics ---`);
  lines.push(`${lines.length - 2} packets transmitted, ${lines.length - 2} received, 0% packet loss`);

  for (const line of lines) {
    await sleep(randomBetween(150, 400));
    const div = document.createElement("div");
    div.className = "cmd-line t-green";
    div.textContent = line;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
}

function clearCmd() {
  document.getElementById("cmdBody").innerHTML = `
    <div class="cmd-line green-text">HackerOS v2.0 — Type <span class="cyan-text">help</span> for available commands</div>
    <div class="cmd-line green-text">─────────────────────────────────────</div>`;
}

// ─────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHex(length) {
  let result = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function randomDomain() {
  const domains = ["secure-bank.net","verify-account.org","auth-service.io","account-help.com","support-portal.net"];
  return domains[Math.floor(Math.random() * domains.length)];
}

// ─────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  startMatrix();
  runSplash();
});
