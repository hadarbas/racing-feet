import MenuScene from "./menu";
import {getDocuments, deleteDocument} from "../services/firebase/db";

export default class SelectExerciseScene extends MenuScene {
  execises;
  deleteKey;

  constructor() {
    super([], 'train');
  }

  create() {
    super.create();

    this.deleteKey = this.input.keyboard.addKey('d');
  }

  init() {
    this.loadExercises();
  }

  update() {
    super.update();

    if (this.deleteKey.isDown) {
      const name = this.items[this.activeItemIndex];
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        deleteDocument('exercise', name).then(() => {
          this.scene.restart();
        });
      }
    }
  } 

  async loadExercises() {
    const list = await getDocuments('exercise');
    this.execises = Object.fromEntries(
      list
        .docs
        .map(doc => [
          doc.id,
          doc.data().data,
        ])
    );
    this.items = Object.keys(this.execises);
    this.createItems(24);
  }

  handleItemClick(name) {
    this.scene.start('train-2', {name, data: this.execises[name]})
  }
}