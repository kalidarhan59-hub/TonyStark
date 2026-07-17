/**
 * J.A.R.V.I.S. Interactive Logic & Real-time Web Audio Synthesizer v5.0
 * Stark Industries HUD
 */

// Web Audio API Context & Nodes
let audioCtx = null;
let mainAnalyser = null;
let mainGainNode = null;
let ambientOsc = null;
let ambientGain = null;
let isAudioEnabled = true;

// Systems Telemetry Intervals
let cpuInterval = null;
let logInterval = null;
let coordinates = { x: 0, y: 0 };
let currentRotationY = 0;

// Suit Specification Matrices
const suitSpecs = {
    mk3: {
        name: "MARK III // THE CLASSIC",
        desc: "Первый золотисто-красный костюм. Оснащен реактивными репульсорами, встроенными ракетами, мини-ганом на плече и прочной золотисто-титановой броней.",
        repulsor: "75%",
        flight: "Mach 2.0", // 20%
        shield: "70%",
        nano: "N/A"
    },
    mk43: {
        name: "MARK XLIII // PREHENSIBLE INTEGRATION",
        desc: "Автономный костюм с раздельным захватом деталей. Оснащен улучшенной ракетой на предплечье, часовым режимом и системой подавления вибрации.",
        repulsor: "85%",
        flight: "Mach 3.5", // 35%
        shield: "80%",
        nano: "20%"
    },
    mk50: {
        name: "MARK L // NANO-FLUID TECHNOLOGY",
        desc: "Революционная нанотехнологическая броня, хранящаяся прямо в дуговом реакторе. Способна регенерировать повреждения в бою и материализовать крылья, клинки, щиты.",
        repulsor: "98%",
        flight: "Mach 8.0", // 80%
        shield: "95%",
        nano: "100%"
    },
    mk85: {
        name: "MARK LXXXV // ULTIMATE NANO-MATRIX",
        desc: "Самая продвинутая броня Тони Старка. Сочетает нанотехнологии Mark L со сверхпрочным титановым экзоскелетом. Способна выдержать мощь Камней Бесконечности.",
        repulsor: "100%",
        flight: "Mach 10.0", // 100%
        shield: "100%",
        nano: "100%"
    }
};

// Start System Hook
window.addEventListener('DOMContentLoaded', () => {
    initBootLoader();
    initThemeControl();
    initAudioToggle();
    initHologramWidgets();
    initSuitSelector();
    initArcReactorCore();
    initCoordinatesTracker();
    initCanvasScanner();
});

// Setup audio nodes and routing
function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Setup central Audio Analyser for the live HUD spectrum viz!
        mainAnalyser = audioCtx.createAnalyser();
        mainAnalyser.fftSize = 64;
        
        mainGainNode = audioCtx.createGain();
        mainGainNode.gain.value = 1.0;
        
        // Route: Synthesizer Nodes -> mainGainNode -> mainAnalyser -> Destination
        mainGainNode.connect(mainAnalyser);
        mainAnalyser.connect(audioCtx.destination);
        
        // Start spectrum canvas animation loop
        animateVisualizer();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Procedural synthesizer play functions
function playClickSound(freq = 800, duration = 0.08, type = 'sine') {
    if (!isAudioEnabled) return;
    initAudioContext();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(mainGainNode);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2.5, audioCtx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playWarningSound() {
    if (!isAudioEnabled) return;
    initAudioContext();
    
    const oscNode = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscNode.connect(gainNode);
    gainNode.connect(mainGainNode);
    
    oscNode.type = 'sawtooth';
    const now = audioCtx.currentTime;
    
    oscNode.frequency.setValueAtTime(140, now);
    oscNode.frequency.linearRampToValueAtTime(260, now + 0.35);
    oscNode.frequency.linearRampToValueAtTime(140, now + 0.7);
    oscNode.frequency.linearRampToValueAtTime(260, now + 1.05);
    oscNode.frequency.linearRampToValueAtTime(140, now + 1.4);
    
    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 1.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
    
    oscNode.start();
    oscNode.stop(now + 1.45);
}

function playBootSound() {
    if (!isAudioEnabled) return;
    initAudioContext();
    
    const now = audioCtx.currentTime;
    
    // Sweep Oscillator 
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    osc.connect(mainGainNode);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 1.6);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 1.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);
    
    // Harmony chords
    const chordFreqs = [300, 450, 600];
    chordFreqs.forEach((freq, idx) => {
        const chordOsc = audioCtx.createOscillator();
        const chordGain = audioCtx.createGain();
        chordOsc.connect(chordGain);
        chordGain.connect(mainGainNode);
        chordOsc.type = idx === 1 ? 'triangle' : 'sine';
        chordOsc.frequency.setValueAtTime(freq, now + 1.4);
        
        chordGain.gain.setValueAtTime(0.001, now + 1.4);
        chordGain.gain.exponentialRampToValueAtTime(0.07, now + 1.6);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
        
        chordOsc.start(now + 1.4);
        chordOsc.stop(now + 2.7);
    });
    
    osc.start();
    osc.stop(now + 1.8);
}

