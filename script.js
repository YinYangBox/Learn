class colorConstructor {
    constructor(r, g, b, a) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }

    makeTransparent() {
        this.a = 0
    }
}


const UI = {
    CANVAS: document.getElementById("canvas"),
    COLOR_SELECTOR: document.getElementById("color-selector"),
    TOOL_SELECTOR: document.getElementById("tool-selector"),
    CLEAR_BUTTON: document.getElementById("clear-button"),
    TOOL_SIZE: document.getElementById("tool-size")
};


const CTX = UI.CANVAS.getContext("2d");


const COLORS = {
    RED: new colorConstructor(255, 0, 0, 255),
    GREEN: new colorConstructor(0, 255, 0, 255),
    BLUE: new colorConstructor(0, 0, 255, 255),
    WHITE: new colorConstructor(255, 255, 255, 255),
    BLACK: new colorConstructor(0, 0, 0, 255),
    ORANGE: new colorConstructor(255, 165, 0, 255),
    YELLOW: new colorConstructor(255, 255, 0, 255),
    CYAN: new colorConstructor(0, 255, 255, 255),
    LIME: new colorConstructor(127, 255, 0, 255),
    TEAL: new colorConstructor(0, 128, 128, 255),
    NAVY: new colorConstructor(0, 0, 128, 255),
    PURPLE: new colorConstructor(128, 0, 128, 255),
    PINK: new colorConstructor(255, 192, 203, 255),
    CORAL: new colorConstructor(255, 127, 80, 255),
    FOREST_GREEN: new colorConstructor(34, 139, 34, 255),
    LIGHT_BLUE: new colorConstructor(173, 216, 230, 255),
    CHOCOLATE: new colorConstructor(210, 105, 30, 255),
    BROWN: new colorConstructor(165, 42, 42, 255),
    GRAY: new colorConstructor(128, 128, 128, 255)
};


let CURRENT_TOOL = null;


const DATA = {

    x({ event } = {}) {
        return event.offsetX;
    },

    y({ event } = {}) {
        return event.offsetY;
    },

    lastX({ canvas } = {}) {
        return canvas.x;
    },

    lastY({ canvas } = {}) {
        return canvas.y;
    },

    buttons({ event } = {}) {
        return event.buttons;
    },

    clientX({ event } = {}) {
        return event.clientX;
    },

    clientY({ event } = {}) {
        return event.clientY;
    },

    tool({ tool } = {}) {
        return tool;
    }
};


class canvasConstructor {

    constructor({
        defaultColor = COLORS.WHITE,
        defaultImage = null
    } = {}) {

        this.isDirty = false;
        this.isDrawing = false;

        this.buffer = new ArrayBuffer(
            UI.CANVAS.width *
            UI.CANVAS.height *
            4
        );

        this.raw = new Uint8ClampedArray(this.buffer);

        this.x = null;
        this.y = null;

        this.defaultColor = defaultColor;
        this.defaultImage = null;

        this.initialize({
            image: defaultImage
        });
    }


    initialize({ image = null } = {}) {

        try {

            if (!image) {

                const color = this.defaultColor;

                this.defaultImage = null;

                for (let i = 0; i < this.raw.length; i += 4) {
                    this.raw[i] = color.r;
                    this.raw[i + 1] = color.g;
                    this.raw[i + 2] = color.b;
                    this.raw[i + 3] = color.a;
                }

                this.isDirty = true;

                return true;
            }


            if (!(image instanceof Uint8ClampedArray)) {
                throw new TypeError(
                    "The image must be a Uint8ClampedArray."
                );
            }


            if (image.length !== this.raw.length) {
                throw new RangeError(
                    "The image dimensions do not match the canvas."
                );
            }


            this.defaultImage =
                new Uint8ClampedArray(image);

            this.raw.set(this.defaultImage);

            this.isDirty = true;

            return true;

        }
        catch (e) {

            console.error(
                "Could not initialize canvas:",
                e
            );

            return false;
        }
    }


    clear() {

        if (this.defaultImage) {

            this.raw.set(
                this.defaultImage
            );

        }
        else {

            const color = this.defaultColor;

            for (let i = 0; i < this.raw.length; i += 4) {
                this.raw[i] = color.r;
                this.raw[i + 1] = color.g;
                this.raw[i + 2] = color.b;
                this.raw[i + 3] = color.a;
            }
        }

        this.isDirty = true;
    }


