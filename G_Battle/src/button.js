const ColorRect = require("./color_rect");
const Input = require('./input');

const State = {
    Normal: 0,
    Hover: 1,
    Pressed: 2,
    Disabled: 3,
};

let textStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fill: ['#ffffff'],
    stroke: '#004620',
    fontSize: 14,
    fontWeight: 'lighter',
    lineJoin: 'round',
    strokeThickness: 1,
    stroke: '0x222222',
    wordWrap: true,
    wordWrapWidth: 180,
});

let hoverStyle = textStyle.clone();
hoverStyle.fill = '0x202040';

let disabledStyle = textStyle.clone();
disabledStyle.fill = '0x999999';

const _IconSize = 32;

class Button extends PIXI.Container {

    /**
     * 
     * @param {number}  width 
     * @param {number}  height 
     * @param {Object}  options 
     * @param {boolean} options.enable
     * @param {String}  options.text
     * @param {PIXI.DisplayObject} options.icon 
     */
    constructor(width, height, options = {}) {
        super();

        this._background = new ColorRect();
        this._background.corner = 4;
        this.addChild(this._background);
        this.interactive = true;

        let enable = options.enable;
        if (enable === undefined) enable = true;
        
        this._state = enable ? State.Normal : State.Disabled;
        this._mouseover = false;
        this.addListener('mouseover', () => {
            if (this._state === State.Normal) {
                this._state = State.Hover;
                this._update();
            }
            this._mouseover = true;
        });
        this.addListener('mouseout', () => {
            if (this._state === State.Hover) {
                this._state = State.Normal;
                this._update();
            }
            this._mouseover = false;
        });
        this.addListener('mousedown', () => {
            if (this._state === State.Disabled) return;
            if (this._state !== State.Pressed) {
                this._state = State.Pressed;
                this._update();
            }
        });
        let mouseup = () => {
            if (this._state === State.Pressed) {
                this._state = this._mouseover ? State.Hover : State.Normal;
                this._update();
            }
        };
        this.addListener('mouseup', mouseup);
        this.addListener('mouseupoutside', mouseup);

        this.addListener('click', ()=> {
            if (this._state !== State.Disabled) {
                this.emit('check');
            }
        });

        this._onChecked = () => {
            if (this.active && this._state !== State.Disabled) {
                this.emit('check');
            }
        };
        Input.event('ok').on('down', this._onChecked);

        this._label = new PIXI.Text('', textStyle);
        this.addChild(this._label);

        this.width = width;
        this.height = height;
        this.text = options.text;
        if (options.icon) {
            this._icon = options.icon;
            this.addChild(this._icon);
        }
        this._update();
    }

    set width(w) {
        if (this._width !== w) {
            this._width = w;
            this._background.width = w;
            this._updateTextPosition();
        }
    }

    get width() {
        return this._width;
    }

    set height(h) {
        if (this._height !== h) {
            super._height = h;
            this._background.height = h;
            this._updateTextPosition();
        }
    }

    get height() {
        return this._height;
    }

    set text(v) {
        this._label.text = v;
        this._label.calculateBounds();
        this._updateTextPosition();
    }

    get text() {
        return this._label.text;
    }

    set active(v) {
        if (this._active != v) {
            this._active = v;
            this._update();
        }
    }

    get active() {
        return this._active;
    }

    _updateTextPosition() {
        if (this._icon) {
            this._icon.x = (_IconSize - this._icon.width) * 0.6;
            this._icon.y = (this.height - this._icon.height) / 2;
            this._label.x = _IconSize + ((this.width - _IconSize) - this._label.width) / 2;
            this._label.y = (this.height - this._label.height) / 2;
        } else {
            this._label.x = (this.width - this._label.width) / 2;
            this._label.y = (this.height - this._label.height) / 2;
        }
    }

    _update() {
        if (this._active && this._state !== State.Pressed && this._state !== State.Disabled) {
            this._label.style = hoverStyle;
            this._background.color = 0xaaaaaa;
            return;
        }
        switch (this._state) {
            case State.Normal: {
                this._label.style = textStyle;
                this._background.color = 0x202040;
                break;
            }
            case State.Hover: {
                this._label.style = hoverStyle;
                this._background.color = 0x666666;
                break;
            }
            case State.Pressed: {
                this._label.style = hoverStyle;
                this._background.color = 0xcccccc;
                break;
            }
            case State.Disabled: {
                this._label.style = disabledStyle;
                this._background.color = 0x202040;
                break;
            }
        }
    }

    destroy(options) {
        super.destroy(options);
        Input.event('ok').off('down', this._onChecked);
    }
}

module.exports = Button;