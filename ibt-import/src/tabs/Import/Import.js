import {useState, useCallback, useMemo} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {Column, Table} from 'react-virtualized';
import {
  ChartContainer, LineChart, ChartRow, Charts, YAxis,
  styler, Legend,
  MultiBrush,
} from 'react-timeseries-charts';
import {TimeSeries} from 'pondjs';
import JsonView from 'react-json-view';
import {JSONEditor} from 'react-json-editor-viewer';
import Button from '@mui/joy/Button';

import { setDocument, serverTimestamp } from 'shared/services/firebase/db';
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
  const [sampleCount, setSampleCount] = useState(0);
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
      const {meta, records} = await loadCsvFile(file);

      if (!meta) {
        console.error('No metadata found');
        alert('No metadata found');
        return;
      }
      setMeta(meta);
      const header = Object.keys(records[0]);
      const columns = header.map(name => ({name, label: makeLabel(name)}));
      setColumns(columns);
      setSamples(records);
      setFileName(file.name); // Set the file name in the state variable
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const handleRowData = useCallback(({index}) => {
    return samples[index];
  }, [samples]);
  const columnMinWidth = 100;
  const [isSaving, setIsSaving] = useState(false); // Add isSaving state
  const handleUpload = useCallback(async () => {
    setIsSaving(true); // Set isSaving to true
    try {
      const minTime = parseFloat(samples[0].SessionTime);
      const data = samples.map(({
        SessionTime, Brake, Throttle, SteeringWheelAngle
      }) => ({
        time: parseFloat(SessionTime) - minTime,
        red: parseFloat(Brake),
        green: parseFloat(Throttle),
        blue: parseFloat(SteeringWheelAngle),
      }));
      await setDocument({timeLastUpdated: serverTimestamp()}, 'category', meta.category);
      await setDocument({data}, 'category', meta.category, 'exercise', meta.name);

      alert(`צק uploaded for ${meta.name} in ${meta.category}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [meta]);
  const handleJsonChange = useCallback((key, value, parent, data) => {
    setMeta({
      ...data,
      [key]: value,
    });
  }, []);

  return (<RootContainer>
    <TopPane>
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
        <JSONEditor
          data={meta}
          onChange={handleJsonChange}
        />
      </SnapRight>
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
    return value.toFixed(2);
  }
  return value;
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