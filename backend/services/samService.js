const { spawn } = require('child_process');
const path = require('path');

/**
 * Executes SAM 2 Python segmentation script to estimate body position & generate silhouette mask.
 * @param {string} imageInput - Base64 image data string or URL path.
 * @returns {Promise<Object>} SAM 2 estimation result object.
 */
function estimateBodyPositionWithSAM2(imageInput) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'utils', 'samSegmenter.py');

    // Spawn Python 3 child process
    const pythonProc = spawn('python3', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdoutData = '';
    let stderrData = '';

    pythonProc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pythonProc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pythonProc.on('close', (code) => {
      if (code !== 0) {
        console.error('SAM 2 Python Script Error:', stderrData);
        return reject(new Error(`SAM 2 process exited with code ${code}: ${stderrData}`));
      }

      try {
        // MediaPipe's native layer can print warnings to stdout, so the JSON
        // is not guaranteed to be the whole buffer. Take the last line that
        // parses as a JSON object.
        const lines = stdoutData.trim().split('\n').filter(Boolean);
        let jsonResult = null;
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{')) {
            jsonResult = JSON.parse(line);
            break;
          }
        }
        if (!jsonResult) throw new Error('no JSON line in output');
        resolve(jsonResult);
      } catch (err) {
        console.error('Failed to parse SAM 2 output:', stdoutData);
        reject(new Error('Invalid JSON output from SAM 2 processor script.'));
      }
    });

    pythonProc.on('error', (err) => {
      console.error('Failed to spawn SAM 2 python process:', err);
      reject(err);
    });

    // Write image input to stdin
    pythonProc.stdin.write(imageInput);
    pythonProc.stdin.end();
  });
}

module.exports = {
  estimateBodyPositionWithSAM2,
};
