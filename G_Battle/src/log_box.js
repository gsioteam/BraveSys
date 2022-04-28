const Scroller = require("./scoller");
const TweenManager = require("./tween_manager");
const RichText = require('rm-rich');
const { Game_Actor, Game_Battler, DataManager, RPG, TextManager, Game_Enemy, Game_Action } = require("rmmz");

class LogBox extends PIXI.Container {

    /**
     * 
     * @param {Object} options 
     * @param {number} options.width
     * @param {number} options.height
     */
    constructor(options) {
        super();

        this.inner = new LogBoxInner({
            width: options.width - 20,
            height: options.height - 20
        });
        this.inner.x = 10;
        this.inner.y = 10;
        this.addChild(this.inner);

        this.interactive = true;

        this.tweens = new TweenManager();

        this._mouseOver = false;
        this.addListener('mouseover', ()=> {
            this.appear();
            this._mouseOver = true;
        });
        this.addListener('mouseout', ()=>{
            this._mouseOver = false;
            this.countToDismiss();
        });
    }

    destroy(options) {
        super.destroy(options);
        this.tweens.destroy();
    }
 
    add(text) {
        if (!text) return;
        this.inner.add(text);

        this.appear();
        this.countToDismiss();
    }

    appear() {
        this.tweens.tween(this).to({
            alpha: 1,
        }, 300).run();
    }

