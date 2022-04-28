const { Easing } = require("@tweenjs/tween.js");
const TweenManager = require("./tween_manager");

class Scroller extends PIXI.Container {

    /**
     * 
     * @param {number} options.width
     * @param {number} options.height
     */
    constructor(options = {}) {
        super();

        this._width = options.width || 48;
        this._height = options.height || 48;
        
        this.type = Scroller.TYPE_VERTICAL;

        this.content = new PIXI.Container();
        this.addChild(this.content);

        this._spriteMask = PIXI.Sprite.from(PIXI.Texture.WHITE);
        this.mask = this._spriteMask;
        // this.mask = new PIXI.Graphics();
        this.tweens = new TweenManager();
        this.addChild(this._spriteMask);

        this.interactive = true;
        this.interactiveMousewheel = true;
        this.pressed = false;
        this.addListener('mousedown', (e)=> {
            this._onMouseDown(e);
        });
        this.addListener('mouseup', (e) => {
            this._onMouseUp(e);
        });
        this.addListener('mouseupoutside', (e) => {
            this._onMouseUp(e);
        });
        this.addListener('mousemove', (e) => {
            this._onMouseMove(e);
        });
        this.addListener('mousewheel', (e) => {
            this._onMouseWheel(e);
        });
        this._oldPosition = new PIXI.Point(
            this.content.x,
            this.content.y
        );
        this._delta = new PIXI.Point();
        this._updateMask();
    }

    set width(w) {
        if (this._width !== w) {
            this._width = w;
            this._updateMask();
        }
    }

    get width() {
        return this._width;
    }

    set height(h) {
        if (this._height !== h) {
            this._height = h;
            this._updateMask();
        }
    }

    get height() {
        return this._height;
    }

    set x(x) {
        if (x !== super.x) {
            super.x = x;
            this._updateMask();
        }
    }

    get x() {
        return super.x;
    }

    set y(y) {
        if (y !== super.y) {
            super.y = y;
            this._updateMask();
        }
    }

    get y() {
        return super.y;
    }
    
    /**
     * @returns {PIXI.Rectangle}
     */
     get viewport() {
        if (!this._viewport) {
            this._viewport = new PIXI.Rectangle();
        }
        this._viewport.x = -this.content.x;
        this._viewport.y = -this.content.y;
        this._viewport.width = this.width;
        this._viewport.height = this.height;
        return this._viewport;
    }

    _updateMask() {
        this._spriteMask.width = this.width;
        this._spriteMask.height = this.height;
    }

    _onMouseDown(e) {
        this._oldPosition.x = e.data.global.x;
        this._oldPosition.y = e.data.global.y;
        this._delta.x = 0;
        this._delta.y = 0;
        this.pressed = true;
    }

    _onMouseUp(e) {
        this.pressed = false;
        if (this.type == Scroller.TYPE_VERTICAL) {
            if (this.content.height > this.height) {
                if (this.content.y > 0) {
                    this.tweens.tween(this.content).to({
                        y: 0
                    }, 400).easing(Easing.Bounce.Out).run();
                } else if (this.content.y < -(this.content.height - this.height)) {
                    this.tweens.tween(this.content).to({
                        y: Math.min(0, -(this.content.height - this.height)),
                    }, 400).easing(Easing.Bounce.Out).run();
                } else {
                    let target = Math.max(Math.min(0, this.content.y + this._delta.y * 60), -(this.content.height - this.height));
                    this.tweens.tween(this.content).to({
                        y: target
                    }, 400).easing(Easing.Cubic.Out).run();
                }
            }
        }
    }

    _onMouseMove(e) {
        if (this.pressed) {
            let offset = e.data.global.y - this._oldPosition.y;

            if (this.type == Scroller.TYPE_VERTICAL) {
                if (this.content.height > this.height) {
                    if (this.content.y > 0) {
                        offset /= 3;
                    } else if (this.content.y < -(this.content.height - this.height)) {
                        offset /= 3;
                    }
                    this.content.y += offset;
                }
            }

            this._delta.x = (e.data.global.x - this._oldPosition.x);
            this._delta.y = (e.data.global.y - this._oldPosition.y);
            this._oldPosition.x = e.data.global.x;
            this._oldPosition.y = e.data.global.y;
        }
    }

    _onMouseWheel(off) {
        if (this.type == Scroller.TYPE_VERTICAL) {
            if (this.content.height > this.height) {
                let target = this.content.y + off;
                if (target > 0) {
                    target = 0;
                } else if (target < -(this.content.height - this.height)) {
                    target = Math.min(0, -(this.content.height - this.height));
                }
                this.content.y = target;
            }
        }
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
     scrollTo(x ,y) {
        return this.tweens.tween(this.content).to({
            x: -x, y: -y
        }, 300).easing(Easing.Cubic.Out).run();
    }

    destroy(options) {
        super.destroy(options);
        this.tweens.destroy();
    }
}

Scroller.TYPE_VERTICAL = 0;
Scroller.TYPE_HORIZONTAL = 1;

module.exports = Scroller;