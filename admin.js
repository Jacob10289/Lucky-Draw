const FIREBASE_CONFIG = {
   apiKey: "AIzaSyA8i-ZCFPvRHxojMOrPIP0kIHdO25cfJiA",
  authDomain: "lucky-draw-app-858d1.firebaseapp.com",
  projectId: "lucky-draw-app-858d1",
  storageBucket: "lucky-draw-app-858d1.firebasestorage.app",
  messagingSenderId: "192234294023",
  appId: "1:192234294023:web:c7d17038643c89a86193a2"
};

// ==================== IMPORTS ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== INIT FIREBASE ====================
const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);
const configRef = ref(db, "luckyDraw/config");
const statsRef = ref(db, "luckyDraw/stats");

// ==================== STATE ====================
let currentConfig = {
    giftLink: "https://spotify.com/gift",
    defaultRate: 10,
    players: {}
};

// ==================== BACKGROUND PARTICLES ====================
function createParticles() {
    const container = document.getElementById("bgParticles");
    for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = Math.random() * 100 + "%";
        p.style.animationDuration = (Math.random() * 12 + 6) + "s";
        p.style.animationDelay = (Math.random() * 6) + "s";
        container.appendChild(p);
    }
}
createParticles();

// ==================== CONNECTION STATUS ====================
const connStatus = document.getElementById("connStatus");
function setStatus(type, text) {
    connStatus.className = "conn-status " + type;
    connStatus.innerHTML = `<span class="conn-dot"></span> ${text}`;
}

// ==================== LISTEN CONFIG FROM FIREBASE ====================
onValue(configRef, (snapshot) => {
    setStatus("connected", "✅ Đã kết nối Firebase");
    const data = snapshot.val();
    if (data) {
        currentConfig = { ...currentConfig, ...data };
        if (!currentConfig.players) currentConfig.players = {};
        updateUI();
    }
}, (error) => {
    setStatus("error", "❌ Lỗi: " + error.message);
});

// ==================== LISTEN STATS ====================
onValue(statsRef, (snapshot) => {
    const stats = snapshot.val() || { totalDraws: 0, totalWins: 0 };
    updateStatsUI(stats);
});

// ==================== UPDATE UI ====================
function updateUI() {
    document.getElementById("giftLink").value = currentConfig.giftLink || "";
    document.getElementById("defaultRate").value = currentConfig.defaultRate || 10;
    renderPlayerTable();
}

function updateStatsUI(stats) {
    const players = Object.keys(currentConfig.players || {}).length;
    const draws = stats.totalDraws || 0;
    const wins = stats.totalWins || 0;
    const avgRate = draws > 0 ? ((wins / draws) * 100).toFixed(1) : "0";

    document.getElementById("statPlayers").textContent = players;
    document.getElementById("statDraws").textContent = draws;
    document.getElementById("statWins").textContent = wins;
    document.getElementById("statRate").textContent = avgRate + "%";
}

// ==================== SAVE GIFT LINK ====================
document.getElementById("saveLinkBtn").addEventListener("click", async () => {
    const link = document.getElementById("giftLink").value.trim();
    currentConfig.giftLink = link || "https://spotify.com/gift";
    await saveConfig();
    showToast("✅ Đã lưu link nhận quà!");
});

// ==================== SAVE DEFAULT RATE ====================
document.getElementById("saveRateBtn").addEventListener("click", async () => {
    const rate = parseInt(document.getElementById("defaultRate").value);
    currentConfig.defaultRate = isNaN(rate) ? 10 : Math.max(0, Math.min(100, rate));
    await saveConfig();
    showToast("✅ Đã lưu tỉ lệ mặc định: " + currentConfig.defaultRate + "%");
});

async function saveConfig() {
    try {
        await set(configRef, currentConfig);
    } catch (e) {
        alert("❌ Lỗi khi lưu: " + e.message);
    }
}

// ==================== ADD PLAYER ====================
document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);
document.getElementById("newPlayerRate").addEventListener("keypress", (e) => {
    if (e.key === "Enter") addPlayer();
});

async function addPlayer() {
    const nameInput = document.getElementById("newPlayerName");
    const rateInput = document.getElementById("newPlayerRate");

    const name = nameInput.value.trim();
    const rate = parseInt(rateInput.value);

    if (!name) { alert("Vui lòng nhập tên!"); return; }
    if (isNaN(rate) || rate < 0 || rate > 100) { alert("Tỉ lệ từ 0-100!"); return; }

    if (!currentConfig.players) currentConfig.players = {};
    currentConfig.players[name] = rate;

    await saveConfig();
    nameInput.value = "";
    rateInput.value = "";
    showToast("✅ Đã thêm: " + name + " (" + rate + "%)");
}

// ==================== RENDER PLAYER TABLE ====================
function renderPlayerTable() {
    const tbody = document.getElementById("playerTableBody");
    const players = currentConfig.players || {};
    const entries = Object.entries(players);

    if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Chưa có người chơi nào trong danh sách</td></tr>';
        return;
    }

    tbody.innerHTML = entries.map(([name, rate], index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(name)}</td>
            <td class="rate-cell">${rate}%</td>
            <td><button class="btn btn-delete" data-name="${escapeHtml(name)}">🗑 Xóa</button></td>
        </tr>
    `).join("");

    // Attach delete handlers
    tbody.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", () => removePlayer(btn.dataset.name));
    });
}

async function removePlayer(name) {
    if (!confirm("Bạn có chắc muốn xóa "" + name + ""?")) return;
    delete currentConfig.players[name];
    await saveConfig();
    showToast("🗑 Đã xóa: " + name);
}

// ==================== RESET STATS ====================
document.getElementById("resetStatsBtn").addEventListener("click", async () => {
    if (!confirm("Bạn có chắc muốn reset toàn bộ thống kê?")) return;
    try {
        await set(statsRef, { totalDraws: 0, totalWins: 0 });
        showToast("🔄 Đã reset thống kê!");
    } catch (e) {
        alert("❌ Lỗi: " + e.message);
    }
});

// ==================== TOAST ====================
function showToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// ==================== SIDEBAR NAV ACTIVE STATE ====================
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        e.target.classList.add("active");
    });
});