    resetPixel(x, y) {

        const index =
            this.getPixelIndex(x, y);


        if (this.defaultImage) {

            this.raw[index] =
                this.defaultImage[index];

            this.raw[index + 1] =
                this.defaultImage[index + 1];

            this.raw[index + 2] =
                this.defaultImage[index + 2];

            this.raw[index + 3] =
                this.defaultImage[index + 3];

        }
        else {

            const color =
                this.defaultColor;

            this.raw[index] =
                color.r;

            this.raw[index + 1] =
                color.g;

            this.raw[index + 2] =
                color.b;

            this.raw[index + 3] =
                color.a;
        }

        this.isDirty = true;
    }


    setPixel(
        x,
        y,
        {
            color = null,
            r = 0,
            g = 0,
            b = 0,
            a = 0
        } = {}
    ) {

        const index =
            this.getPixelIndex(x, y);


        if (color) {
            r = color.r;
            g = color.g;
            b = color.b;
            a = color.a;
        }


        if (
            this.raw[index] === r &&
            this.raw[index + 1] === g &&
            this.raw[index + 2] === b &&
            this.raw[index + 3] === a
        ) {
            return;
        }


        this.raw[index] = r;
        this.raw[index + 1] = g;
        this.raw[index + 2] = b;
        this.raw[index + 3] = a;

        this.isDirty = true;
    }


    getPixelIndex(x, y) {

        return (
            y * UI.CANVAS.width +
            x
        ) * 4;
    }
}


const canvas =
    new canvasConstructor({
        defaultColor: COLORS.WHITE
    });


class Tool {

    static select(tool) {
        return this._collection[tool];
    }


    static _drawLine(
        x,
        y,
        lastX,
        lastY,
        callback
    ) {

        if (
            lastX === null ||
            lastY === null
        ) {
            callback(x, y);
            return;
        }


        const dx =
            x - lastX;

        const dy =
            y - lastY;


        const steps =
            Math.max(
                Math.abs(dx),
                Math.abs(dy)
            );


        for (
            let step = 0;
            step <= steps;
            step++
        ) {

            const t =
                steps === 0
                    ? 0
                    : step / steps;


            const pointX =
                Math.round(
                    lastX + dx * t
                );

            const pointY =
                Math.round(
                    lastY + dy * t
                );


            callback(
                pointX,
                pointY
            );
        }
    }


    static _prototype = {

        pencil(
            size,
            {
                x = 0,
                y = 0,
                lastX = null,
                lastY = null,
                tool = null
            } = {}
        ) {

            Tool._drawLine(
                x,
                y,
                lastX,
                lastY,
                (pointX, pointY) => {

                    const left =
                        pointX -
                        Math.floor(size / 2);

                    const top =
                        pointY -
                        Math.floor(size / 2);


                    for (
                        let i = 0;
                        i < size;
                        i++
                    ) {

                        for (
                            let j = 0;
                            j < size;
                            j++
                        ) {

                            const pixelX =
                                left + i;

                            const pixelY =
                                top + j;


                            if (
                                pixelX >= 0 &&
                                pixelX < UI.CANVAS.width &&
                                pixelY >= 0 &&
                                pixelY < UI.CANVAS.height
                            ) {

                                canvas.setPixel(
                                    pixelX,
                                    pixelY,
                                    {
                                        color:
                                            tool.data.currentColor
                                    }
                                );
                            }
                        }
                    }
                }
            );
        },


        circular_draw(
            size,
            {
                x = 0,
                y = 0,
                lastX = null,
                lastY = null,
                tool = null
            } = {}
        ) {

            const radius =
                (size - 1) / 2;


            Tool._drawLine(
                x,
                y,
                lastX,
                lastY,
                (pointX, pointY) => {

                    const left =
                        Math.floor(
                            pointX - radius
                        );

                    const right =
                        Math.ceil(
                            pointX + radius
                        );

                    const top =
                        Math.floor(
                            pointY - radius
                        );

                    const bottom =
                        Math.ceil(
                            pointY + radius
                        );


                    for (
                        let pixelX = left;
                        pixelX <= right;
                        pixelX++
                    ) {

                        for (
                            let pixelY = top;
                            pixelY <= bottom;
                            pixelY++
                        ) {

                            const dx =
                                pixelX - pointX;

                            const dy =
                                pixelY - pointY;


                            if (
                                dx * dx +
                                dy * dy <=
                                radius * radius &&

                                pixelX >= 0 &&
                                pixelX < UI.CANVAS.width &&

                                pixelY >= 0 &&
                                pixelY < UI.CANVAS.height
                            ) {

                                canvas.setPixel(
                                    pixelX,
                                    pixelY,
                                    {
                                        color:
                                            tool.data.currentColor
                                    }
                                );
                            }
                        }
                    }
                }
            );
        },


        eraser(
            size,
            {
                x = 0,
                y = 0,
                lastX = null,
                lastY = null
            } = {}
        ) {

            Tool._drawLine(
                x,
                y,
                lastX,
                lastY,
                (pointX, pointY) => {

                    const left =
                        pointX -
                        Math.floor(size / 2);

                    const top =
                        pointY -
                        Math.floor(size / 2);


                    for (
                        let i = 0;
                        i < size;
                        i++
                    ) {

                        for (
                            let j = 0;
                            j < size;
                            j++
                        ) {

                            const pixelX =
                                left + i;

                            const pixelY =
                                top + j;


                            if (
                                pixelX >= 0 &&
                                pixelX < UI.CANVAS.width &&
                                pixelY >= 0 &&
                                pixelY < UI.CANVAS.height
                            ) {

                                canvas.resetPixel(
                                    pixelX,
                                    pixelY
                                );
                            }
                        }
                    }
                }
            );
        }
    };


