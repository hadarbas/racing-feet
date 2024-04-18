import MenuScene from "./menu";
import {getDocuments} from "shared/services/firebase/db";

export default class SelectCategoryScene extends MenuScene {
  constructor() {
    super([], 'train');
  }

  create() {
    super.create();

    this.deleteKey = this.input.keyboard.addKey('d');
  }

  init() {
    this.loadCategories();
  }

  update() {
    super.update();
  } 

  LEGACY_CATEGORY = '(legacy)';

  async loadCategories() {
    const list = await getDocuments('category');
    this.categories = list
      .docs
      .map(doc => doc.id);
    this.items = [
      this.LEGACY_CATEGORY,
      ...this.categories,
    ];
    this.createItems(32);
  }

  handleItemClick(name) {
    this.scene.start('select-exercise', {
      category: name === this.LEGACY_CATEGORY ? null : name,
    });
  }
}