/*
  Lichtung — previous edition viewer
  -----------------------------------
  Renders a PDF, page by page, straight onto a canvas in the browser
  using pdf.js. No watermark, no third-party frame — just the file.

  To use: save your PDF in this same folder and point the data-pdf
  attribute on the #flipbook element (in index.html) at its filename.
  Nothing else here needs to change.
*/

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    var container = document.getElementById("flipbook");
    if (!container || typeof pdfjsLib === "undefined") {
      return;
    }

    var pdfUrl = container.getAttribute("data-pdf");
    if (!pdfUrl) {
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

    var pageWrap = container.querySelector(".flipbook-page");
    var canvas = document.getElementById("flipbook-canvas");
    var ctx = canvas.getContext("2d");
    var indicator = document.getElementById("flipbook-indicator");
    var prevBtn = container.querySelector(".flipbook-prev");
    var nextBtn = container.querySelector(".flipbook-next");

    var pdfDoc = null;
    var pageNum = 1;
    var rendering = false;
    var pendingPage = null;

    function isDutch() {
      return document.documentElement.lang === "nl";
    }

    indicator.textContent = isDutch() ? "Bezig met laden…" : "Loading…";
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    pdfjsLib
      .getDocument(pdfUrl)
      .promise.then(function (doc) {
        pdfDoc = doc;
        renderPage(pageNum);
      })
      .catch(function () {
        indicator.textContent = isDutch()
          ? "De PDF kon niet worden geladen."
          : "Could not load the PDF.";
      });

    function renderPage(num) {
      rendering = true;

      pdfDoc.getPage(num).then(function (page) {
        var availableWidth = pageWrap.clientWidth || 600;
        var baseViewport = page.getViewport({ scale: 1 });
        var pixelRatio = window.devicePixelRatio || 1;
        var scale = (availableWidth / baseViewport.width) * pixelRatio;
        var viewport = page.getViewport({ scale: scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = Math.floor(viewport.width / pixelRatio) + "px";
        canvas.style.height = Math.floor(viewport.height / pixelRatio) + "px";

        var renderTask = page.render({ canvasContext: ctx, viewport: viewport });

        renderTask.promise.then(function () {
          rendering = false;
          if (pendingPage !== null) {
            var next = pendingPage;
            pendingPage = null;
            renderPage(next);
          }
        });
      });

      indicator.textContent = num + " / " + pdfDoc.numPages;
      prevBtn.disabled = num <= 1;
      nextBtn.disabled = num >= pdfDoc.numPages;
    }

    function queueRenderPage(num) {
      if (rendering) {
        pendingPage = num;
      } else {
        renderPage(num);
      }
    }

    prevBtn.addEventListener("click", function () {
      if (!pdfDoc || pageNum <= 1) {
        return;
      }
      pageNum -= 1;
      queueRenderPage(pageNum);
    });

    nextBtn.addEventListener("click", function () {
      if (!pdfDoc || pageNum >= pdfDoc.numPages) {
        return;
      }
      pageNum += 1;
      queueRenderPage(pageNum);
    });

    document.addEventListener("keydown", function (event) {
      if (!pdfDoc || !isNearViewport(container)) {
        return;
      }
      if (event.key === "ArrowLeft") {
        prevBtn.click();
      } else if (event.key === "ArrowRight") {
        nextBtn.click();
      }
    });

    window.addEventListener(
      "resize",
      debounce(function () {
        if (pdfDoc) {
          queueRenderPage(pageNum);
        }
      }, 200)
    );

    function isNearViewport(el) {
      var rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }

    function debounce(fn, wait) {
      var timer;
      return function () {
        clearTimeout(timer);
        timer = setTimeout(fn, wait);
      };
    }
  }
})();
