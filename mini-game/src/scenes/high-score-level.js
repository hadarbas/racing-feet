import MenuScene from "./menu";
import {getDocument, getDocuments, deleteDocument} from "shared/services/firebase/db";
import {db} from "shared/services/firebase/db"
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";


export default class HighScoreLevel extends MenuScene {
  execises;
  deleteKey;
  selectedCategory;
  level;

  constructor() {
    super([], 'high-score-level');
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
      this.level = params.name
    this.loadLevelScores(this.level);
  }

  update() {
    super.update();

  } 

  async loadLevelScores(name) {
    try {
        const levelsSnapshot = await getDocuments("user_levels");

        const levels = levelsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(level => level.level === name)
            .sort((a, b) => b.score - a.score); 

            this.items = levels
            .map(level => `${level.user} - Score: ${level.score}`)
            .slice(0, 10);
        

        console.log("Sorted Levels:", this.items); 

        this.createItems(32);
     
        this.time.delayedCall(50, () => {
            this.cameras.main.setVisible(true);
        });

    } catch (error) {
        console.error("Greška pri učitavanju levela:", error);
        return [];
    }
}



  
}
