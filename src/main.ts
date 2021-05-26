import game from "./game/game";

document.body.innerHTML = "";

const g = new game({
    dimension: {
        width: window.innerWidth,
        height: window.innerHeight
    }
});

g.start();