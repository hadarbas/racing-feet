import {useState, useCallback, useEffect} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {Column, Table} from 'react-virtualized';
import pick from 'lodash/fp/pick';

import '../../buffer';
import 'react-virtualized/styles.css'; // only needs to be imported once

import { RootContainer, TopPane, RowPane  } from './IbtToCsv.styled';
function IbtToCsv() {
  const [telemetry, setTelemetry] = useState();
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [samples, setSamples] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState('');
  const [sampleCount, setSampleCount] = useState(0);

  const handleIbtChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true); // Set isLoading to true

    try {
      const {loadIbtFile} = await import('../../tools/file-loader');
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
    let allKeys = null;
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
        if (!allKeys) {
          allKeys = Object.keys(batch[0]);
          console.debug("all keys", allKeys);
        }
      }
      setColumns(["SessionTime", "Throttle", "Brake", "SteeringWheelAngle"]
        .map(name => ({name, label: makeLabel(name)})));
      /*
      setColumns(batch.length
        ? Object.keys(batch[0])
            .filter(isRelevantColumn)
            .map(name => ({name, label: makeLabel(name)}))
        : []);*/
      setSamples(samples => [...samples, ...batch]);
      console.debug("all keys", Object.keys(batch[0]));
    }, 0);

    return () => clearInterval(intervalId);
  }, [telemetry]);
  const handleRowData = useCallback(({index}) => {
    return samples[index];
  }, [samples]);
  const columnMinWidth = 100;
  const [isSaving, setIsSaving] = useState(false); // Add isSaving state
//  const [samplesSaved, setSamplesSaved] = useState(0);

  const handleSave = useCallback(() => {
    if (isSaving) return;

    setIsSaving(true); // Set isSaving to true

    const records = [];

/*    const keys = Object.keys(samples[0])
      .filter(isRelevantColumn);*/
    const keys = columns.map(({name}) => name);
    const picker = pick(keys);
    
    records.push(keys.join(",")); // Add the header row to the CSV
    
    const intervalId = setInterval(() => {
      try {
        const end = Math.min(records.length + 100, samples.length);
        for (let i = records.length; i < end; i++) {
          const values = Object.values(picker(samples[i]));
          records.push(values.join(",")); // Convert the sample to a CSV record
        }

//        setSamplesSaved(records.length); // Update the samplesSaved state variable
        if (records.length >= samples.length) {
          clearInterval(intervalId);

          records.push(""); // Add an empty line at the end of the CSV
          records.push("category=Default"); // Add the category metadata to the CSV
          records.push(`name=${fileName}`); // Add the exercise metadata to the CSV

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
  }, [samples, fileName, isSaving, columns]);

  return (<RootContainer>
    <TopPane>
      <label>
        Telemetry file&nbsp;
        <input
          type="file"
          accept=".ibt"
          onChange={handleIbtChange}
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
    </RowPane>
  </RootContainer>);
}

const isRelevantColumn = name =>
  /time|raw|throttle|wheel|gear|brake|^(lat)$|^(lon)$|^(alt)$/i
  .test(name)

const convertSample = sample => sample && Object.fromEntries(
  Object.entries(sample.toJSON())
    .map(([key, {value}]) => [key, formatValue(value)])
);

function formatValue(value) {
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return value.toFixed(4);
  }
  return value;
}

function makeLabel(name) {
  return name
    .toLowerCase()
}

export default IbtToCsv;
