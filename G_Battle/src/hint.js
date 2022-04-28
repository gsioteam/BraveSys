
const { Easing } = require('@tweenjs/tween.js');
const ColorRect = require('./color_rect');
const TweenManager = require('./tween_manager');

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

const _Padding = {
    x: 4,
    y: 4
};
class Hint extends PIXI.Sprite {
    constructor() {
        super();

        this._background = new ColorRect();
        this._background.color = 0x202040;
        this._background.alpha = 0.6;
        this._label = new PIXI.Text('', textStyle);
        this.alpha = 0;

        this.tweens = new TweenManager();

        this.addChild(this._background);
        this.addChild(this._label);
    }
    
    set text(v) {
        if (this._text !== v) {
            this._text = v;
            this._update();
        }
    }

    get text() {
        return this._text;
    }

    _update() {
        if (this._text) {
            let textMetrics = PIXI.TextMetrics.measureText(this._text, textStyle);
            this._background.width = textMetrics.width + _Padding.x * 2;
            this._background.height = textMetrics.height + _Padding.y * 2;
            this._label.text = this._text;
            this._label.width = textMetrics.width;
            this._label.height = textMetrics.height;
            this._label.x = _Padding.x;
            this._label.y = _Padding.y;
            // this.width = textMetrics.width;
            // this.height = textMetrics.height;
        }
    }

    async appear(x, y) {
        let cx = x - (this.width + _Padding.x * 2) / 2;

        if (this.alpha <= 0.04) {
            this.x = cx;
            this.y = y + 40;
        }
        await this.tweens.tween(this).to({
            x: cx,
            y: y + 20,
            alpha: 1,
        }, 400).easing(Easing.Cubic.Out).run();
    }

    async disappear() {
        let cx = this.x;
        await this.tweens.tween(this).to({
            x: cx,
            y: this.y + 20,
            alpha: 0,
        }, 400).easing(Easing.Cubic.Out).run();
    }

    destroy(options) {
        super.destroy(options);
        this.tweens.destroy();
    }
}

module.exports = Hint;