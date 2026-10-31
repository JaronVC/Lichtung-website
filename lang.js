/*
  Lichtung — language toggle
  ---------------------------
  Switches every element carrying a data-en / data-nl pair between
  English and Dutch, and remembers the choice for next time.

  To add a new piece of translated text anywhere on the page: put the
  English version in the element itself (as normal), then add
  data-en="..." with that same text and data-nl="..." with the Dutch
  version to that element's opening tag.
*/

(function () {
  "use strict";

  var STORAGE_KEY = "lichtung-lang";

  var titles = {
    en: "Lichtung - Undergraduate Journal of Philosophy at Ugent",
    nl: "Lichtung - Filosofie journal aan de UGent"
  };

  function getStoredLang() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* localStorage unavailable; language just won't persist */
    }
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.title = titles[lang] || titles.en;

    var nodes = document.querySelectorAll("[data-en]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var content = el.getAttribute("data-" + lang);
      if (content === null) {
        content = el.getAttribute("data-en");
      }
      el.innerHTML = content;
    }

    var buttons = document.querySelectorAll(".lang-toggle button");
    for (var j = 0; j < buttons.length; j++) {
      var btn = buttons[j];
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  var startLang = getStoredLang() || "nl";
  applyLang(startLang);

  document.addEventListener("click", function (event) {
    var btn = event.target.closest && event.target.closest(".lang-toggle button");
    if (!btn) {
      return;
    }
    var lang = btn.getAttribute("data-lang");
    if (!lang) {
      return;
    }
    storeLang(lang);
    applyLang(lang);
  });
})();
