import SteppedScene from './stepped';
import trainBackground from "@assets/train-background.png";

export default class TrainExerciseScene extends SteppedScene {
  greenGraphics;
  redGraphics;
  blueGraphics;
  name;
  data;
  green;
  red;
  blue;
  score;
  lastCornerScore;

  corner;
  cornerEnd;
  scorePerCorner;
  distancesInOneCorner;
  levelDifficultyPoints;
  levelDifficulty;
  distanceBonus;

  greenPlayer;
  redPlayer;
  oldScore;
  
  radius = 15;

  xPadding = this.baseWidth / 3;
  xWidth;
  yPadding = this.baseHeight / 4;
  yHeight = this.baseHeight / 5;
  maxTime;
  recording;

  greenTrail;
  redTrail;
  blueTrails;

  playerSize = 30;
  scoreScrollDirection;

  adminMode;



  preload() {
    super.preload();

    this.load.image('train-background', trainBackground);
  }

  init(params) {
    super.init(params);
    this.scorePerCorner = [];
    this.distancesInOneCorner = [];
    this.recording = [];
    this.currentScore=0;

    this.currentScore = 0;
     this.lastCornerScore = 0;
 
     this.corner = false
     this.cornerEnd = false
     this.scorePerCorner = []
     this.distancesInOneCorner = []
 
     this.distanceBonus = 5
     this.askedForSave = false

switch(params.levelDifficulty) {
       case "easy":
         this.levelDifficultyPoints = 30;
         break;
       case "normal":
         this.levelDifficultyPoints = 20;
         break;
       case "hard":
         this.levelDifficultyPoints = 10;
         break;
       default:
         this.levelDifficultyPoints = 0;
     }
    
  }

  process = (data, key) => data
    .filter(({[key]: value}) => typeof value === 'number')
    .reduce((points, {time, [key]: value}) => [
      ...points,
      this.fit(
        this.xPadding + time / this.maxTime * this.xWidth,
        this.yPadding + (1 - value) * this.yHeight
      ),
    ], []);
  
  getMaxTime = (data, key) => Math.max(...data
    .map(({[key]: value}) => value)
  );

  getPointsForKey = (data, key) =>
    this.getMaxTime(data, key) ? this.process(data, key) : null;

