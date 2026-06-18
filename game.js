/**
 * PROJECT: KONKAN CINEMATIC PLATINUM EDITION
 * LIFECYCLE HANDSHAKE BUG FIX ENGINE
 */

const SoundSynth = {
    ctx: null,
    init() { if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    playTone(freq, type, duration, vol = 0.2) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    playChime() { this.playTone(523, 'sine', 0.15, 0.2); setTimeout(() => this.playTone(659, 'sine', 0.15, 0.2), 80); },
    playSlap() { this.playTone(180, 'triangle', 0.1, 0.3); },
    playError() { this.playTone(95, 'sawtooth', 0.3, 0.3); }
};

const RuleEngine = {
    playerHand: [],
    discardPile: [{ value: 11, color: 'Red', colorCode: '#d91e18' }],
    activeTurnIndex: 0,
    selectedTileIndex: null,
    isDragging: false,
    dragX: 0, dragY: 0,
    punishments: [
        { text: "بۆکوێ؟ هێشتا نەتگەیاندووەتە ٨١! 🥖📉", icon: "🥖" },
        { text: "کاکە ڕەنگەکان وەک یەک نین، چاوت بکەرەوە! 🕶️❌", icon: "🕶️" },
        { text: "هۆپ هۆپ! نۆرەی تۆ نییە برا! 🐒", icon: "🐒" }
    ],
    dealInitialHand() {
        this.playerHand = [];
        const colors = [{name:'Red',code:'#d91e18'}, {name:'Black',code:'#000000'}, {name:'Blue',code:'#1976d2'}];
        for(let i=0; i<14; i++) {
            const rc = colors[Math.floor(Math.random()*colors.length)];
            this.playerHand.push({ value: Math.floor(Math.random()*13)+1, color: rc.name, colorCode: rc.code, x:0, y:0 });
        }
        document.getElementById('coin-count').innerText = `خاڵەکانت: ٨١`;
    },
    triggerViolationSequence() {
        SoundSynth.playError();
        const banner = document.getElementById('punishment-banner');
        const data = this.punishments[Math.floor(Math.random() * this.punishments.length)];
        document.getElementById('warning-text').innerText = data.text;
        document.getElementById('warning-icon').innerText = data.icon;
        banner.classList.remove('opacity-0'); banner.classList.add('opacity-100');
        document.getElementById('game-canvas').classList.add('shake-rack');
        setTimeout(() => {
            banner.classList.remove('opacity-100'); banner.classList.add('opacity-0');
            document.getElementById('game-canvas').classList.remove('shake-rack');
        }, 2500);
    }
};

const GameEngine = {
    canvas: null, ctx: null, currentState: 'STATE_PRELOAD', startTime: 0,

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // The Magic Fix: Explicitly remove black screens on touch events
        document.getElementById('tap-to-start').addEventListener('click', () => {
            document.getElementById('tap-to-start').style.display = 'none';
            document.getElementById('ui-layer').classList.remove('hidden');
            SoundSynth.init();
            
            this.currentState = 'STATE_CUTSCENE';
            this.startTime = performance.now();
            this.setupInteractions();
            this.loop();
        });
    },

    resize() {
        const wrapper = document.getElementById('orientation-wrapper');
        if (window.innerHeight > window.innerWidth) {
            // Screen is physically held in portrait, update sizes to force rotated dimensions
            this.canvas.width = window.innerHeight;
            this.canvas.height = window.innerWidth;
            wrapper.style.width = window.innerHeight + 'px';
            wrapper.style.height = window.innerWidth + 'px';
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            wrapper.style.width = window.innerWidth + 'px';
            wrapper.style.height = window.innerHeight + 'px';
        }
    },

    setupInteractions() {
        const getMouseCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Inversion calculation parameters check if screen is currently forced rotated
            const isRotated = window.innerHeight > window.innerWidth;
            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            if (isRotated) {
                return { x: clientY, y: this.canvas.height - (clientX - rect.left) };
            }
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            if(this.currentState !== 'STATE_GAME_PLAYING') return;
            const coords = getMouseCoords(e);
            RuleEngine.playerHand.forEach((tile, i) => {
                if(coords.x >= tile.x && coords.x <= tile.x + 45 && coords.y >= tile.y && coords.y <= tile.y + 70) {
                    RuleEngine.selectedTileIndex = i; RuleEngine.isDragging = true;
                    RuleEngine.dragX = coords.x - tile.x; RuleEngine.dragY = coords.y - tile.y;
                }
            });
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!RuleEngine.isDragging) return;
            const coords = getMouseCoords(e);
            const tile = RuleEngine.playerHand[RuleEngine.selectedTileIndex];
            tile.x = coords.x - RuleEngine.dragX; tile.y = coords.y - RuleEngine.dragY;
        });

        window.addEventListener('mouseup', () => {
            if (!RuleEngine.isDragging) return;
            RuleEngine.isDragging = false;
            const tile = RuleEngine.playerHand[RuleEngine.selectedTileIndex];
            if(tile.y < this.canvas.height / 2) {
                SoundSynth.playSlap();
                RuleEngine.discardPile.unshift(RuleEngine.playerHand.splice(RuleEngine.selectedTileIndex, 1)[0]);
            }
            RuleEngine.selectedTileIndex = null;
        });
        
        // Match touch interface routing
        this.canvas.addEventListener('touchstart', (e) => this.canvas.dispatchEvent(new MouseEvent('mousedown', e)));
        this.canvas.addEventListener('touchmove', (e) => this.canvas.dispatchEvent(new MouseEvent('mousemove', e)));
    },

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const elapsed = (performance.now() - this.startTime) / 1000;

        if (this.currentState === 'STATE_CUTSCENE') {
            this.renderCutscene(elapsed);
        } else if (this.currentState === 'STATE_GAME_PLAYING') {
            this.renderTable();
        }
        requestAnimationFrame(() => this.loop());
    },

    renderCutscene(elapsed) {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = '#0b0c10'; ctx.fillRect(0, 0, w, h);

        if (elapsed < 2.0) {
            ctx.fillStyle = '#ffffff'; ctx.font = '900 24px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText("SPECTRE GAMES", w/2, h/2 - 10);
            ctx.fillStyle = '#c5a059'; ctx.font = '14px sans-serif';
            ctx.fillText("پێشکەش دەکرێت لەلایەن مۆحەمەد عەبدوڵا", w/2, h/2 + 20);
        } else if (elapsed >= 2.0 && elapsed < 4.0) {
            ctx.fillStyle = '#c5a059'; ctx.font = '900 36px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText("کۆنکان - شای یارییەکان", w/2, h/2);
        } else {
            this.currentState = 'STATE_GAME_PLAYING';
            SoundSynth.playChime();
            RuleEngine.dealInitialHand();
        }
    },

    renderTable() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = '#0f3d1e'; ctx.fillRect(0, 0, w, h);

        // Deck piles
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(w/2 - 60, h/2 - 40, 45, 65);
        ctx.fillRect(w/2 + 15, h/2 - 40, 45, 65);

        if(RuleEngine.discardPile.length > 0) {
            let top = RuleEngine.discardPile[0];
            ctx.fillStyle = '#ffffff'; ctx.fillRect(w/2 + 15, h/2 - 40, 45, 65);
            ctx.fillStyle = top.colorCode; ctx.font = 'bold 16px Arial'; ctx.fillText(top.value, w/2 + 28, h/2 - 20);
        }

        // Hand
        RuleEngine.playerHand.forEach((tile, index) => {
            if (!RuleEngine.isDragging || RuleEngine.selectedTileIndex !== index) {
                tile.x = (w / 2 - (RuleEngine.playerHand.length * 25)) + (index * 48);
                tile.y = h - 90;
            }
            ctx.fillStyle = '#fdfdfa'; ctx.fillRect(tile.x, tile.y, 40, 60);
            ctx.fillStyle = tile.colorCode; ctx.font = 'bold 16px Arial'; ctx.fillText(tile.value, tile.x + 12, tile.y + 25);
        });
    },
    toggleChatWheel() { document.getElementById('chat-wheel').classList.toggle('hidden'); },
    sendPhrase() { this.toggleChatWheel(); RuleEngine.triggerViolationSequence(); },
    sortHand() { RuleEngine.playerHand.sort((a,b)=>a.value-b.value); }
};

window.onload = () => GameEngine.init();
