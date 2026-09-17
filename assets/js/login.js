/* ==========================================================================
   Doodle Desk — log in & join-a-room
   Demo mode: both forms validate properly but there is no auth backend yet,
   so they explain what would happen instead of pretending to sign you in.
   ========================================================================== */
(function () {
  "use strict";

  function setError(input, message) {
    var field = input.closest(".field");
    var slot = field.querySelector(".err");
    field.classList.toggle("field--error", Boolean(message));
    if (slot) slot.textContent = message || "";
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  /* ---- Teacher login ---------------------------------------------------- */
  var login = document.getElementById("login-form");
  if (login) {
    login.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = login.elements.email;
      var pass = login.elements.password;
      var ok = setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())
        ? "" : "Please enter a valid email address.");
      ok = setError(pass, pass.value.length ? "" : "Please enter your password.") && ok;
      if (!ok) return;

      var note = document.querySelector("[data-login-note]");
      if (note) {
        note.hidden = false;
        note.textContent = "Demo mode — there's no account server connected to this site yet. " +
          "Wire up your auth provider in assets/js/login.js to make this real.";
      }
    });
  }

  /* ---- Student join ----------------------------------------------------- */
  var join = document.getElementById("join-form");
  if (join) {
    var code = join.elements.code;

    code.addEventListener("input", function () {
      /* Codes look like SUN-42B — uppercase as they type */
      code.value = code.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);
    });

    join.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = join.elements.nickname;
      var ok = setError(code, code.value.trim().length >= 5 ? "" : "Room codes are 6–8 characters.");
      ok = setError(name, name.value.trim().length >= 2 ? "" : "Pop your first name in.") && ok;
      if (!ok) return;

      var note = document.querySelector("[data-join-note]");
      if (note) {
        note.hidden = false;
        note.innerHTML = "Nice one, <strong>" + name.value.trim().replace(/[<>&]/g, "") +
          "</strong>! In the live app this drops you straight onto a blank board. " +
          'Try the <a href="demo.html">demo board</a> in the meantime.';
      }
      if (window.doodleConfetti) window.doodleConfetti(50);
    });
  }
})();
