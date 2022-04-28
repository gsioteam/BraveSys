const { Game_Actor, ImageManager, Bitmap, Graphics, Sprite } = require("rmmz");
const utils = require("./utils");
const tinycolor = require("tinycolor2");
const TweenManager = require("./tween_manager");
const { Easing } = require("@tweenjs/tween.js");
const StateIcon = require("./state_icon");
const Hint = require('./hint');

const _CircleSize = 80;
const _Padding = 2;
const _AvatarSize = _CircleSize - _Padding * 2;

const circleBitmap = new Bitmap(_CircleSize, _CircleSize);
circleBitmap.drawCircle(_CircleSize/2, _CircleSize/2, _CircleSize/2, '#ffffff');
const _circleTexture = new PIXI.Texture(circleBitmap.baseTexture);

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} width 
 * @param {number} height 
 * @param {string} color 
 */
function drawRoundCanvas(canvas, width, height, color) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.beginPath();
    if (width <= 0) {
    } else if (width > height) {
        ctx.moveTo(height/2, height);
        ctx.arc(height/2, height/2, height/2, Math.PI/2, -Math.PI/2);
        ctx.lineTo(width-height/2, 0);
        ctx.arc(width-height/2, height/2, height/2, -Math.PI/2, Math.PI/2);
        ctx.lineTo(height/2, height);
    } else {
        ctx.arc(width/2, height/2, width/2, 0, Math.PI*2);
    }
    ctx.closePath();
    ctx.fill();

}

function createRoundCanvas(width, height, color) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    drawRoundCanvas(canvas, width, height, color);

    return canvas;
}

class RoundBar extends PIXI.Sprite {
    constructor(width, height, color) {
        let canvas = createRoundCanvas(width, height, color);
        super(PIXI.Texture.from(canvas));
        this._canvas = canvas;

        this._width = width;
        this._height = height;
        this._color = color;
    }

    get width() {
        return this._width;
    }

    set width(v) {
        if (this._width !== v) {
            this._width = v;

            drawRoundCanvas(this._canvas, this._width, this._height, this._color);
            this.texture.update();
        }
    }

    get height() {
        return this._height;
    }

    set height(v) {
        if (this._height !== v) {
            this._height = v;

            drawRoundCanvas(this._canvas, this._width, this._height, this._color);
            this.texture.update();
        }
    }

    set rate(v) {
        this.width = this._canvas.width * v;
    }
}

let textStyle = new PIXI.TextStyle({
    fontFamily: 'VL Gothic',
    fill: ['#ffffff'],
    stroke: '#004620',
    fontSize: 16,
    fontWeight: 'lighter',
    fontStyle: 'italic',
    lineJoin: 'round',
    strokeThickness: 4,
    stroke: '0x202040',
});

const _GaugeSize = {
    w: 180,
    h: 12,
};
class GaugeBar extends PIXI.Container {

    constructor({color, max, value}) {
        super();

        this.bitmap = new Bitmap(_GaugeSize.w, _GaugeSize.h);
        this.bitmap.drawCircle(_GaugeSize.h/2, _GaugeSize.h/2, _GaugeSize.h/2, '#000');
        this.bitmap.drawCircle(_GaugeSize.w - _GaugeSize.h/2, _GaugeSize.h/2, _GaugeSize.h/2, '#000');
        this.bitmap.fillRect(_GaugeSize.h/2, 0, _GaugeSize.w-_GaugeSize.h, _GaugeSize.h, '#000');
        let texture = new PIXI.Texture(this.bitmap.baseTexture);
        this._background = new PIXI.Sprite(texture);
        this._background.y = 10;
        this.addChild(this._background);
        
        function createGradTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = _GaugeSize.h;

            const ctx = canvas.getContext('2d');

            let tcolor = tinycolor(color);
            const grd = ctx.createLinearGradient(0, 0, 0, _GaugeSize.h);
            grd.addColorStop(0, tcolor.toRgbString());
            tcolor.darken(20);
            grd.addColorStop(1, tcolor.toRgbString());

            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 1, _GaugeSize.h);

            return PIXI.Texture.from(canvas);
        }
        
        let barSize = {
            w: _GaugeSize.w - 4,
            h: _GaugeSize.h - 4
        };
        this._bar = new PIXI.Sprite(createGradTexture());
        this._bar.width = barSize.w;
        this._bar.height = barSize.h;
        this._bar.x = 2;
        this._bar.y = 12;
        this.addChild(this._bar);

        this._bar.mask = new RoundBar(barSize.w, barSize.h, '#ffffff');
        this._bar.mask.x = 2;
        this._bar.mask.y = 12;
        this.addChild(this._bar.mask);
        
        this._label = new PIXI.Text(`${value} / ${max}`, textStyle);
        this.addChild(this._label);

        this._max = max;
        this._value = value;

    }

    destroy(options) {
        super.destroy(options);
        this.bitmap.destroy();
    }

    set max(v) {
        v = Math.round(v);
        if (this._max !== v) {
            this._max = v;
            this._label.text = `${this._value} / ${this._max}`;
            this._bar.mask.rate = this._value / this._max;
        }
    }

    get max() {
        return this._max;
    }

    set value(v) {
        v = Math.round(v);
        if (this._value !== v) {
            this._value = v;
            this._label.text = `${this._value} / ${this._max}`;
            this._bar.mask.rate = this._value / this._max;
        }
    }

    get value() {
        return this._value;
    }
}

