const { Game_Battler, Game_Action, Game_Enemy } = require("rmmz");
const utils = require("./utils");

class BattlerController {
    /**
     * 
     * @param {Game_Battler} battler 
     */
    constructor(battler) {
        this.battler = battler;
    }

    onTurnStart() {}

    onTurnEnd() {}

    /**
     * 
     * @param {Game_Action} action 
     */
    onActed(action) {}

    onCast(action, targets) {}

    onDead() {}
}

class EnemyController extends BattlerController {
    
    onTurnStart() {
        if (this.battler.isAlive())
            this.battler.makeActions();
    }
}

class PatternController extends EnemyController {

    /**
     * 
     * @param {Game_Enemy} battler 
     */
    constructor(battler) {
        super(battler);

        this.config = utils.noteData(battler.enemy());
        this._turnCount = this.config.begin_turn || 0;
    }

    onTurnStart() {
        let pattern = this.config.actions;
        let actions = pattern[this._turnCount % pattern.length];
        this._turnCount++;

        if (Array.isArray(actions)) {
            for (let actionId of actions) {
                let action = new Game_Action(this.battler, false);
                action.setSkill(actionId);
                this.battler.pushAction(action); 
            }
        } else {
            super.onTurnStart();
        }
    }
}

module.exports = {
    BattlerController,
    EnemyController,
    PatternController,
};