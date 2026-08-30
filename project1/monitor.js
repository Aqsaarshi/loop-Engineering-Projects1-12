const fs = require('fs');
const filePath = 'task-complete.txt';

let checks = 0;
const MAX_CHECKS = 5;
let completed = false;

const intervalId = setInterval(() => {
  checks++;
  if (fs.existsSync(filePath)) {
    if (!completed) {
      console.log('Task finished successfully!');
      completed = true;
    }
    clearInterval(intervalId);
    process.exit(0);
  }
  if (checks >= MAX_CHECKS) {
    clearInterval(intervalId);
    console.log('Maximum check limit reached. Stopping safely.');
    process.exit(0);
  }
}, 1000 * 60); // 60 seconds

console.log('Monitoring started. Checking every 60 seconds for task-complete.txt');