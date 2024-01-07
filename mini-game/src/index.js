import Phaser from 'phaser';

import RecorderScene from './scenes/recorder';

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    input: {
        gamepad: true
    },
    scene: RecorderScene,
};

const game = new Phaser.Game(config);
