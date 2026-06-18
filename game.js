/**
 * PROJECT: KONKAN CINEMATIC PLATINUM EDITION (MAX-FIDELITY AUTOMATION MATRIX)
 * LEAD DEVELOPER ARCHITECT: SPECTRE / MOHAMMED ABDULLAH
 * VERSION: 10.0.2 [ULTRA-IMPROVED]
 */

// Global AudioManager Interface
const SoundSynth = {
    ctx: null,
    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playTone(freq, type, duration, vol = 0.2) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    playChime() {
        this.playTone(523.25, 'sine', 0.15, 0.25); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.25), 80); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.3, 0.3), 160); // G5
    },
    playSlap() {
        this.playTone(180, 'triangle', 0.1, 0.4);
    },
    playError() {
        this.playTone(90, 'sawtooth', 0.4, 0.3);
        setTimeout(() => this.playTone(80, 'sawtooth', 0.3, 0.3), 100);
    }
};

// Core Architectural Systems Logic
const RuleEngine = {
    playerHand: [],
    bots: [
        { name: "Bot ڕێبوار", tilesLeft: 14, active: false },
        { name: "Bot چێنەر", tilesLeft: 14, active: false }
    ],
    discardPile: [{ value: 7, color: 'Red', colorCode: '#d91e18' }],
    activeTurnIndex: 0, // 0 = Player, 1 = Bot 1, 2 = Bot 2
    selectedTileIndex: null,
    isDragging: false,
    dragX: 0, dragY: 0,

    punishmentDictionary: [
        { text: "بۆکوێ؟ هێشتا نەتگەیاندووەتە ٨١! نانی کەم بخۆ بۆ ئەوەی هێزت هەبێت! 🥖📉", icon: "🥖" },
        { text: "کاکە ڕەنگەکان وەک یەک نین، چاوت بکەرەوە یان عەینەک بکڕە! 🕶️❌", icon: "🕶️" },
        { text: "هۆپ هۆپ! نۆرەی تۆ نییە، دەستت کۆبکەرەوە پێش ئەوەی جۆکەرەکە بتخوات! 🐒", icon: "🐒" },
        { text: "ئەم ڕیزبەندییە لای کێ فێربوویت؟ بچۆوە دەورەی سەرەتایی کۆنکان! 🎒😂", icon: "🎒" }
    ],

    dealInitialHand() {
        this.playerHand = [];
        const colors = [
            { name: 'Red', code: '#d91e18' },
            { name: 'Black', code: '#000000' },
            { name: 'Blue', code: '#1976d2' },
            { name: 'Yellow', code: '#f5b041' }
        ];

        for(let i = 0; i < 14; i++) {
            const rc = colors[Math.floor(Math.random() * colors.length)];
            this.playerHand.push({
                value: Math.floor(Math.random() * 13) + 1,
                color: rc.name,
                colorCode: rc.code,
                x: 0, y: 0, targetX: 0, targetY: 0 // Physics coordinates nodes
            });
        }
        this.calculatePointEvaluations();
    },

    calculatePointEvaluations() {
        let currentScore = this.playerHand.reduce((acc, tile) => acc + (tile.value > 10 ? 10 : tile.value), 0);
        document.getElementById('coin-count').innerText = `کۆمەڵە خاڵ: ${currentScore}`;
    },

    triggerViolationSequence() {
        SoundSynth.playError();
        const banner = document.getElementById('punishment-banner');
        const textElement = document.getElementById('warning-text');
        const iconElement = document.getElementById('warning-icon');
        const canvasElement = document.getElementById('game-canvas');

        const data = this.punishmentDictionary[Math.floor(Math.random() * this.punishmentDictionary.length)];
        
        textElement.innerText = data.text;
        iconElement.innerText = data.icon;

        banner.classList.remove('opacity-0', 'scale-75');
        banner.classList.add('opacity-100', 'scale-100');
        canvasElement.classList.add('shake-rack');

        setTimeout(() => {
            banner.classList.remove('opacity-100', 'scale-100');
            banner.classList.add('opacity-0', 'scale-75');
            canvasElement.classList.remove('shake-rack');
        }, 3000);
    },

    executeBotBehavior() {
        if (this.activeTurnIndex === 0) return;
        
        let currentBot = this.bots[this.activeTurnIndex - 1];
        currentBot.active = true;
        SoundSynth.playSlap();

        setTimeout(() => {
            // Simulated calculation logic
            this.discardPile.unshift({
                value: Math.floor(Math.random() * 13) + 1,
                color: 'Black',
                colorCode: '#000000'
            });
            SoundSynth.playSlap();
            currentBot.active = false;
            
            // Increment loop turn cycle
            this.activeTurnIndex = (this.activeTurnIndex + 1) % 3;
        }, 2000);
    }
};

