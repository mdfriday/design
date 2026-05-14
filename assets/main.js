/* 一程 · shared reveal motion + first-screen kick */
(function () {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  // Kick first-screen reveals immediately so the door doesn't feel "still loading".
  requestAnimationFrame(function () {
    var firstScreen = document.querySelectorAll(".door .reveal, .page-hero .reveal");
    firstScreen.forEach(function (el, i) {
      setTimeout(function () { el.classList.add("in"); }, 80 + i * 180);
    });
  });
})();
