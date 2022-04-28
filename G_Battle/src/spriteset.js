const { Easing } = require("@tweenjs/tween.js");
const { Spriteset_Battle, Game_Battler, Sprite, Graphics, ImageManager, Stage, Game_Action, Game_Actor, SoundManager, Game_Enemy } = require("rmmz");
const ColorRect = require("./color_rect");
const Hint = require("./hint");
const Icon = require("./icon");
const TweenManager = require("./tween_manager");
const Input = require('./input');
const utils = require('./utils');
const ResultText = require("./result_text");
const ActorStateWindow = require("./actor_state_window");

let _old_onBitmapChange = Sprite.prototype._onBitmapChange;
Sprite.prototype._onBitmapChange = function() {
    _old_onBitmapChange.call(this);
    
    if (this._onbitmapCbs) {
        for (let cb of this._onbitmapCbs) {
            cb();
        }
    }
};

Sprite.prototype.onbitmap = function (fn) {
    if (!this._onbitmapCbs) {
        this._onbitmapCbs = [];
    }
    this._onbitmapCbs.push(fn);
};

const _BarSize = {
    w:60,
    h:4,
};
const _IconSize = {
    w: 16,
    h: 16,
}

const _ActiveEvent = 'active';

const textStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fill: ['#ff0000'],
    stroke: '#004620',
    fontSize: 10,
    fontWeight: 'lighter',
    lineJoin: 'round',
    strokeThickness: 1,
    stroke: '0x222222',
    wordWrap: true,
    wordWrapWidth: 180,
});

class ActionIcon extends Icon {

    constructor() {
        super(...arguments);
        this.tweens = new TweenManager();
        this._onActionActive = async () => {
            if (this.parent) {
                let icon = new Icon(this.width, this.height);
                icon.iconIndex = this.iconIndex;
                icon.x = this.x + this.width / 2;
                icon.y = this.y + this.height / 2;
                icon.anchor.set(0.5, 0.5);
                this.parent.addChild(icon);
                
                await this.tweens.tween(icon).to({
                    scale: {
                        x: 4,
                        y: 4,
                    },
                    alpha: 0
                }, 400).easing(Easing.Cubic.Out).run();
                icon.destroy({
                    children: true,
                    texture: true,
                    baseTexture: true,
                });
            }
        };

        this._label = new PIXI.Text('❌', textStyle);
        this._label.visible = false;
        this._label.anchor.set(0.5);
        this._label.position.set(this.width/2, this.height/2);
        this.addChild(this._label);
    }

    destroy(options) {
        super.destroy(options);
        if (this._action) {
            utils.ee(this._action).removeListener(_ActiveEvent, this._onActionActive);
        }
        this.tweens.destroy();
    }

    set action(v) {
        if (this._action !== v) {
            if (this._action) {
                utils.ee(this._action).removeListener(_ActiveEvent, this._onActionActive);
            }
            this._action = v;
            if (this._action) {
                utils.ee(this._action).addListener(_ActiveEvent, this._onActionActive);
            }
            this.iconIndex = this._action.item().iconIndex;
        }
    }

    get action() {
        return this._action;
    }

    update() {
        super.update();
        this._label.visible = this._action.isInterrupted();
    }
}

class EnemyState extends Sprite {
    
    /**
     * 
     * @param {Object} options
     * @param {Game_Battler} options.battler 
     * @param {Hint} options.hint 
     * @param {Sprite} options.sprite
     */
    constructor(options = {}) {
        super();

        let {battler, hint, sprite} = options;

        this.battler = battler;

        this._bar = new ColorRect();
        this._bar.color = 0x202040;
        this._bar.height = _BarSize.h + 2;
        this._bar.width = _BarSize.w + 2;
        this._bar.corner = 4;
        this._bar.y = _IconSize.h + 2;
        this.addChild(this._bar);

        this._hpBar = new ColorRect();
        this._hpBar.color = 0xff0000;
        this._hpBar.height = _BarSize.h;
        this._hpBar.width = _BarSize.w * battler.hp / battler.mhp;
        this._hpBar.x = 1;
        this._hpBar.y = _IconSize.h + 3;
        this._hpBar.corner = 4;
        this.addChild(this._hpBar);

        this._ohp = battler.hp;
        this.tweens = new TweenManager();

        this._actions = [];
        this._states = [];

        this._hint = hint;

        this.sprite = sprite;
        let rect = new ColorRect();
        sprite.onbitmap( () => {
            let bitmap = sprite.bitmap;
            bitmap.addLoadListener(() => {
                rect.width = bitmap.width;
                rect.height = bitmap.height;
                rect.color = 0x111111;
                rect.x = -bitmap.width / 2;
                rect.y = -bitmap.height;
                rect.alpha = 0;
                sprite.addChild(rect);

                this.x = -_BarSize.w / 2;
                this.y = -bitmap.height - _IconSize.h;
                sprite.addChild(this);
            });
        });
        this.rect = rect;
    }

    destroy(options) {
        super.destroy(options);
        this.tweens.destroy();
    }
    
