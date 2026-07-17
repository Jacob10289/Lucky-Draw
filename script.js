// ===== STATE MANAGEMENT =====
let currentUser = null;
let isAdmin = false;

// Default data
const DEFAULT_DATA = {
    players: {},      // { "name": rate }
    giftLink: "https://spotify.com/gift",
    defaultRate: 10,
    stats: { totalDraws: 0, totalWins: 0 }
};

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('luckyDrawData');
    if (saved) {
        return JSON.parse(saved);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// Save data to localStorage
function saveData(data) {
    localStorage.setItem('luckyDrawData', JSON.stringify(data));
}

let appData = loadData();

// ===== BACKGROUND PARTICLES =====
function createParticles() {
    const container = document.getElementById('bgParticles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 10 + 5) + 's';
        p.style.animationDelay = (Math.random() * 5) + 's';
        p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
        container.appendChild(p);
    }
}
createParticles();

// ===== LOGIN =====
function handleLogin() {
    const nameInput = document.getElementById('fullName');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Vui lòng nhập họ tên đầy đủ!');
        return;
    }

    currentUser = name;

    // Check admin: name ends with "PTD" (case-insensitive, can have space before)
    const adminRegex = /\s*PTD$/i;
    isAdmin = adminRegex.test(name);

    document.getElementById('loginSection').classList.add('hidden');

    if (isAdmin) {
        document.getElementById('adminSection').classList.remove('hidden');
        document.getElementById('adminName').textContent = name;
        loadAdminPanel();
    } else {
        document.getElementById('userSection').classList.remove('hidden');
        document.getElementById('displayName').textContent = name;
    }
}

// Allow Enter key to login
document.getElementById('fullName')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

// ===== LOGOUT =====
function logout() {
    currentUser = null;
    isAdmin = false;
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('userSection').classList.add('hidden');
    document.getElementById('adminSection').classList.add('hidden');
    document.getElementById('fullName').value = '';
}

// ===== DRAW LOGIC =====
function handleDraw() {
    const giftBox = document.getElementById('giftBox');
    const drawBtn = document.getElementById('drawBtn');

    // Disable button
    drawBtn.disabled = true;
    drawBtn.style.opacity = '0.6';

    // Shake animation
    giftBox.classList.add('shake');

    setTimeout(() => {
        giftBox.classList.remove('shake');
        giftBox.classList.add('open');

        setTimeout(() => {
            performDraw();
            giftBox.classList.remove('open');
            drawBtn.disabled = false;
            drawBtn.style.opacity = '1';
        }, 600);
    }, 500);
}

function performDraw() {
    // Get rate for current user
    let rate = appData.defaultRate;
    const normalizedName = currentUser.toLowerCase();

    // Check exact match in players list (case-insensitive)
    for (const [playerName, playerRate] of Object.entries(appData.players)) {
        if (playerName.toLowerCase() === normalizedName) {
            rate = playerRate;
            break;
        }
    }

    // Random draw
    const random = Math.random() * 100;
    const isWin = random < rate;

    // Update stats
    appData.stats.totalDraws++;
    if (isWin) appData.stats.totalWins++;
    saveData(appData);

    if (isWin) {
        showWin();
    } else {
        showLoss();
    }
}

// ===== RESULT DISPLAY =====
function showWin() {
    const modal = document.getElementById('resultModal');
    const icon = document.getElementById('resultIcon');
    const title = document.getElementById('resultTitle');
    const msg = document.getElementById('resultMessage');
    const prize = document.getElementById('prizeDisplay');
    const link = document.getElementById('prizeLink');

    icon.textContent = '🎉';
    title.textContent = 'Chúc mừng bạn!';
    msg.innerHTML = `Bạn đã <strong>TRÚNG THƯỞNG</strong>!\nPhần quà đang chờ bạn nhận.`;
    prize.classList.remove('hidden');
    link.href = appData.giftLink || '#';

    modal.classList.remove('hidden');
    startConfetti();
}

function showLoss() {
    const modal = document.getElementById('resultModal');
    const icon = document.getElementById('resultIcon');
    const title = document.getElementById('resultTitle');
    const msg = document.getElementById('resultMessage');
    const prize = document.getElementById('prizeDisplay');

    icon.textContent = '🍀';
    title.textContent = 'Tiếc quá!';
    msg.textContent = 'Chúc bạn may mắn lần sau!';
    prize.classList.add('hidden');

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('resultModal').classList.add('hidden');
    stopConfetti();
}

// ===== ADMIN PANEL =====
function loadAdminPanel() {
    // Load gift link
    document.getElementById('giftLink').value = appData.giftLink || '';
    document.getElementById('defaultRate').value = appData.defaultRate || 10;

    renderPlayerList();
    updateStats();
}

function saveGiftLink() {
    const link = document.getElementById('giftLink').value.trim();
    appData.giftLink = link || 'https://spotify.com/gift';
    saveData(appData);
    alert('Đã lưu link nhận quà!');
}

function saveDefaultRate() {
    const rate = parseInt(document.getElementById('defaultRate').value);
    appData.defaultRate = isNaN(rate) ? 10 : Math.max(0, Math.min(100, rate));
    saveData(appData);
    alert('Đã lưu tỉ lệ mặc định: ' + appData.defaultRate + '%');
}

function addPlayer() {
    const nameInput = document.getElementById('newPlayerName');
    const rateInput = document.getElementById('newPlayerRate');

    const name = nameInput.value.trim();
    const rate = parseInt(rateInput.value);

    if (!name) {
        alert('Vui lòng nhập tên người chơi!');
        return;
    }
    if (isNaN(rate) || rate < 0 || rate > 100) {
        alert('Tỉ lệ phải từ 0 đến 100!');
        return;
    }

    appData.players[name] = rate;
    saveData(appData);

    nameInput.value = '';
    rateInput.value = '';
    renderPlayerList();
    updateStats();
}

function removePlayer(name) {
    delete appData.players[name];
    saveData(appData);
    renderPlayerList();
    updateStats();
}

function renderPlayerList() {
    const list = document.getElementById('playerList');
    list.innerHTML = '';

    if (Object.keys(appData.players).length === 0) {
        list.innerHTML = '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:10px;">Chưa có người chơi nào</p>';
        return;
    }

    for (const [name, rate] of Object.entries(appData.players)) {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.innerHTML = `
            <div class="player-info">
                <span class="player-name">${escapeHtml(name)}</span>
                <span class="player-rate">Tỉ lệ: ${rate}%</span>
            </div>
            <button class="btn btn-danger" onclick="removePlayer('${escapeHtml(name)}')">Xóa</button>
        `;
        list.appendChild(item);
    }
}

function updateStats() {
    document.getElementById('totalPlayers').textContent = Object.keys(appData.players).length;
    document.getElementById('totalDraws').textContent = appData.stats.totalDraws || 0;
    document.getElementById('totalWins').textContent = appData.stats.totalWins || 0;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== CONFETTI =====
let confettiActive = false;
let confettiAnimationId = null;

function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffd166', '#ff4757'];

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

            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;

            if (p.y > canvas.height) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }
        });

        confettiAnimationId = requestAnimationFrame(animate);
    }

    animate();

    // Auto stop after 5 seconds
    setTimeout(stopConfetti, 5000);
}

function stopConfetti() {
    confettiActive = false;
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
    }
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Handle resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confettiCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
