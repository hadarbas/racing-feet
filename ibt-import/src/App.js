import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';

import IbtToCsv from './tabs/IbtToCsv';
import Import from './tabs/Import';

import './buffer';
import 'react-virtualized/styles.css'; // only needs to be imported once

import { RootContainer } from './App.styled';
function App() {
  return (
    <RootContainer>
      <Tabs aria-label="Basic tabs" defaultValue="ibt">
        <TabList>
          <Tab value="ibt">IBT to CSV</Tab>
          <Tab value="import">Import CSV</Tab>
        </TabList>
        <TabPanel value="ibt">
          <IbtToCsv />
        </TabPanel>
        <TabPanel value="import">
          <Import />
        </TabPanel>
      </Tabs>
    </RootContainer>
  );
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

export default App;
