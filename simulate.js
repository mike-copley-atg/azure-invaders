// INPUTS:
// 1. player ship count
// 2. wave
// 3. shield states

// OUTPUTS:
// 1. player ship count
// 2. enemy ship count
// 3. shield states

const SIM_TIME_STEP_MS = 10;
const SIM_SIZE_X = 384;
const SIM_SIZE_Y = 384;
const SIM_EDGE_T_INCLUSIVE = 0;
const SIM_EDGE_L_INCLUSIVE = 0;
// dependent on:
// SIM_SIZE_Y
const SIM_EDGE_B_INCLUSIVE = 383;
// dependent on:
// SIM_SIZE_X
const SIM_EDGE_R_INCLUSIVE = 383;

const MIN_INVADER_MOVE_PIXELS_PER_SEC = 1;
const MAX_INVADER_MOVE_PIXELS_PER_SEC = 100;

const INVADER_MOVE_DOWN_PIXELS = 8;
const INVADER_SIZE_Y = 12;
const INVADER_SIZE_X = 16;
const INVADER_SPACE_SIZE_X = 8;
const INVADER_SPACE_SIZE_Y = 8;
const INVADER_GROUP_START_ROWS = 5;
const INVADER_GROUP_START_COLS = 11;

const INVADER_GROUP_START_EDGE_T_INCLUSIVE = 0;
// dependent on: 
// SIM_SIZE_X 
// INVADER_START_GROUP_COLS 
// INVADER_SIZE_X
// INVADER_SPACE_SIZE_X 
const INVADER_GROUP_START_EDGE_L_INCLUSIVE = 64;
// dependent on: 
// INVADER_GROUP_START_EDGE_T_INCLUSIVE
// INVADER_START_GROUP_ROWS
// INVADER_SIZE_Y
// INVADER_SPACE_SIZE_Y
const INVADER_GROUP_START_EDGE_B_INCLUSIZE = 72;
// dependent on:
// INVADER_GROUP_START_EDGE_L_INCLUSIVE
// SIM_SIZE_X
const INVADER_GROUP_START_EDGE_R_INCLUSIVE = 320;

// note: first 16 bits -> first frame, second 16 bits -> second frame
// note: bits are ordered top to bottom, left to right
const INVADER_TYPE_1_COLLISION_MASK = [
    0b00000000000000000000000000000000,
    0b00000011110000000000001111000000,
    0b00000111111000000000011111100000,
    0b00001111111100000000111111110000,
    0b00011111111110000001111111111000,
    0b00111111111111000011111111111100,
    0b00111111111111000010000000000100,
    0b00011111111110000011000000001100,
    0b00001111111100000011100000011100,
    0b00000111111000000011110000111100,
    0b00000011110000000011111111111100,
    0b00000000000000000000000000000000,
]
const INVADER_TYPE_2_COLLISION_MASK = [
    0b00000000000000000000000000000000,
    0b00000011110000000000001111000000,
    0b00000111111000000000011111100000,
    0b00001111111100000000111111110000,
    0b00011111111110000001111111111000,
    0b00111111111111000011111111111100,
    0b00111111111111000011111111111100,
    0b00111111111111000010111111110100,
    0b00111111111111000110011111100110,
    0b00111111111111001110001111000111,
    0b00111111111111001111111111111111,
    0b00000000000000000000000000000000,
]
const INVADER_TYPE_3_COLLISION_MASK = [
    0b00000000000000000000000000000000,
    0b00000011110000000000001111000000,
    0b00000111111000000000011111100000,
    0b00111111111111000011111111111100,
    0b00111111111111000110011111100110,
    0b00111111111111001110001111000111,
    0b00111111111111001110001111000111,
    0b00111111111111000110011111100110,
    0b00111111111111000011111111111100,
    0b00000111111000000000011111100000,
    0b00000011110000000000001111000000,
    0b00000000000000000000000000000000,
]

////////////////////////////////////////
// INITIALIZATION
////////////////////////////////////////

var invaderCollisionMasks = [
  0,
  INVADER_TYPE_1_COLLISION_MASK,
  INVADER_TYPE_2_COLLISION_MASK,
  INVADER_TYPE_3_COLLISION_MASK
]
var invaderRowTypes = [1, 2, 2, 3, 3]
var invaderRows = []

var invadersHorzExtents = [];
var invadersVertExtents = [];

var invaderMovementSpeed = 0;

var doChangeInvaderMoveDirection = false;
var invaderMoverFunction = moveInvadersLeft;

// returns the movement horizontally movement speed of the invaders in simulation 
// pixels per second...
function calculateMovementSpeed(wave) {
  return 16;
}

function initializeInvaderRow(type) {
  var rowInvaders = [];
  for (var col = 0; col < INVADER_GROUP_START_COLS; col++) {
    rowInvaders[col] = type;
  }
  return rowInvaders;
}