    update() {
        super.update();

        if (this._ohp !== this.battler.hp) {
            this._hpChanged(this._ohp, this.battler.hp);
            this._ohp = this.battler.hp;
        }

        this._updateActions();
        this._updateStates();
    }

    _updateActions() {
        let actionsLength = this.battler.numActions();
        if (actionsLength < this._actions.length) {
            let actions = this._actions.splice(actionsLength, this._actions.length - actionsLength);
            for (let icon of actions) {
                icon.destroy({
                    children: true,
                    texture: true,
                    baseTexture: true,
                });
            }
        }
        for (let i = 0; i < actionsLength; ++i) {
            let actionData = this.battler.action(i);
            if (i < this._actions.length) {
                let icon = this._actions[i];
                icon.action = actionData;
            } else {
                let icon = new ActionIcon(_IconSize.w, _IconSize.h);
                this._actions.push(icon);
                icon.action = actionData;
                icon.x = i * (_IconSize.w + 2);
                icon.y = 0;
                icon.interactive = true;
                icon.addListener('mouseover', () => {
                    this._hint.text = icon.action.item().description || '_';
                    let point = icon.getGlobalPosition(new PIXI.Point(_IconSize.w/2, _IconSize.h/2));
                    this._hint.appear(point.x, point.y);
                });
                icon.addListener('mouseout', () => {
                    this._hint.disappear();
                });
                this.addChild(icon);
                
            }
        }
    }

    _updateStates() {
        let stateIcons = this.battler.stateIcons();
        if (stateIcons.length < this._states.length) {
            let states = this.this._states.splice(stateIcons.length, this._states.length - stateIcons.length);
            for (let icon of states) {
                this.removeChild(icon);
            }
        }

        for (let i = 0; i < stateIcons.length; ++i) {
            let iconIndex = stateIcons[i];
            if (i < this._states.length) {
                let action = this._states[i];
                action.iconIndex = iconIndex;
            } else {
                let action = new Icon(_IconSize.w, _IconSize.h);
                this._states.push(action);
                action.iconIndex = iconIndex;
                action.x = i * (_IconSize.w + 2);
                action.y = _IconSize.h + _BarSize.h + 4;
                this.addChild(action);
            }
        }
    }
    
    _hpChanged(ohp, nhp) {
        let tween = this.tweens.tween(this._hpBar)
            .to({width: _BarSize.w * nhp / this.battler.mhp}, 460);
        if (Math.abs(nhp / this.battler.mhp - ohp / this.battler.mhp) > 0.2) {
            tween.easing(Easing.Bounce.Out);
        } else {
            tween.easing(Easing.Cubic.Out);
        }
        tween.run();
    }

    set active(v) {
        if (this._active !== v) {
            this._active = v;
            this.rect.interactive = v;
            this._updateSprite();
        }
    }

    get active() {
        return this._active;
    }

    set highlight(v) {
        if (this._highlight !== v) {
            this._highlight = v;
            this._updateSprite();
        }
    } 

    get highlight() {
        return this._highlight && this.battler.isAlive();
    }

    get targetPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y - this.rect.height + 32,
        };
    }

    _updateSprite() {
        if (this.highlight && this.active) {
            this.sprite.setBlendColor([255, 255, 255, 64]);
        } else {
            this.sprite.setBlendColor([0, 0, 0, 0]);
        }
    }
}

