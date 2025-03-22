import Phaser from "phaser";
import menuBackground from "@assets/menu-background.png"; // Učitaj pozadinsku sliku
import lockIcon from "@assets/lock-icon.png"; // Ikona ključa
import unlockIcon from "@assets/unlock-icon.png"; // Ikona ključa

export default class LevelDetailsScene extends Phaser.Scene {
    constructor() {
        super({ key: "LevelDetailsScene" });
    }
    
    init(data) {
        this.data = data.levelData || {}; // Podaci o nivou iz baze
    }

    preload() {
        // Učitaj pozadinsku sliku i ikonu ključa
        this.load.image('menu-background', menuBackground);
        this.load.image('lock-icon', lockIcon);
        this.load.image('unlock-icon', unlockIcon);
    }

    create() {
        // Postavi pozadinsku sliku
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'menu-background')
            .setDepth(-1)
            .setTint(0x04040, 0x000040, 0x004000, 0x404040); // Prilagodi veličinu ekranu

        const { name, difficulty, order_id, instructions, lock } = this.data;

        // Prikaz detalja nivoa sa centriranim tekstom
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

        const instructionText = instructions ? instructions : "There are no instructions for this level.";
        this.add.text(this.cameras.main.width / 2, 280, `Instructions: ${instructionText}`, { 
            fontSize: "20px", 
            fill: "#fff", 
            wordWrap: { width: 700 }, 
            align: "center", 
            lineSpacing: 30 // Povećanje razmaka između redova
        }).setOrigin(0.5);

        let lockText = lock ? "Locked" : "Unlocked";
        this.add.text(this.cameras.main.width / 2, 330, lockText, { 
            fontSize: "24px", 
            fill: lock ? "#f00" : "#0f0", 
            align: "center" 
        }).setOrigin(0.5);

        // Ako je nivo zaključan, prikaži ikonu ključa
        if (lock) {
            // Postavi ikonu ključa
            this.add.image(this.cameras.main.width / 2+80, 330, 'lock-icon')
                .setScale(0.05) // Smanji ikonu da bi stala u ekran
                .setOrigin(0.5);
        } else {
            this.add.image(this.cameras.main.width / 2+90, 330, 'unlock-icon')
                .setScale(0.05) // Smanji ikonu da bi stala u ekran
                .setOrigin(0.5);
        }

        // Play Button
        let playButton = this.add.text(this.cameras.main.width / 2, 400, "Play", { 
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

        // Return Button
        let returnButton = this.add.text(this.cameras.main.width / 2, 460, "Return", { 
            fontSize: "28px", 
            fill: "#fff", 
            backgroundColor: "#555", 
            align: "center" 
        })
            .setPadding(10)
            .setOrigin(0.5)
            .setInteractive();

        returnButton.on("pointerdown", () => {
            this.scene.start("train"); // Vrati se na listu levela
        });

        // Dodaj tekstualne upute pored dugmadi
        // "Press Enter to Play" pored dugmeta Play
        this.add.text(this.cameras.main.width / 2 + 150, 400, "Press Enter to Play", {
            fontSize: "18px",
            fill: "#ff0", // Žuta boja
            align: "left"
        }).setOrigin(0.5);

        // "Press ESC to Return" pored dugmeta Return
        this.add.text(this.cameras.main.width / 2 + 170, 460, "Press ESC to Return", {
            fontSize: "18px",
            fill: "#ff0", // Žuta boja
            align: "left"
        }).setOrigin(0.5);

        // Dodaj funkcionalnost za Enter dugme
        this.input.keyboard.on("keydown-ENTER", () => {
            this.scene.start("train-2", { data: this.data }); // Početak nove scene
        });

        // Dodaj funkcionalnost za ESC dugme
        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.start("train"); // Vrati se na listu levela
        });
    }
}
