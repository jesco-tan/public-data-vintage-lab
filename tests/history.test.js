import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fixture, params, vintageDates } from '../src/core.js';
import { analyzeHistory } from '../src/history.js';

test('history measures right-censored value changes and disagreement over eligible earlier dates',async()=>{
  const dates=['2025-04-04','2025-05-02','2026-02-11'];
  const snapshots=await Promise.all(dates.map(async date=>({date,records:(await fixture(date,params('PAYEMS','2025-01-01','2025-03-01',date))).records})));
  const a=analyzeHistory(snapshots,dates[0],dates[2]);
  assert.deepEqual(a.rows.map(r=>r.growth),[200,160,80]);
  assert.equal(a.metrics.march.change_count,2);
  assert.equal(a.metrics.march.last_observed_change,'2026-02-11');
  assert.equal(a.metrics.march.right_censored_at,'2026-02-11');
  const primary=a.sensitivity.find(s=>s.threshold===150);
  assert.equal(primary.disagreements,2);
  assert.equal(primary.eligible,2);
  assert.deepEqual(primary.adjacent_flips,[['2025-05-02','2026-02-11']]);
  assert.equal(a.sensitivity.find(s=>s.threshold===50).disagreements,0);
  assert.equal(a.sensitivity.find(s=>s.threshold===250).disagreements,0);
  assert.throws(()=>analyzeHistory([...snapshots].reverse(),dates[0],dates[2]),/sorted/);
});

test('vintage-date endpoint paginates, pins range, and replays checked cache without key',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'vintage-dates-'));
  const oldKey=process.env.FRED_API_KEY,oldFetch=globalThis.fetch;
  process.env.FRED_API_KEY='test-only-key';
  let calls=0;
  try {
    globalThis.fetch=async url=>{
      calls++;
      const u=new URL(url),offset=Number(u.searchParams.get('offset'));
      assert.equal(u.pathname,'/fred/series/vintagedates');
      assert.equal(u.searchParams.get('realtime_start'),'2025-04-04');
      assert.equal(u.searchParams.get('realtime_end'),'2026-02-11');
      const raw={realtime_start:'2025-04-04',realtime_end:'2026-02-11',count:3,offset,limit:2,vintage_dates:['2025-04-04','2025-05-02','2026-02-11'].slice(offset,offset+2)};
      return {ok:true,arrayBuffer:async()=>Buffer.from(JSON.stringify(raw))};
    };
    const first=await vintageDates('PAYEMS','2025-04-04','2026-02-11',dir);
    assert.equal(calls,2);
    assert.deepEqual(first.dates,['2025-04-04','2025-05-02','2026-02-11']);
    delete process.env.FRED_API_KEY;
    globalThis.fetch=()=>{throw Error('unexpected fetch');};
    assert.deepEqual((await vintageDates('PAYEMS','2025-04-04','2026-02-11',dir)).dates,first.dates);
    await writeFile(first.pages[0].file,(await readFile(first.pages[0].file,'utf8')).replace('2025-05-02','2025-05-03'));
    await assert.rejects(vintageDates('PAYEMS','2025-04-04','2026-02-11',dir),/checksum mismatch/);
  } finally {
    globalThis.fetch=oldFetch;
    if(oldKey===undefined) delete process.env.FRED_API_KEY; else process.env.FRED_API_KEY=oldKey;
    await rm(dir,{recursive:true,force:true});
  }
});
