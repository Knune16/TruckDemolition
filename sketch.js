let sprite;
let characters = [];
let obstacles = [];
let timer;
let truckPower = 5;
let obstacleInbterval;
let elapsedTime = 0;

let bgMusic;
let sounds;

let startButton;
let gameStarted = false;

let port;
let joyX = 0, joyY = 0, sw = 0;
let mSpeed = 5;

let melodyPlayed = false;

let bg;

function preload(){
  
}

sounds = new Tone.Players({
  'break': "Assets/glassBreak.flac",
  'Motor': "Assets/TruckSound.wav",
}).toDestination();


bgMusic = new Tone.Player("Assets/BackGroundSound.wav").toDestination();

bgMusic.loop = true;

function setup() {
  port = createSerial();
  bg = loadImage("Assets/pixil-frame-0 (2).png");
  createCanvas(1000, 700);
  
  let usedPorts = usedSerialPorts();
  if(usedPorts.length > 0){
    port.open(usedPorts[0], 57600);
  }
  frameRate(60);

  startButton = createButton("Start Game");
  startButton.position(width / 2 - startButton.width / 2, height / 2);
  startButton.mousePressed(startGame);
}

function startGame(){
  startButton.hide();
  gameStarted = true;
  
  //Truck Animations 
  let animation = {
    stand: { row: 0, frames: 1},
    walkRight: { row: 0, col: 0, frames: 1},
    walkUp: { row: 2.5, col: 0, frames: 1},
    walkDown: { row: 0, col: 2.5, frames: 1}
  };
  
  //Truck Sprite
  characters.push(character = new Truck(100,100,120,120,'Assets/Red_BOXTRUCK_CLEAN_8D_000-sheet.png',animation,truckPower));

  obstacleInbterval = setInterval(generateObstacles, 2000);

  bgMusic.start()
  bgMusic.volume.value = -20;
}

function endGame(){
  textSize(40);
  fill(0);
  text('GameOver', 500, 350);
  textSize(20);
  gameStarted = false;
  elapsedTime = 0;
  bgMusic.stop();
  
}

function draw() {
  background(bg);
  if(gameStarted){
    elapsedTime += deltaTime / 1000;
  }

  let latest = port.readUntil("\n");
  let values = latest.split(",");
  if (values.length > 2){
    joyX = values[0];
    joyY = values[1];
    sw = values[2];


    //Truck's movement logic
characters.forEach((Truck) => {
  Truck.draw();
  if(joyX > 0){
    Truck.walkRight();
  }
  else if(joyX < 0){
    Truck.walkLeft();
  }
  else if(joyY < 0){
    Truck.walkUp();
  }
  else if(joyY > 0){
    Truck.walkDown();
  }
  else {
    Truck.stop();
  }

  if(sw == 1){
    sounds.player("Motor").start();
    sounds.player("Motor").volume.value = 1;
  }
  else{
    sounds.player("Motor").stop();
  }

  obstacles.forEach((obstacle) => { 
      //calling obstacle's draw function to display obstacle's power
      obstacle.draw();
    if(Truck.sprite.overlaps(obstacle.sprite)) {
      if(Truck.sprite.truckPower > obstacle.sprite.obstaclePower){
        //calling obstacle's remove function to set active = false; 
        obstacle.remove();
        sounds.player("break").start();
        sounds.volume.value = -20;
        port.write('R');
        setTimeout(() => {
          port.write('O');
        }, 250);
        
      Truck.sprite.truckPower += obstacle.sprite.obstaclePower;
      }else{
        Truck.sprite.truckPower -= obstacle.sprite.obstaclePower;
      } 
    }
    if(Truck.sprite.truckPower <= 0 ){
      endGame();
      if(!melodyPlayed){
        port.write('M');
        melodyPlayed = true;
        
    }
        obstacle.remove();
        Truck.remove();
     }
  });
  

  if(Truck.sprite.x + Truck.sprite.width/4 > width){
    Truck.walkLeft();
 } 
else if (Truck.sprite.x - Truck.sprite.width/4 < 0){
  Truck.walkRight();
   } 
});

  }
  
  //Setting a timer 
  
  textSize(30)
  text("" + int(elapsedTime),5,25);
  
  
}

  //Function to generate obstacle sprites with random values
function generateObstacles(){
 
    let x = random(0, width);
    let y = random(0, height);
    let size = random( 20, 50);
    let obstaclePower; 
    if (elapsedTime < 20){
     obstaclePower = random(1, 8) + (elapsedTime * 0.5);
    }
    else if (elapsedTime >= 20){
      obstaclePower = random(1, 8) + (elapsedTime * 2);
    }
    else if (elapsedTime >= 40){
      obstaclePower = random(1, 8) + (elapsedTime * 10);
    }
    
      obstacles.push(new Obstacle(x, y, size,obstaclePower));
    
    
  
}
 

class Truck{
  constructor(x,y,width,height,spriteSheet,animation,truckPower){
  this.sprite = new Sprite(x,y,width,height,);
  this.sprite.spriteSheet = spriteSheet;
  this.sprite.truckPower = truckPower;

  this.sprite.anis.frameDelay = 6;
  this.sprite.addAnis(animation);
  this.sprite.changeAni('stand');
  this.active = true;

  }
  
  walkRight(){
    this.sprite.changeAni('walkRight');
    this.sprite.vel.x = 3;
    this.sprite.scale.x = 1;
    this.sprite.vel.y = 0;
   }
   
   walkLeft(){
     this.sprite.changeAni('walkRight');
     this.sprite.vel.x = -3;
     this.sprite.scale.x = -1;
     this.sprite.vel.y = 0;
   }
   
   walkUp(){
     this.sprite.changeAni('walkUp');
     this.sprite.vel.y = -3;
     this.sprite.vel.x = 0;
   }
   
   walkDown(){
    this.sprite.changeAni('walkDown');
    this.sprite.vel.y = 3;    
    this.sprite.vel.x = 0;
   }
   
   stop(){
     this.sprite.vel.x = 0;
     this.sprite.vel.y = 0;
   }

  draw(){
    if(this.active){
      //function to display truck's power value
      textSize(16);
      fill(0);
      text(" "+ int(this.sprite.truckPower), this.sprite.x + this.sprite.width / 2, this.sprite.y -10);
    }
  }

  remove(){
    this.active = false;
    this.sprite.remove();
  }
}

class Obstacle{
  constructor(x,y,size, obstaclePower){
    this.sprite = new Sprite(x, y, size, 's');
    this.sprite.obstaclePower = obstaclePower;
    this.active = true;
    
  }

  //function to display obstacle's power values
  draw(){
    if (this.active){
  textSize(16);
  fill(0);
  text(" " + int(this.sprite.obstaclePower), this.sprite.x + this.sprite.width / 2, this.sprite.y - 10);
    } 
 }
  //function to remove obstacle's power if is not active 
  remove(){
    this.active = false;
    this.sprite.remove();
  }
}

function connect(){
  if(!port.opned()){
    port.open('Arduino', 57600);
  }
  else{
    port.close();
  }
}