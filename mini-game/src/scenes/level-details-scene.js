import Phaser from "phaser";
import menuBackground from "@assets/menu-background.png"; 
import lockIcon from "@assets/lock-icon.png";
import unlockIcon from "@assets/unlock-icon.png";

export default class LevelDetailsScene extends Phaser.Scene {
    constructor() {
        super({ key: "LevelDetailsScene" });
    }
    
    init(data) {
        this.data = data.levelData || {}; 
    }

    preload() {
        this.load.image('menu-background', menuBackground);
        this.load.image('lock-icon', lockIcon);
        this.load.image('unlock-icon', unlockIcon);
    }

    create() {
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'menu-background')
            .setDepth(-1)
            .setTint(0x04040, 0x000040, 0x004000, 0x404040); 
    
        const { name, difficulty, order_id, instructions, lock } = this.data;
    
        this.add.text(this.cameras.main.width / 2, 100, `Level: ${name}`, { 
            fontSize: "32px", 
            fill: "#fff", 
            align: "center" 
        }).setOrigin(0.5);
    
        this.add.text(this.cameras.main.width / 2, 180, `Difficulty: ${difficulty}`, { 
            fontSize: "24px", 
            fill: "#fff", 
            align: "center" 
        }).setOrigin(0.5);
    
        this.add.text(this.cameras.main.width / 2, 230, `Order ID: ${order_id}`, { 
            fontSize: "24px", 
            fill: "#fff", 
            align: "center" 
        }).setOrigin(0.5);
    
        // Ispravljen prikaz instrukcija
        const instructionText = instructions ? instructions : "There are no instructions for this level.";
        const instructionsBoxWidth = 700;
    
        const instructionsText = this.add.text(0, 0, `Instructions: ${instructionText}`, {
            fontSize: "20px",
            fill: "#fff",
            wordWrap: { width: instructionsBoxWidth, useAdvancedWrap: true },
            align: "center",
            lineSpacing: 10
        });
    
        instructionsText.setPosition(
            this.cameras.main.width / 2 - instructionsBoxWidth / 2,
            280
        );
    
        let lockText = lock ? "Locked" : "Unlocked";
        this.add.text(this.cameras.main.width / 2, 370, lockText, { 
            fontSize: "24px", 
            fill: lock ? "#f00" : "#0f0", 
            align: "center" 
        }).setOrigin(0.5);
    
        if (lock) {
            this.add.image(this.cameras.main.width / 2 + 80, 370, 'lock-icon')
                .setScale(0.05) 
                .setOrigin(0.5);
        } else {
            this.add.image(this.cameras.main.width / 2 + 90, 370, 'unlock-icon')
                .setScale(0.05) 
                .setOrigin(0.5);
        }
    
        let playButton = this.add.text(this.cameras.main.width / 2, 430, "Play", { 
            fontSize: "28px", 
            fill: "#0f0", 
            backgroundColor: "#222", 
            align: "center" 
        })
            .setPadding(10)
            .setOrigin(0.5)
            .setInteractive();
        
        playButton.on("pointerdown", () => {
            this.scene.start("train-2", { data: this.data });
        });
    
        let returnButton = this.add.text(this.cameras.main.width / 2, 490, "Return", { 
            fontSize: "28px", 
            fill: "#fff", 
            backgroundColor: "#555", 
            align: "center" 
        })
            .setPadding(10)
            .setOrigin(0.5)
            .setInteractive();
    
        returnButton.on("pointerdown", () => {
            this.scene.start("train"); 
        });
    
        this.add.text(this.cameras.main.width / 2 + 150, 430, "Press Enter to Play", {
            fontSize: "18px",
            fill: "#ff0", 
            align: "left"
        }).setOrigin(0.5);
    
        this.add.text(this.cameras.main.width / 2 + 170, 490, "Press ESC to Return", {
            fontSize: "18px",
            fill: "#ff0", 
            align: "left"
        }).setOrigin(0.5);
    
        this.input.keyboard.on("keydown-ENTER", () => {
            this.scene.start("train-2", { data: this.data }); 
        });
    
        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.start("train"); 
        });
    
    }
    
}