function initializeInvaders() {
  for (var row = 0; row < INVADER_GROUP_START_ROWS; row++) {
    invaderRows[row] = initializeInvaderRow(invaderRowTypes[row]);
  }

  invadersHorzExtents[0] = INVADER_GROUP_START_EDGE_L_INCLUSIVE;
  invadersHorzExtents[1] = INVADER_GROUP_START_EDGE_R_INCLUSIVE;
  invadersVertExtents[0] = INVADER_GROUP_START_EDGE_T_INCLUSIVE;
  invadersVertExtents[1] = INVADER_GROUP_START_EDGE_B_INCLUSIZE;

  invaderMovementSpeed = calculateMovementSpeed(0) * SIM_TIME_STEP_MS * 0.001;
  console.debug("INVADER MOVE SPEED = " + invaderMovementSpeed);

  doChangeInvaderMoveDirection = false;
  invaderMoverFunction = moveInvadersLeft;
}

////////////////////////////////////////
// MOVEMENT PHASE FUNCTIONS
////////////////////////////////////////

function showInvadersExtents() {
  return "he = " + invadersHorzExtents + ", ve = " + invadersVertExtents;
}

function moveInvaders() {
  if (doChangeInvaderMoveDirection) {
    console.debug("Change direction: " + showInvadersExtents());
    moveInvadersDown();
    doChangeInvaderMoveDirection = false;
  } else {
    doChangeInvaderMoveDirection = invaderMoverFunction();
  }
}

// returns 'true' if the invaders need to change movement direction since the group hit
// the left edge of the simulation space
function moveInvadersLeft() {
  invadersHorzExtents[0] -= invaderMovementSpeed;
  invadersHorzExtents[1] -= invaderMovementSpeed;

  var lOverlap = invadersHorzExtents[0] - SIM_EDGE_L_INCLUSIVE;
  if (lOverlap < 0) {
    var invadersWidth = invadersHorzExtents[1] - invadersHorzExtents[0];
    invadersHorzExtents[0] = SIM_EDGE_L_INCLUSIVE;
    invadersHorzExtents[1] = invadersHorzExtents[0] + invadersWidth;
    invaderMoverFunction = moveInvadersRight;
  }

  return lOverlap < 0;
}

// returns 'true' if the invaders need to change movement direction since the group hit
// the right edge of the simulation space
function moveInvadersRight() {
  invadersHorzExtents[0] += invaderMovementSpeed;
  invadersHorzExtents[1] += invaderMovementSpeed;

  var rOverlap = invadersHorzExtents[1] - SIM_EDGE_R_INCLUSIVE;
  if (rOverlap > 0) {
    var invadersWidth = invadersHorzExtents[1] - invadersHorzExtents[0];
    invadersHorzExtents[1] = SIM_EDGE_R_INCLUSIVE;
    invadersHorzExtents[0] = invadersHorzExtents[1] - invadersWidth;
    invaderMoverFunction = moveInvadersLeft;
  }

  return rOverlap > 0;
}

function moveInvadersDown() {
  invadersVertExtents[0] += INVADER_MOVE_DOWN_PIXELS;
  invadersVertExtents[1] += INVADER_MOVE_DOWN_PIXELS;
}

////////////////////////////////////////
// COLLISION PHASE FUNCTIONS
////////////////////////////////////////

function didInvadersHitBottom() {
  return invadersVertExtents[1] > SIM_EDGE_B_INCLUSIVE;
}

////////////////////////////////////////
// SIMULATION FUNCTIONS
////////////////////////////////////////

var isSimulationComplete = false;
var simulationTicks = 0;

function doSimulation() {
  isSimulationComplete = false;
  simulationTicks = 0;

  initializeInvaders();

  while (!isSimulationComplete) {
    updateSimulation();
    simulationTicks++;
  }

  // TODO: any post simulation wrap-up?
  console.debug("DONE! in " + simulationTicks + " ticks, or " + simulationTicks * SIM_TIME_STEP_MS + " ms");
}

function updateSimulation() {
  // step 1: assess inputs, modify properties (like player movement direction)
  
  // step 2: add to provisional spawn queues (like player and enemy bullets)
  
  // step 3: move player and enemy entities
  moveInvaders();

  // step 4: handle entity collisions
  //  --> enemies against bottom-of-the-simulation-screen collision check (terminating)
  isSimulationComplete = didInvadersHitBottom();
  if (isSimulationComplete) {
    return;
  }

  //  --> enemies against shields collision check (non-terminating)
  //  --> enemies against player bullet collision check (maybe terminating)
  //  --> enemies against player collision check (terminating)
  //  --> player against enemy bullets collision check (terminating)
}

doSimulation();
