/**
 * layers.js - Harita Katman Kontrolleri (jQuery)
 */

$(document).ready(function () {
    $("#show-ports").click(function () { $("#ports").toggle(); });
    $("#show-lighthouses").click(function () { $("#lighthouses").toggle(); });
    $("#show-portsxy").click(function () { $("#portsxy").toggle(); });
    $("#show-islandsxy").click(function () { $("#islandsxy").toggle(); });
    $("#show-fast-travel").click(function () { $("#fast-travel").toggle(); });
    $("#show-circle").click(function () { $("#circle").toggle(); });
    $("#show-wind").click(function () { $("#wind-indicator-container").toggle(); });
    $("#show-island").click(function () { $(".island").toggle(); });
    $("#show-altar").click(function () { $(".altar").toggle(); });
    $("#show-fort").click(function () { $(".fort").toggle(); });
    $("#show-altarsxy").click(function () { $("#altarsxy").toggle(); });
    $("#show-fortsxy").click(function () { $("#fortsxy").toggle(); });
});
