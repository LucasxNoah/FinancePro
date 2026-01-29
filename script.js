const hero = document.querySelector('.hero-container');
const logo = document.querySelector('.top-left-logo');

// loading another page
function launchApp() {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.4s ease";

    setTimeout(function () {
        window.location.href = "main.html";
    }, 400);
}


function onload() {
    if (hero && logo) {
        hero.style.opacity = "0";
        hero.style.transform = "translateY(20px)";
        logo.style.opacity = "0";

        setTimeout(function () {
            hero.style.transition = "all 0.8s ease-out";
            hero.style.opacity = "1";
            hero.style.transform = "translateY(0)";

            logo.style.transition = "opacity 0.6s ease";
            logo.style.opacity = "1";
        }, 100);
    }
};