// Low drone reactor sound hum
function startAmbientHum() {
    if (!isAudioEnabled) return;
    initAudioContext();
    
    if (ambientOsc) return;
    
    ambientOsc = audioCtx.createOscillator();
    ambientGain = audioCtx.createGain();
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 110;
    
    ambientOsc.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(mainGainNode);
    
    ambientOsc.type = 'sawtooth';
    ambientOsc.frequency.value = 65; // JARVIS drone hum
    
    ambientGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    ambientOsc.start();
}

function stopAmbientHum() {
    if (ambientOsc) {
        try {
            ambientOsc.stop();
        } catch(e){}
        ambientOsc = null;
        ambientGain = null;
    }
}

// Live equalizer canvas rendering loop
function animateVisualizer() {
    const canvas = document.getElementById('audio-viz-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const bufferLength = mainAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        requestAnimationFrame(draw);
        
        if (!mainAnalyser) return;
        mainAnalyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isCombat = document.body.classList.contains('combat-theme');
        ctx.fillStyle = isCombat ? '#ff003c' : '#00f0ff';
        
        const barWidth = (canvas.width / bufferLength) * 1.8;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.95;
            
            // Draw symmetric glowing equalizer bars
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
        }
    }
    draw();
}

// 1. Initial Boot System Console Stream Loader
function initBootLoader() {
    const bootBtn = document.getElementById('boot-btn');
    const bootConsole = document.getElementById('boot-console');
    const bootScreen = document.getElementById('boot-screen');
    const hudMain = document.getElementById('hud-main');
    
    const bootLogs = [
        "[OK] SYSTEM DIAGNOSTICS DETECTED: 100% HEALTHY",
        "[OK] SYNAPSE DATA ARCHIVES LOADED...",
        "[OK] ARC REACTOR FUEL LEVEL: OPTIMAL",
        "[OK] INITIATING STARK ENCRYPTION PROTOCOLS...",
        "[OK] INTRODUCING COGNITIVE HUD ALIGNMENT...",
        "[OK] SYSTEMS STABLE. J.A.R.V.I.S. VER.5 READY."
    ];
    
    let idx = 0;
    const interval = setInterval(() => {
        if (idx < bootLogs.length) {
            const row = document.createElement('div');
            row.innerText = bootLogs[idx];
            bootConsole.appendChild(row);
            bootConsole.scrollTop = bootConsole.scrollHeight;
            idx++;
        } else {
            clearInterval(interval);
            document.querySelector('.boot-prompt').style.display = 'none';
            bootBtn.style.display = 'block';
        }
    }, 700);
    
    bootBtn.addEventListener('click', () => {
        initAudioContext();
        playBootSound();
        
        bootScreen.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        bootScreen.style.opacity = '0';
        bootScreen.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            bootScreen.style.display = 'none';
            document.body.classList.remove('boot-loading');
            hudMain.style.display = 'grid';
            
            setTimeout(() => {
                startAmbientHum();
            }, 300);
            
            startTelemetrySimulation();
        }, 700);
    });
}

// 2. Audio Control Toggle Button
function initAudioToggle() {
    const audioToggle = document.getElementById('audio-toggle');
    audioToggle.addEventListener('click', () => {
        isAudioEnabled = !isAudioEnabled;
        playClickSound(900, 0.05);
        
        if (isAudioEnabled) {
            audioToggle.classList.add('active');
            audioToggle.querySelector('.audio-label-text').innerText = 'AUDIO: ON';
            startAmbientHum();
        } else {
            audioToggle.classList.remove('active');
            audioToggle.querySelector('.audio-label-text').innerText = 'AUDIO: OFF';
            stopAmbientHum();
        }
    });
}

