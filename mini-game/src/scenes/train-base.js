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

  corner;
  cornerEnd;
  scorePerCorner;
  distancesInOneCorner;
  levelDifficulty;
  distanceBonus;

  greenPlayer;
  redPlayer;
  
  radius = 15;

  xPadding = this.baseWidth / 3;
  xWidth;
  yPadding = this.baseHeight / 4;
  yHeight = this.baseHeight / 3;
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

    this.name = params.name;
    this.data = params.data;

    this.maxTime = Math.max(...this.data.map(({time}) => time));
    this.xWidth = this.baseWidth * this.maxTime / SECONDS_PER_SCREEN;

    this.green = this.getPointsForKey(this.data, 'green');
    this.red = this.getPointsForKey(this.data, 'red');
    this.blue = this.getPointsForKey(this.data, 'blue');

    this.recording = [];
    this.currentScore = 0;

    this.corner = false
    this.cornerEnd = false
    this.scorePerCorner = []
    this.distancesInOneCorner = []
    this.levelDifficulty = 0
    this.distanceBonus = 5

    this.pointsCache = new Map(); 
    this.lastHandleStepStartCall = 0;
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

  getPointsForKey = (data, key) => {
    if (!this.pointsCache) {
        this.pointsCache = new Map(); 
    }

    const cacheKey = key + JSON.stringify(data);

    if (this.pointsCache.has(cacheKey)) {
        return this.pointsCache.get(cacheKey); 
    }

    if (!this.getMaxTime(data, key)) {
        return null;
    }

    const processedData = this.process(data, key);
    this.pointsCache.set(cacheKey, processedData); 

    return processedData;
};



  create() {

    super.create();


    this.add.image(...this.fit(this.baseWidth / 2, this.baseHeight / 2), 'train-background')
      .setDepth(-1)
      .setTint(0x02020, 0x000020, 0x002000, 0x202020)
      .setScrollFactor(0);

      if (this.adminMode) {
        this.deleteKey = this.input.keyboard.addKey('D'); 
      }

    this.greenGraphics = this.add.graphics();
    this.redGraphics = this.add.graphics();
    this.blueGraphics = this.add.graphics();
    this.greenTrail = this.add.graphics();
    this.redTrail = this.add.graphics();
    this.blueTrail = this.add.graphics();

    this.drawStartCurve(this.greenGraphics, this.green, 0x00ff00, this.radius);
    this.drawStartCurve(this.redGraphics, this.red, 0xff0000, this.radius);
    this.drawStartCurve(this.blueGraphics, this.blue, 0x0000ff, this.radius);

    this.greenPlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding + this.yHeight), this.playerSize, this.playerSize, 0x00ff00)
      .setStrokeStyle(this.playerSize * 0.2, 0x008000, 0.5);
    this.redPlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding), this.playerSize * 0.8, this.playerSize * 0.8, 0xff0000)
      .setStrokeStyle(this.playerSize * 0.2, 0x800000, 0.5);
    this.bluePlayer = this.add.ellipse(...this.fit(this.xPadding, this.yPadding), this.playerSize  * 0.6, this.playerSize * 0.6, 0x0000ff)
      .setStrokeStyle(this.playerSize * 0.2, 0x000080, 0.5);

    this.prompt.setPosition(...this.fit(600, 950));

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
    /*
//makni ovo!!!!!!!!!
    setTimeout(() => {
      this.currentStep = 'play';
  }, 3000);
  */


  }

  
  handleStep_play({ time, green, red, blue }) {


    this.greenTrail.clear();
    this.redTrail.clear();
    this.blueTrail.clear();

    if (time >= this.maxTime) {
        this.currentStep = 'over_release_1';
        this.scoreScrollDirection = -100;
        return;
    }

    this.recording.push({ time, green, red, blue });

    // Iscrtavanje tragova
    this.drawCurrCurve(this.greenTrail, this.getPointsForKey(this.recording, 'green'), 0x008000, this.radius * 0.05);
    this.drawCurrCurve(this.redTrail, this.getPointsForKey(this.recording, 'red'), 0x800000, this.radius * 0.05);
    this.drawCurrCurve(this.blueTrail, this.getPointsForKey(this.recording, 'blue'), 0x000080, this.radius * 0.05);

    // Ažuriranje pozicije igrača
    this.updatePlayerPosition(this.greenPlayer, time, green);
    this.updatePlayerPosition(this.redPlayer, time, red);
    this.updatePlayerPosition(this.bluePlayer, time, blue);

    // Skrolovanje kamere
    this.cameras.main.scrollX = this.fit(time / this.maxTime * this.xWidth, 0)[0];

    // Pronalaženje podataka za tekuće vreme
    const { greenData, redData, blueData } = this.findDataForTime(time);
    
    this.handleCornerLogic(greenData, redData, green);

    // Ažuriranje boja igrača
    this.updatePlayerColor(this.greenPlayer, green, greenData, 0x00ff00);
    this.updatePlayerColor(this.redPlayer, red, redData, 0xff0000);
    this.updatePlayerColor(this.bluePlayer, blue, blueData, 0x0000ff);
}

