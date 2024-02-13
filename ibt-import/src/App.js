import {useState, useCallback, useEffect} from 'react';
import ReactJsonView from 'react-json-view';
import AutoSizer from 'react-virtualized-auto-sizer';
import {Column, Table} from 'react-virtualized';
import './buffer';
import 'react-virtualized/styles.css'; // only needs to be imported once

import { RootContainer, TopPane, RowPane, LeftPane, RightPane } from './App.styled';
function App() {
  const [telemetry, setTelemetry] = useState();
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [samples, setSamples] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState('');
  const [sampleCount, setSampleCount] = useState(0);

  const handleChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true); // Set isLoading to true

    try {
      const {loadIbtFile} = await import('./tools/file-loader');
      const telemetry = await loadIbtFile(file);
      
      setTelemetry(telemetry);
      setSampleCount((file.size - telemetry.headers.bufOffset) / telemetry.headers.bufLen);
      setFileName(file.name); // Set the file name in the state variable
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!telemetry) return;

    const generator = telemetry.samples();
    const intervalId = setInterval(() => {
      const batch = [];
      for (let i = 0; i < 100; i++) {
        const {value, done} = generator.next();
        if (done) {
          clearInterval(intervalId);
          setIsLoading(false);
          break;
        }
        batch.push(convertSample(value));
      }
      setColumns(batch.length ? Object.keys(batch[0]).map(name => ({name, label: makeLabel(name)})) : []);
      setSamples(samples => [...samples, ...batch]);
    }, 0);

    return () => clearInterval(intervalId);
  }, [telemetry]);
  const handleRowData = useCallback(({index}) => {
    return samples[index];
  }, [samples]);
  const columnMinWidth = 70;
  const [isSaving, setIsSaving] = useState(false); // Add isSaving state
  const [samplesSaved, setSamplesSaved] = useState(0);

  const handleSave = useCallback(() => {
    if (isSaving) return;

    setIsSaving(true); // Set isSaving to true

    const records = [];

    records.push(Object.keys(samples[0]).join(",")); // Add the header row to the CSV
    
    const intervalId = setInterval(() => {
      try {
        const end = Math.min(records.length + 100, samples.length);
        for (let i = records.length; i < end; i++) {
          const values = Object.values(samples[i]);
          records.push(values.join(",")); // Convert the sample to a CSV record
        }

        setSamplesSaved(records.length); // Update the samplesSaved state variable
        if (records.length >= samples.length) {
          clearInterval(intervalId);

          const encodedUri = encodeURI("data:text/csv;charset=utf-8," + records.join("\n"));
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `${fileName}.csv`); // Use fileName as the filename with .csv extension
          document.body.appendChild(link);
          link.click();
          setIsSaving(false);
        }
      } catch (error) {
        console.error(error);
        setIsSaving(false);
      }
    }, 0);
  }, [samples, fileName]);

  return (
    <RootContainer>
      <TopPane>
        <label>
          Telemetry file&nbsp;
          <input
            type="file"
            accept=".ibt"
            onChange={handleChange}
          />
        </label>
        &nbsp;
        {isLoading && <p>Loading...</p>}
        &nbsp;
        {sampleCount ? <p>({samples?.length}/{sampleCount} {(samples?.length * 100 / sampleCount).toFixed(2)}%)</p> : null}
        &nbsp;
        <button onClick={handleSave} disabled={!telemetry || isLoading}>Save</button>
      </TopPane>
      <RowPane>
        <LeftPane>
          {telemetry && <ReactJsonView src={telemetry} />}
        </LeftPane>
        <RightPane>
          {isLoading && samples.length === 0
            ? <p>Loading...</p>
            : <AutoSizer>{({width, height}) => (
                <Table
                  rowCount={samples.length}
                  headerHeight={24}
                  rowHeight={16}
                  rowGetter={handleRowData}
                  {...{height}}
                  width={Math.max(width, columnMinWidth * columns.length)}
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
        </RightPane>
      </RowPane>
    </RootContainer>
  );
}

const convertSample = sample => sample && Object.fromEntries(
  Object.entries(sample.toJSON())
    .map(([key, {value}]) => [key, formatValue(value)])
);

function formatValue(value) {
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return value.toFixed(2);
  }
  return value;
}

function makeLabel(name) {
  return name
    .toLowerCase()
    .replace('session', '')
}

export default App;
