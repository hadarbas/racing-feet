import Button from '@mui/joy/Button';
import { TimeSeries } from 'pondjs';
import { useCallback, useMemo, useState } from 'react';
import {
  ChartContainer,
  ChartRow, Charts,
  Legend,
  LineChart,
  MultiBrush,
  YAxis,
  styler,
} from 'react-timeseries-charts';
import { Column, Table } from 'react-virtualized';
import AutoSizer from 'react-virtualized-auto-sizer';
import { importIRacerCSV } from '../../tools/iracer-importer';

import 'react-virtualized/styles.css';
import { getDocuments, setDocument } from 'shared/services/firebase/db';
import '../../buffer';

import { loadCsvFile } from '../../tools/file-loader';
import { useTimeRanges } from './useTimeRanges';

import { RootContainer, RowPane, SnapRight, TopPane } from './Import.styled';

function Import() {
  const [isLoading, setIsLoading] = useState(false);
  const [samples, setSamples] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState('');
  const [sampleCount, setSampleCount] = useState(0);
  const [isRealCar, setIsRealCar] = useState(false);

  const clamp = v => Math.max(-1, Math.min(1, v));

  const sampleSeries = useMemo(() => {
    const result = new TimeSeries({
      name: fileName,
      columns: ["time", "brake", "throttle"],
      points: samples.map(sample => [
        parseFloat(sample.SessionTime),
        parseFloat(sample.Brake),
        parseFloat(sample.Throttle),
      ]),
    });
    return result;
  }, [samples, fileName]);

  const timeRanges = useTimeRanges(samples);
  const [meta, setMeta] = useState({
    name: "",
    difficulty: "",
    orderId: null,
    instructions: "",
    folderTag: "",
    lock: false,
  });

  const handleCsvChange = useCallback(async event => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let { meta: fileMeta, records } = await loadCsvFile(file);
      if (!fileMeta) fileMeta = { name: 'Exercise' };
      setMeta(fileMeta);
      setIsRealCar(false);

      // Uklanjamo volan iz kolona
      const header = Object.keys(records[0]).filter(name => name !== 'SteeringWheelAngle');
      setColumns(header.map(name => ({ name, label: makeLabel(name) })));

      const clamped = records.map(pt => ({
        SessionTime: pt.SessionTime,
        Brake:       clamp(parseFloat(pt.Brake)),
        Throttle:    clamp(parseFloat(pt.Throttle)),
      }));

        if (clamped[clamped.length - 1].SessionTime < 1) {
          throw new Error("Exercise must be at least 1 second long.");
        }
      
      setSamples(clamped);
      setFileName(file.name);

      const snap = await getDocuments('levels');
      let maxOrderId = 0;
      snap.forEach(doc => {
        const d = doc.data();
        if (typeof d.order_id === 'number' && d.order_id > maxOrderId) {
          maxOrderId = d.order_id;
        }
      });
      const nextOrderId = maxOrderId + 1;
      setMeta(prev => ({ ...prev, orderId: nextOrderId }));
      handleJsonChange('order_id', nextOrderId, null, { ...fileMeta, orderId: nextOrderId });

      setSampleCount(clamped.length);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRowData = useCallback(({ index }) => samples[index], [samples]);
  const columnMinWidth = 100;
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = useCallback(event => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    importIRacerCSV(file, async mappedData => {
      setIsRealCar(true);
      setSamples(mappedData);
      setFileName(file.name);

      // Izbacujemo volan iz kolona
      const header = Object.keys(mappedData[0]).filter(name => name !== 'SteeringWheelAngle');
      setColumns(header.map(name => ({ name, label: makeLabel(name) })));

      let newMeta = {
        name:        file.name.replace(/\.[^/.]+$/, ''),
        difficulty:  '',
        orderId:     null,
        instructions:'',
        folderTag:   '',
        lock:        false,
      };
      const snapshot = await getDocuments('levels');
      let maxOrderId = 0;
      snapshot.forEach(doc => {
        const d = doc.data();
        if (typeof d.order_id === 'number' && d.order_id > maxOrderId) {
          maxOrderId = d.order_id;
        }
      });
      newMeta.orderId = maxOrderId + 1;
      setMeta(newMeta);

      setSampleCount(mappedData.length);
      setIsLoading(false);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    setIsSaving(true);
    try {
      if (!samples.length) { alert('No data to upload!'); return; }
      const minTime = parseFloat(samples[0].SessionTime);

      const dataForFirebase = samples.map(pt => {
        const t = parseFloat(pt.SessionTime) - minTime;
        if (isRealCar) {
          return {
            time:  t,
            red:   clamp(pt.Brake),
            green: clamp(pt.Throttle),
          };
        } else {
          return {
            time:  t,
            red:   parseFloat(pt.Brake),
            green: parseFloat(pt.Throttle),
          };
        }
      });

      const levelsSnap = await getDocuments('levels');
      const existingIds = levelsSnap.docs.map(d => d.data().order_id);
      if (existingIds.includes(meta.orderId)) {
        alert(`Order ID ${meta.orderId} already exists`);
        return;
      }

      const docData = {
        name:         meta.name,
        difficulty:   meta.difficulty,
        order_id:     meta.orderId,
        instructions: meta.instructions,
        folderTag:    meta.folderTag,
        lock:         meta.lock,
        data:         dataForFirebase,
      };
      Object.keys(docData).forEach(k => docData[k] === undefined && delete docData[k]);

      await setDocument(docData, 'levels', meta.name);
      const usersSnap = await getDocuments('users');
      const users = usersSnap.docs.map(d => d.id);
      await Promise.all(users.map(u =>
        setDocument({ user: u, level: meta.name, score: 0 }, 'user_levels', `${u}_${meta.name}`)
      ));
      alert(`Level '${meta.name}' uploaded and assigned to all users.`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to upload.');
    } finally {
      setIsSaving(false);
    }
  }, [meta, samples, isRealCar]);

  const handleJsonChange = useCallback((key, value, parent, data) => {
    setMeta({ ...data, [key]: value });
  }, []);

  return (
  <RootContainer>
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
                columns={["brake", "throttle", /*"wheel"*/]}
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
          // { key: "wheel", label: "Wheel" },
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
  min="1" 
  step="1" 
  value={meta.orderId ?? ""} 
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
  // {key: "wheel", color: "black", width: 1},
]);

export default Import;