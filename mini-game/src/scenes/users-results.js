import MenuScene from "./menu";
import { getDocuments } from "shared/services/firebase/db";

export default class UsersResultsScene extends MenuScene {
  constructor() {
    super([], "users-results");
    this.results = [];
    this.filteredResults = [];
    this.currentPage = 0;
    this.resultsPerPage = 10;
    this.resultTexts = [];
    this.prevButton = null;
    this.nextButton = null;
    this.pageText = null;
    this.escText = null;
    this.userFilter = "";
    this.levelFilter = "";
    this.userInput = null;
    this.levelInput = null;
    this.maxScrollY = 0; 
  }

  async create() {
    super.create();

    if (localStorage.getItem("name") !== "admin") {
      console.error("Access denied. Only admin can view user results.");
      this.scene.start("main-menu");
      return;
    }
    
    this.scale.on("resize", this.resize, this);
    const centerX = this.scale.width / 2;

    this.add.text(centerX, 70, "Users and Their Results", {
      fontSize: "24px",
      fill: "#fff",
    }).setOrigin(0.5);

    this.userInput = this.add.dom(0, 0, "input");
    this.userInput.node.setAttribute("placeholder", "Search User...");
    this.userInput.node.setAttribute("type", "text");
    this.userInput.node.style.width = "200px";
    this.userInput.node.style.fontSize = "16px";
    this.userInput.setPosition(centerX - 130, 110);

    this.levelInput = this.add.dom(0, 0, "input");
    this.levelInput.node.setAttribute("placeholder", "Search Level / Exercise...");
    this.levelInput.node.setAttribute("type", "text");
    this.levelInput.node.style.width = "200px";
    this.levelInput.node.style.fontSize = "16px";
    this.levelInput.setPosition(centerX + 130, 110);

    this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.userInput.node.addEventListener("input", (e) => {
      this.userFilter = e.target.value.toLowerCase();
      this.filterAndDisplayResults();
    });

    this.levelInput.node.addEventListener("input", (e) => {
      this.levelFilter = e.target.value.toLowerCase();
      this.filterAndDisplayResults();
    });

    this.results = await this.getUsersResults();
    this.filterAndDisplayResults();
    this.createPaginationButtons();

    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      this.cameras.main.scrollY += deltaY * 0.5;
      this.limitScroll();
    });

    this.input.keyboard.on("keydown-UP", () => {
      this.cameras.main.scrollY -= 30;
      this.limitScroll();
    });

    this.input.keyboard.on("keydown-DOWN", () => {
      this.cameras.main.scrollY += 30;
      this.limitScroll();
    });

    this.input.keyboard.on("keydown-LEFT", () => {
      this.changePage(-1);
    });

    this.input.keyboard.on("keydown-RIGHT", () => {
      this.changePage(1);
    });

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("main-menu");
    });
  }

  async getUsersResults() {
    try {
      const userLevelsSnapshot = await getDocuments("user_levels");
      const userExercisesSnapshot = await getDocuments("user_exercises");

      const levelResults = userLevelsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          resultType: "level",     
          resultName: data.level,  
        };
      });

      const exerciseResults = userExercisesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          resultType: "exercise",      
          resultName: data.exercise,  
        };
      });

      const mergedResults = levelResults.concat(exerciseResults);
      return mergedResults.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error("Error fetching user results:", error);
      return [];
    }
  }

  filterAndDisplayResults() {
    const userSearch = this.userFilter;
    const levelSearch = this.levelFilter;

    this.filteredResults = this.results.filter(({ user, resultName }) => {
      const matchUser = userSearch.length < 3 || user.toLowerCase().includes(userSearch);
      const matchResult = levelSearch.length < 3 || resultName.toLowerCase().includes(levelSearch);
      return matchUser && matchResult;
    });

    this.currentPage = 0;
    this.displayFilteredResults();
    this.updatePageText();
  }

  displayFilteredResults() {
    if (!this.resultTexts) this.resultTexts = [];
    this.resultTexts.forEach((text) => text.destroy());
    this.resultTexts = [];

    const centerX = this.cameras.main.width / 2;
    let yOffset = 160;

    this.resultTexts.push(
      this.add.text(centerX - 200, yOffset, "User", { fontSize: "18px", fill: "#ff0" }).setOrigin(0.5),
      this.add.text(centerX, yOffset, "Level / Exercise", { fontSize: "18px", fill: "#ff0" }).setOrigin(0.5),
      this.add.text(centerX + 200, yOffset, "Score", { fontSize: "18px", fill: "#ff0" }).setOrigin(0.5)
    );

    yOffset += 30;

    const groupedResults = {};
    this.filteredResults.forEach(item => {
      if (!groupedResults[item.user]) {
        groupedResults[item.user] = [];
      }
      groupedResults[item.user].push(item);
    });

    const sortedUsers = Object.keys(groupedResults).sort((a, b) => a.localeCompare(b));

    let orderedResults = [];
    sortedUsers.forEach(user => {
      const levels = groupedResults[user]
        .filter(item => item.resultType === "level")
        .sort((a, b) => a.timestamp - b.timestamp);
      const exercises = groupedResults[user]
        .filter(item => item.resultType === "exercise")
        .sort((a, b) => a.timestamp - b.timestamp);
      orderedResults = orderedResults.concat(levels, exercises);
    });

    const startIdx = this.currentPage * this.resultsPerPage;
    const paginatedResults = orderedResults.slice(startIdx, startIdx + this.resultsPerPage);

    paginatedResults.forEach(({ user, resultType, resultName, score }) => {
      let levelText = "";
      if (resultType === "level") {
        levelText = `${resultName} - level`;
      } else if (resultType === "exercise") {
        levelText = `${resultName} - exercise`;
      }

      this.resultTexts.push(
        this.add.text(centerX - 200, yOffset, user, { fontSize: "16px", fill: "#fff" }).setOrigin(0.5),
        this.add.text(centerX, yOffset, levelText, { fontSize: "16px", fill: "#fff" }).setOrigin(0.5),
        this.add.text(centerX + 200, yOffset, score.toString(), { fontSize: "16px", fill: "#fff" }).setOrigin(0.5)
      );
      yOffset += 25;
    });

    const contentHeight = yOffset + 150;
    const scrollHeight = Math.max(contentHeight, this.scale.height);
    this.cameras.main.setBounds(0, 0, this.scale.width, scrollHeight);
    this.maxScrollY = Math.max(0, contentHeight - this.scale.height);
  }

  createPaginationButtons() {
    const centerX = this.scale.width / 2;
    const buttonY = this.scale.height >= 720 ? this.scale.height - 200 : this.scale.height;

    this.prevButton = this.add.text(centerX - 100, buttonY, "Previous page", {
      fontSize: "18px",
      fill: "#ff0",
    })
      .setInteractive()
      .setOrigin(0.5)
      .on("pointerdown", () => this.changePage(-1));

    this.nextButton = this.add.text(centerX + 100, buttonY, "Next page", {
      fontSize: "18px",
      fill: "#ff0",
    })
      .setInteractive()
      .setOrigin(0.5)
      .on("pointerdown", () => this.changePage(1));

    this.pageText = this.add.text(centerX, buttonY, `${this.currentPage + 1}`, {
      fontSize: "18px",
      fill: "#ff0",
    }).setOrigin(0.5);

    this.escText = this.add.text(centerX - 100, buttonY + 25, "Press ESC to return", {
      fontSize: "18px",
      fill: "#ff0",
    });
  }

  changePage(direction) {
    const groupedCount = (() => {
      const grouped = {};
      this.filteredResults.forEach(item => {
        if (!grouped[item.user]) grouped[item.user] = [];
        grouped[item.user].push(item);
      });
      let total = 0;
      Object.keys(grouped).forEach(user => {
        total += grouped[user].length;
      });
      return total;
    })();

    const totalPages = Math.ceil(groupedCount / this.resultsPerPage);
    this.currentPage = (this.currentPage + direction + totalPages) % totalPages;
    this.displayFilteredResults();
    this.updatePageText();
    this.cameras.main.scrollY = 0;
  }

  updatePageText() {
    if (this.pageText) {
      this.pageText.setText(`${this.currentPage + 1}`);
    }
  }

  limitScroll() {
    this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, this.maxScrollY);
  }

  resize() {
    const centerX = this.scale.width / 2;
    const buttonY = this.scale.height - 100;

    this.prevButton.setPosition(centerX - 100, buttonY);
    this.nextButton.setPosition(centerX + 100, buttonY);
    this.pageText.setPosition(centerX, buttonY);
    this.escText.setPosition(centerX - 100, buttonY + 25);

    const contentHeight = this.maxScrollY + this.scale.height;
    this.cameras.main.setBounds(0, 0, this.scale.width, contentHeight);
    this.maxScrollY = Math.max(0, contentHeight - this.scale.height);
  }
}
