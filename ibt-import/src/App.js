import {useState, useCallback} from 'react';
import Telemetry from './ ibt-telemetry';
import * as BrowserFS from 'browserfs';
import ReactJsonView from 'react-json-view';

function App() {
  const [telemetry, setTelemetry] = useState();
  const handleChange = useCallback(event => {
    const {files} = event.target;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      BrowserFS.configure({
        fs: 'InMemory'
      }, async e => {
        if (e) {
          alert(e);
          return;
        }

        const fs = BrowserFS.BFSRequire('fs');
        const { Buffer } = BrowserFS.BFSRequire('buffer');
        fs.writeFileSync(file.name, Buffer.from(data));

        const telemetry = await Telemetry.fromFile(file.name);
        setTelemetry(telemetry);
      })
    }
    reader.readAsArrayBuffer(file);

  }, []);

  return (
    <app>
      <label>
        Telemetry file&nbsp;
        <input
          type="file"
          accept=".ibt"
          onChange={handleChange}
        />
      </label>
      <hr/>
      <ReactJsonView src={telemetry}/>
    </app>
  );
}

export default App;