// 3. J.A.R.V.I.S. Cyan vs F.R.I.D.A.Y. Red Combat Theme Shift
function initThemeControl() {
    const modeToggle = document.getElementById('mode-toggle');
    const threatLevel = document.getElementById('threat-level');
    
    modeToggle.addEventListener('click', () => {
        document.body.classList.toggle('combat-theme');
        document.getElementById('hud-main').classList.toggle('combat-theme');
        
        const isCombat = document.body.classList.contains('combat-theme');
        
        if (isCombat) {
            playWarningSound();
            modeToggle.querySelector('.btn-label').innerText = 'JARVIS MODE';
            threatLevel.innerText = 'CRITICAL ALERT';
            threatLevel.className = 'readout-value alert-text';
            
            // Fullscreen alarm flash
            document.getElementById('combat-flash').classList.add('active');
            setTimeout(() => {
                document.getElementById('combat-flash').classList.remove('active');
            }, 2000);
            
            if (ambientOsc) {
                ambientOsc.frequency.setValueAtTime(85, audioCtx.currentTime);
                ambientGain.gain.setValueAtTime(0.035, audioCtx.currentTime);
            }
        } else {
            playClickSound(600, 0.1, 'triangle');
            modeToggle.querySelector('.btn-label').innerText = 'COMBAT MODE';
            threatLevel.innerText = 'MINIMAL';
            threatLevel.className = 'readout-value';
            
            if (ambientOsc) {
                ambientOsc.frequency.setValueAtTime(65, audioCtx.currentTime);
                ambientGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            }
        }
    });
}

// 4. Holographic widget controls
function initHologramWidgets() {
    const menuButtons = document.querySelectorAll('.menu-nav-item');
    const widgets = document.querySelectorAll('.hologram-floating-widget');
    
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            playClickSound(880, 0.05);
            
            menuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            widgets.forEach(w => w.classList.remove('active-widget'));
            
            const widget = document.getElementById(targetId);
            if (widget) {
                widget.classList.add('active-widget');
                
                // Initialize typewriter
                const typewriters = widget.querySelectorAll('.typewriter-text');
                typewriters.forEach(tw => runTypewriter(tw));
            }
        });
    });
    
    // Close button handles
    document.querySelectorAll('.widget-dismiss-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-close');
            const widget = document.getElementById(targetId);
            
            playClickSound(440, 0.08);
            
            if (widget) {
                widget.classList.remove('active-widget');
                menuButtons.forEach(b => {
                    if (b.getAttribute('data-target') === targetId) {
                        b.classList.remove('active');
                    }
                });
            }
        });
    });
}

// Typewriter Text Effect with procedural clicks
function runTypewriter(element) {
    if (element.classList.contains('typing-complete')) return;
    
    const text = element.getAttribute('data-stored-text') || element.innerText;
    if (!element.getAttribute('data-stored-text')) {
        element.setAttribute('data-stored-text', text);
    }
    
    element.innerText = '';
    element.classList.add('typing-active');
    
    const delay = parseInt(element.getAttribute('data-delay') || '30');
    let i = 0;
    
    function writeChar() {
        if (i < text.length) {
            element.innerText += text[i];
            i++;
            // Soft diagnostic click sounds while rendering text character-by-character
            if (i % 4 === 0) {
                playClickSound(1000 + Math.random() * 300, 0.01);
            }
            setTimeout(writeChar, delay);
        } else {
            element.classList.remove('typing-active');
            element.classList.add('typing-complete');
        }
    }
    writeChar();
}

