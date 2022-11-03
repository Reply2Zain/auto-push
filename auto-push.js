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
// how long to wait before closing the terminal (when there is no more output being received from the command)
const CLOSE_TERMINAL_TIME = 5;


if(inputsArray.includes('--help')){
  console.log(
    'this program runs a custom command after a specified duration\n' +
    'params:\n' +
    '-d => days\n' +
    '-h => hours\n' +
    '-m => minutes\n' +
    '-s => seconds\n' +
    '-c => your command to run \n' +
    'example command: node auto-push.js -h 1 -m 20 -c "cd ../gitProject && git push"\n' +
    'explanation: this will wait 1h 20m before executing the command'
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


let addDay = getFlagVariableAsNum('-d', inputsArray) || 0;
let addHour = getFlagVariableAsNum('-h', inputsArray) || 0;
let addMin = getFlagVariableAsNum('-m', inputsArray) || 0;
let addSec = getFlagVariableAsNum('-s', inputsArray) || 0;
if (addDay + addHour + addMin + addSec === 0){
  console.log('no time set, exiting...');
  process.exit(0);
} else {
  console.log(`command: ${cmdToRun}`);
}
current.setHours(current.getHours() + (addHour + (24 * addDay)), current.getMinutes() + addMin, current.getSeconds() + addSec);

console.log(`waiting${getTimeRemainingStr()} (press enter to view time left)`);
schedule.scheduleJob(current, function(){
  console.log(`running command: ${cmdToRun}`);
  exec(cmdToRun, (err, output) => {
    if (err) {
      console.log('[ERROR]\n' + err.message);
    }
    else if (output) {
      console.log(output);
    }
    console.log(`closing terminal... (${CLOSE_TERMINAL_TIME} seconds)`)
    // note assumes that command takes less than CLOSE_TERMINAL_TIME (seconds) to complete
    setTimeout(()=> {
      process.emit('SIGINT');
    }, CLOSE_TERMINAL_TIME * 1000);
  });
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
  console.log(`waiting ${getTimeRemainingStr()}`);
})

function getTimeRemainingStr() {
  const timeElapsedMS = Date.now() - startTime;
  const timeElapsedSec = (timeElapsedMS / 1000);
  const totalTimeSec = (addDay * Math.pow(60,2) * 24) + (addHour * Math.pow(60,2)) + (addMin * 60) + addSec;
  const timeRemainingSec = totalTimeSec - timeElapsedSec
  // time remaining days only
  const timeDayOnly = Math.floor(timeRemainingSec / (Math.pow(60,2) * 24));
  // time remaining hours only
  const timeHourOnly = Math.floor(timeRemainingSec / Math.pow(60,2) % 24);
  // time remaining minutes only
  const timeMinOnly = Math.floor(timeRemainingSec / Math.pow(60,1) % 60);
  // time remaining seconds only
  const timeSecOnly = Math.floor(timeRemainingSec % 60);
  return `${tFlagStr('d', timeDayOnly)}${tFlagStr('h', timeHourOnly)}${tFlagStr('m', timeMinOnly)} ${timeSecOnly}s`
}

// display time per flag
function tFlagStr(flag, time) {
  return `${time ? ` ${time}${flag}` : ''}`;
}
