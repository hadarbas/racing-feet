import Telemetry from '../ ibt-telemetry';
import * as BrowserFS from 'browserfs';
import Papa from 'papaparse';
import { camelCase } from 'lodash';

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

export const loadCsvFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;

      const lines = data.split(/\r?\n/);
      const lineSeparatorIndex = findBackwardsIndex(lines, line =>
        line
          .split(',')
          .every(cell => !cell));
      if (lineSeparatorIndex === -1) {
        return resolve({
          meta: null,
          records: parseCsvData(data),
        });
      }
      const meta = Object.fromEntries(
        lines
          .slice(lineSeparatorIndex + 1)
          .map(line => line.split(',')[0].split('='))
          .map(([key, value]) => [
            camelCase(key.trim()),
            value ? value.trim() : null,
          ])
      );
      const records = parseCsvData(lines.slice(0, lineSeparatorIndex).join('\n'));
      resolve({meta, records});
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

function findBackwardsIndex(array, predicate) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return i;
    }
  }
  return -1;
}

const parseCsvData = (data) => {
  const { data: records } = Papa.parse(data);
  const [header, ...samples] = records;

  return samples
    .map(sample => Object.fromEntries(
      header.map((name, index) => [name, sample[index]])
    ));
};