// 5. Suit selector spec change and rotation slider
function initSuitSelector() {
    const suitBtns = document.querySelectorAll('.armor-tab-btn');
    const rangeSlider = document.getElementById('rotation-range');
    const suitImg = document.getElementById('suit-img');
    
    suitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-suit');
            const specs = suitSpecs[key];
            
            playClickSound(950, 0.05);
            
            if (specs) {
                suitBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.getElementById('suit-name').innerText = specs.name;
                document.getElementById('suit-desc').innerText = specs.desc;
                
                const repFill = document.getElementById('spec-repulsor');
                const fliFill = document.getElementById('spec-flight');
                const shiFill = document.getElementById('spec-shield');
                const nanoFill = document.getElementById('spec-nano');
                
                repFill.style.width = specs.repulsor;
                fliFill.style.width = specs.flight.includes('Mach') ? parseFloat(specs.flight.split(' ')[1]) * 10 + '%' : specs.flight;
                shiFill.style.width = specs.shield;
                nanoFill.style.width = specs.nano === 'N/A' ? '0%' : specs.nano;
                
                document.getElementById('val-repulsor').innerText = specs.repulsor;
                document.getElementById('val-flight').innerText = specs.flight;
                document.getElementById('val-shield').innerText = specs.shield;
                document.getElementById('val-nano').innerText = specs.nano;
            }
        });
    });
    
    // Slider rotation logic
    rangeSlider.addEventListener('input', (e) => {
        currentRotationY = e.target.value;
        suitImg.style.transform = `perspective(500px) rotateY(${currentRotationY}deg)`;
        
        if (currentRotationY % 8 === 0) {
            playClickSound(1100 + (currentRotationY * 1.5), 0.01);
        }
    });
    
    // Interactive mouse drag rotational matrix on blueprint
    let isDragging = false;
    let clickStartX = 0;
    let startRotationY = 0;
    
    const viewport = document.querySelector('.blueprint-canvas-viewport');
    
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        clickStartX = e.clientX;
        startRotationY = parseInt(rangeSlider.value);
        viewport.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mouseup', () => {
        isDragging = false;
        viewport.style.cursor = 'grab';
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - clickStartX;
        let rotVal = (startRotationY + Math.round(deltaX * 0.75)) % 360;
        if (rotVal < 0) rotVal += 360;
        
        rangeSlider.value = rotVal;
        currentRotationY = rotVal;
        suitImg.style.transform = `perspective(500px) rotateY(${rotVal}deg)`;
        
        if (Math.abs(deltaX) % 15 === 0) {
            playClickSound(1050 + Math.random() * 200, 0.01);
        }
    });
}

// 6. Arc Reactor Click Core: Overload discharge, recharge simulation
function initArcReactorCore() {
    const arcCore = document.getElementById('arc-core');
    const powerPercent = document.getElementById('power-percent');
    const powerStatus = document.getElementById('power-status');
    const arcImg = document.getElementById('arc-img');
    
    let isRecharging = false;
    
    arcCore.addEventListener('click', () => {
        if (isRecharging) return;
        isRecharging = true;
        
        // Critical blackout trigger
        playWarningSound();
        
        powerPercent.innerText = '0%';
        powerStatus.innerText = 'CRITICAL SHUTDOWN';
        powerStatus.style.color = '#ff003c';
        
        arcImg.style.filter = 'brightness(0.08) sepia(1) hue-rotate(320deg) saturate(6)';
        
        let p = 0;
        const interval = setInterval(() => {
            p += Math.floor(Math.random() * 6) + 1;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                isRecharging = false;
                
                powerPercent.innerText = '100%';
                powerStatus.innerText = 'CORE SECURE';
                powerStatus.style.color = '';
                
                // Restore filter to theme settings
                const isCombat = document.body.classList.contains('combat-theme');
                arcImg.style.filter = isCombat ? 'var(--hologram-filter)' : '';
                
                playClickSound(1000, 0.15, 'sine');
            } else {
                powerPercent.innerText = p + '%';
                if (p % 10 === 0) {
                    playClickSound(150 + (p * 8), 0.02, 'triangle');
                }
            }
        }, 120);
    });
    
    // Core details widget buttons
    const overchargeBtn = document.getElementById('overcharge-btn');
    const dischargeBtn = document.getElementById('discharge-btn');
    
    overchargeBtn.addEventListener('click', () => {
        playWarningSound();
        powerPercent.innerText = '165%';
        powerStatus.innerText = 'SYSTEM OVERCHARGE';
        powerStatus.style.color = '#ffaa00';
        arcImg.style.animation = 'pulse-glow 0.4s infinite alternate';
    });
    
    dischargeBtn.addEventListener('click', () => {
        playClickSound(400, 0.2);
        powerPercent.innerText = '20%';
        powerStatus.innerText = 'DISCHARGED STATE';
        powerStatus.style.color = '#ff003c';
        arcImg.style.animation = 'none';
        arcImg.style.filter = 'brightness(0.35) sepia(1)';
    });
}

// 7. Cursor Coordinates Tracking
function initCoordinatesTracker() {
    const coordsVal = document.getElementById('coords-val');
    window.addEventListener('mousemove', (e) => {
        coordinates.x = ((e.clientX / window.innerWidth) * 100).toFixed(2);
        coordinates.y = ((e.clientY / window.innerHeight) * 100).toFixed(2);
        
        coordsVal.innerText = `X: ${coordinates.x} Y: ${coordinates.y}`;
    });
}