function createGlassBall(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    let ctx = canvas.getContext('2d');
    let grd = ctx.createRadialGradient(0, 0, size * 0.1, 0, 0, Math.sqrt(size * size + size * size));
    grd.addColorStop(0, '#99bfff');
    grd.addColorStop(0.5, '#00bfd9');
    grd.addColorStop(0.75, '#359');
    grd.addColorStop(0.84, '#99bfff');

    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    grd = ctx.createLinearGradient(0, 0, 0, size/2);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(1, '#ffffff00');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(size/2, size/4 + size*0.1, size/3, size/4, 0, 0, Math.PI * 2);
    ctx.fill();

    return PIXI.Texture.from(canvas);
}

let _glassBall = createGlassBall(28);

class EnergyGauge extends PIXI.Container {

    /**
     * 
     * @param {Game_Actor} actor 
     */
    constructor(actor) {
        super();
        this._actor = actor;
        
        let max = actor.maxTp() / 10;
        this._dots = [];
        for (let i = 0; i < max; ++i) {
            let bg = new PIXI.Sprite(_circleTexture);
            bg.width = 18;
            bg.height = 18;
            bg.x = i * 18;
            bg.tint = 0x000;
            this.addChild(bg);

            let dot = new PIXI.Sprite(_glassBall);
            dot.width = 14;
            dot.height = 14;
            dot.anchor.set(0.5);
            dot.y = 9;
            dot.x = 9 + 18 * i;
            this._dotScale = dot.scale.x;
            dot.scale.set(0);
            this.addChild(dot);
            this._dots.push(dot);
        }

        this.value = actor.tp;
    }

    get value() {
        return this._value;
    }

    set value(v) {
        if (this._value !== v) {
            this._value = v;
            let n = v / 10;
            for (let i = 0, t = this._dots.length; i < t; ++i) {
                let dot = this._dots[i];
                
                dot.scale.set(Math.min(1, Math.max(0, n - i)) * this._dotScale);
            }
        }
    }
}

class CircleAvatar extends PIXI.Container {

    /**
     * 
     * @param {Game_Actor} actor 
     */
    constructor(actor) {
        super();
        this._actor = actor;

        this._background = new PIXI.Sprite(_circleTexture);
        this._background.tint = 0x000;
        this.addChild(this._background);
        
        this._avatar = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._avatar.width = _AvatarSize;
        this._avatar.height = _AvatarSize;
        this._avatar.tint = 0x666666;
        this._avatar.anchor.set(0.5);

        this._avatarContainer = new Sprite();
        this._avatarContainer.x = _Padding + _AvatarSize/2;
        this._avatarContainer.y = _Padding + _AvatarSize/2;
        this._avatarContainer.addChild(this._avatar);
        this.addChild(this._avatarContainer);

        this._avatarMask = new PIXI.Sprite(_circleTexture);
        this._avatarMask.x = _Padding;
        this._avatarMask.y = _Padding;
        this._avatarMask.width = _AvatarSize;
        this._avatarMask.height = _AvatarSize;
        this._avatar.mask = this._avatarMask;
        this.addChild(this._avatarMask);

        this._hpBar = new GaugeBar({
            color: '#ff0000',
            value: actor.hp,
            max: actor.mhp,
        });
        this._hpBar.x = _AvatarSize - 4;
        this._hpBar.y = 18;
        this.addChild(this._hpBar);

        this._mpBar = new GaugeBar({
            color: '#0000ff',
            value: actor.mp,
            max: actor.mmp,
        });
        this._mpBar.x = _AvatarSize - 4;
        this._mpBar.y = 34;
        this.addChild(this._mpBar);

        this._energyGauge = new EnergyGauge(actor);
        this._energyGauge.x = _AvatarSize - 4;
        this._energyGauge.y = 54;
        this.addChild(this._energyGauge);

        this._loadFace();

        this.tweens = new TweenManager();

        this._stateIcons = [];
        this._data = {};
        let _checkValue = (key) => {
            if (this._data[key] !== actor[key]) {
                this._data[key] = actor[key];
                return true;
            }
            return false;
        };
        this._onUpdate = ()=>{
            if (_checkValue('hp') || _checkValue('mhp')) {
                this.tweens.tween(this._hpBar).to({
                    value: actor.hp,
                    max: actor.mhp
                }, 300).easing(Easing.Cubic.Out).run();
            }

            if (_checkValue('mp') || _checkValue('mmp')) {
                this.tweens.tween(this._mpBar).to({
                    value: actor.mp,
                    max: actor.mmp
                }, 300).easing(Easing.Cubic.Out).run();
            }

            if (_checkValue('tp')) {
                this.tweens.tween(this._energyGauge).to({
                    value: actor.tp,
                }, 300).run();
            }
            this._updateStates();
        };
        this._onUpdate();
        Graphics.app.ticker.add(this._onUpdate);
    }

