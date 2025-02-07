import Phaser from 'phaser';
import BBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin.js';

import MainMenuScene from './scenes/main-menu';
import SelectControllerScene from './scenes/select-controller';
import SetupScene from './scenes/setup';
import TrainScene from './scenes/train';
import RecorderScene from './scenes/recorder';
import SelectCategoryScene from './scenes/select-category';
import SelectExerciseScene from './scenes/select-exercise';
import SelectRecordedExerciseScene from './scenes/select-recorded-exercise';
import TrainExerciseScene from './scenes/train-exercise';

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: window.innerWidth,
    height: Math.round(window.innerWidth * 9 / 16),
    input: {
        gamepad: true
    },
    scene: [MainMenuScene, SelectControllerScene, SetupScene,
        TrainScene, RecorderScene,
        SelectCategoryScene, SelectExerciseScene, SelectRecordedExerciseScene, TrainExerciseScene],
    plugins: {
        global: [{
            key: 'rexBBCodeTextPlugin',
            plugin: BBCodeTextPlugin,
            start: true
        }]},
};

const game = new Phaser.Game(config);
