// Module Web Worker wrapper around the equity engine.
import { equity } from './equity.js';

self.onmessage = (e) => {
  const { hands, board, trials } = e.data;
  try {
    const result = equity({
      hands, board, trials,
      onProgress: (partial) => self.postMessage({ type: 'progress', result: partial }),
    });
    self.postMessage({ type: 'done', result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
