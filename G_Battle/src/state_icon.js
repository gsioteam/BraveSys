const Icon = require("./icon");
const {RPG, Game_Actor, Game_Battler, Graphics} = require('rmmz');
const Hint = require("./hint");
const utils = require("./utils");

const IconType = {
    Icon: 0,
    State: 1,
};

const textStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fill: ['#ffffff'],
    stroke: '#004620',
    fontSize: 10,
    fontWeight: 'lighter',
    lineJoin: 'round',
    strokeThickness: 2,
    stroke: '0x222222',
    wordWrap: true,
    wordWrapWidth: 180,
});

class StateIcon extends Icon {
    constructor() {
        super(24, 24);

        this._label = new PIXI.Text('', textStyle);
        this.addChild(this._label);
        this._label.visible = false;
        this._label.anchor.set(1, 1);
        this._label.x = 23;
        this._label.y = 23;

        this._update = ()=> this._onUpdate();
        Graphics.app.ticker.add(this._update);
    }

    destroy(options) {
        super.destroy(options);
        Graphics.app.ticker.remove(this._update);
    }

    /**
     * 
     * @param {Object} options
     * @param {IconType} options.type
     * @param {number} options.iconIndex
     * @param {RPG.DataState} options.state
     * @param {Game_Battler} options.battler
     */
    setData(options) {
        this.options = options;
        switch (options.type) {
            case IconType.Icon: {
                this.iconIndex = options.iconIndex;
                break;
            }
            case IconType.State: {
                this.iconIndex = options.state.iconIndex;
                break;
            }
        }
    }

    _onUpdate() {
        const { state, battler } = this.options;
        const { maxstacks } = utils.noteData(state);
        if (maxstacks > 1) {
            this._label.text = Math.round(battler.stacks(state.id)).toString();
            this._label.visible = true;
        } else {
            this._label.visible = false;
        }
    }
}

StateIcon.Type = IconType;

module.exports = StateIcon;