  create() {
    super.create();

    this.add.image(...this.fit(this.baseWidth / 2, this.baseHeight / 2), 'train-background')
      .setDepth(-1)
      .setTint(0x02020, 0x000020, 0x002000, 0x202020)
      .setScrollFactor(0);

    this.greenGraphics = this.add.graphics();
    this.redGraphics = this.add.graphics();
    this.blueGraphics = this.add.graphics();
    this.greenTrail = this.add.graphics();
    this.redTrail = this.add.graphics();
    this.blueTrail = this.add.graphics();

    this.drawCurve(this.greenGraphics, this.green, 0x00ff00, this.radius);
    this.drawCurve(this.redGraphics, this.red, 0xff0000, this.radius);
    this.drawCurve(this.blueGraphics, this.blue, 0x0000ff, this.radius);

    this.greenPlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding + this.yHeight), this.playerSize, this.playerSize, 0x00ff00)
      .setStrokeStyle(this.playerSize * 0.2, 0x008000, 0.5);
    this.redPlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding), this.playerSize * 0.8, this.playerSize * 0.8, 0xff0000)
      .setStrokeStyle(this.playerSize * 0.2, 0x800000, 0.5);
    this.bluePlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding), this.playerSize  * 0.6, this.playerSize * 0.6, 0x0000ff)
      .setStrokeStyle(this.playerSize * 0.2, 0x000080, 0.5);

    this.prompt.setPosition(...this.fit(600, 950));
  }

  getStarRating(score) {
    if (score <= 60) return "⭐";
    if (score <= 75) return "⭐⭐";
    if (score <= 85) return "⭐⭐⭐";
    if (score <= 95) return "⭐⭐⭐⭐";
    return "⭐⭐⭐⭐⭐";
}

  handleStep_init() {
    super.handleStep_init();

    [this.greenPlayer, this.redPlayer, this.bluePlayer]
      .forEach(player => player.setVisible(false));
  }

  handleStep_start({green, red}) {
    if (green >= 1) {
      Object.entries({
        green: this.greenPlayer,
        red: this.redPlayer,
        blue: this.bluePlayer,
      })
        .forEach(([key, player]) => player.setVisible(!!this.getMaxTime(this.data, key)));

      this.currentStep = 'play';
      this.currentTime = 0;
    }
    if (red >= 1) {
      this.currentStep = 'over_release_2';
    }
  }

  handleStep_play({time, green, red, blue}) {
    if (time >= this.maxTime) {
        this.currentStep = 'over_release_1';
        this.scoreScrollDirection = -100;
        return;
    }

    this.recording.push({time, green, red, blue});

    const lastGreenPoint = this.getLastPointForKey(this.recording, 'green');
    
    const prevGreenPoint = this.getSecondLastPointForKey(this.recording, 'green');
    const lastRedPoint = this.getLastPointForKey(this.recording, 'red');
    const prevRedPoint = this.getSecondLastPointForKey(this.recording, 'red');
    
    const lastBluePoint = this.getLastPointForKey(this.recording, 'blue');
    const prevBluePoint = this.getSecondLastPointForKey(this.recording, 'blue');
    
    const trailWidth = this.radius * 0.05;
    
    if (prevGreenPoint && lastGreenPoint) {
        this.drawRaceCurve(this.greenTrail, prevGreenPoint, lastGreenPoint, 0x008000, trailWidth);
    }
    
    if (prevRedPoint && lastRedPoint) {
        this.drawRaceCurve(this.redTrail, prevRedPoint, lastRedPoint, 0xff0000, trailWidth);
    }
    
    if (prevBluePoint && lastBluePoint) {
        this.drawRaceCurve(this.blueTrail, prevBluePoint, lastBluePoint, 0x0000ff, trailWidth);
    }

    this.greenPlayer.setPosition(...this.fit(
        this.xPadding + time / this.maxTime * this.xWidth,
        this.yPadding + (1 - green) * this.yHeight
    ));
    this.redPlayer.setPosition(...this.fit(
        this.xPadding + time / this.maxTime * this.xWidth,
        this.yPadding + (1 - red) * this.yHeight
    ));
    this.bluePlayer.setPosition(...this.fit(
        this.xPadding + time / this.maxTime * this.xWidth,
        this.yPadding + (1 - blue) * this.yHeight
    ));

    const [scrollX, _] = this.fit(time / this.maxTime * this.xWidth, 0);
    this.cameras.main.scrollX = scrollX;

    let greenData = 0, redData = 0, blueData = 0;
    for (let i = 0; i < this.data.length; i++) {
        const p1 = this.data[i];
        if (p1.time >= time) {
            greenData = p1.green;
            redData = p1.red;
            blueData = p1.blue;
            break;
        }
    }

    const greenDist = Math.abs(green - greenData);
    const redDist = Math.abs(red - redData);
    const blueDist = Math.abs(blue - blueData);

    if (greenData < 1 || redData > 0) {
        this.corner = true;
    } else if (greenData == 1 && redData == 0) {
        if (this.corner) {
            this.cornerEnd = true;
            let sum = this.distancesInOneCorner.reduce((acc, val) => acc + val, 0);
            let cornerScore = 100 - (sum / this.distancesInOneCorner.length * 100) + this.distanceBonus + this.levelDifficultyPoints;

            if (cornerScore > 100) cornerScore = 100;
            this.scorePerCorner.push(cornerScore);

            this.lastCornerScore = Math.round(cornerScore);

            this.distancesInOneCorner = [];

            this.currentScore = Math.round(this.scorePerCorner.reduce((acc, val) => acc + val, 0) / this.scorePerCorner.length);
            if (this.currentScore > 100) this.currentScore = 100;
        } else {
            this.cornerEnd = false;
        }
        this.corner = false;
    }
    if (this.corner) {
        if (greenData > 0) this.distancesInOneCorner.push(greenDist);
        if (redData > 0) this.distancesInOneCorner.push(redDist);
    }

    this.greenPlayer.setFillStyle(0x00ff00, greenDist < 0.2 && greenData > 0 ? 1 - greenDist : 0.2);
    this.redPlayer.setFillStyle(0xff0000, redDist < 0.2 && redData > 0 ? 1 - redDist : 0.2);
    this.bluePlayer.setFillStyle(0x0000ff, blueDist < 0.2 && blueData > 0 ? 1 - blueDist : 0.2);
  
}

getLastPointForKey(data, key) {
  if (!data || data.length === 0) return null;
  return this.processPoint(data[data.length - 1], key);
}

