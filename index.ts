const width = 7;
const height = 7;
let p = 0.9;
let fieldSize = 1;
let wasDag = false;

const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--background-color");

const foregroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--foreground-color");

const fields: (Field | null)[][] = [];

const map = document.getElementById("map") as HTMLTableElement;
const pointer = document.getElementById("pointer") as HTMLElement;

const show = (element: HTMLElement) => element.style.opacity = "1";
const hide = (element: HTMLElement) => element.style.opacity = "0";

hide(pointer);

enum State {
    init = "init",
    active = "active",
    inactive = "inactive"
}

class Field {
    x: number;
    y: number;
    view: HTMLTableCellElement;
    state: State = State.inactive;;

    constructor(x: number, y: number, view: HTMLTableCellElement, state: State) {
        this.x = x;
        this.y = y;
        this.view = view;

        view.appendChild(document.createTextNode(`${x}:${y}`));

        this.setState(state);
    }

    setState(state: State) {
        this.state = state;

        switch (this.state) {
            case State.init:
            case State.active:
                this.view.style.opacity = "1";
                break;

            case State.inactive:
                this.view.style.backgroundColor = "red";
                this.view.style.opacity = "0";
                break;
        }

        this.setInteraction();
    }

    setInteraction() {
        this.view.onmouseup = null;

        switch (this.state) {
            case State.init:
                this.view.onclick = () => {
                    this.playAudio();

                    pointer.style.animation = `fade-in 8s linear`;

                    fields.flat().filter((f): f is Field => f !== null)
                        .forEach(f => {
                            f.setState(State.active);
                            f.view.style.animation = `fade-in 8s linear`;
                        });

                    this.view.style.animation = `fade-out 8s linear`;
                    this.setState(State.inactive);
                };
                break;

            case State.active:
                const onclick = () => {
                    this.playAudio();

                    const hasInactiveNeighbour = [...this.getNeighbours()]
                        .some(f => f?.state === State.inactive);

                    if (hasInactiveNeighbour) {
                        this.setState(State.inactive);
                        document.body.style.cursor = "none";
                        show(pointer);
                    }
                };

                this.view.ontouchmove = onclick;
                this.view.onmousedown = onclick;
                break;

            case State.inactive:
                this.view.onmouseup = () => {
                    document.body.style.cursor = "default";
                    hide(pointer);
                };

                this.view.onclick = null;
                this.view.ontouchmove = null;
                this.view.onmousedown = null;
                break;
        }
    }

    playAudio() {
        switch (this.state) {
            case State.init:
                new Audio("bell.mp3").play();
                break;

            case State.active:
                new Audio("pop.mp3").play();
                break;
        }
    }

    *getNeighbours(): Generator<Field | null> {
        if (this.y > 1) yield fields[this.x][this.y - 2];
        if (this.x > 1) yield fields[this.x - 2][this.y];
        if (this.y < height - 2) yield fields[this.x][this.y + 2];
        if (this.x < width - 2) yield fields[this.x + 2][this.y];
    }
}

function draw() {
    const mapParts = [2, 3, 4];

    for (let x = 0; x < height; x++) {
        const row = document.createElement("tr");
        const rowFields: (Field | null)[] = [];

        for (let y = 0; y < width; y++) {
            const column = document.createElement("td");

            if (mapParts.includes(x) || mapParts.includes(y)) {
                column.classList.add("field");

                const isCenter =
                    x === Math.floor(width / 2) &&
                    y === Math.floor(height / 2);

                rowFields.push(
                    new Field(x, y, column, isCenter ? State.init : State.inactive)
                );
            } else {
                rowFields.push(null);
            }

            row.appendChild(column);
        }

        fields.push(rowFields);
        map.appendChild(row);
    }

    size();
}

draw();

function size() {
    const vWith = window.innerWidth * p;
    const vHeight = window.innerHeight * p;

    fieldSize = vWith / width > vHeight
        ? vWith / width
        : vHeight / height;

    const maxSize =
        Math.min(window.innerWidth / width, window.innerHeight / height) - 1;

    fieldSize = fieldSize >= maxSize ? maxSize : fieldSize;

    map.style.width = `${fieldSize * width}px`;
    map.style.height = `${fieldSize * height}px`;

    const first = fields.flat().filter((f): f is Field => f !== null)[0];

    pointer.style.width = `${first.view.clientWidth}px`;
    pointer.style.height = `${first.view.clientWidth}px`;
}

window.onwheel = e => {
    p += Math.sign(e.deltaY) < 0 ? 0.05 : -0.05;
    size();
};

window.onresize = () => size();

window.ontouchmove = e => {
    const touch = e.changedTouches[0];
    pointer.style.left = `${touch.clientX - pointer.clientWidth / 2}px`;
    pointer.style.top = `${touch.clientY - pointer.clientHeight / 2}px`;
};

window.onmousemove = e => {
    pointer.style.left = `${e.x - pointer.clientWidth / 2}px`;
    pointer.style.top = `${e.y - pointer.clientHeight / 2}px`;
};