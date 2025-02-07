import MenuScene from "./menu";
import {getDocument, getDocuments, deleteDocument} from "shared/services/firebase/db";

export default class SelectExerciseScene extends MenuScene {
  execises;
  deleteKey;
  selectedCategory;

  constructor() {
    super([], 'train');
  }

  create() {
    super.create();

    this.deleteKey = this.input.keyboard.addKey('d');
  }

  init(params) {
    this.firstItemIndex = 0;
      this.activeItemIndex = 0;
      this.timeLastChange = 0;
      this.container = null;
      this.items = [];
      this.itemHeight = 0;
    const name = localStorage.getItem("name") || null
    this.loadLevels(name);
  }

  update() {
    super.update();
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
      console.error("  Greška pri učitavanju levela:", error);
      return [];
    }
  }


  async handleItemClick(name) {
      try {
          console.log(`🔍 Dohvatam level '${name}'...`);

          const levelDoc = await getDocument("levels", name);
  
          if (!levelDoc.exists()) {
              console.error(`  Level '${name}' ne postoji!`);
              alert(`  Level '${name}' nije pronađen.`);
              return;
          }

          const levelData = levelDoc.data();
          console.log(`  Level '${name}' pronađen:`, levelData);
  
          this.scene.start('train-2', { name, data: levelData.data });
  
      } catch (error) {
          console.error("  Greška pri dohvaćanju levela:", error);
          alert("Check console for error.");
      }
  }
  
}