getSecondLastPointForKey(data, key) {
  if (!data || data.length < 2) return null;
  return this.processPoint(data[data.length - 2], key);
}

processPoint(point, key) {
  if (!point || typeof point[key] !== 'number') return null;
  return this.fit(
      this.xPadding + point.time / this.maxTime * this.xWidth,
      this.yPadding + (1 - point[key]) * this.yHeight
  );
}



  handleStep_over_release_1(pedals) {
    super.handleStepRelease(pedals, 'over_menu');
  }

  handleStep_over_release_2(pedals) {
    super.handleStepRelease(pedals, 'main_menu');
  }

  handleStep_over_menu({green, red}) {
    const [minX, _] = this.fit(this.xPadding, 0);
    const [maxX, __] = this.fit(this.xWidth - this.xPadding * 0.8, 0);
    if (this.cameras.main.scrollX <= minX) {
      this.scoreScrollDirection = maxX * 0.003;
    } else if (this.cameras.main.scrollX >= maxX) {
      this.scoreScrollDirection = maxX * -0.05;
    }
    this.cameras.main.scrollX += this.scoreScrollDirection;

    if (green > 0.6) {
      this.currentStep = 'retry';
    } else if (red > 0.2) {
      this.currentStep = 'over_release_2';
    }
  }

  handleStep_retry() {
    this.scene.restart();
  }

  handleAnyStep(step) {
    if (['init', 'main_menu', 'retry'].includes(step)) {
      return;
    }

    this.setPrompt([
      ['over_release_1', 'over_release_2', 'over_menu'].includes(step)
          ? `Score: [b]${this.getStarRating(this.currentScore)} (${Math.round(this.currentScore)})[/b]`
          : `Score: [b]${Math.round(this.currentScore)}[/b]`,  
      {
          start: 'Please press [b]full gas[/b] to start\n'
              + 'or [b]full brake[/b] to return to main menu',
          over_release_1: 'Please release all pedals',
          over_menu: `Please press [b][color=green]full gas[/color][/b] to retry\nor [b][color=red]brake[/color][/b] for main menu`,
          over_release_2: 'Please release all pedals for main menu',
      }[step],
  ]
  .filter(line => !!line)
  .join('\n'));
  
  
  }

  getReplayPedals(time) {
    for (let i = 0; i < this.recording.length; i++) {
      const p1 = this.recording[i];
      if (p1.time >= time) {
        return p1;
      }
    }

    return {green: 0, red: 0, belu: 0};
  }

  drawCurve(graphics, points, color, radius) {
    if (!points || points.length < 2) {
        return;
    }

    const maskGraphics = this.make.graphics();
    maskGraphics.lineStyle(radius * 2, 0xffffff).fillStyle(0xffffff);

    const [_, maxY] = this.fit(0, this.yPadding + this.yHeight);

    let flatCount = 0;
    let nonFlatCount = 0;

    maskGraphics.beginPath();
    maskGraphics.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];

        if (p0[1] >= maxY && p1[1] >= maxY) {
            continue;
        }

        const dy = Math.abs(p1[1] - p0[1]);
        const isFlat = dy < radius * 0.5;

        if (isFlat) {
            flatCount++;
            maskGraphics.lineTo(p1[0], p1[1]); // Ravne linije crtamo normalno
        } else {
            nonFlatCount++;

            const midX = (p0[0] + p1[0]) / 2;
            const midY = (p0[1] + p1[1]) / 2;

            maskGraphics.lineTo(midX, midY);
            maskGraphics.lineTo(p1[0], p1[1]);
        }
    }

    maskGraphics.strokePath();

    const mask = new Phaser.Display.Masks.BitmapMask(this, maskGraphics);
    graphics.fillStyle(color, 0.3).fillRect(0, 0, ...this.fit(this.xPadding + this.xWidth, this.baseHeight));
    graphics.setMask(mask);
}




  drawRaceCurve(graphics, p0, p1, color, radius) {
    if (!p0 || !p1) {
        return; 
    }

    graphics.lineStyle(radius * 2, color, 1);
    graphics.beginPath();
    graphics.moveTo(p0[0], p0[1]);
    graphics.lineTo(p1[0], p1[1]);
    graphics.strokePath();
}


score;
  get currentScore() {
    return this.score;
  }
  set currentScore(score) {
    this.score = score;
    super.updateStep();
  }



}

const SECONDS_PER_SCREEN = 10;