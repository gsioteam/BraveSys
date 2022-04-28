const { Game_Actor, TextManager, Graphics, Game_Battler, RPG, Game_Action } = require("rmmz");
const Pager = require("./pager");
const List = require('./list');
const Button = require("./button");
const { Easing } = require("@tweenjs/tween.js");
const Input = require('./input');
const utils = require("./utils");
const Icon = require("./icon");

const _Size = {
    w: 120,
    h: 99
}

const CommandType = {
    Cancel: 0,
    Attack: 1,
    Guard: 2,
    Skip: 3,
    Skill: 4,
}

class Command {
    /**
     * 
     * @param {Object} options 
     * @param {number} options.type
     * @param {*} options.data
     */
    constructor({type, data}) {
        this.type = type;
        this.data = data;
    }
}

class SkillButton extends Button {

    /**
     * 
     * @param {Game_Action} action 
     */
    constructor(action) {
        let icon = new Icon(16, 16);
        let skill = action.item();
        icon.iconIndex = skill.iconIndex;
        super(80, 32, {
            text: skill.name,
            icon: icon,
            enable: action.subject().canUse(skill)
        });
    }
}

class ActionMenu extends Pager {
    /**
     * 
     * @param {Game_Actor} actor 
     * @param {Game_Battler} battler 
     */
    constructor(actor, battler) {
        let isDead = battler.isDead();
        let isEnemy = battler.isEnemy();
        let skills = actor.skills();
        let actions = skills.map((skill)=>{
            let action = new Game_Action(actor);
            action.setSkill(skill.id);
            return action;
        }).filter((action) => {
            if (isEnemy) {
                return action.isForOpponent();
            } else {
                if (isDead) {
                    return action.isForDeadFriend();
                }
                return action.isForFriend();
            }
        });
        let attackButton = new Button(80, 32, {
            text: TextManager.attack,
        });
        let skillButton = new Button(80, 32, {
            text: TextManager.skill,
        });
        let guardButton = new Button(80, 32, {
            text: TextManager.guard,
        });
        let skipButton = new Button(80, 32, {
            text: 'Skip',
        });

        let items = [
        ];
        if (isEnemy) {
            items.push(attackButton);
        } else {
            items.push(guardButton);
        }
        if (actions.length > 0) {
            items.push(skillButton);
        }
        items.push(skipButton);

        let list = new List({
            width: _Size.w,
            height: _Size.h,
            items: items
        });

        super(list);

        this._attackActions = actions;
        this._actor = actor;
        this._battler = battler;

        this.width = _Size.w;
        this.height = 0;

        attackButton.addListener('check', ()=>this._onAttack());
        skillButton.addListener('check', ()=>this._onSkill());
        guardButton.addListener('check', ()=>this._onGuard());
        skipButton.addListener('check', ()=>this._onSkip());
        
        this.active = false;

        Input.event('cancel').on('down', ()=>this._onCancel());
    }

    destroy(options) {
        this.emit('dismiss-details');
        super.destroy(options);
        Input.event('cancel').off('down', ()=>this._onCancel());
    }
    
    _onAttack() {
        this.emit('select', new Command({
            type: CommandType.Attack,
        }));
    }

    _onSkill() {
        let items = [];
        for (let action of this._attackActions) {
            let button = new SkillButton(action);
            button.on("check", () => {
                this.emit('select', new Command({
                    type: CommandType.Skill,
                    data: action.item(),
                }));
            });
            items.push(button);
        }
        let list = new List({
            width: _Size.w,
            height: _Size.h,
            items: items
        });
        let selectIndex = (idx) => {
            this.emit('details', this._attackActions[idx].item(), list.items[idx]);
        };
        list.on("highlight", selectIndex);
        this.push(list);
        selectIndex(0);
    }

    _onGuard() {
        this.emit('select', new Command({
            type: CommandType.Guard,
        }));
    }

    async _onCancel() {
        if (this.stack.length <= 1) {
            this.emit('select', new Command({
                type: CommandType.Cancel,
            }));
        } else {
            let child = await this.pop();
            child.destroy({
                children: true,
                texture: true,
                baseTexture: true,
            });
            this.emit('dismiss-details');
        }
    }

    _onSkip() {
        this.emit('select', new Command({
            type: CommandType.Skip,
        }));
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {Promise<Command>}
     */
    async startSelection(x, y, details) {
        this.active = true;
        this.show(x, y);
        if (details) {
            details.x = this.x + this.width;
            details.y = this.y;
        }
        let command = await utils.until(this, 'select');
        await this.miss();
        return command;
    }
    
    async show(x, y) {
        this.x = x - this.width / 2;
        this.y = Math.min(y - 16, Graphics.height - _Size.h);
        await this.tweens.tween(this).to({
            height: _Size.h
        }, 300).easing(Easing.Cubic.Out).run();
    }

    async miss() {
        await this.tweens.tween(this).to({
            height: 0
        }, 300).easing(Easing.Cubic.Out).run();
        this.parent.removeChild(this);
    }
}

ActionMenu.Command = CommandType;

module.exports = ActionMenu;