// Funkcija za ažuriranje pozicije igrača
updatePlayerPosition(player, time, value) {
    player.setPosition(
        ...this.fit(
            this.xPadding + (time / this.maxTime) * this.xWidth,
            this.yPadding + (1 - value) * this.yHeight
        )
    );
}

// Funkcija za pronalaženje podataka za određeno vreme
findDataForTime(time) {
    for (let point of this.data) {
        if (point.time >= time) {
            return { greenData: point.green, redData: point.red, blueData: point.blue };
        }
    }
    return { greenData: 0, redData: 0, blueData: 0 };
}

// Funkcija za ažuriranje boje igrača
updatePlayerColor(player, value, dataValue, color) {
    const dist = Math.abs(value - dataValue);
    player.setFillStyle(color, dataValue > 0 && dist < 0.2 ? 1 - dist : 0.2);
}

// Funkcija za upravljanje logikom krivine
handleCornerLogic(greenData, redData, green) {
    if (greenData < 1 || redData > 0) {
        this.corner = true;
    } else if (greenData === 1 && redData === 0) {
        if (this.corner) {
            this.cornerEnd = true;
            const sum = this.distancesInOneCorner.reduce((acc, val) => acc + val, 0);
            this.scorePerCorner.push(100 - (sum / this.distancesInOneCorner.length * 100) + this.distanceBonus + this.levelDifficulty);
            this.distancesInOneCorner = [];
            this.currentScore = Math.round(this.scorePerCorner.reduce((acc, val) => acc + val, 0) / this.scorePerCorner.length);
        } else {
            this.cornerEnd = false;
        }
        this.corner = false;
    }

    if (this.corner) {
        if (greenData > 0) this.distancesInOneCorner.push(Math.abs(green - greenData));
        if (redData > 0) this.distancesInOneCorner.push(Math.abs(redData));
    }
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
      `Score: [b]${this.score}[/b]`, {
        start: 'Please press [b]full gas[/b] to start\n'
          + 'or [b]full brake[/b] to return to main menu',
        over_release_1: 'Please release all pedals',
        over_menu: `Please press [b][color=green]full gas[/color][/b] to retry\nor [b][color=red]brake[/color][/b] for main menu`,
        over_release_2: 'Please release all pedals for main menu',
      }[step],
    ]
      .filter(line => !!line)
      .join('\n')
    );
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

  drawStartCurve(graphics, points, color, radius) {
    if (!points) {
      return;
    }

    const maskGraphics = this.make.graphics();
    maskGraphics.lineStyle(radius * 2, 0xffffff).fillStyle(0xffffff);

    const [_, maxY] = this.fit(0, this.yPadding + this.yHeight);
    for (let i = 0; i < points.length; i++) {
      const p0 = points[i-1];
      const p1 = points[i];

      if (!i) {
        continue;
      }
      if (p0[1] >= maxY && p1[1] >= maxY) {
        continue;
      }

      maskGraphics.lineBetween(p0[0], p0[1], p1[0], p1[1]);
      maskGraphics.fillCircle(p1[0], p1[1], radius);
    }

    const mask = new Phaser.Display.Masks.BitmapMask(this, maskGraphics);
    graphics.fillStyle(color, 0.3).fillRect(0, 0, ...this.fit(this.xPadding + this.xWidth, this.baseHeight));
    graphics.setMask(mask);
  }

  drawCurrCurve(graphics, points, color, radius) {
    if (!points) return;

    const visiblePoints = points.filter(p => p[0] > this.cameras.main.scrollX - 100 && p[0] < this.cameras.main.scrollX + this.cameras.main.width + 100);
    if (visiblePoints.length === 0) return;

    graphics.clear();
    graphics.lineStyle(radius * 2, color);
    for (let i = 1; i < visiblePoints.length; i++) {
        graphics.lineBetween(visiblePoints[i - 1][0], visiblePoints[i - 1][1], visiblePoints[i][0], visiblePoints[i][1]);
    }
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