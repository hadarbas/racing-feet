import Phaser from 'phaser';

import MainMenuScene from './scenes/main-menu';
import SelectControllerScene from './scenes/select-controller';
import SetupScene from './scenes/setup';
import TrainScene from './scenes/train';
import RecorderScene from './scenes/recorder';
import SelectExerciseScene from './scenes/select-exercise';

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    input: {
        gamepad: true
    },
    scene: [MainMenuScene, SelectControllerScene, SetupScene,
        TrainScene, RecorderScene, SelectExerciseScene],
};

const game = new Phaser.Game(config);
