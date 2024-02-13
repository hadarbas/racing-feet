import 'regenerator-runtime/runtime';

import { loadIbtFile } from "./loader";
import fs from 'fs';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Syntax: node index.js <file-path>");
    process.exit(1);
  }

  const telemetry = await loadIbtFile(filePath);
  const csvData = [];
  const maxRows = 1000;

  for await (const sample of telemetry.samples()) {
    const json: Object = sample.toJSON();

    if (!csvData.length) {
      const header = Object
        .keys(json)
        .join(',');
      csvData.push(header);
    }

    const row = Object
      .values(json)
      .map(({value}) => value)
      .join(',');
    csvData.push(row);

    // Update progress
    process.stdout.write(`Converting samples to CSV: ${csvData.length} rows\r`);

    if (csvData.length >= maxRows) {
      break;
    }
  }

  const csvContent = csvData.join('\n');

  const outputFilePath = filePath.replace(/\.[^/.]+$/, ".csv");
  fs.writeFileSync(outputFilePath, csvContent);

  console.log('\nCSV file generated successfully!');
}

main();
