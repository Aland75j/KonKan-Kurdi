/**
 * PROJECT: KONKAN 100x MASTER LOBBY ARCHITECTURE
 * AUTHOR: MOHAMMED ABDULLAH
 */

const LobbyManager = {
    // کردنەوەی مۆداڵەکان بە ئەنیمەیشنی نەرم
    openModal(id) {
        const modal = document.getElementById(id);
        if(!modal) return;
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
        }, 5);
    },

    // داخستنی مۆداڵەکان
    closeModal(id) {
        const modal = document.getElementById(id);
        if(!modal) return;
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    },

    // هەڵبژاردنی مۆد و چوونە ناو مێزی یاری
    selectMode(modeName) {
        console.log("Entering mode: " + modeName);
        
        // شاردنەوەی لۆبی سەرەکی
        document.getElementById('lobby-modes').classList.add('opacity-0', 'pointer-events-none');
        
        // نیشاندانی کانڤاسی یاری ڕاستەقینە
        const canvas = document.getElementById('game-canvas');
        canvas.classList.remove('hidden');
        setTimeout(() => {
            canvas.classList.remove('opacity-0');
            canvas.classList.add('opacity-100');
            // دەستپێکردنی بزوێنەری مێزەکە
            TableEngine.boot(canvas);
        }, 300);
    }
};

const TableEngine = {
    canvas: null, ctx: null,
    boot(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loop();
    },
    resize() {
        if(!this.canvas) return;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    },
    loop() {
        if(!this.ctx) return;
        this.render();
        requestAnimationFrame(() => this.loop());
    },
    render() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        
        // باکگراوندی مێزی سەوزی قووڵی کۆنکان
        let grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, Math.max(w, h));
        grad.addColorStop(0, '#0a331a'); grad.addColorStop(1, '#03140a');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

        // نوسینی تێست لەسەر مێزەکە
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = '900 24px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText("مێزی کۆنکان چالاکە - بەردەکان لە پۆلی داهاتوو ڕێکدەخرێن", w/2, h/2);
    }
};

// قوفڵکردنی لۆدینگ لەسەر لۆبی
window.onload = () => {
    console.log("Konkan Ultimate Lobby Initialized.");
};
