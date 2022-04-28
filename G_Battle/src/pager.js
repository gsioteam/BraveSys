const { Easing } = require("@tweenjs/tween.js");
const Scroller = require("./scoller");
const TweenManager = require("./tween_manager");

class Pager extends Scroller {
    
    /**
     * @param {PIXI.Container} child 
     */
    constructor(child) {
        super();

        this.type = Scroller.TYPE_HORIZONTAL;

        this.stack = [child];
        this.content.addChild(child);
        child.x = 0;
        child.y = 0;
        this._active = false;

        this.interactive = false;

        this.tweens = new TweenManager();
    }

    destroy(options) {
        super.destroy(options);
        this.tweens.destroy();
    }

    get current() {
        return this.stack[this.stack.length - 1];
    }

    get width() {
        return super.width;
    }

    set width(v) {
        super.width = v;
        this.current.width = v;
    }

    get height() {
        return super.height;
    }

    set height(v) {
        super.height = v;
        this.current.height = v;
    }

    /**
     * 
     * @param {PIXI.DisplayObject} child 
     */
    async push(child) {
        let old = this.current;
        let len = this.stack.length;
        child.x = len * this.width;
        child.y = 0;
        child.width = this.width;
        child.height = this.height;
        this.stack.push(child);
        old.active = false;
        child.active = this.active;
        this.content.addChild(child);

        await this.scrollTo(len * this.width, 0);
    }

    async pop() {
        if (this.stack.length <= 1) return;
        let top = this.stack.pop();
        let cur = this.current;
        top.active = false;
        cur.active = this.active;
        await this.scrollTo((this.stack.length - 1) * this.width, 0);
        return top;
    }

    set active(v) {
        if (this._active !== v) {
            this._active = v;
            this.current.active = v;
        }
    }

    get active() {
        return this._active;
    }
}

module.exports = Pager;