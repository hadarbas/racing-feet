import MenuScene from "./menu";
import {getDocument, getDocuments, deleteDocument} from "shared/services/firebase/db";
import {db} from "shared/services/firebase/db"
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";


export default class HighScore extends MenuScene {
  execises;
  selectedCategory;

  constructor() {
    super([], 'high-score');
  }

  create() {
    super.create();
  }

  init(params) {
    this.firstItemIndex = 0;
      this.activeItemIndex = 0;
      this.timeLastChange = 0;
      this.container = null;
      this.items = [];
      this.itemHeight = 0;
    this.loadLevels();
  }

  update() {
    super.update();
  } 

  async loadLevels() {
    try {
      
        const levelsSnapshot = await getDocuments("levels");

        const levels = levelsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() })) 

        this.items = levels.map(level => `${level.id}`)
        
        this.createItems(32);
     
        this.time.delayedCall(50, () => {
            this.cameras.main.setVisible(true); 
        });

    } catch (error) {
        console.error("Greška pri učitavanju levela:", error);
        return [];
    }
}



  async handleItemClick(name) {
      try {
          console.log(` Dohvatam level '${name}'...`);

          const levelDoc = await getDocument("levels", name);
  
          if (!levelDoc.exists()) {
              console.error(`  Level '${name}' ne postoji!`);
              alert(`  Level '${name}' nije pronađen.`);
              return;
          }

          const levelData = levelDoc.data();
          console.log(`  Level '${name}' pronađen:`, levelData);
  
          this.scene.start('high-score-level', { name });
  
      } catch (error) {
          console.error("  Greška pri dohvaćanju levela:", error);
          alert("Check console for error.");
      }
  }
  
}