const GameEngine = {
    canvas: null,
    ctx: null,
    currentState: 'STATE_PRELOAD',
    startTime: 0,
    particles: [],

    init() {
        document.getElementById('game-container').classList.remove('hidden');
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupPointerInteractions();

        window.addEventListener('click', () => {
            SoundSynth.init();
            this.requestEngineFullscreen();
            if(this.currentState === 'STATE_PRELOAD') {
                this.currentState = 'STATE_CUTSCENE';
                this.startTime = performance.now();
                this.generateCutsceneParticles();
                this.animateLoop();
            }
        }, { once: true });
    },

    resizeCanvas() {
        if(this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    },

    requestEngineFullscreen() {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) docEl.requestFullscreen();
    },

    generateCutsceneParticles() {
        this.particles = [];
        for (let i = 0; i < 200; i++) {
            this.particles.push({
                x: this.canvas.width / 2, y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                radius: Math.random() * 4 + 1,
                color: `rgba(197, 160, 89, ${Math.random()})`
            });
        }
    },

    setupPointerInteractions() {
        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const downHandler = (e) => {
            if (this.currentState !== 'STATE_GAME_PLAYING') return;
            if (RuleEngine.activeTurnIndex !== 0) {
                RuleEngine.triggerViolationSequence(); // Out of turn
                return;
            }
            const coords = getCanvasCoords(e);
            
            // Check bounding matrix collision against hand elements
            RuleEngine.playerHand.forEach((tile, i) => {
                if (coords.x >= tile.x && coords.x <= tile.x + 45 && coords.y >= tile.y && coords.y <= tile.y + 70) {
                    RuleEngine.selectedTileIndex = i;
                    RuleEngine.isDragging = true;
                    RuleEngine.dragX = coords.x - tile.x;
                    RuleEngine.dragY = coords.y - tile.y;
                    SoundSynth.playTone(400, 'sine', 0.05, 0.1);
                }
            });
        };

        const moveHandler = (e) => {
            if (!RuleEngine.isDragging) return;
            const coords = getCanvasCoords(e);
            const tile = RuleEngine.playerHand[RuleEngine.selectedTileIndex];
            tile.x = coords.x - RuleEngine.dragX;
            tile.y = coords.y - RuleEngine.dragY;
        };

        const upHandler = () => {
            if (!RuleEngine.isDragging) return;
            RuleEngine.isDragging = false;
            const tile = RuleEngine.playerHand[RuleEngine.selectedTileIndex];
            
            // Discard zone detection rule bounds
            if (tile.y < this.canvas.height / 2 + 60 && tile.x > this.canvas.width/2 - 100 && tile.x < this.canvas.width/2 + 100) {
                SoundSynth.playSlap();
                RuleEngine.discardPile.unshift(RuleEngine.playerHand.splice(RuleEngine.selectedTileIndex, 1)[0]);
                RuleEngine.calculatePointEvaluations();
                RuleEngine.activeTurnIndex = 1; // Hand pass workflow straight to bots matrix
            }
            RuleEngine.selectedTileIndex = null;
        };

        this.canvas.addEventListener('mousedown', downHandler);
        this.canvas.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);

        this.canvas.addEventListener('touchstart', downHandler);
        this.canvas.addEventListener('touchmove', moveHandler);
        window.addEventListener('touchend', upHandler);
    },

    animateLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const elapsed = (performance.now() - this.startTime) / 1000;

        switch(this.currentState) {
            case 'STATE_CUTSCENE':
                this.renderCinematicCutscene(elapsed);
                break;
            case 'STATE_LOBBY':
                this.renderAmbientLobbyBackground();
                break;
            case 'STATE_GAME_PLAYING':
                this.renderGameplayTable();
                RuleEngine.executeBotBehavior();
                break;
        }
        requestAnimationFrame(() => this.animateLoop());
    },

    renderCinematicCutscene(elapsed) {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = '#0b0c10'; ctx.fillRect(0, 0, w, h);

        if (elapsed < 2.5) {
            ctx.save();
            ctx.globalAlpha = Math.min(elapsed / 1.5, 1);
            ctx.fillStyle = '#ffffff'; ctx.font = '900 28px "Noto Sans Arabic"'; ctx.textAlign = 'center';
            ctx.fillText("SPECTRE GAMES", w / 2, h / 2 - 10);
            ctx.fillStyle = '#c5a059'; ctx.font = '700 16px "Noto Sans Arabic"';
            ctx.fillText("پێشکەش دەکرێت لەلایەن مۆحەمەد عەبدوڵا", w / 2, h / 2 + 25);
            ctx.restore();
        } 
        else if (elapsed >= 2.5 && elapsed < 5.0) {
            this.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color; ctx.fill();
            });
            ctx.save();
            const scale = (elapsed - 2.5) * 2.5;
            ctx.translate(w / 2, h / 2); ctx.rotate(elapsed * 5);
            ctx.shadowBlur = 40; ctx.shadowColor = '#c5a059';
            ctx.fillStyle = '#1f2833'; ctx.strokeStyle = '#c5a059'; ctx.lineWidth = 4;
            ctx.fillRect(-25 * scale, -38 * scale, 50 * scale, 76 * scale);
            ctx.strokeRect(-25 * scale, -38 * scale, 50 * scale, 76 * scale);
            ctx.fillStyle = '#c5a059'; ctx.font = `${12 * scale}px Arial`;
            ctx.fillText("🐒", -8 * scale, 6 * scale);
            ctx.restore();
        } 
        else if (elapsed >= 5.0 && elapsed < 6.5) {
            ctx.save();
            ctx.fillStyle = '#c5a059'; ctx.font = '900 52px "Noto Sans Arabic"'; ctx.textAlign = 'center';
            ctx.shadowBlur = 25; ctx.shadowColor = '#c5a059';
            ctx.fillText("کۆنکان - شای یارییەکان", w / 2, h / 2);
            ctx.restore();
        } 
        else {
            this.currentState = 'STATE_LOBBY';
            SoundSynth.playChime();
            document.getElementById('hud-top').classList.remove('opacity-0');
            document.getElementById('hud-center').classList.remove('opacity-0');
        }
    },

    renderAmbientLobbyBackground() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        let grad = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, w);
        grad.addColorStop(0, '#1f2833'); grad.addColorStop(1, '#0b0c10');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    },

    startMatch() {
        document.getElementById('lobby-menu').classList.add('hidden');
        document.getElementById('sorting-controls').classList.remove('hidden');
        this.currentState = 'STATE_GAME_PLAYING';
        RuleEngine.dealInitialHand();
    },

    renderGameplayTable() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        
        // 3D-feeling Deep Velvet Felt Surface Layer
        let tableGrad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w);
        tableGrad.addColorStop(0, '#0f3d1e'); tableGrad.addColorStop(1, '#051a0c');
        ctx.fillStyle = tableGrad; ctx.fillRect(0, 0, w, h);

        // Center Stack Boundary Slots Rendering
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(w/2 - 75, h/2 - 60, 60, 85); // Draw pile
        ctx.fillRect(w/2 + 15, h/2 - 60, 60, 85); // Discard pile

        // Draw Deck Pile Cover Graphics
        ctx.fillStyle = '#1f2833'; ctx.fillRect(w/2 - 72, h/2 - 57, 54, 79);
        ctx.strokeStyle = '#c5a059'; ctx.lineWidth = 2; ctx.strokeRect(w/2 - 72, h/2 - 57, 54, 79);

        // Render Open Discard Pile Top Asset
        if(RuleEngine.discardPile.length > 0) {
            let topTile = RuleEngine.discardPile[0];
            ctx.fillStyle = '#ffffff'; ctx.fillRect(w/2 + 18, h/2 - 57, 54, 79);
            ctx.fillStyle = topTile.colorCode; ctx.font = 'bold 20px Arial';
            ctx.fillText(topTile.value, w/2 + 34, h/2 - 10);
        }

        // Display Active HUD Context Turn Updates
        ctx.fillStyle = '#ffffff'; ctx.font = '14px "Noto Sans Arabic"'; ctx.textAlign = 'center';
        let turnText = RuleEngine.activeTurnIndex === 0 ? "نۆرەی تۆیە! کارتێک ڕابکێشە یان فڕێبدە سەر زەوی" : `نۆرەی کابرایە: ${RuleEngine.bots[RuleEngine.activeTurnIndex-1].name}`;
        ctx.fillText(turnText, w / 2, 40);

        // Render AI Nodes Dashboard
        RuleEngine.bots.forEach((bot, idx) => {
            ctx.save();
            ctx.fillStyle = bot.active ? '#c5a059' : 'rgba(255,255,255,0.1)';
            ctx.fillRect(idx === 0 ? 30 : w - 150, h/2 - 40, 120, 50);
            ctx.fillStyle = '#ffffff'; ctx.font = '12px "Noto Sans Arabic"';
            ctx.fillText(bot.name, idx === 0 ? 90 : w - 90, h/2 - 20);
            ctx.fillText(`کارتەکان: ${bot.tilesLeft}`, idx === 0 ? 90 : w - 90, h/2);
            ctx.restore();
        });

        // Compute/Interpolate Player Hand Positioning
        RuleEngine.playerHand.forEach((tile, index) => {
            if (!RuleEngine.isDragging || RuleEngine.selectedTileIndex !== index) {
                tile.targetX = (w / 2 - (RuleEngine.playerHand.length * 25)) + (index * 50);
                tile.targetY = h - 110;
                tile.x += (tile.targetX - tile.x) * 0.25; // 60FPS spring interpolation ease
                tile.y += (tile.targetY - tile.y) * 0.25;
            }

            ctx.save();
            ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.fillStyle = '#fdfdfa'; ctx.beginPath();
            ctx.roundRect(tile.x, tile.y, 45, 70, 6); ctx.fill();
            
            ctx.fillStyle = tile.colorCode; ctx.font = '900 18px Arial';
            ctx.fillText(tile.value, tile.x + 14, tile.y + 32);
            ctx.restore();
        });
    },

    toggleChatWheel() {
        document.getElementById('chat-wheel').classList.toggle('hidden');
    },

    sendPhrase(id) {
        this.toggleChatWheel();
        RuleEngine.triggerViolationSequence(); // Direct banter feedback initialization loop
    },

    sortHand(criteria) {
        SoundSynth.playChime();
        RuleEngine.sortHand(criteria);
    }
};
