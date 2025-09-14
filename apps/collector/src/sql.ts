export const createTableIfNotExists = `
CREATE TABLE IF NOT EXISTS toolgate_events (
  event_id UUID PRIMARY KEY,
  trace_id TEXT NOT NULL,
  type     TEXT NOT NULL,
  ts       TIMESTAMPTZ NOT NULL,
  attrs    JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_toolgate_events_trace_ts
  ON toolgate_events (trace_id, ts);
`;

export const insertEventSQL = `
INSERT INTO toolgate_events (event_id, trace_id, type, ts, attrs)
VALUES ($1, $2, $3, $4, $5::jsonb)
`;

export const selectTraceSQL = `
SELECT event_id, trace_id, type, ts, attrs
FROM toolgate_events
WHERE trace_id = $1
ORDER BY ts ASC
`;