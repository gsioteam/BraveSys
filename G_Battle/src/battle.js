const { Game_Action, BattleManager, 
    Scene_Base, Rectangle, Graphics, 
    Window_BattleStatus, Game_Battler,
    Game_Actor, ImageManager, Window_BattleLog, 
    Sprite_AnimationMV, Sprite_Animation, Sprite,
    Game_Enemy, SceneManager, Scene_Gameover, PluginManager, 
    Scene_Map,
} = require("rmmz");
const utils = require('./utils');
const TweenManager = require('./tween_manager');
const { Easing } = require("@tweenjs/tween.js");
const Spriteset = require('./spriteset');
const List = require("./list");
const Button = require("./button");
const ActionMenu = require("./action_menu");
const ActorStatus = require("./actor_status");
const LogBox = require('./log_box');
const ActorStateWindow = require("./actor_state_window");
require('./pixi-mousewheel');
const createAnimation = require('./event_animation');
const BattleEvent = require("./battle_event");
const YAML = require('js-yaml');
const EventEmitter = require("events");
const package = require('../package.json');
const { BattlerController, EnemyController, PatternController } = require('./battler_controller');
const ItemDetails = require("./item_details");

/**
 * 
 * @param {Game_Action} action 
 */
Game_Battler.prototype.pushAction = function(action) {
    this._actions.push(action);
};

/**
 * 
 * @param {*} damage 
 * @param {Game_Battler} target 
 * @returns 
 */
Game_Action.prototype.applyGuard = function (damage, target) {
    let guardRate = target.states().reduce((value, current) => {
        const config = utils.noteData(current);
        if (config.dmgReduction) {
            value += target.stacks(current.id) * config.dmgReduction;
        }
        return value;
    }, 0);
    return damage * Math.max(0, (1 - (guardRate / 100)));
};

const _Random = 'random';
const _RandomPattern = [_Random];
const _battlerScripts = {};

class BattleScene extends Scene_Base {

    create() {
        super.create();
        this.tweens = new TweenManager();

        this._spriteset = new Spriteset();
        this.addChild(this._spriteset);
        
        this.createWindowLayer();

        this._logBox = new LogBox({
            width: Graphics.boxWidth,
            height: Scene_Base.prototype.calcWindowHeight(3, false)
        });
        this.addChild(this._logBox);

        this._actorStatus = new ActorStatus();
        this.addChild(this._actorStatus);

        this._observer = null;

        this._itemDetails = new ItemDetails();
        this._itemDetails.visible = false;
        this.addChild(this._itemDetails);
    }

    stop() {
        super.stop();
        this.tweens.destroy();
    }

