const { Game_Battler, RPG } = require("rmmz");
const ColorRect = require("./color_rect");
const utils = require("./utils");
const RichText = require("rm-rich");

const _Size = {
    w: 240,
};
const _Padding = {
    x: 4,
    y: 4
};
let textStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fill: '#ffffff',
    stroke: '#004620',
    fontSize: 14,
    fontWeight: 'lighter',
    lineJoin: 'round',
    strokeThickness: 1,
    stroke: '0x222222',
    wordWrap: true,
    wordWrapWidth: 120,
});

let detailsStyle = textStyle.clone();
detailsStyle.wordWrapWidth = _Size.w - _Padding.x * 2;

class ItemDetails extends PIXI.Container {

    constructor() {
        super();

        this._background = new ColorRect();
        this._background.color = 0x202040;
        this._background.alpha = 0.6;
        this._background.width = _Size.w;
        this.addChild(this._background);

        this._title = new PIXI.Text('', textStyle);
        this._title.x = _Padding.x;
        this._title.y = _Padding.y;
        this.addChild(this._title);

        this._content = new PIXI.Text('', detailsStyle);
        this._content.x = _Padding.x;
        this._content.y = _Padding.y + 22;
        this.addChild(this._content);

        this._detailsLabel = new RichText('', textStyle, {
            mp: {
                fill: '#6666ff',
            },
            cd: {
                fill: '#66ff66',
            },
            tp: {
                fill: '#eeee66',
            }
        });
        this.addChild(this._detailsLabel);
    }

    /**
     * 
     * @param {RPG.Data} item 
     * @param {Game_Battler} battler 
     */
    setContent(item, battler) {
        const config = utils.noteData(item);
        this._title.text = item.name;

        this._content.text = item.description;
        let textMetrics = PIXI.TextMetrics.measureText(item.description, detailsStyle);
        this._background.height = 22 + textMetrics.height + _Padding.y * 2;

        let arr = [];
        if (config.cooldown) {
            let cd = battler.getCooldownCount(item.id);
            let cdStr;
            if (cd) {
                cdStr = `(${cd})`;
            } else {
                cdStr = '';
            }
            arr.push(`<cd>CD:${config.cooldown}${cdStr}</cd>`);
        }
        if (item.mpCost) {
            arr.push(`<mp>MP:${item.mpCost}</mp>`);
        } 
        if (item.tpCost) {
            arr.push(`<tp>TP:${item.tpCost}</tp>`);
        }
        this._detailsLabel.text = arr.join('  ');
        this._detailsLabel.x = _Size.w - this._detailsLabel.width - _Padding.x;
        this._detailsLabel.y = _Padding.y;

    }
}

module.exports = ItemDetails;