    static construct(
        [type, ...attributes],
        required = [],
        condition = () => true
    ) {

        const tool =
            this._prototype[type].bind(
                null,
                ...attributes
            );


        tool.type =
            type;

        tool.required =
            required;

        tool.condition =
            condition;

        tool.attributes =
            attributes;


        return tool;
    }


    static create(
        type,
        size = 1,
        color = COLORS.BLACK
    ) {

        return {

            use: this.construct(
                [type, size],
                [
                    "x",
                    "y",
                    "lastX",
                    "lastY",
                    "tool"
                ]
            ),

            data: {
                type: type,
                size: size,
                currentColor: color
            }
        };
    }
}


const TOOL_TYPES = {
    pencil: "pencil",
    circular_draw: "circular_draw",
    eraser: "eraser"
};


function createCurrentTool(
    type,
    size,
    color
) {

    CURRENT_TOOL =
        Tool.create(
            type,
            size,
            color
        );

    return CURRENT_TOOL;
}


function selectToolType(type) {

    const currentColor =
        CURRENT_TOOL
            ? CURRENT_TOOL.data.currentColor
            : COLORS.BLACK;


    const currentSize =
        CURRENT_TOOL
            ? CURRENT_TOOL.data.size
            : Number(UI.TOOL_SIZE.value);


    createCurrentTool(
        type,
        currentSize,
        currentColor
    );


    document
        .querySelectorAll(".tool-button")
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.tool === type
            );
        });
}


function createNewData(event) {

    return Object.fromEntries(
        CURRENT_TOOL.use.required.map(
            key => [
                key,
                DATA[key]({
                    event: event,
                    canvas: canvas,
                    tool: CURRENT_TOOL
                })
            ]
        )
    );
}


function getCanvasCoordinates(event) {
    const rect = UI.CANVAS.getBoundingClientRect();
    const scaleX = UI.CANVAS.width / rect.width;
    const scaleY = UI.CANVAS.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    return {
        x: Math.min(
            Math.max(
                Math.round(x),
                0
            ),
            UI.CANVAS.width - 1
        ),
        y: Math.min(
            Math.max(
                Math.round(y),
                0
            ),
            UI.CANVAS.height - 1
        )
    };
}


function normalizePointerEvent(event) {
    if (
        typeof event.offsetX === "number" &&
        typeof event.offsetY === "number"
    ) {
        return event;
    }

    const point = getCanvasCoordinates(event);

    return {
        ...event,
        offsetX: point.x,
        offsetY: point.y,
        clientX: point.x,
        clientY: point.y
    };
}


function colorToCSS(color) {

    return `rgba(
        ${color.r},
        ${color.g},
        ${color.b},
        ${color.a / 255}
    )`;
}


Object.entries(COLORS).forEach(
    ([name, color]) => {

        const button =
            document.createElement("button");


        button.className =
            "color-button";

        button.dataset.color =
            name;

        button.title =
            name;

        button.style.background =
            colorToCSS(color);


        button.addEventListener(
            "click",
            () => {

                if (!CURRENT_TOOL) {
                    return;
                }


                CURRENT_TOOL.data.currentColor =
                    color;


                document
                    .querySelectorAll(".color-button")
                    .forEach(button => {
                        button.classList.remove(
                            "selected"
                        );
                    });


                button.classList.add(
                    "selected"
                );
            }
        );


        UI.COLOR_SELECTOR.appendChild(
            button
        );
    }
);


const customColor =
    document.createElement("input");


customColor.type =
    "color";

customColor.alpha =
    true;

customColor.setAttribute(
    "alpha",
    ""
);

customColor.value =
    "#000000";


customColor.className =
    "custom-color";


