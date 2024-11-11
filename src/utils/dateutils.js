import { exec } from 'child_process';

export function getWeek(date) {
  const dateString = date.toISOString().split('T')[0];

  const scriptPath = './src/utils/getWeek.sh';

  return new Promise((resolve, reject) => {
    exec(`${scriptPath} ${dateString}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error running getWeek.sh: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Error: ${stderr}`);
        return;
      }
      resolve(stdout.trim());
    });
  });
}
