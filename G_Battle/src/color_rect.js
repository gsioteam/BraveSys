
class ColorRect extends PIXI.Graphics {

    constructor() {
        super();
        this._corner = 0;
    }

    set width(w) {
        if (this._width !== w) {
            this._width = w;
            this._update();
        }
    }

    get width() {
        return this._width || 0;
    }

    set height(h) {
        if (this._height !== h) {
            this._height = h;
            this._update();
        }
    }

    get height() {
        return this._height || 0;
    }

    set color(v) {
        if (this._color !== v) {
            this._color = v;
            this._update();
        }
    }

    get color() {
        return this._color;
    }

    set corner(v) {
        if (this._corner !== v) {
            this._corner = v;
            this._update();
        }
    }

    get corner() {
        return this._corner;
    }

    _update() {
        this.clear();
        if (this._color && this._width && this._height) {
            this.beginFill(this._color);
            this.drawRoundedRect(0, 0, this._width, this._height, this._corner);
            this.endFill();
        }
    }
}

module.exports = ColorRect;