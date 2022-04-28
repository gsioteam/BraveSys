
const EventEmitter = require('events');
const { RPG, Game_Action, Game_Battler } = require('rmmz');

class BattleEvent extends EventEmitter {
    
    /**
     * 
     * @param {Object} options
     * @param {number} options.commonEventId 
     * @param {Game_Battler} options.target
     * @param {Game_Action} options.action
     */
    constructor(options) {
        super();
        const commonEventId = options.commonEventId;
        this.target = options.target;
        this.action = options.action;
        const { $dataCommonEvents } = require('rmmz');

        let commandEvent = $dataCommonEvents[commonEventId];

        this._interpreter = new Game_Interpreter();
        this._interpreter.setup(commandEvent.list);
    }

    update() {
        this._interpreter.update();
        if (!this.isActive()) {
            this.emit('finished');
        }
    }

    isActive() {
        return this._interpreter.isRunning();
    }

    get stateData() {
        return {
            target: this.target,
            action: this.action,
        };
    }
}

module.exports = BattleEvent;