// Page sound: ambience on first interaction, a corner sound toggle,
// and a different high note on each topic card.
(function () {
    var S = window.GlitchSound;
    if (!S) return;
    var btn = document.getElementById('page-sound');
    var started = false;

    function update() {
        if (!btn) return;
        var off = S.isMuted();
        btn.textContent = off ? 'SOUND: OFF' : 'SOUND: ON';
        btn.setAttribute('aria-pressed', off ? 'true' : 'false');
    }

    // Browsers only allow audio after the visitor clicks, taps or presses a key
    function unlock(e) {
        if (started) return;
        if (btn && e && e.target && btn.contains(e.target)) return;
        started = true;
        S.ambientStart();
    }
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);

    if (btn) {
        btn.addEventListener('click', function () {
            S.setMuted(!S.isMuted());
            if (!S.isMuted()) { started = true; S.ambientStart(); }
            update();
        });
    }
    window.addEventListener('glitchmute', update);

    Array.prototype.forEach.call(document.querySelectorAll('.topics .card'), function (card, i) {
        card.addEventListener('mouseenter', function () { S.cardTone(i); });
        card.addEventListener('click', function () { S.cardTone(i, true); });
    });

    update();
})();
