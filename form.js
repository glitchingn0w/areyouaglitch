// Send the glitch form in the background so visitors stay on the site.
// If the background send fails for any reason, fall back to a normal submit
// (which lands on thanks.html), so no story is ever lost.
(function () {
    var form = document.getElementById('share');
    var done = document.getElementById('form-done');
    var again = document.getElementById('send-another');
    var button = document.getElementById('form-submit');
    var status = document.getElementById('form-status');
    if (!form || !done || !window.fetch) return;

    var endpoint = 'https://formsubmit.co/ajax/areyouaglitchpodcast@gmail.com';
    var label = button ? button.textContent : '';

    // Themed lines that play while the message is on its way
    var steps = [
        'Encrypting signal...',
        'Bypassing firewall...',
        'Routing through the static...',
        'Uploading to the system...',
        'Locking in your glitch...'
    ];
    var ticker = null;

    function startStatus() {
        if (!status) return;
        var i = 0;
        status.textContent = steps[0];
        status.hidden = false;
        if (window.GlitchSound) window.GlitchSound.tick();
        ticker = setInterval(function () {
            i = Math.min(i + 1, steps.length - 1);
            status.textContent = steps[i];
            if (window.GlitchSound) window.GlitchSound.tick();
        }, 1100);
    }

    function stopStatus() {
        clearInterval(ticker);
        ticker = null;
        if (status) { status.hidden = true; status.textContent = ''; }
    }

    function fallback() {
        stopStatus();
        form.submit();
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = {};
        new FormData(form).forEach(function (value, key) { data[key] = value; });

        if (button) { button.disabled = true; button.textContent = 'Transmitting...'; }
        startStatus();

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(function (res) { return res.json(); })
            .then(function (json) {
                if (json && (json.success === true || json.success === 'true')) {
                    stopStatus();
                    form.hidden = true;
                    done.hidden = false;
                    done.focus();
                    if (window.GlitchSound) window.GlitchSound.answer();
                } else {
                    fallback();
                }
            })
            .catch(fallback)
            .then(function () {
                if (button) { button.disabled = false; button.textContent = label; }
            });
    });

    if (again) {
        again.addEventListener('click', function () {
            form.reset();
            done.hidden = true;
            form.hidden = false;
            var name = document.getElementById('name');
            if (name) name.focus();
        });
    }
})();

// Launch signup: same background send, with an inline confirmation
(function () {
    var form = document.getElementById('notify');
    var done = document.getElementById('notify-done');
    var button = document.getElementById('notify-submit');
    if (!form || !done || !window.fetch) return;

    var endpoint = 'https://formsubmit.co/ajax/areyouaglitchpodcast@gmail.com';
    var label = button ? button.textContent : '';

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = {};
        new FormData(form).forEach(function (value, key) { data[key] = value; });
        if (button) { button.disabled = true; button.textContent = 'Linking...'; }
        if (window.GlitchSound) window.GlitchSound.tick();

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(function (res) { return res.json(); })
            .then(function (json) {
                if (json && (json.success === true || json.success === 'true')) {
                    form.hidden = true;
                    done.hidden = false;
                    done.focus();
                    if (window.GlitchSound) window.GlitchSound.answer();
                } else {
                    form.submit();
                }
            })
            .catch(function () { form.submit(); })
            .then(function () {
                if (button) { button.disabled = false; button.textContent = label; }
            });
    });
})();
