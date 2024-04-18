import { useMemo } from "react";
import { TimeRange } from "pondjs";

export const useTimeRanges = (samples0) => useMemo(() => {
  if (!samples0.length) return [];

  let inRange = false;
  let timeStart = undefined;
  const timeRanges = [];

  const samples = samples0.map(sample => ({
    time: parseFloat(sample.SessionTime),
    throttle: parseFloat(sample.Throttle),
    brake: parseFloat(sample.Brake),
  }));

  for (let i = 1; i < samples.length - 1; i++) {
    const prevSample = samples[i - 1];
    const sample = samples[i];
    const nextSample = samples[i + 1];

    if (inRange) {
      if (sample.throttle >= 1 &&
        prevSample.throttle < sample.throttle &&
        sample.throttle <= nextSample.throttle &&
        sample.brake === 0) {
        timeRanges.push(new TimeRange([timeStart, sample.time]));
        inRange = false;
      }
    } else {
      if (prevSample.brake < sample.brake &&
        sample.brake >= 1 &&
        nextSample.brake >= sample.brake) {
        timeStart = sample.time;
        inRange = true;
      }
    }
  }

  return timeRanges;
}, [samples0]);