// 8. Systems Telemetry & Logs Simulation
function startTelemetrySimulation() {
    const cpuFill = document.getElementById('cpu-fill');
    const cpuVal = document.getElementById('cpu-val');
    const tempFill = document.getElementById('temp-fill');
    const tempVal = document.getElementById('temp-val');
    const logStream = document.getElementById('log-stream');
    const scannerFeed = document.getElementById('scanner-feed');
    
    const logsData = [
        { text: "Repulsor flight calibration sync", status: "OK", cls: "log-status-ok" },
        { text: "Thermal capacitor cell spiked", status: "WARN", cls: "log-status-warn" },
        { text: "Target acquisition reticle focused", status: "OK", cls: "log-status-ok" },
        { text: "Nanotech shield density verified", status: "OK", cls: "log-status-ok" },
        { text: "Vibrational damper hydraulics scan", status: "OK", cls: "log-status-ok" },
        { text: "Exotic element structural degradation", status: "CRIT", cls: "log-status-crit" },
        { text: "Stark secure cloud sync finalized", status: "OK", cls: "log-status-ok" },
        { text: "Acoustic sensor baseline normalized", status: "OK", cls: "log-status-ok" }
    ];
    
    // CPU load updater
    cpuInterval = setInterval(() => {
        const val = Math.floor(Math.random() * 25) + 35; // 35% to 60%
        cpuFill.style.width = val + '%';
        cpuVal.innerText = val + '%';
        
        const temp = Math.floor(Math.random() * 12) + 55; // 55 to 67C
        tempFill.style.width = temp + '%';
        tempVal.innerText = temp + '°C';
    }, 2500);
    
    function appendLog() {
        const randomLog = logsData[Math.floor(Math.random() * logsData.length)];
        const time = new Date().toTimeString().split(' ')[0];
        
        const line = document.createElement('div');
        line.className = 'log-item';
        line.innerHTML = `
            <span>[${time}]</span>
            <span>${randomLog.text.toUpperCase()}</span>
            <span class="${randomLog.cls}">${randomLog.status}</span>
        `;
        
        logStream.appendChild(line);
        logStream.scrollTop = logStream.scrollHeight;
        
        // Update footer horizontal scanner feed
        scannerFeed.innerText = `[LOG] ${randomLog.text.toUpperCase()} // STATUS: ${randomLog.status}`;
        
        while (logStream.children.length > 25) {
            logStream.removeChild(logStream.firstChild);
        }
    }
    
    // Populate base log pool
    for(let l = 0; l < 8; l++) appendLog();
    
    logInterval = setInterval(appendLog, 4500);
}

// 9. Interactive Scanning Laser Canvas sweeps
function initCanvasScanner() {
    const canvas = document.getElementById('hud-scanner-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    
    let scanLineY = 0;
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isCombat = document.body.classList.contains('combat-theme');
        const prefix = isCombat ? 'rgba(255, 0, 60,' : 'rgba(0, 240, 255,';
        
        // Horizontal scan sweep
        scanLineY += 1.8;
        if (scanLineY > canvas.height) scanLineY = 0;
        
        ctx.beginPath();
        ctx.moveTo(0, scanLineY);
        ctx.lineTo(canvas.width, scanLineY);
        ctx.strokeStyle = `${prefix} 0.16)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Glow gradient around sweep
        const sweepGrad = ctx.createLinearGradient(0, scanLineY - 30, 0, scanLineY + 30);
        sweepGrad.addColorStop(0, `${prefix} 0)`);
        sweepGrad.addColorStop(0.5, `${prefix} 0.08)`);
        sweepGrad.addColorStop(1, `${prefix} 0)`);
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, scanLineY - 30, canvas.width, 60);
        
        // Interactive cursor compass grids
        if (coordinates.x > 0 && coordinates.y > 0) {
            const cx = (parseFloat(coordinates.x) / 100) * canvas.width;
            const cy = (parseFloat(coordinates.y) / 100) * canvas.height;
            
            // Outer crosshair circle
            ctx.beginPath();
            ctx.arc(cx, cy, 55, 0, Math.PI * 2);
            ctx.strokeStyle = `${prefix} 0.06)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Inner core dot
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = `${prefix} 0.15)`;
            ctx.fill();
        }
        
        requestAnimationFrame(render);
    }
    render();
}
