const THREE_MINUTES = 1000 * 60 * 3; // 3 minutes in milliseconds

console.log('Task started. Waiting 3 minutes before completing...');

setTimeout(() => {
  const fs = require('fs');
  const filePath = 'task-complete.txt';
  const message = 'Task completed at ' + new Date().toISOString() + '\n';
  fs.writeFileSync(filePath, message);
  console.log('Task completion file written: task-complete.txt');
}, THREE_MINUTES);

console.log('Task is running in background. It will complete in approximately 3 minutes.');