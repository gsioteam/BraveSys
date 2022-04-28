const { Sprite, RPG, Sprite_AnimationMV, Sprite_Animation } = require("rmmz");


/**
 * 
 * @param {RPG.DataAnimation} animation
 * @param {Array<PIXI.DisplayObject>} targets
 */
function createAnimation(animation, targets) {
    function isMVAnimation(animation) {
        return !!animation.frames;
    }
    let sprite = new (isMVAnimation(animation) ? Sprite_AnimationMV : Sprite_Animation)();
    sprite.setup(
        targets, animation, true, 0, null
    );
    let emited = false;
    let oldUpdate = sprite.update;
    sprite.update = function() {
        oldUpdate.call(this);
        if (!this.isPlaying()) {
            if (!emited) {
                emited = true;
                this.emit('complete');
            }
        }
    };
    return sprite;
}

module.exports = createAnimation;