    async start() {
        super.start();
        BattleManager.playBattleBgm();
        BattleManager.startBattle();

        await this.fadeIn(this.fadeSpeed(), false);

        const {$gameParty, $gameTroop} = require('rmmz');

        let enemies = $gameTroop.members();
        let members = $gameParty.members();

        for (let enemy of enemies) {
            let data = enemy.enemy();
            let config = utils.noteData(data);
            let Class = _battlerScripts[config.script];
            if (Class) {
                enemy._ai = new Class(enemy);
            } else {
                enemy._ai = new EnemyController(enemy);
            }
        }
        for (let actor of members) {
            let data = actor.actor();
            let config = utils.noteData(data);
            let Class = _battlerScripts[config.script];
            if (Class) {
                actor._ai = new Class(actor);
            } else {
                actor._ai = new BattlerController(actor);
            }
        }

        while (true) {

            $gameTroop.increaseTurn();
            for (let enemy of enemies) {
                if (enemy.isAlive()) {
                    enemy.gainTp(100);
                }
                enemy._ai.onTurnStart();
            }
            for (let actor of members) {
                if (actor.isAlive()) {
                    actor.gainTp(20);
                }
                actor._ai.onTurnStart();
            }

            for (let index = 0, t = members.length; index < t; ++index) {
                let actor = members[index];
                actor.clearActions();

                if (!actor.isAlive()) continue;
                await this._actorStatus.show(actor);

                if (actor.canMove()) {
                    while (true) {
                        let target = await this._spriteset.startTargetSelection();
                        let menu = new ActionMenu(actor, target);
                        menu.x = 60;
                        menu.y = 60;
                        let point = this._spriteset.point;
                        this.addChild(menu);
                        menu.on('details', (item, button) => {
                            this._itemDetails.visible = true;
                            this._itemDetails.setContent(item, actor);
                            let pos = button.getGlobalPosition();
                            if (menu.x > Graphics.width / 2) {
                                this._itemDetails.x = menu.x - this._itemDetails.width  - 2;
                            } else {
                                this._itemDetails.x = menu.x + menu.width + 2;
                            }
                            this._itemDetails.y = Math.min(pos.y, Graphics.height - button.height);
                        });
                        menu.on('dismiss-details', () => {
                            this._itemDetails.visible = false;
                        });
                        let command = await menu.startSelection(point.x, point.y, this._itemDetails);
                        menu.destroy();
                        let action;
                        let targets;
                        switch (command.type) {
                            case ActionMenu.Command.Cancel: {
                                break;
                            }
                            case ActionMenu.Command.Attack: {
                                action = new Game_Action(actor);
                                action.setAttack();
                                action.setTarget(target.index());
                                break;
                            }
                            case ActionMenu.Command.Guard: {
                                action = new Game_Action(actor);
                                action.setGuard();
                                break;
                            }
                            case ActionMenu.Command.Skill: {
                                action = new Game_Action(actor);
                                action.setSkill(command.data.id);
                                action.setTarget(target.index());
                                break;
                            }
                        }
    
                        if (action) {
                            let item = action.item();
                            if (actor.canUse(item)) {
                                actor.useItem(item);
                                targets = action.makeTargets();
                                actor._ai.onCast(action, targets);
                                this._spriteset.startActionAnimation(actor, targets, action);
                                this._logBox.displayAction(actor, action);
                                for (let target of targets) {
                                    action.apply(target);
                                    target._ai.onActed(action);
                                    this._logBox.displayResult(actor, target);
                                    this._logBox.displayBattlerStatus(target, false);
                                    this._spriteset.displayResultText(target);

                                    if (target.isDead()) {
                                        target._ai.onDead();
                                    }
                                }

                                $gameTroop.battleStatus = {
                                    targets,
                                    action,
                                    battleScene: this,
                                };
                                action.applyGlobal();
                                await this.waitForAction();
                                $gameTroop.battleStatus = null;
                            }

                            if ($gameTroop.isAllDead()) {
                                this._terminate();
                                BattleManager.processVictory();
                                await utils.wait(200);
                                BattleManager.updateBattleEnd();
                                return;
                            }
                        }
    
                        if (actor.tp < 10 || command.type === ActionMenu.Command.Skip) {
                            // Next
                            break;
                        }
                    }
                    actor.onAllActionsEnd();
                }

                await this._actorStatus.miss();

            }

            let aliveEnemies = $gameTroop.aliveMembers();
            for (let enemy of aliveEnemies) {
                let action;
                while ((action = enemy.currentAction()) != null) {
                    if (!action.isInterrupted()) {
                        let targets = action.makeTargets();
                        enemy._ai.onCast(action, targets);
                        let item = action.item();
                        if (enemy.canUse(item)) {
                            this._logBox.displayAction(enemy, action);
                            for (let target of targets) {
                                enemy.useItem(item);
                                action.apply(target);
                                target._ai.onActed(action);
                                utils.ee(action).emit('active');
                                SoundManager.playEnemyAttack();
                                this._logBox.displayResult(enemy, target);
                                this._logBox.displayBattlerStatus(target, false);
                                this.startEnemyAttackAnimation(target);

                                if (target.isDead()) {
                                    target._ai.onDead();
                                }
                                await utils.wait(200);
                            }
                            $gameTroop.battleStatus = {
                                targets,
                                action,
                                battleScene: this,
                            };
                            action.applyGlobal();
                            await this.waitForAction();
                            $gameTroop.battleStatus = null;
                        }
                    }
                    enemy.removeCurrentAction();
                }
                enemy.onAllActionsEnd();
                if ($gameParty.isAllDead()) {
                    this._terminate();
                    BattleManager.processDefeat();
                    await utils.wait(500);
                    BattleManager.updateBattleEnd();
                    return;
                }
                await utils.wait(200);
            }
            
            for (let enemy of enemies) {
                enemy.onTurnEnd();
                enemy._ai.onTurnEnd();
            }
            for (let actor of members) {
                actor.onTurnEnd();
                if (actor.isAlive()) {
                    this._logBox.displayBattlerStatus(actor, true);
                }
                actor._ai.onTurnEnd();
            }
            await utils.wait(500);

        }
    }

