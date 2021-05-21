import game from "./game.js";

document.body.innerHTML = "";

const g = new game({
    dimension: {
        width: window.innerWidth,
        height: window.innerHeight
    }
});

g.start();

document.onresize = function (e) {
    g.size = {
        width: window.innerWidth,
        height: window.innerHeight
    };
}