import Telemetry from 'ibt-telemetry';

export async function loadIbtFile(filePath) {
  return Telemetry.fromFile(filePath);
}
