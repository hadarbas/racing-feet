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

      this.firstItemIndex = 0;
      this.activeItemIndex = 0;
      this.timeLastChange = 0;
      this.container = null;
      this.items = [];
      this.itemHeight = 0;
    
    this.cameras.main.setVisible(false); // Sakrij scenu dok se ne učitaju kategorije
    this.loadCategories();
  }
  
  async loadCategories() {
    const list = await getDocuments('category');
    this.categories = list.docs.map(doc => doc.id);
    this.items = [
      this.LEGACY_CATEGORY,
      ...this.categories,
    ];
    this.createItems(32);
  
    this.time.delayedCall(50, () => {
      this.cameras.main.setVisible(true); // Prikaži scenu nakon kašnjenja
    });
  }
    

  update() {
    super.update();
  } 

  LEGACY_CATEGORY = '(legacy)';

  

  handleItemClick(name) {
    this.scene.start('select-exercise', {
      category: name === this.LEGACY_CATEGORY ? null : name,
    });
  }
}