const { Sprite, ImageManager, Bitmap } = require("rmmz");


function _loadBitmap(iconIndex, w, h) {
    if (!iconIndex) return null;
    const bitmap = ImageManager.loadSystem("IconSet");
    const pw = ImageManager.iconWidth;
    const ph = ImageManager.iconHeight;
    const sx = (iconIndex % 16) * pw;
    const sy = Math.floor(iconIndex / 16) * ph;
    let iconBitmap = new Bitmap(w, h);
    iconBitmap.blt(bitmap, sx, sy, pw, ph, 0, 0, w, h);
    return iconBitmap;
}

class Icon extends Sprite {
    constructor(w, h) {
        super(null);
        this.width = w;
        this.height = h;
    }

    set iconIndex(v) {
        if (this._iconIndex !== v) {
            this._iconIndex = v;
            this.bitmap = _loadBitmap(v, this.width, this.height);
        }
    }

    get iconIndex() {
        return this._iconIndex;
    }

}

module.exports = Icon;