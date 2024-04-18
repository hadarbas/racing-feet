import MenuScene from "./menu";
import {getDocuments, deleteDocument} from "shared/services/firebase/db";

export default class SelectExerciseScene extends MenuScene {
  execises;
  deleteKey;
  selectedCategory;

  constructor() {
    super([], 'select-exercise');
  }

  create() {
    super.create();

    this.deleteKey = this.input.keyboard.addKey('d');
  }

  init(params) {
    this.selectedCategory = params.category;
    this.loadExercises();
  }

  update() {
    super.update();

    if (this.selectedCategory) {
      this.setPrompt(`Category [b]${this.selectedCategory}[/b]`);
    }

    if (this.selectedCategory && this.deleteKey.isDown) {
      const name = this.items[this.activeItemIndex];
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        deleteDocument(...this.path, name).then(() => {
          this.scene.restart();
        });
      }
    }
  } 

  get path() {
    return this.selectedCategory
      ? ['category', this.selectedCategory, 'exercise']
      : ['exercise'];
  }

  async loadExercises() {
    const list = await getDocuments(...this.path);
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
    this.scene.start('train-2', {name, data: this.execises[name]});
  }
}