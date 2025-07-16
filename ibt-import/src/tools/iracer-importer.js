import Papa from 'papaparse';

export const importIRacerCSV = (file, callback) => {
  const reader = new FileReader();

  const clamp = v => 2 * (Math.max(-1, Math.min(1, v))) - 1;

  reader.onload = (event) => {
    const csvData = event.target.result;

    Papa.parse(csvData, {
      skipEmptyLines: true,
      preview: 15,
      complete: (result) => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          beforeFirstChunk: (chunk) => {
            return chunk.split("\n").slice(14).join("\n");
          },
          complete: (result) => {
            const mappedData = result.data.map((row, index) => {
              // const rawSteering = parseFloat(row["Steeringangle"]?.trim()) || 0;
              const percent = parseFloat(row["F brake pressure"]?.trim().replace("%", "")) || 0;
              const rawBrake =  percent / 25;

              const rawThrottle = (parseFloat(row["F88 PPSA"]?.trim()) || 0) / 100;

              return {
                // SteeringWheelAngle: clamp(rawSteering), // volan više ne čitamo
                Brake:    clamp(rawBrake),
                Throttle: clamp(rawThrottle),
                SessionTime: parseFloat((index * (16.66 / 1000)).toFixed(6)),
              };
            });

            callback(mappedData);
          },
          error: (err) => {
            console.error(err);
            alert(err);
          },
        });
      },
    });
  };

  reader.readAsText(file);
};
