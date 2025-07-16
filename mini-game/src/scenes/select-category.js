import MenuScene from "./menu";
import {getDocuments} from "shared/services/firebase/db";

export default class SelectCategoryScene extends MenuScene {
  constructor() {
    super([], 'pfff');
  }

  create() {
    super.create();

    this.backSpaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
    this.deleteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
  }

  init() {

      this.firstItemIndex = 0;
      this.activeItemIndex = 0;
      this.timeLastChange = 0;
      this.container = null;
      this.items = [];
      this.itemHeight = 0;
    
    this.cameras.main.setVisible(false); // Sakrij scenu dok se ne učitaju kategorije
    const name = localStorage.getItem("name") || null
    this.loadLevels(name);
  }
  
  async loadLevels(name) {
    try {
      const levelsSnapshot = await getDocuments("user_levels");
  
      const levels = levelsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) 
        .filter(level => level.user === name);

        this.categories = levels.map(level => level.level);

        this.items = [...this.categories];
        
       this.createItems(32);
     
       this.time.delayedCall(50, () => {
         this.cameras.main.setVisible(true); 
       });

    } catch (error) {
      console.error("Error:", error);
      return [];
    }
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



  /*async loadCategories() {
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
    */