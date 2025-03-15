import MenuScene from "./menu";
import { getDocuments, setDocument } from "shared/services/firebase/db";
import { query, where, collection } from "firebase/firestore";
import { db } from "shared/services/firebase/db";

export default class MainMenuScene extends MenuScene {
  constructor() {
    const playerName = localStorage.getItem("name") || null;
  
    const menuOptions = ['Train', 'Recorded exercises', 'High score', 'Setup', 'Glossary'];

    if (playerName === "admin") {
        menuOptions.splice(1, 0, "Record a new exercise"); 
    } 

    if (playerName !== null){
      menuOptions.splice(menuOptions.length,0, "Logout")
    }

    super(menuOptions, 'main-menu');

    this.playerName = playerName;
    this.menuDisabled = true; 
}


async create() {
  super.create();

  setTimeout(async () => { 
      let name = localStorage.getItem("name") || null;

      while (!name || name.trim() === "") {
          name = prompt("Enter your name:");
          if (name === null) {
              location.reload()
              return; 
          }
      }

      this.playerName = name.trim();
      localStorage.setItem("name", this.playerName);

      const exists = await this.checkUserExists(this.playerName);

      if (exists && localStorage.getItem("alreadyReloaded") !== "true") {
          console.log(`  Korisnik '${this.playerName}' postoji, osvežavam stranicu...`);
          localStorage.setItem("alreadyReloaded", "true"); 
          location.reload();
          return;
      }

      if (!exists) {
          const confirmCreate = confirm(`Are you sure you want to create an account '${this.playerName}'?`);
          if (confirmCreate) {
              await this.createUserInDatabase(this.playerName); 
              this.menuDisabled = false;
              location.reload();
          } else {
              localStorage.removeItem("name"); 
              localStorage.removeItem("alreadyReloaded"); 
              location.reload(); 
          }
      } else {
          this.menuDisabled = false;
      }
  }, 500);
}



  handleItemClick(item) {
    if (this.menuDisabled) return;

    if (item === "Logout") {
       localStorage.removeItem("name"); 
       localStorage.removeItem("alreadyReloaded"); 
       location.reload(); 
       return;
    }

    const sceneKey = item.toLowerCase().replace(/\s/g, '-');

    if (item === "Glossary") {
      this.scene.start("glossary");
      return;
  }

    if (this.scene.get(sceneKey)) {
      this.scene.start(sceneKey);
      this.scene.get(sceneKey).scene.restart();
    } else {
      console.error(`Scena "${sceneKey}" ne postoji!`);
    }
}



  async checkUserExists(name) {
    try {
        const usersSnapshot = await getDocuments("users");

        const userExists = usersSnapshot.docs.some(doc => doc.id === name);
        return userExists;
    } catch (error) {
        console.error(error);
        return false;
    }
  }

  async createUserInDatabase(name) {
    try {
        await setDocument({ data: {} }, "users", name);
        console.log(`  Korisnik '${name}' kreiran u bazi.`);

        const levelsSnapshot = await getDocuments("levels");
        const levels = levelsSnapshot.docs.map(doc => doc.id); 

        console.log(`📋 Nađeni leveli:`, levels);

        const userLevelPromises = levels.map(level => 
            setDocument({ user: name, level: level, score: 0 }, "user_levels", `${name}_${level}`)
        );

        await Promise.all(userLevelPromises); 
        console.log(`  Korisnik '${name}' dobio sve levele.`);
        localStorage.setItem("alreadyReloaded", "true"); 
    } catch (error) {
        console.error("  Greška pri kreiranju korisnika ili dodeli levela:", error);
    }
  
}
}


