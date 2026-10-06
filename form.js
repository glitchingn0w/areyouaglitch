// Send the glitch form in the background so visitors stay on the site.
// If the background send fails for any reason, fall back to a normal submit
// (which lands on thanks.html), so no story is ever lost.
(function () {
    var form = document.getElementById('share');
    var done = document.getElementById('form-done');
    var again = document.getElementById('send-another');
    var button = document.getElementById('form-submit');
    if (!form || !done || !window.fetch) return;

    var endpoint = 'https://formsubmit.co/ajax/areyouaglitchpodcast@gmail.com';
    var label = button ? button.textContent : '';

    function fallback() {
        form.submit();
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = {};
        new FormData(form).forEach(function (value, key) { data[key] = value; });

        if (button) { button.disabled = true; button.textContent = 'Transmitting...'; }

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
