import "phaser";

type Sprite = Phaser.Physics.Arcade.Sprite;
type SpriteWithDynamicBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export default class Demo extends Phaser.Scene {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  stars: Phaser.Physics.Arcade.Group;
  scoreText: Phaser.GameObjects.Text;
  bombs:
    | Phaser.GameObjects.Group
    | Phaser.GameObjects.GameObject
    | Phaser.GameObjects.GameObject[]
    | Phaser.GameObjects.Group[];
  gameOver = false;

  private _score = 0;
  gameOverText: Phaser.GameObjects.Text;

  get score() {
    return this._score;
  }

  constructor() {
    super("demo");
    window["demo"] = this;
    window["currentScore"] = this.getCurrentScore;
  }

  getCurrentScore = () => {
    return this.score;
  };

  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.image("libs", "assets/libs.png");

    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    this.platforms = this.physics.add.staticGroup();

    this.add.image(400, 300, "sky");
    this._addPlatforms();
    this._addMainPlayer();

    this.physics.add.collider(this.player, this.platforms);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate((child: Sprite) => {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(this.stars, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      undefined,
      this
    );

    this.scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      fill: "#000",
    } as any);

    this.gameOverText = this.add.text(300, 200, "", {
      fontSize: "32px",
      fill: "#000",
    } as any);

    this.bombs = this.physics.add.group();
    this.physics.add.collider(this.bombs, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.bombs,
      this.hitBomb,
      undefined,
      this
    );
  }

  update() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);

      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);

      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-350);
    }
  }

  collectStar(_player: SpriteWithDynamicBody, star: Sprite) {
    star.disableBody(true, true);

    this.addStarPoints();

    if (this.stars.countActive(true) <= 2) {
      this._addBomb();
    }

    if (this.stars.countActive(true) <= 0) {
      this.stars.children.iterate((child: Sprite) => {
        child.enableBody(true, child.x, 0, true, true);
      });
    }
  }

  hitBomb(player: SpriteWithDynamicBody, bomb: Sprite) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play("turn");

    this.gameOver = true;
    this.gameOverText.setText("GAME OVER!");
  }

  addStarPoints() {
    this._score += 100;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  private _addBomb() {
    const x =
      this.player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    const bomb = (this.bombs as Phaser.GameObjects.Group).create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }

  private _addPlatforms() {
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();

    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");
  }

  private _addMainPlayer() {
    this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this._addMainPlayerAnimations();
  }

  private _addMainPlayerAnimations() {
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: "#125555",
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: Demo,
};

const game = new Phaser.Game(config);
