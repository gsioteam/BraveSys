
const Scroller = require('./scoller');
const Input = require('./input');

class List extends Scroller {

    /**
     * 
     * @param {Object} options
     * @param {number} options.width
     * @param {number} options.height
     * @param {Array} options.items
     */
    constructor(options) {
        super(options);

        this._items = options.items;

        let offset = 0;

        for (let idx = 0; idx < this._items.length; ++idx) {
            let child = this._items[idx];
            child.x = 0;
            child.y = offset;
            child.width = options.width;
            offset += child.height + 1;
            this.content.addChild(child);

            child.addListener('mouseover', () => {
                this.highlight = idx;
            });
        }

        this._onUpPressed = ()=> {
            if (this.type === Scroller.TYPE_VERTICAL) {
                if (this.highlight === -1) {
                    this.highlight = this._items.length - 1;
                } else {
                    if (this.highlight > 0) {
                        this.highlight -= 1;
                    } else {
                        this.highlight = this._items.length - 1;
                    }
                }
                this.show(this.highlight);
            }
        };
        this._onDownPressed = ()=> {
            if (this.type === Scroller.TYPE_VERTICAL) {
                if (this.highlight === -1) {
                    this.highlight = 0;
                } else {
                    if (this.highlight < this._items.length - 1) {
                        this.highlight += 1;
                    } else {
                        this.highlight = 0;
                    }
                }
                this.show(this.highlight);
            }
        };

        this.active = true;
        this.highlight = 0;
    }

    set active(v) {
        if (this._active !== v) {
            this._active = v;

            if (v) {
                this._changeSelect(-1, this._highlight);
                Input.event("up").on('down', this._onUpPressed);
                Input.event("down").on("down", this._onDownPressed);
            } else {
                this._changeSelect(this._highlight, -1);
                Input.event("up").off('down', this._onUpPressed);
                Input.event("down").off("down", this._onDownPressed);
            }
        }
    }

    get active() {
        return this._active;
    }

    set highlight(v) {
        v = Math.round(v);
        if (this._highlight !== v && v >= 0 && v < this._items.length) {
            this._changeSelect(this._highlight, v);
            this._highlight = v;
        }
    }

    get highlight() {
        return this._highlight;
    }

    set type(v) {
        if (this._type !== v) {
            this._type = v;
        }
    }

    get type() {
        return this._type;
    }

    get items() {
        return this._items;
    }

    _changeSelect(old, sel) {
        if (old >= 0 && old < this._items.length) {
            this._items[old].active = false;
        }
        if (sel >= 0 && sel < this._items.length) {
            let item = this._items[sel];
            item.active = true;

            this.emit('highlight', sel);
        }
    }

    show(sel) {
        let item = this._items[sel];
        if (this.type === List.TYPE_VERTICAL) {
            let low = item.y;
            let high = item.y + item.height;
            let vp = this.viewport;
            if (vp.top > low) {
                this.scrollTo(0, low);
            } else if (vp.bottom < high) {
                this.scrollTo(0, Math.max(0, high - vp.height));
            }
        }
    }
    
    destroy(options) {
        super.destroy(options);

        Input.event("up").off('down', this._onUpPressed);
        Input.event("down").off("down", this._onDownPressed);
    }
}

module.exports = List;