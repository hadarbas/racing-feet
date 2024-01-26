import MenuScene from "./menu";

export default class MainMenuScene extends MenuScene {
  constructor() {
    super(['Train', 'Record a New Exercise', 'Setup'], 'main-menu');
  }

  handleItemClick(item) {
    const sceneKey = item.toLowerCase().replace(/\s/g, '-');
    const nextScene = this.scene.get(sceneKey);
    this.scene.start(sceneKey);
    nextScene.scene.restart();
  }
}