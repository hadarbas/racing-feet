import Telemetry from '../ ibt-telemetry';
import * as BrowserFS from 'browserfs';

export const loadIbtFile = async (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result;
    BrowserFS.configure({
      fs: 'InMemory'
    }, async e => {
      if (e) {
        reject(e);
        return;
      }

      const fs = BrowserFS.BFSRequire('fs');
      const { Buffer } = BrowserFS.BFSRequire('buffer');
      fs.writeFileSync(file.name, Buffer.from(data));

      const telemetry = await Telemetry.fromFile(file.name);
      resolve(telemetry);
    });
  };
  reader.onerror = reject;
  reader.readAsArrayBuffer(file);
});