    destroy(options) {
        super.destroy(options);
        Graphics.app.ticker.remove(this._onUpdate);
        this.tweens.destroy();
    }

    async _loadFace() {
        let faceIndex = this._actor.faceIndex();
        const bitmap = ImageManager.loadFace(this._actor.faceName());
        await utils.bitmapReady(bitmap);

        const pw = ImageManager.faceWidth;
        const ph = ImageManager.faceHeight;
        const sw = pw;
        const sh = ph;
        const sx = Math.floor((faceIndex % 4) * pw + (pw - sw) / 2);
        const sy = Math.floor(Math.floor(faceIndex / 4) * ph + (ph - sh) / 2);
        this._avatar.texture = new PIXI.Texture(bitmap.baseTexture, new PIXI.Rectangle(sx, sy, sw, sh));
        this._avatar.tint = 0xffffff;
        this._avatar.width = _AvatarSize;
        this._avatar.height = _AvatarSize;
    }

    get statesData() {
        let buffs = this._actor.buffIcons().map((icon)=>{
            return {
                type: StateIcon.Type.Icon,
                iconIndex: icon,
                battler: this._actor,
            };
        });
        let states = this._actor.states().map((state) => {
            return {
                type: StateIcon.Type.State,
                state: state,
                battler: this._actor,
            };
        });
        return [...buffs, ...states];
    }

    _updateStates() {
        let states = this.statesData;
        if (this._stateIcons.length > states.length) {
            let icons = this._stateIcons.splice(states.length, this._stateIcons.length - states.length);
            for (let icon of icons) {
                icon.destroy({
                    children: true,
                    texture: true,
                    baseTexture: true,
                });
            }
        }

        for (let i = 0, t = states.length; i < t; ++i) {
            let state = states[i];
            if (i < this._stateIcons.length) {
                let icon = this._stateIcons[i];
                icon.setData(state);
            } else {
                let icon = new StateIcon();
                icon.setData(state);
                icon.x = _AvatarSize - 4 + i * (16 + 2);
                icon.y = -2;
                icon.interactive = true;
                this.addChild(icon);
                this._stateIcons.push(icon);
            }
        }
    }
}

class ActorState extends Sprite {

    /**
     * 
     * @param {Game_Actor} actor 
     */
    constructor(actor) {
        super();

        this._actor = actor;
        this._active = false;
        this._highlight = false;

        this._avatar = new CircleAvatar(actor);
        this.addChild(this._avatar);
    }

    get actor() {
        return this._actor;
    }

    get battler() {
        return this._actor;
    }

    get active() {
        return this._active;
    }

    set active(v) {
        if (this._active !== v) {
            this._active = v;
            this.interactive = v;

            this._updateSprite();
        }
    }

    get highlight() {
        return this._highlight;
    }

    set highlight(v) {
        if (this._highlight !== v) {
            this._highlight = v;
            this._updateSprite();
        }
    }

    get targetPosition() {
        let pos = this.getGlobalPosition();
        return {
            x: pos.x + _CircleSize/2,
            y: pos.y + 24,
        };
    }

    _updateSprite() {
        if (this.highlight && this.active) {
            this.setBlendColor([255, 255, 255, 64]);
        } else {
            this.setBlendColor([0, 0, 0, 0]);
        }
    }

    get avatar() {
        return this._avatar._avatarContainer;
    }
}

const _Size = {
    w: 280,
    h: 92
};

class ActorStateWindow extends PIXI.Container {

    constructor() {
        super();

        const {$gameParty} = require("rmmz");

        const MaxLineNum = 2;
        this._actors = [];
        let actors = $gameParty.members();
        for (let i = 0, t = actors.length; i < t; ++i) {
            let actor = actors[i];
            let state = new ActorState(actor);
            state.x = (i % MaxLineNum) * _Size.w;
            state.y = Math.floor(i / MaxLineNum) * _Size.h;
            this.addChild(state);
            this._actors.push(state);
        }
    }

    get actors() {
        return this._actors;
    }

    set active(v) {
        if (this._active !== v) {
            this._active = v;
            for (let state of this._states) {
                state.interactive = v;
            }
        }
    }

    get active() {
        return this._active;
    }

    findTargetSprite(target) {
        let avatar = this.actors.find((actor)=>actor._actor === target);
        if (avatar) {
            return avatar.avatar;
        }
    }
}

module.exports = ActorStateWindow;