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

    // Rubber-band twang: resonant pluck that bends and wobbles as it decays
    function twang(at, base, dur) {
        var o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(base * 0.55, at);
        o.frequency.exponentialRampToValueAtTime(base * 1.2, at + 0.05);
        o.frequency.exponentialRampToValueAtTime(base, at + 0.16);

        var lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(11 + Math.random() * 7, at);
        lfo.frequency.exponentialRampToValueAtTime(4, at + dur);
        var depth = ctx.createGain();
        depth.gain.setValueAtTime(base * 0.22, at);
        depth.gain.exponentialRampToValueAtTime(1, at + dur);
        lfo.connect(depth);
        depth.connect(o.frequency);

        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.Q.value = 7;
        lp.frequency.setValueAtTime(3200, at);
        lp.frequency.exponentialRampToValueAtTime(500, at + dur);

        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.08, at + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

        o.connect(lp);
        lp.connect(g);
        route(g, 0.7);
        o.start(at); lfo.start(at);
        o.stop(at + dur + 0.05); lfo.stop(at + dur + 0.05);
    }

    // Warp dive: a pitch that drops away like a tape slowing down
    function dive(at, from, to, dur) {
        var o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(from, at);
        o.frequency.exponentialRampToValueAtTime(to, at + dur);
        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(2400, at);
        lp.frequency.exponentialRampToValueAtTime(300, at + dur);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.045, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(lp);
        lp.connect(g);
        route(g, 0.8);
        o.start(at);
        o.stop(at + dur + 0.05);
    }

    // Long static glitch that decelerates, with twangs and warps tangled in it,
    // then a final stretch that bends up into a sharp, clean tone.
    function stretchOut(startIn) {
        if (!ctx) return;
        var t0 = ctx.currentTime + startIn;
        var len = 3.6;
        var toneFreq = 880;

        var src = ctx.createBufferSource();
        src.buffer = noiseBuffer(len + 0.3);
        src.playbackRate.setValueAtTime(1, t0);
        src.playbackRate.exponentialRampToValueAtTime(0.2, t0 + len);

        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 1.4;
        bp.frequency.setValueAtTime(3600, t0);
        bp.frequency.exponentialRampToValueAtTime(380, t0 + len);

        // Gate: fast stutters that get longer and slower
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        var at = t0, seg = 0.016, on = true;
        while (at < t0 + len - 0.05) {
            var fade = 1 - (at - t0) / len;
            var level = on ? (0.05 + Math.random() * 0.05) * (0.35 + 0.65 * fade) : 0.0001;
            g.gain.setValueAtTime(level, at);
            at += seg;
            seg *= 1.13;
            on = Math.random() < 0.7 ? !on : on;
        }
        g.gain.setValueAtTime(0.0001, at);
        src.connect(bp);
        bp.connect(g);
        route(g, 0.8);
        src.start(t0);
        src.stop(t0 + len + 0.3);

        // Twangs and warp dives mixed into the static
        twang(t0 + 0.15, 330, 0.5);
        dive(t0 + 0.55, 1600, 90, 0.55);
        twang(t0 + 0.95, 247, 0.6);
        twang(t0 + 1.35, 392, 0.45);
        dive(t0 + 1.7, 1200, 60, 0.7);
        twang(t0 + 2.2, 196, 0.7);
        dive(t0 + 2.55, 900, 55, 0.6);

        // Final stretch: a wobbling band pulled up into the tone's pitch
        var riseAt = t0 + len - 0.75;
        var r = ctx.createOscillator();
        r.type = 'triangle';
        r.frequency.setValueAtTime(toneFreq / 4, riseAt);
        r.frequency.exponentialRampToValueAtTime(toneFreq, riseAt + 0.7);
        var rl = ctx.createOscillator();
        rl.frequency.value = 14;
        var rd = ctx.createGain();
        rd.gain.setValueAtTime(40, riseAt);
        rd.gain.exponentialRampToValueAtTime(1, riseAt + 0.7);
        rl.connect(rd);
        rd.connect(r.frequency);
        var rg = ctx.createGain();
        rg.gain.setValueAtTime(0.0001, riseAt);
        rg.gain.exponentialRampToValueAtTime(0.05, riseAt + 0.5);
        rg.gain.exponentialRampToValueAtTime(0.0001, riseAt + 0.78);
        r.connect(rg);
        route(rg, 0.75);
        r.start(riseAt); rl.start(riseAt);
        r.stop(riseAt + 0.85); rl.stop(riseAt + 0.85);

        // The tone: hard attack, bright harmonics, rings out
        var toneStart = t0 + len - 0.05;
        var tg = ctx.createGain();
        tg.gain.setValueAtTime(0.0001, toneStart);
        tg.gain.exponentialRampToValueAtTime(0.1, toneStart + 0.008);
        tg.gain.setValueAtTime(0.1, toneStart + 1.0);
        tg.gain.exponentialRampToValueAtTime(0.0001, toneStart + 3.0);
        [[toneFreq, 'sine', 0.7], [toneFreq, 'square', 0.12], [toneFreq * 2, 'sine', 0.22], [toneFreq * 3, 'sine', 0.08]].forEach(function (p) {
            var o = ctx.createOscillator();
            o.type = p[1];
            o.frequency.value = p[0];
            var pg = ctx.createGain();
            pg.gain.value = p[2];
            o.connect(pg);
            pg.connect(tg);
            o.start(toneStart);
            o.stop(toneStart + 3.1);
        });
        route(tg, 0.85);
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

        // Rising arpeggio plus a low swell for the result,
        // then static that slows and stretches out, resolving into a clean tone
        reveal: function () {
            [440, 554.4, 659.3, 880, 1318.5].forEach(function (f, i) {
                tone(f, 0.22, { vol: 0.08, wet: 0.9, delay: i * 0.09 });
            });
            tone(55, 1.6, { vol: 0.22, wet: 0.4, attack: 0.08, glide: 49 });
            stretchOut(0.6);
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