    _terminate() {
        $gameParty.onBattleEnd();
        $gameTroop.onBattleEnd();
        AudioManager.stopMe();
        if (this.shouldAutosave()) {
            this.requestAutosave();
        }
    }
    shouldAutosave() {
        return SceneManager.isNextScene(Scene_Map);
    };

    update() {
        $gameTroop.updateInterpreter();
        const active = this.isActive();
        $gameTimer.update(active);
        $gameScreen.update();
        super.update();
        if (this._currentCommand) {
            this._currentCommand.update();
        }

        if (this._observer !== null) {
            if (!$gameTroop.isEventRunning()) {
                this._observer.emit('finished');
            }
        }
    }

    fadeIn(duration, white) {
        super.startFadeIn(duration, white);
        return utils.wait(duration);
    }

    fadeOut(duration, white) {
        super.startFadeOut(duration, white);
        return utils.wait(duration);
    }

    async startEnemyAttackAnimation(target) {
        const {$gameParty, $dataAnimations} = require('rmmz');
        let sprite = this._spriteset.findTargetSprite(target);
        let animation = $dataAnimations[1];
        let animationSprite = createAnimation(animation, [sprite]);
        this.addChild(animationSprite);
        await utils.until(animationSprite, 'complete');
        animationSprite.destroy({
            children: true,
            texture: true,
            baseTexture: true,
        });
    }

    async waitForAction() {
        const {$gameTroop, $gameTemp} = require('rmmz');
        if ($gameTemp.isCommonEventReserved()) {
            $gameTroop.setupBattleEvent();
            this._observer = new EventEmitter();
            await utils.until(this._observer, 'finished');
            this._observer = null;
        }
    }

    static registerAIScript(name, Class) {
        _battlerScripts[name] = Class;
    }
}

Game_Battler.prototype.initTp = function() {
    this.setTp(0);
};

Game_Battler.prototype.chargeTpByDamage = function() {
};

const _Game_Battler_canUse = Game_Battler.prototype.canUse;
/**
 * 
 * @param {RPG.DataItemBase} data 
 * @param {Object|null} options
 * @param {Game_Action} options.action
 * @param {Game_Battler} options.target
 * @returns {boolean}
 */
Game_Battler.prototype.canUse = function (item, options) {
    const config = utils.noteData(item);
    let cooldown = this.getCooldownCount(item.id);
    if (cooldown > 0) {
        return false;
    }

    if (typeof config.canUse === 'string' && options !== null) {
        let formula = utils.formula(config.canUse, ['a', 'b', 'item', 'config']);
        let ret = formula({
            a: options.action.subject(),
            b: options.target,
            item: item,
            config: config,
        });
        if (!ret) return false;
    }
    return _Game_Battler_canUse.call(this, ...arguments);
};

const _Game_Battler_useItem = Game_Battler.prototype.useItem;
/**
 * 
 * @param {RPG.DataConsumable} item 
 */
Game_Battler.prototype.useItem = function (item) {
    const config = utils.noteData(item);
    if (typeof config.cooldown === 'number') {
        if (!this._cooldownMap) {
            this._cooldownMap = {};
        }
        this._cooldownMap[item.id] = config.cooldown;
    }
    _Game_Battler_useItem.call(this, ...arguments);
};

Game_Battler.prototype.getCooldownCount = function(itemId) {
    let cooldown = 0;
    if (this._cooldownMap) {
        cooldown = this._cooldownMap[itemId] || 0;
    }
    return cooldown;
}

const _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
Game_Battler.prototype.onTurnEnd = function() {
    _Game_Battler_onTurnEnd.call(this);
    if (this._cooldownMap) {
        for (let id in this._cooldownMap) {
            let cooldown = this._cooldownMap[id];
            if (cooldown > 0) {
                this._cooldownMap[id] = cooldown - 1;
            }
        }
    }
};

let _Video_updateVisibility = Video._updateVisibility;
Video._updateVisibility = function (videoVisible) {
    _Video_updateVisibility.call(this, videoVisible);
    if (videoVisible) {
        this._element.style.removeProperty('pointerEvents');
    } else {
        this._element.style.pointerEvents = 'none';
    }
}

