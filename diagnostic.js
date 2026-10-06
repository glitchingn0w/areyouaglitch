// Glitch diagnostic: boot sequence + five-question scan, opened by "Enter the System"
(function () {
    var enter = document.getElementById('enter');
    var system = document.getElementById('system');
    if (!enter || !system) return;

    var boot = document.getElementById('boot');
    var skip = document.getElementById('skip');
    var quiz = document.getElementById('quiz');
    var result = document.getElementById('result');
    var progress = document.getElementById('quiz-progress');
    var question = document.getElementById('quiz-question');
    var answers = quiz.querySelectorAll('[data-points]');
    var level = document.getElementById('result-level');
    var title = document.getElementById('result-title');
    var text = document.getElementById('result-text');
    var shareBtn = document.getElementById('share-result');
    var toForm = document.getElementById('to-form');
    var exitBtn = document.getElementById('exit');
    var closeBtn = document.getElementById('system-close');
    var muteBtn = document.getElementById('system-mute');

    var sound = window.GlitchSound;
    function sfx(name) { if (sound && sound[name]) sound[name](); }

    function updateMute() {
        if (!muteBtn || !sound) return;
        var off = sound.isMuted();
        muteBtn.textContent = off ? 'SOUND OFF' : 'SOUND ON';
        muteBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var bootLines = [
        'INITIALIZING REALITY.EXE',
        'Scanning environment...',
        '3 anomalies detected',
        'Subject identified',
        'Running glitch diagnostic...'
    ];

    var questions = [
        'Ever walked into a room and completely forgot why you went in?',
        'Had déjà vu so strong it felt like a replay?',
        'Does tech freeze or break the second you touch it?',
        'Ever remembered something one way, then found out it never happened like that?',
        'Do you ever feel like the world runs on a script nobody gave you a copy of?'
    ];

    var tiers = [
        { max: 2, title: 'STABLE SYSTEM', text: "Barely a flicker. Either you're perfectly in sync with reality, or the glitch is hiding really well." },
        { max: 5, title: 'MINOR INTERFERENCE', text: "Small cracks are showing. Reality skips on you now and then, and you've noticed. Most people don't." },
        { max: 8, title: 'ACTIVE ANOMALY', text: "The system is struggling to keep up with you. Strange moments follow you around, and that's no coincidence." },
        { max: 10, title: 'CRITICAL GLITCH', text: 'Reality can\'t hold you. Things break, repeat and rewrite themselves around you. You might be a glitch.' }
    ];

    var timers = [];
    var current = 0;
    var score = 0;
    var lastResult = '';

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function open() {
        clearTimers();
        boot.textContent = '';
        boot.hidden = false;
        skip.hidden = false;
        quiz.hidden = true;
        result.hidden = true;
        system.hidden = false;
        document.body.style.overflow = 'hidden';
        updateMute();
        sfx('start');
        sfx('duckOn');
        closeBtn.focus();
        runBoot();
    }

    function close(targetId) {
        clearTimers();
        sfx('stop');
        sfx('duckOff');
        system.hidden = true;
        document.body.style.overflow = '';
        var target = targetId && document.getElementById(targetId);
        if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    }

    function runBoot() {
        if (reduced) {
            bootLines.forEach(function (line) { addLine(line); });
            sfx('bleep');
            sfx('staticBurst');
            later(startQuiz, 800);
            return;
        }
        typeLine(0);
    }

    function addLine(content) {
        var p = document.createElement('p');
        p.className = 'boot-line';
        p.textContent = content || '';
        boot.appendChild(p);
        return p;
    }

    function typeLine(i) {
        if (i >= bootLines.length) { later(startQuiz, 500); return; }
        var line = bootLines[i];
        var p = addLine('');
        var c = 0;
        sfx('bleep');
        if (i === 2) sfx('staticBurst');
        (function step() {
            p.textContent = line.slice(0, ++c);
            if (c % 2 === 0) sfx('tick');
            if (c < line.length) later(step, 18);
            else later(function () { typeLine(i + 1); }, 220);
        })();
    }

    function startQuiz() {
        clearTimers();
        boot.hidden = true;
        skip.hidden = true;
        quiz.hidden = false;
        current = 0;
        score = 0;
        showQuestion();
    }

    function showQuestion() {
        progress.textContent = 'SCAN ' + (current + 1) + ' / ' + questions.length;
        question.textContent = questions[current];
        answers[0].focus();
    }

    function answer(points) {
        sfx('answer');
        score += points;
        current++;
        if (current < questions.length) showQuestion();
        else showResult();
    }

    function showResult() {
        var pct = Math.min(99, Math.max(4, Math.round(score / 10 * 90) + Math.floor(Math.random() * 9)));
        var tier = tiers.filter(function (t) { return score <= t.max; })[0];
        level.textContent = pct + '%';
        level.setAttribute('data-text', pct + '%');
        title.textContent = tier.title;
        text.textContent = tier.text;
        lastResult = 'My glitch level is ' + pct + '% (' + tier.title + '). Are you a glitch?';
        shareBtn.textContent = 'Share My Result';
        quiz.hidden = true;
        result.hidden = false;
        sfx('reveal');
        shareBtn.focus();
    }

    function share() {
        var url = 'https://areyouaglitch.com';
        if (navigator.share) {
            navigator.share({ title: 'Are You a Glitch?', text: lastResult, url: url }).catch(function () {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(lastResult + ' ' + url).then(function () {
                shareBtn.textContent = 'Copied! Paste it anywhere';
                later(function () { shareBtn.textContent = 'Share My Result'; }, 2500);
            });
        }
    }

    enter.addEventListener('click', function (e) { e.preventDefault(); open(); });
    skip.addEventListener('click', startQuiz);
    Array.prototype.forEach.call(answers, function (btn) {
        btn.addEventListener('click', function () { answer(Number(btn.getAttribute('data-points'))); });
    });
    shareBtn.addEventListener('click', share);
    toForm.addEventListener('click', function (e) {
        e.preventDefault();
        close('share');
        var name = document.getElementById('name');
        if (name) setTimeout(function () { name.focus({ preventScroll: true }); }, reduced ? 0 : 600);
    });
    window.addEventListener('glitchmute', updateMute);
    if (muteBtn && sound) {
        muteBtn.addEventListener('click', function () {
            sound.setMuted(!sound.isMuted());
            updateMute();
        });
    }
    exitBtn.addEventListener('click', function () { close('about'); });
    closeBtn.addEventListener('click', function () { close('about'); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !system.hidden) close('about');
    });
})();
