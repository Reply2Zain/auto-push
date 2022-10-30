#!/usr/bin/env node
const schedule = require('node-schedule');
const {exec} = require('child_process');

// current date
const current = new Date();
// start time in MS
const startTime = Date.now();
// the command to run
let cmdToRun = '';
// ex input "-h 2 -m 5 -s 30" (2h 5m 30s)
const inputsArray = process.argv.slice(2);

if(inputsArray.includes('--help')){
  console.log(
    'this program runs a custom command after a specified duration\n' +
    'params:\n' +
    '-h => hours\n' +
    '-m => minutes\n' +
    '-s => seconds\n' +
    '-c => your command to run \n' +
    'example command: node auto-push.js -h 1 -m 20 -c "cd ../gitProject && git push"\n'
  );
  process.exit(0);
}

const customCmd = getFlagValue('-c', inputsArray);

if (customCmd){
  cmdToRun = customCmd;
} else if (!cmdToRun) {
  console.log('no cmd provided, try \'--help\'');
  process.exit(0);
}


let addHour = getFlagVariableAsNum('-h', inputsArray) || 0;
let addMin = getFlagVariableAsNum('-m', inputsArray) || 0;
let addSec = getFlagVariableAsNum('-s', inputsArray) || 0;
if (addHour + addMin + addSec === 0){
  console.log('no time set, exiting...');
  process.exit(0);
} else {
  console.log(`command: ${cmdToRun}`);
}
current.setHours(current.getHours() + addHour, current.getMinutes() + addMin, current.getSeconds() + addSec);

console.log(`waiting ${addHour}h ${addMin}m ${addSec}s`);
const job = schedule.scheduleJob(current, function(){
  console.log(`running: ${cmdToRun}`);
  exec(cmdToRun);
  process.emit('SIGINT');
});

process.on('SIGINT', function () {
  schedule.gracefulShutdown()
    .then(() => process.exit(0))
});

/**
 * Returns the value flag provided, if the flag was found.
 * @param array
 * @param flag
 * @return {undefined|*}
 */
function getFlagValue(flag, array) {
  if (!array || !flag) {
   throw new Error('missing required parameter');
  }
  const foundIndex = array.findIndex(val => val === flag);
  if (foundIndex < 0) return undefined;
  if (!array[foundIndex + 1]) return undefined;
  let val = '';
  let i = 1;
  while(array[foundIndex + i] && array[foundIndex + i][0] !== '-'){
    val += array[foundIndex + i] + ' ';
    i++
  }
  return val;
}

/**
 * Gets the value of the flag as a number.
 * @param array
 * @param flag
 */
function getFlagVariableAsNum(flag, array) {
  const flagVariable = getFlagValue(flag, array);
  const number = Number(flagVariable);
  if (Number.isNaN(flagVariable)) return undefined;
  else return number;
}

// c = CMD
// any-key = time left
process.stdin.on("data", data => {
  if (data.toString().trim().toLowerCase() === 'c') {
    console.log(`command: ${cmdToRun}`);
    return;
  }
  const timeElapsedMS = Date.now() - startTime;
  const timeElapsedSec = (timeElapsedMS / 1000);
  const totalTimeSec = (addHour * Math.pow(60,2)) + (addMin * 60) + addSec;
  const timeRemainingSec = totalTimeSec - timeElapsedSec
  // is floored
  const timeRemainingHourOnly = Math.floor(timeRemainingSec / Math.pow(60,2));
  const timeRemainingMinOnly = Math.floor(timeRemainingSec / Math.pow(60,1) % 60);
  const timeRemainingSecOnly = Math.floor(timeRemainingSec % 60);
  console.log(`waiting ${timeRemainingHourOnly}h ${timeRemainingMinOnly}m ${timeRemainingSecOnly}s`);
})
