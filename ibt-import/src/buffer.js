import {BFSRequire} from 'browserfs';
const buffer = BFSRequire('buffer');
window.Buffer = buffer.Buffer;
export default buffer;