let _Video_createElement = Video._createElement;
Video._createElement = function () {
    _Video_createElement.call(this);
    this._element.style.pointerEvents = 'none';
};

let _Graphics_createErrorPrinter = Graphics._createErrorPrinter;
Graphics._createErrorPrinter = function () {
    _Graphics_createErrorPrinter.call(this);
    this._errorPrinter.style.pointerEvents = 'none';
};

const _Game_Battler_addState = Game_Battler.prototype.addState;
Game_Battler.prototype.addState = function (stateId, stacks, actor) {
    _Game_Battler_addState.call(this, stateId);
    stacks = stacks || 1;
    
    const { $dataStates } = require('rmmz');
    let state = $dataStates[stateId];
    if (!state) return;
    if (!state._config) {
        state._config = YAML.load(state.node);
        if (!state._config) state._config = {};
    }
    const config = utils.noteData(state);
    let maxstacks = config.maxstacks;
    if (!maxstacks) maxstacks = 1;
    let formula;
    if (typeof config.stacks === 'string') {
        formula = utils.formula(config.stacks, ['a', 'b', 'stacks', 'state', 'stateId', 'config']);
    }
    let params = {
        stacks,
        stateId,
        state,
        config
    };
    let stacksNum = stacks;
    if (formula) {
        params.a = actor;
        params.b = this;
        try {
            stacksNum = formula(params);
        } catch (e) {
            console.error(e);
        }
    }

    if (!this._stateStacks) {
        this._stateStacks = {};
    }

    let num = this._stateStacks[stateId];
    if (typeof num !== 'number') {
        num = 0;
    }
    this._stateStacks[stateId] = Math.min(num + stacksNum, maxstacks);
};

const _Game_Battler_removeState = Game_Battler.prototype.removeState;
Game_Battler.prototype.removeState = function(stateId) {
    _Game_Battler_removeState.call(this, stateId);
    if (this._stateStacks) {
        delete this._stateStacks[stateId];
    }
};

Game_Battler.prototype.stacks = function(stateId) {
    if (this._stateStacks) {
        let num = this._stateStacks[stateId];
        if (typeof num === 'number') {
            return num;
        }
    }
    return this.isStateAffected(stateId) ? 1 : 0;
};
Game_Action.prototype.isInterrupted = function () {
    return !!this._interrupted;
};

// Commands
PluginManager.registerCommand(package.name, "addState", ({stacks, stateId})=>{
    if ( $gameTroop.battleStatus ) {
        const { $dataStates } = require('rmmz');
        const { targets, action } = $gameTroop.battleStatus;
        const actor = action.subject();
        const state = $dataStates[stateId];
        if (!state) return;
        if (typeof stacks === 'string') {
            stacks = parseInt(stacks);
        }
        if (typeof stateId === 'string') {
            stateId = parseInt(stateId);
        }

        const config = utils.noteData(state);
        for (let target of targets) {
            target.addState(stateId, stacks, actor);
        }
    }
});
PluginManager.registerCommand(package.name, 'taunt', () => {
    if ( $gameTroop.battleStatus ) {
        const { targets, action } = $gameTroop.battleStatus;
        const actor = action.subject();
        for (const target of targets) {
            for (let i = 0, t = target.numActions(); i < t; ++i) {
                const enemyAction = target.action(i);
                enemyAction.setTarget(actor.index());
            }
        }
    }
});
PluginManager.registerCommand(package.name, 'interrupt', ({ successRate, successMsg, failMsg }) => {
    if ( $gameTroop.battleStatus ) {
        const { targets, action, battleScene } = $gameTroop.battleStatus;
        if (typeof successRate === 'string') successRate = parseFloat(successRate);

        for (const target of targets) {
            let activeActions = [];
            for (let i = 0, t = target.numActions(); i < t; ++i) {
                const enemyAction = target.action(i);
                if (!enemyAction._interrupted) {
                    activeActions.push(enemyAction);
                }
            }
            if (Math.random() < successRate) {
                if (activeActions.length > 0) {
                    let enemyAction = activeActions[Math.floor(Math.random() * activeActions.length)];
                    enemyAction._interrupted = true;
                }
                battleScene._logBox.add('<heal>Success!</heal>');
            } else {
                battleScene._logBox.add('<dmg>Failed!</dmg>');
            }
        }
    }
});

module.exports = BattleScene;


BattleScene.registerAIScript('pattern', PatternController);