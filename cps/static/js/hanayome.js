/* This file is part of the Calibre-Web Hanayome theme.
 * Login <-> Register transition: dust-dissolve away, then rise in.
 */
(function () {
    "use strict";

    var PAGE_BG = "#faf6f0";
    var DUST_COLORS = ["#3a3226", "#9b7bb5", "#d98ba6", "#c9beb1", "#8a8074"];

    function isAuthPage() {
        return $("body").hasClass("login") || $("body").hasClass("register");
    }

    /* ---------- leave: dust dissolve ------------------------------------ */
    function dustAway(href) {
        if (!$("#hy-dust").length) {
            $("<div id='hy-dust'></div>").appendTo("body");
        }
        var $dust = $("#hy-dust").empty();
        var $sources = $("body.login .hy-login, body.register .hy-reg-min").filter(":visible");

        // 1) fade the real content out
        $sources.css("transition", "opacity .7s ease").css("opacity", "0");
        $("body > .hy-topbar, body > .hy-app").css("transition", "opacity .5s ease").css("opacity", "0");

        // 2) spawn dust motes over the content area
        var area = $sources.length
            ? $sources[0].getBoundingClientRect()
            : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        var count = 90;
        for (var i = 0; i < count; i++) {
            var color = DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)];
            var size = 2 + Math.random() * 5;
            var x = area.left + Math.random() * area.width;
            var y = area.top + Math.random() * area.height;
            var dx = (Math.random() - 0.5) * 220;
            var dy = -30 - Math.random() * 160;
            var $mote = $("<span class='hy-mote'></span>")
                .css({
                    left: x + "px",
                    top: y + "px",
                    width: size + "px",
                    height: size + "px",
                    background: color
                })
                .appendTo($dust);
            (function ($m) {
                setTimeout(function () {
                    $m.css("transform", "translate(" + dx + "px," + dy + "px) rotate(" +
                        (Math.random() * 200 - 100) + "deg) scale(" + (0.3 + Math.random()) + ")")
                        .css("opacity", "0");
                }, 10 + Math.random() * 120);
            })($mote);
        }

        // 3) navigate after the dust settles
        setTimeout(function () {
            window.location.href = href;
        }, 850);
    }

    /* ---------- enter: rise in ------------------------------------------ */
    function riseIn() {
        var $root = $("body.login .hy-login, body.register .hy-reg-min").first();
        if (!$root.length) { return; }
        $root.css("opacity", "0").css("transform", "translateY(26px)");
        requestAnimationFrame(function () {
            $root.css("transition", "opacity .55s ease .06s, transform .55s ease .06s")
                .css("opacity", "1").css("transform", "translateY(0)");
        });
    }

    /* ---------- toasts: float up, fade out, leave no trace --------------- */
    var TOAST_MS = 4200;

    function primeToast($t) {
        if ($t.data("hy-toast")) { return; }
        $t.data("hy-toast", true);
        // small stagger so stacked toasts read as a pile
        var delay = 150 * $t.index();
        setTimeout(function () {
            $t.addClass("hy-toast-in");
        }, delay + 30);
        setTimeout(function () {
            $t.addClass("hy-toast-out");
            setTimeout(function () { $t.remove(); }, 700);
        }, TOAST_MS + delay);
    }

    function convertLegacyAlert($alert) {
        // main.js injects '.navbar'-after row-fluid > #flash_X.alert.alert-X
        var type = "info";
        if ($alert.hasClass("alert-danger")) { type = "error"; }
        else if ($alert.hasClass("alert-success")) { type = "success"; }
        else if ($alert.hasClass("alert-warning")) { type = "warning"; }
        var $toast = $("<div class='hy-toast hy-toast-" + type + "' role='status'>" +
            "<span class='hy-toast-txt'></span></div>");
        $toast.find(".hy-toast-txt").text($alert.text().trim());
        var zone = $("#hy-toastzone");
        if (!zone.length) {
            zone = $("<div id='hy-toastzone'></div>").appendTo("body");
        }
        zone.append($toast);
        $alert.closest(".row-fluid").remove();
        $alert.remove();
        primeToast($toast);
    }

    /* ---------- wiring --------------------------------------------------- */
    $(function () {
        // 1) toasts on every page
        $("#hy-toastzone .hy-toast").each(function () { primeToast($(this)); });

        // 2) legacy alerts injected by main.js after navigation
        var mo = window.MutationObserver
            ? new MutationObserver(function (muts) {
                muts.forEach(function (m) {
                    m.addedNodes.forEach(function (n) {
                        if (n.nodeType !== 1) { return; }
                        var $n = $(n);
                        if ($n.hasClass("alert") && $n.find(".hy-toast-txt").length === 0) {
                            convertLegacyAlert($n);
                        }
                        $n.find(".alert").each(function () {
                            var $a = $(this);
                            if (!$a.closest(".hy-toast").length) { convertLegacyAlert($a); }
                        });
                    });
                });
            })
            : null;
        if (mo) {
            mo.observe(document.body, { childList: true, subtree: true });
        }
        // catch any alert already present on load
        $("body > .row-fluid.text-center .alert, #message.alert").each(function () {
            convertLegacyAlert($(this));
        });

        // 3) auth-page dust transition (login <-> register only)
        if (!isAuthPage()) { return; }

        $(document).on("click", "#to-register, #to-login", function (e) {
            e.preventDefault();
            dustAway($(this).attr("href"));
        });

        // if we just arrived from the other page, play the enter animation
        var ref = document.referrer || "";
        if (ref.indexOf("/login") !== -1 || ref.indexOf("/register") !== -1) {
            riseIn();
        }
    });
})();
