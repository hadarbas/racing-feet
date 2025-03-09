import Papa from 'papaparse';

export const importIRacerCSV = (file, callback) => {
  const reader = new FileReader();

  reader.onload = (event) => {
    const csvData = event.target.result;
    console.log(csvData);

    Papa.parse(csvData, {
      skipEmptyLines: true,
      preview: 15, // Parsira samo prvih 15 redova da dohvatimo nazive kolona
      complete: (result) => {
        const columnNames = result.data[result.data.length - 1]; // Uzimamo 15. red kao header
        console.log("Nazivi kolona:", columnNames);

        // Ponovno parsiranje, sada sa pravim headerima
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          beforeFirstChunk: (chunk) => {
            const lines = chunk.split("\n").slice(14);
            return lines.join("\n");
          },
          complete: (result) => {
            const mappedData = result.data.map((row, index) => ({
              SteeringWheelAngle: parseFloat(row["Steeringangle"]?.trim()) || 0,
              Brake: Math.min(parseFloat(row["F brake pressure"]?.trim()) / 5 || 0, 1),
              Throttle: Math.min(parseFloat(row["F88 PPSA"]?.trim()) / 100 || 0, 1),
              SessionTime: parseFloat((index * (16.66 / 1000)).toFixed(6)),
            }));

            console.log("Mapped Data:", mappedData); // Log za provjeru
            callback(mappedData);
          },
          error: (err) => {
            console.error("Greška pri parsiranju CSV-a:", err);
          },
        });
      },
    });
  };

  reader.readAsText(file);
};

