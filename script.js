// ==================== FIREBASE CONFIG - THAY ĐỔI Ở ĐÂY ====================
const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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
let currentUser = null;
let appConfig = {
    giftLink: "https://spotify.com/gift",
    defaultRate: 10,
    players: {}
};
let isConnected = false;

// ==================== BACKGROUND PARTICLES ====================
function createParticles() {
    const container = document.getElementById("bgParticles");
    for (let i = 0; i < 30; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = Math.random() * 100 + "%";
        p.style.animationDuration = (Math.random() * 10 + 5) + "s";
        p.style.animationDelay = (Math.random() * 5) + "s";
        p.style.width = p.style.height = (Math.random() * 4 + 2) + "px";
        container.appendChild(p);
    }
}
createParticles();

// ==================== CONNECTION STATUS ====================
const connStatus = document.getElementById("connStatus");
function setStatus(type, text) {
    connStatus.className = "connection-status " + type;
    connStatus.innerHTML = `<span class="conn-dot"></span> ${text}`;
}

// ==================== LISTEN CONFIG FROM FIREBASE (REAL-TIME) ====================
onValue(configRef, (snapshot) => {
    isConnected = true;
    setStatus("connected", "✅ Đã kết nối server — Config đang cập nhật real-time");

    const data = snapshot.val();
    if (data) {
        appConfig = { ...appConfig, ...data };
    }
}, (error) => {
    isConnected = false;
    setStatus("error", "❌ Lỗi kết nối: " + error.message);
    console.error("Firebase error:", error);
});

// ==================== LOGIN ====================
document.getElementById("loginBtn").addEventListener("click", handleLogin);
document.getElementById("fullName").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
});

function handleLogin() {
    const nameInput = document.getElementById("fullName");
    const name = nameInput.value.trim();

    if (!name) {
        alert("Vui lòng nhập họ tên đầy đủ!");
        return;
    }
    if (!isConnected) {
        alert("⏳ Đang kết nối đến server, vui lòng đợi một chút...");
        return;
    }

    currentUser = name;
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("userSection").classList.remove("hidden");
    document.getElementById("displayName").textContent = name;
}

// ==================== LOGOUT ====================
document.getElementById("logoutBtn").addEventListener("click", logout);

function logout() {
    currentUser = null;
    document.getElementById("loginSection").classList.remove("hidden");
    document.getElementById("userSection").classList.add("hidden");
    document.getElementById("fullName").value = "";
}

// ==================== DRAW ====================
document.getElementById("drawBtn").addEventListener("click", handleDraw);

function handleDraw() {
    const giftBox = document.getElementById("giftBox");
    const drawBtn = document.getElementById("drawBtn");

    drawBtn.disabled = true;
    giftBox.classList.add("shake");

    setTimeout(() => {
        giftBox.classList.remove("shake");
        giftBox.classList.add("open");

        setTimeout(() => {
            performDraw();
            giftBox.classList.remove("open");
            drawBtn.disabled = false;
        }, 600);
    }, 500);
}

async function performDraw() {
    // Lấy tỉ lệ cho người chơi hiện tại
    let rate = appConfig.defaultRate || 10;
    const normalizedName = currentUser.toLowerCase();

    if (appConfig.players) {
        for (const [playerName, playerRate] of Object.entries(appConfig.players)) {
            if (playerName.toLowerCase() === normalizedName) {
                rate = playerRate;
                break;
            }
        }
    }

    // Random
    const random = Math.random() * 100;
    const isWin = random < rate;

    // Cập nhật stats lên Firebase
    try {
        const snapshot = await get(statsRef);
        const currentStats = snapshot.val() || { totalDraws: 0, totalWins: 0 };
        await update(statsRef, {
            totalDraws: (currentStats.totalDraws || 0) + 1,
            totalWins: (currentStats.totalWins || 0) + (isWin ? 1 : 0)
        });
    } catch (e) {
        console.error("Update stats failed:", e);
    }

    if (isWin) showWin();
    else showLoss();
}

// ==================== RESULT ====================
function showWin() {
    const modal = document.getElementById("resultModal");
    document.getElementById("resultIcon").textContent = "🎉";
    document.getElementById("resultTitle").textContent = "Chúc mừng bạn!";
    document.getElementById("resultMessage").innerHTML = `Bạn đã <strong>TRÚNG THƯỞNG</strong>!<br>Phần quà đang chờ bạn nhận.`;
    document.getElementById("prizeDisplay").classList.remove("hidden");
    document.getElementById("prizeLink").href = appConfig.giftLink || "#";
    modal.classList.remove("hidden");
    startConfetti();
}

function showLoss() {
    const modal = document.getElementById("resultModal");
    document.getElementById("resultIcon").textContent = "🍀";
    document.getElementById("resultTitle").textContent = "Tiếc quá!";
    document.getElementById("resultMessage").textContent = "Chúc bạn may mắn lần sau!";
    document.getElementById("prizeDisplay").classList.add("hidden");
    modal.classList.remove("hidden");
}

document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("resultModal").classList.add("hidden");
    stopConfetti();
});

// ==================== CONFETTI ====================
let confettiActive = false;
let confettiAnimationId = null;

function startConfetti() {
    const canvas = document.getElementById("confettiCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ["#ff006e", "#8338ec", "#3a86ff", "#06d6a0", "#ffd166", "#ff4757"];

    for (let i = 0; i < 150; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 4 - 2
        });
    }

    confettiActive = true;
    function animate() {
        if (!confettiActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            p.y += p.speedY; p.x += p.speedX; p.rotation += p.rotationSpeed;
            if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        });
        confettiAnimationId = requestAnimationFrame(animate);
    }
    animate();
    setTimeout(stopConfetti, 5000);
}

function stopConfetti() {
    confettiActive = false;
    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    const canvas = document.getElementById("confettiCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener("resize", () => {
    const canvas = document.getElementById("confettiCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
