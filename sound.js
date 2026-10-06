// Glitch sound engine: generated with the Web Audio API, no audio files.
// Ticks, bleeps and static, all sent through reverb and echo. No background hum.
window.GlitchSound = (function () {
    var ctx, master, dry, send;
    var VOLUME = 1.0;
    var muted = false;
    try { muted = localStorage.getItem('glitchMuted') === '1'; } catch (e) {}

    function init() {
        if (ctx) {
            if (ctx.state === 'suspended') ctx.resume();
            return true;
        }
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();

        master = ctx.createGain();
        master.gain.value = muted ? 0 : VOLUME;
        master.connect(ctx.destination);

        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.ratio.value = 4;
        comp.connect(master);

        dry = ctx.createGain();
        dry.gain.value = 0.6;
        dry.connect(comp);

        // Reverb: long, dark tail
        var reverb = ctx.createConvolver();
        reverb.buffer = impulse(3.4, 2.6);
        var revTone = ctx.createBiquadFilter();
        revTone.type = 'lowpass';
        revTone.frequency.value = 5000;
        var revGain = ctx.createGain();
        revGain.gain.value = 0.9;
        reverb.connect(revTone);
        revTone.connect(revGain);
        revGain.connect(comp);

        // Echo: dotted, filtered feedback delay that also feeds the reverb
        var delay = ctx.createDelay(2);
        delay.delayTime.value = 0.34;
        var feedback = ctx.createGain();
        feedback.gain.value = 0.42;
        var delayTone = ctx.createBiquadFilter();
        delayTone.type = 'lowpass';
        delayTone.frequency.value = 2600;
        delay.connect(delayTone);
        delayTone.connect(feedback);
        feedback.connect(delay);
        var delayGain = ctx.createGain();
        delayGain.gain.value = 0.45;
        delayTone.connect(delayGain);
        delayGain.connect(comp);
        delayGain.connect(reverb);

        send = ctx.createGain();
        send.connect(reverb);
        send.connect(delay);
        return true;
    }

    function impulse(seconds, decay) {
        var len = Math.floor(ctx.sampleRate * seconds);
        var buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
            var data = buf.getChannelData(ch);
            for (var i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
            }
        }
        return buf;
    }

    function noiseBuffer(seconds) {
        var len = Math.floor(ctx.sampleRate * seconds);
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        return buf;
    }

    // Connect a source to the dry bus and the reverb/echo send
    function route(node, wet) {
        node.connect(dry);
        var s = ctx.createGain();
        s.gain.value = wet;
        node.connect(s);
        s.connect(send);
    }

    function tone(freq, dur, opts) {
        if (!ctx) return;
        opts = opts || {};
        var t = ctx.currentTime + (opts.delay || 0);
        var o = ctx.createOscillator();
        o.type = opts.type || 'sine';
        o.frequency.setValueAtTime(freq, t);
        if (opts.glide) o.frequency.exponentialRampToValueAtTime(opts.glide, t + dur);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(opts.vol || 0.1, t + (opts.attack || 0.004));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        route(g, opts.wet === undefined ? 0.8 : opts.wet);
        o.start(t);
        o.stop(t + dur + 0.05);
    }

    return {
        start: function () { init(); },
        stop: function () {},

        // Soft high tick for typed characters
        tick: function () {
            tone(2400 + Math.random() * 1400, 0.03, { type: 'triangle', vol: 0.035, wet: 0.9 });
        },

        // Bleep for each new boot line
        bleep: function () {
            var notes = [880, 987.8, 1174.7, 1318.5];
            tone(notes[Math.floor(Math.random() * notes.length)], 0.14, { vol: 0.09, wet: 0.85 });
        },

        // Short burst of gated static ("anomalies detected")
        staticBurst: function () {
            if (!ctx) return;
            var t = ctx.currentTime;
            var src = ctx.createBufferSource();
            src.buffer = noiseBuffer(0.5);
            var bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 1800;
            bp.Q.value = 1.2;
            var g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            for (var i = 0; i < 12; i++) {
                g.gain.setValueAtTime(Math.random() < 0.6 ? 0.06 + Math.random() * 0.05 : 0.0001, t + i * 0.03);
            }
            g.gain.setValueAtTime(0.0001, t + 0.38);
            src.connect(bp);
            bp.connect(g);
            route(g, 0.75);
            src.start(t);
            src.stop(t + 0.5);
        },

        // Two-note blip when an answer is chosen
        answer: function () {
            tone(659.3, 0.1, { vol: 0.08, wet: 0.8 });
            tone(987.8, 0.16, { vol: 0.07, wet: 0.85, delay: 0.07 });
        },

        // Rising arpeggio plus a low swell for the result
        reveal: function () {
            [440, 554.4, 659.3, 880, 1318.5].forEach(function (f, i) {
                tone(f, 0.22, { vol: 0.08, wet: 0.9, delay: i * 0.09 });
            });
            tone(55, 1.6, { vol: 0.22, wet: 0.4, attack: 0.08, glide: 49 });
        },

        isMuted: function () { return muted; },

        setMuted: function (m) {
            muted = m;
            try { localStorage.setItem('glitchMuted', m ? '1' : '0'); } catch (e) {}
            if (!ctx) return;
            var t = ctx.currentTime;
            master.gain.cancelScheduledValues(t);
            master.gain.setTargetAtTime(m ? 0 : VOLUME, t, 0.05);
        }
    };
})();