class Spriteset extends Spriteset_Battle {
    createEnemies() {
        super.createEnemies();

        this._hint = new Hint();

        this._active = false;
        this._states = [];
        for (let sprite of this._enemySprites) {
            let state = new EnemyState({
                battler: sprite._battler, 
                hint: this._hint,
                sprite: sprite,
            });
            state.rect.addListener('mouseover', () => {
                if (state.battler.isDead()) return;
                this.sprites.forEach((sprite) => sprite.highlight = false);
                state.highlight = true;
            });
            state.rect.addListener('mouseout', () => {
                if (state.battler.isDead()) return;
                state.highlight = false;
            });
            state.rect.addListener('click', (e) => {
                if (state.battler.isDead()) return;
                this.point = {
                    x: e.data.global.x,
                    y: e.data.global.y,
                };
                this.emit('select', state.battler);
            });
            this._states.push(state);

            sprite.startEffect("appear");
        }

        this.addChild(this._hint);
        
        let findHighlight = (status) => {
            for (let i = 0, t = status.length; i < t; ++i) {
                let state = status[i];
                if (state.highlight) {
                    return i;
                }
            }
            return -1;
        } 
        this._onPrevClicked = () => {
            if (this.active) {
                let states = this.selectableTargets;
                if (states.length === 0) return;
                let idx = findHighlight(states);
                let state;
                let old;
                if (idx == -1) {
                    state = states[states.length - 1];
                } else {
                    let i = idx - 1;
                    if (i < 0) {
                        i = states.length - 1;
                    }
                    old = states[idx];
                    state = states[i];
                }
                if (old) old.highlight = false;
                state.highlight = true;
            }
        };
        this._onNextClicked = () => {
            if (this.active) {
                let states = this.selectableTargets;
                if (states.length === 0) return;
                let idx = findHighlight(states);
                let state;
                let old;
                if (idx == -1) {
                    state = states[0];
                } else {
                    let i = idx + 1;
                    if (i >= states.length) {
                        i = 0;
                    }
                    old = states[idx];
                    state = states[i];
                }
                if (old) old.highlight = false;
                state.highlight = true;
            }
        };
        Input.event('left').on('down', this._onPrevClicked);
        Input.event('up').on('down', this._onPrevClicked);
        Input.event('right').on('down', this._onNextClicked);
        Input.event('down').on('down', this._onNextClicked);

        this._onChecked = () => {
            if (this.active) {
                let states = this.selectableTargets;
                if (states.length === 0) return;
                let idx = findHighlight(states);
                if (idx >= 0) {
                    let state = states[idx];
                    this.point = state.targetPosition;
                    this.emit('select', state.battler);
                } else {
                    let state = states[0];
                    state.highlight = true;
                }
            }
        };
        Input.event('ok').on('down', this._onChecked);

        let height = 180;
        const _SpriteWidth = 180;
        const statusWindow = new ActorStateWindow();
        statusWindow.x = _SpriteWidth + 20;
        statusWindow.y = Graphics.boxHeight - height;
        this._battleField.addChild(statusWindow);
        this._statusWindow = statusWindow;
        
        for (let actor of statusWindow.actors) {
            actor.addListener('mouseover', () => {
                this.sprites.forEach((sprite) => sprite.highlight = false);
                actor.highlight = true;
            });
            actor.addListener('mouseout', () => {
                actor.highlight = false;
            });
            actor.addListener('click', (e) => {
                this.point = {
                    x: e.data.global.x,
                    y: e.data.global.y,
                };
                this.emit('select', actor.actor);
            });
        }
    }

    async startTargetSelection() {
        return new Promise((resolve, reject)=> {
            this.active = true;
            this.once('select', (battler) => {
                this.active = false;
                resolve(battler);
            });
        });
    }

    destroy(options) {
        super.destroy(options);
        Input.event('left').off('down', this._onPrevClicked);
        Input.event('up').off('down', this._onPrevClicked);
        Input.event('right').off('down', this._onNextClicked);
        Input.event('down').off('down', this._onNextClicked);
        Input.event('ok').off('down', this._onChecked);
    }

    get sprites() {
        return [...this._states, ...this._statusWindow.actors];
    }

    get selectableTargets() {
        let enemies = this._states.filter((state) => state.battler.isAlive());
        return [...enemies, ...this._statusWindow.actors];
    }

    set active(v) {
        if (this._active !== v) {
            for (let sprite of this.sprites) {
                sprite.active = v;
            }
            this._active = v;
        }
    }

    get active() {
        return this._active;
    }

    /**
     * 
     * @param {Game_Actor} actor
     * @param {Array<Game_Battler>} targets 
     * @param {Game_Action} action 
     */
    async startActionAnimation(actor, targets, action) {
        let animationId = action.item().animationId;
        if (animationId < 0) {
            animationId = actor.attackAnimationId1();
        }
        if (animationId === 0) return;
        this.createAnimation({
            animationId: animationId,
            targets: targets,
            mirror: false,
        });
        let sprite = this._animationSprites[this._animationSprites.length - 1];
        return utils.until(sprite, 'animtion-over');
    }

    /**
     * 
     * @param {Game_Battler} target 
     * @returns 
     */
    async displayResultText(target) {
        let result = target.result();
        if (result.hpAffected || result.mpDamage || result.tpDamage) {
            let sprite = this.findTargetSprite(target);
            if (!sprite) return;
            let resultText = new ResultText(result);
            let pox = sprite.getGlobalPosition();
            resultText.x = pox.x;
            resultText.y = pox.y - sprite.height / 2;
            this.addChild(resultText);
            let neg = Math.random() - 0.5;
            neg = neg / Math.abs(neg);
            resultText.jump({
                x: (0.5 + Math.random() * 1.5) * neg,
                y: -6 + Math.random() * 2
            }).then(()=>{
                this.removeChild(resultText);
            });
            await utils.wait(240);
            if (target.isDead()) {
                switch (target.collapseType()) {
                    case 0:
                        sprite.startEffect("collapse");
                        SoundManager.playEnemyCollapse();
                        break;
                    case 1:
                        sprite.startEffect("bossCollapse");
                        SoundManager.playBossCollapse1();
                        break;
                    case 2:
                        sprite.startEffect("instantCollapse");
                        break;
                }
            }
        }
    }

    removeAnimation(sprite) {
        super.removeAnimation(sprite);
        sprite.emit('animtion-over');
    }

    /**
     * 
     * @param {Game_Battler} target 
     */
    findTargetSprite(target) {
        if (target.isEnemy()) {
            return super.findTargetSprite(target);
        } else {
            return this._statusWindow.findTargetSprite(target);
        }
    }
}

module.exports = Spriteset;