customColor.addEventListener(
    "input",
    () => {

        if (!CURRENT_TOOL) {
            return;
        }


        const value =
            customColor.value;


        const color =
            new colorConstructor(
                parseInt(
                    value.slice(1, 3),
                    16
                ),

                parseInt(
                    value.slice(3, 5),
                    16
                ),

                parseInt(
                    value.slice(5, 7),
                    16
                ),

                value.length >= 9
                    ? parseInt(
                        value.slice(7, 9),
                        16
                    )
                    : 255
            );


        CURRENT_TOOL.data.currentColor =
            color;


        document
            .querySelectorAll(".color-button")
            .forEach(button => {
                button.classList.remove(
                    "selected"
                );
            });
    }
);


UI.COLOR_SELECTOR.appendChild(
    customColor
);


Object.entries(
    TOOL_TYPES
).forEach(
    ([name, type]) => {

        const button =
            document.createElement("button");


        button.className =
            "tool-button";

        button.dataset.tool =
            name;

        button.textContent =
            name;


        button.addEventListener(
            "click",
            () => {
                selectToolType(type);
            }
        );


        UI.TOOL_SELECTOR.appendChild(
            button
        );
    }
);


UI.TOOL_SIZE.addEventListener(
    "input",
    () => {

        if (!CURRENT_TOOL) {
            return;
        }


        const size =
            Number(
                UI.TOOL_SIZE.value
            );


        const type =
            CURRENT_TOOL.data.type;

        const color =
            CURRENT_TOOL.data.currentColor;


        createCurrentTool(
            type,
            size,
            color
        );
    }
);


class App {

    static loop = () => {

        if (canvas.isDirty) {

            CTX.putImageData(
                new ImageData(
                    canvas.raw,
                    UI.CANVAS.width,
                    UI.CANVAS.height
                ),
                0,
                0
            );

            canvas.isDirty = false;
        }


        requestAnimationFrame(
            App.loop
        );
    }


    static executeTool(event) {

        if (!CURRENT_TOOL) {
            return;
        }

        const normalizedEvent =
            normalizePointerEvent(event);

        const NEW_DATA =
            createNewData(normalizedEvent);


        if (
            CURRENT_TOOL.use.condition(
                NEW_DATA
            )
        ) {

            CURRENT_TOOL.use(
                NEW_DATA
            );
        }


        canvas.x =
            normalizedEvent.offsetX;

        canvas.y =
            normalizedEvent.offsetY;
    }


    static addEventListeners() {

        UI.CANVAS.addEventListener(
            "pointerdown",
            (e) => {
                e.preventDefault();

                UI.CANVAS.setPointerCapture?.(e.pointerId);

                const point = getCanvasCoordinates(e);

                canvas.x = point.x;
                canvas.y = point.y;

                canvas.isDrawing = true;

                App.executeTool(e);
            }
        );


        window.addEventListener(
            "keydown",
            (e) => {

                if (
                    e.key >= "1" &&
                    e.key <= "9"
                ) {

                    const index =
                        Number(e.key) - 1;

                    const tool =
                        Object.keys(
                            TOOL_TYPES
                        )[index];


                    if (tool) {
                        selectToolType(tool);
                    }
                }
            }
        );


        UI.CANVAS.addEventListener(
            "pointermove",
            (e) => {
                if (!canvas.isDrawing) {
                    return;
                }

                e.preventDefault();
                App.executeTool(e);
            }
        );


        UI.CANVAS.addEventListener(
            "pointerleave",
            () => {

                canvas.x = null;
                canvas.y = null;
            }
        );


        UI.CANVAS.addEventListener(
            "pointerenter",
            (e) => {

                if (canvas.isDrawing) {
                    const point = getCanvasCoordinates(e);

                    canvas.x = point.x;
                    canvas.y = point.y;
                }
            }
        );


        window.addEventListener(
            "pointerup",
            (e) => {
                if (canvas.isDrawing) {
                    UI.CANVAS.releasePointerCapture?.(e.pointerId);
                }

                canvas.isDrawing = false;
                canvas.x = null;
                canvas.y = null;
            }
        );

        window.addEventListener(
            "pointercancel",
            (e) => {
                if (canvas.isDrawing) {
                    UI.CANVAS.releasePointerCapture?.(e.pointerId);
                }

                canvas.isDrawing = false;
                canvas.x = null;
                canvas.y = null;
            }
        );


        UI.CLEAR_BUTTON.addEventListener(
            "click",
            () => {
                canvas.clear();
            }
        );
    }


    static start() {

        App.addEventListeners();

        selectToolType("pencil");

        requestAnimationFrame(
            App.loop
        );
    }
}


App.start();