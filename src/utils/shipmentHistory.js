// Timeline IDs may repeat across event sources. SequenceNo is presentation order,
// not identity; preserve distinct updates and collapse identical response rows.
export const prepareShipmentHistory = (events = []) => {
  const seen = new Set();
  return events.flatMap((event) => {
    const key = JSON.stringify(Object.keys(event)
      .filter((field) => field !== 'SequenceNo' && field !== '_historyKey')
      .sort()
      .map((field) => [field, event[field]]));
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...event, _historyKey: key }];
  });
};
