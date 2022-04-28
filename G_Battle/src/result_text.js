const { Easing } = require("@tweenjs/tween.js");
const { Graphics } = require("rmmz");
const TweenManager = require("./tween_manager");

const missedStyle = new PIXI.TextStyle({
    dropShadow: true,
    dropShadowAlpha: 0.5,
    dropShadowAngle: -0.6,
    dropShadowBlur: 3,
    dropShadowColor: "#545454",
    dropShadowDistance: 3,
    fill: "white",
    fontSize: 16,
    fontWeight: "bold",
    lineJoin: "bevel",
    stroke: "#454545",
    strokeThickness: 4
});

const physicStyle = missedStyle.clone();
physicStyle.fill = '#ff2424';

const magicStyle = missedStyle.clone();
magicStyle.fill = '#3cf';

const failedStyle = missedStyle.clone();
failedStyle.fill = '#a3a3a3';

class ResultText extends PIXI.Text {

    constructor(result) {
        let text;
        let style;
        if (!result.success) {
            text = 'Failed';
            style = failedStyle;
        } else if (result.missed) {
            text = 'Miss';
            style = missedStyle;
        } else if (result.evaded) {
            text = 'Evade';
            style = missedStyle;
        } else if (result.hpAffected) {
            text = '-' + result.hpDamage;
            style = result.physical ? physicStyle : magicStyle;
        } else {
            text = '0';
            style = physicStyle;
        }

        if (result.critical) {
            style = style.clone();
            style.fontSize = 22;
            style.strokeThickness = 6;
            style.dropShadowColor = "#ffa200";
            style.stroke = "#fb0";
        }

        super(text, style);

        this.anchor.set(0.5, 0.5);

        this.tweens = new TweenManager();
    }

    destroy(options) {
        this._finish();
        this.tweens.destroy();
        super.destroy(options);
    }

    _finish() {
        if (this._update) {
            Graphics.app.ticker.remove(this._update);
            this._update = null;
        }
    }

    /**
     * 
     * @param {Object} speed 
     * @param {number} speed.x
     * @param {number} speed.y
     * @returns 
     */
    jump(speed) {
        if (this._running) return;
        this._running = true;
        return new Promise((resolve, reject)=>{
            let ox = this.x, oy = this.y;
            let bottom = this.y + 46;
            let that = this;
            const gravy = 0.3;
            let bounce = 2;
            let speedx = speed.x, speedy = speed.y;
            function _complete() {
                that._finish();
                resolve(that.tweens.tween(that).to({
                    alpha: 0,
                }, 300).run());
            }
            function _update() {
                that.x += speedx;
                that.y += speedy;
                speedy += gravy;
                if (that.y >= bottom && speedy > 0) {
                    if (bounce <= 0) {
                        _complete();
                    } else {
                        bounce -= 1;
                        speedy = speedy * -0.4;
                    }
                }
            }
            this._update = _update;
            Graphics.app.ticker.add(_update);
        });
    }
}

module.exports = ResultText;