    countToDismiss() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._mouseOver) return;
        this._timer = setTimeout(()=>{
            this.dismiss();
        }, 3000);
    }

    dismiss() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._mouseOver) return;
        this.tweens.tween(this).to({
            alpha: 0,
        }, 300).run();
    }

    /**
     * 
     * @param {Game_Actor} subject 
     * @param {Game_Action} action 
     */
    displayAction(subject, action) {
        const item = action.item();
        if (DataManager.isSkill(item)) {
            this.add(item.message1.format(this._battler(subject), this._item(item)));
            this.add(item.message2.format(this._battler(subject), this._item(item)));
        } else {
            this.add(TextManager.useItem.format(this._battler(subject), this._item(item)));
        }
    }

    /**
     * 
     * @param {Game_Battler} subject 
     * @param {Game_Battler} target 
     */
    displayResult(subject, target) {
        let result = target.result();
        if (result.used) {
            if (result.critical) {
                if (target.isActor()) {
                    this.add(TextManager.criticalToActor);
                } else {
                    this.add(TextManager.criticalToEnemy);
                }
            }
            if (result.missed) {
                if (result.physical) {
                    const isActor = target.isActor();
                    let fmt = isActor ? TextManager.actorNoHit : TextManager.enemyNoHit;
                    target.performMiss();
                    this.add(fmt.format(this._battler(target)));
                } else {
                    this.add(TextManager.actionFailure.format(this._battler(target)));
                }
            } else if (result.evaded) {
                let fmt;
                if (result.physical) {
                    fmt = TextManager.evasion;
                    target.performEvasion();
                } else {
                    fmt = TextManager.magicEvasion;
                    target.performMagicEvasion();
                }
                this.add(fmt.format(this._battler(target)));
            } else {
                if (result.hpAffected) {
                    let damage = result.hpDamage;
                    if (damage > 0 && !result.drain) {
                        target.performDamage();
                    } else if (damage < 0) {
                        target.performRecovery();
                    }
                    const isActor = target.isActor();
                    let fmt;
                    if (damage > 0 && result.drain) {
                        fmt = isActor ? TextManager.actorDrain : TextManager.enemyDrain;
                        this.add(fmt.format(this._battler(target), TextManager.hp, this._tag('dmg', damage)));
                    } else if (damage > 0) {
                        fmt = isActor ? TextManager.actorDamage : TextManager.enemyDamage;
                        this.add(fmt.format(this._battler(target), this._tag('dmg', damage)));
                    } else if (damage < 0) {
                        fmt = isActor ? TextManager.actorRecovery : TextManager.enemyRecovery;
                        this.add(fmt.format(this._battler(target), TextManager.hp, this._tag('heal', -damage)));
                    } else {
                        fmt = isActor ? TextManager.actorNoDamage : TextManager.enemyNoDamage;
                        this.add(fmt.format(this._battler(target)));
                    }
                }
                if (target.isAlive() && result.mpDamage !== 0) {
                    if (result.mpDamage < 0) {
                        target.performRecovery();
                    }
                    const damage = result.mpDamage;
                    const isActor = target.isActor();
                    let fmt;
                    if (damage > 0 && result.drain) {
                        fmt = isActor ? TextManager.actorDrain : TextManager.enemyDrain;
                        this.add(fmt.format(this._battler(target), TextManager.mp, this._tag('mp', damage)));
                    } else if (damage > 0) {
                        fmt = isActor ? TextManager.actorLoss : TextManager.enemyLoss;
                        this.add(fmt.format(this._battler(target), TextManager.mp, this._tag('mp', damage)));
                    } else if (damage < 0) {
                        fmt = isActor ? TextManager.actorRecovery : TextManager.enemyRecovery;
                        this.add(fmt.format(this._battler(target), TextManager.mp, this._tag('mp', -damage)));
                    } else {
                    }
                }
                if (target.isAlive() && result.tpDamage !== 0) {
                    if (result.tpDamage < 0) {
                        target.performRecovery();
                    }

                    const damage = result.tpDamage;
                    const isActor = target.isActor();
                    let fmt;
                    if (damage > 0) {
                        fmt = isActor ? TextManager.actorLoss : TextManager.enemyLoss;
                        this.add(fmt.format(this._battler(target), TextManager.tp, this._tag('tp', damage)));
                    } else if (damage < 0) {
                        fmt = isActor ? TextManager.actorGain : TextManager.enemyGain;
                        this.add(fmt.format(this._battler(target), TextManager.tp, this._tag('tp', -damage)));
                    } else {
                    }
                }
            }
        }
    }

    /**
     * 
     * @param {Game_Battler} target 
     * @param {boolean} current 
     */
    displayBattlerStatus(target, current) {
        const result = target.result();
        if (result.isStatusAffected()) {
            let states = result.addedStateObjects();
            for (const state of states) {
                const stateText = target.isActor() ? state.message1 : state.message2;
                if (state.id === target.deathStateId()) {
                    target.performCollapse();
                }
                if (stateText) {
                    this.add(stateText.format(this._battler(target)));
                }
            }
            states = result.removedStateObjects();
            for (const state of states) {
                if (state.message4) {
                    this.add(state.message4.format(this._battler(target)));
                }
            }
        }

        if (current) {
            const stateText = target.mostImportantStateText();
            if (stateText) {
                this.add(stateText.format(this._battler(target)));
            }
        }
        // if (target.shouldPopupDamage()) {
        //     target.startDamagePopup();
        // }
    }

    /**
     * 
     * @param {Game_Battler} battler 
     */
    _battler(battler) {
        return battler.isActor() ? this._ally(battler) : this._enemy(battler);
    }

    /**
     * 
     * @param {Game_Actor} actor 
     */
    _ally(actor) {
        return `<ally>${actor.name()}</ally>`;
    }

    /**
     * 
     * @param {Game_Enemy} actor 
     */
    _enemy(actor) {
        return `<enemy>${actor.name()}</enemy>`;
    }

    /**
     * 
     * @param {RPG.DataItemBase} item 
     */
    _item(item) {
        return `<item>${item.name}</item>`;
    }

    _tag(tag, hp) {
        return `<${tag}>${hp}</${tag}>`;
    }
}

class LogBoxInner extends Scroller {

    /**
     * 
     * @param {Object} options 
     * @param {number} options.width
     * @param {number} options.height
     */
    constructor(options) {
        super(options);

        this.textStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fill: ['#ffffff'],
            stroke: '#004620',
            fontSize: 16,
            fontWeight: 'lighter',
            lineJoin: 'round',
            strokeThickness: 2,
            stroke: '0x222222',
            wordWrap: true,
            wordWrapWidth: options.width,
        });
        this.tagStyles = {
            ally: {
                fill: "#ffc400",
                fontSize: 18,
            },
            enemy: {
                fill: "#b50e0e",
                fontSize: 18,
            },
            dmg: {
                fill: "#ff0000"
            },
            heal: {
                fill: "#00ff00"
            },
            mp: {
                fill: "#0000ff"
            },
            item: {
                fill: '#a8a8a8'
            },
            tp: {
                fill: '#00c900'
            }
        };

        this.offset = 0;
        this.content.y = options.height;
    }

    add(text) {
        const label = new RichText(text, this.textStyle, this.tagStyles);
        label.x = 0;
        label.y = this.offset;
        this.offset += label.height;
        this.content.addChild(label);

        this.scrollTo(0, this.offset - this.height);
    }
}

module.exports = LogBox;