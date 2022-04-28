const { Easing } = require("@tweenjs/tween.js");
const { PluginManager, Graphics, Game_Actor, ImageManager, Sprite } = require("rmmz");
const TweenManager = require("./tween_manager");

let params = PluginManager.parameters('g_battle');

const _Size = 420;
const _SpriteSize = 280;
class ActorStatus extends PIXI.Container {
    constructor() {
        super();

        let color = parseInt(params['Actor Color']);
        let r = (color >> 16) & 0xff;
        let g = (color >> 8) & 0xff;
        let b = color & 0xff;

        let rgb = (r, g, b) => ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);

        this._bg0 = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._bg0.tint = rgb(r + 0x33, g + 0x11, b);
        this._bg0.width = _Size * 1.2;
        this._bg0.height = _Size * 1.2;
        this._bg0.anchor.set(1, 0);
        this._bg0.position.set(_Size * 1.2 / 2, Graphics.height);
        // this._bg0.angle = 58;
        this._bg0.alpha = 0.9;
        this.addChild(this._bg0);

        this._bg1 = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._bg1.tint = color;
        this._bg1.width = _Size;
        this._bg1.height = _Size;
        this._bg1.anchor.set(1, 0);
        this._bg1.position.set(_Size / 2, Graphics.height);
        // this._bg1.angle = 60;
        this.addChild(this._bg1);

        this._sprite = new Sprite();
        this._sprite.anchor.set(0, 1);
        this._sprite.position.set(0, Graphics.height);
        this.addChild(this._sprite);

        this.tweens = new TweenManager();
    }

    destroy(options) {
        super.destroy(options);
        this.tweens.destroy();
    }

    waitBitmap(bitmap) {
        return new Promise(function (resolve, reject) {
            bitmap.addLoadListener(resolve);
        });
    }

    /**
     * 
     * @param {Game_Actor} actor 
     */
    async show(actor) {
        let pictureName = `${actor.faceName()}_${actor.faceIndex() + 1}`;
        let bitmap = ImageManager.loadPicture(pictureName);
        if (!bitmap.isReady()) {
            await this.waitBitmap(bitmap);
        }
        let width = _SpriteSize;
        let height = _SpriteSize / bitmap.width * bitmap.height;
        let scale = _SpriteSize / bitmap.width;
        this._sprite.x = -width;
        this._sprite.bitmap = bitmap;
        this._sprite.scale.set(scale, scale);

        this.tweens.tween(this._bg0).to({
            angle: 58
        }, 300).easing(Easing.Cubic.Out).run();
        this.tweens.tween(this._bg1).to({
            angle: 60
        }, 300).delay(200).easing(Easing.Cubic.Out).run();
        await this.tweens.tween(this._sprite).to({
            x: -60
        }, 300).delay(300).easing(Easing.Cubic.Out).run();
    }

    async miss() {
        this.tweens.tween(this._sprite).to({
            x: -this._sprite.width
        }, 300).easing(Easing.Cubic.Out).run();
        this.tweens.tween(this._bg1).to({
            angle: 0
        }, 300).delay(200).easing(Easing.Cubic.Out).run();
        await this.tweens.tween(this._bg0).to({
            angle: 0
        }, 300).delay(300).easing(Easing.Cubic.Out).run();
    }
}

module.exports = ActorStatus;