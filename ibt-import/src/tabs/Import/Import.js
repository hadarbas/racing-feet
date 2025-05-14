import {useState, useCallback, useMemo} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {Column, Table} from 'react-virtualized';
import {
  ChartContainer, LineChart, ChartRow, Charts, YAxis,
  styler, Legend,
  MultiBrush,
} from 'react-timeseries-charts';
import {TimeSeries} from 'pondjs';
import Button from '@mui/joy/Button';
import { importIRacerCSV } from '../../tools/iracer-importer';

import { setDocument, getDocuments } from 'shared/services/firebase/db';
import '../../buffer';
import 'react-virtualized/styles.css'; // only needs to be imported once

import { loadCsvFile } from '../../tools/file-loader';
import { useTimeRanges } from './useTimeRanges';

import { RootContainer, TopPane, RowPane, SnapRight  } from './Import.styled';

function Import() {
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [samples, setSamples] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState('');
  const [sampleCount] = useState(0);
  const sampleSeries = useMemo(() => {
    const result = new TimeSeries({
    name: fileName,
    columns: ["time", "brake", "throttle", "wheel"],
    points: samples.map((sample) => [
      parseFloat(sample.SessionTime),
      parseFloat(sample.Brake),
      parseFloat(sample.Throttle),
      parseFloat(sample.SteeringWheelAngle),
      ]),
    });
    return result;
  }, [samples, fileName]);
  const timeRanges = useTimeRanges(samples);
  const [meta, setMeta] = useState({});

  const handleCsvChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true); // Set isLoading to true

    try {
      var {meta, records} = await loadCsvFile(file);

      if (!meta) {
        /*console.error('No metadata found');
        alert('No metadata found');
        return;*/
        meta = {}
        meta.name = "Exercise"
      }
      setMeta(meta);
      const header = Object.keys(records[0]);
      const columns = header.map(name => ({name, label: makeLabel(name)}));
      setColumns(columns);

      for (let i = 0; i < records.length; i++) {
        const point = records[i];
        const invalidFields = [];

        if (point.SteeringWheelAngle < -1 || point.SteeringWheelAngle > 1) {
          invalidFields.push(`SteeringWheelAngle (${point.SteeringWheelAngle})`);
        }
        if (point.Brake < -1 || point.Brake > 1) {
          invalidFields.push(`Brake (${point.Brake})`);
        }
        if (point.Throttle < -1 || point.Throttle > 1) {
          invalidFields.push(`Throttle (${point.Throttle})`);
        }

        if (invalidFields.length > 0) {
          throw new Error(
            `Line ${i + 1}: Value(s) out of range [-1, 1]: ${invalidFields.join(", ")}`
          );
        }
      }

      setSamples(records);
      setFileName(file.name); 
    } catch (error) {
      alert(error)
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const handleRowData = useCallback(({index}) => {
    return samples[index];
  }, [samples]);
  const columnMinWidth = 100;
  const [isSaving, setIsSaving] = useState(false); 

  const handleUpload = useCallback(async () => {
    setIsSaving(true);
    try {
      if (!samples.length) {
          alert("No data to upload!");
          setIsSaving(false);
          return;
      }
  
      const minTime = parseFloat(samples[0].SessionTime);
      const data = samples.map(({ SessionTime, Brake, Throttle, SteeringWheelAngle }) => ({
          time: parseFloat(SessionTime) - minTime,
          red: parseFloat(Brake),
          green: parseFloat(Throttle),
          blue: parseFloat(SteeringWheelAngle),
      }));
  
      const levelsSnapshot = await getDocuments("levels");
      const existingOrderIds = levelsSnapshot.docs.map(doc => doc.data().order_id);
  
      if (existingOrderIds.includes(meta.orderId)) {
          alert(`Order ID ${meta.orderId} already exists`);
          return
      }
  
      await setDocument(
          { 
              name: meta.name, 
              difficulty: meta.difficulty, 
              order_id: meta.orderId, 
              instructions: meta.instructions, 
              folderTag: meta.folderTag, 
              lock: meta.lock,  
              data 
          }, 
          "levels", 
          meta.name
      );
  
      console.log(`Level '${meta.name}' uploaded successfully with order_id: ${meta.orderId}`);
  
      const usersSnapshot = await getDocuments("users");
      const users = usersSnapshot.docs.map(doc => doc.id); 
  
      const userLevelPromises = users.map(user => 
          setDocument({ user, level: meta.name, score: 0 }, "user_levels", `${user}_${meta.name}`)
      );
  
      await Promise.all(userLevelPromises); 
  
      alert(`Level '${meta.name}' uploaded and assigned to all users.`);
  } catch (error) {
      console.error("Error uploading level or assigning users:", error);
      alert(error.message || "Failed to upload level and assign users.");
  } finally {
      setIsSaving(false);
  }
  
}, [meta, samples]);

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  importIRacerCSV(file, (mappedData) => {
    console.log("Imported iRacer Data:", mappedData);
    setSamples(mappedData); // Ažuriraj samples sa podacima
    // Ovdje možeš proslediti mappedData u state ili level sistem igre
  });
};


  
  const handleJsonChange = useCallback((key, value, parent, data) => {
    setMeta({
      ...data,
      [key]: value,
    });
  }, []);

  return (<RootContainer>
    <TopPane>
    
    <label>Real Car Data&nbsp;
    <input type="file" accept=".csv" onChange={handleFileUpload}/>
    </label>

      <label>
        CSV file&nbsp;
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvChange}
        />
      </label>
      &nbsp;
      {isLoading && <p>Loading...</p>}
      &nbsp;
      {sampleCount ? <p>({samples?.length}/{sampleCount} {(samples?.length * 100 / sampleCount).toFixed(2)}%)</p> : null}
      &nbsp;
      <Button
        variant="soft"
        color="primary"
        disabled={isLoading || isSaving}
        onClick={handleUpload}
      >
        Upload
      </Button>
    </TopPane>
    {samples.length > 0 && (<TopPane>
      <AutoSizer disableHeight>{({width}) => (
        <ChartContainer
          timeRange={sampleSeries.timerange()}
          enablePanZoom={true}
          width={width}
        >
          <ChartRow
            height={400}>
            <YAxis
              id="y"
              label="Value"
              min={-5}
              max={5}
              width="60"
              type="linear"/>
            <Charts>
              <LineChart
                axis="y"
                series={sampleSeries}
                columns={["brake", "throttle", "wheel"]}
                style={STYLE}
              />
              <MultiBrush
                timeRanges={timeRanges}
                allowSelectionClear={true}
              />
            </Charts>
          </ChartRow>
        </ChartContainer>
      )}</AutoSizer>
    </TopPane>)}
    <TopPane>
      {samples.length > 0 && (<Legend
        type="line"
        align="right"
        style={STYLE}
        categories={[
          { key: "brake", label: "Brake" },
          { key: "throttle", label: "Throttle" },
          { key: "wheel", label: "Wheel" },
        ]}
    />)}


    </TopPane>
    <RowPane>
      {isLoading && samples.length === 0
        ? <p>Loading...</p>
        : <AutoSizer>{({width, height}) => (
            <Table
              rowCount={samples.length}
              headerHeight={24}
              rowHeight={16}
              rowGetter={handleRowData}
              {...{height}}
              width={Math.min(width, columnMinWidth * columns.length)}
            >
              {columns.map(({name, label}) => (
                <Column
                  key={name}
                  dataKey={name}
                  label={label}
                  width={Math.max(columnMinWidth, Math.floor(width / columns.length))}
                />
              ))}
            </Table>
      )}</AutoSizer>}
      <SnapRight>
  {samples.length > 0 && ( // Prikazujemo samo ako grafikon postoji
    <div>
    {/* Level Name Input */}
    <label htmlFor="levelName">Level name:</label>
    <input
      type="text"
      id="levelName"
      value={meta.name || ""}
      onChange={(e) => handleJsonChange("name", e.target.value, null, meta)}
    />
    <br/>
  
    {/* Level Difficulty Dropdown */}
    <label htmlFor="levelDifficulty">Level difficulty:</label>
    <select
  id="levelDifficulty"
  value={meta.difficulty || ""} 
  onChange={(e) => handleJsonChange("difficulty", e.target.value, null, meta)}
>
  <option value="" disabled hidden>Select difficulty</option>
  <option value="easy">Easy</option>
  <option value="medium">Medium</option>
  <option value="hard">Hard</option>
  <option value="challenge">Challenge</option>
</select>
<br/>

  
    {/* Order ID Input (only integers > 0) */}
<label htmlFor="orderId">Order ID:</label>
<input
  type="number"
  id="orderId"
  min="1" // Ensures only positive numbers
  step="1" // Ensures only whole numbers
  value={meta.orderId ?? ""} // ✅ Ispravljeno
  onChange={(e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      handleJsonChange("orderId", value, null, meta);
    }
  }}
/>
    <br/>
  
    {/* Level Instructions (Textarea) */}
    <label htmlFor="levelInstructions">Level instructions:</label>
    <textarea
      id="levelInstructions"
      value={meta.instructions || ""}
      onChange={(e) => handleJsonChange("instructions", e.target.value, null, meta)}
    />
    <br/>
  
    {/* Folder Tag Input */}
    <label htmlFor="folderTag">Folder tag:</label>
    <input
      type="text"
      id="folderTag"
      value={meta.folderTag || ""}
      onChange={(e) => handleJsonChange("folderTag", e.target.value, null, meta)}
    />
    <br/>
  
{/* Lock Dropdown */}
<label htmlFor="lock">Lock:</label>
<select
  id="lock"
  value={meta.lock ?? ""} 
  onChange={(e) => handleJsonChange("lock", e.target.value === "true", null, meta)}
>
  <option value="" disabled hidden>Select Lock Status</option>
  <option value="true">True</option>
  <option value="false">False</option>
</select>
<br/>


  </div>
  
  )}
</SnapRight>
    </RowPane>
  </RootContainer>);
}

function makeLabel(name) {
  return name
    .toLowerCase()
}

const STYLE = styler([
  {key: "brake", color: "red", width: 1},
  {key: "throttle", color: "green", width: 1},
  {key: "wheel", color: "black", width: 1},
]);

export default Import;