import test from 'node:test';
import assert from 'node:assert/strict';
import { params, normalize, fixture, compare, replay, months, live } from '../src/core.js';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const p=d=>params('PAYEMS','2025-01-01','2025-03-01',d);
test('request always pins both realtime bounds and rejects invalid dates/series',()=>{
  assert.equal(p('2025-04-04').realtime_end,'2025-04-04');
  assert.throws(()=>params('OTHER','2025-01-01','2025-03-01','2025-04-04'));
  assert.throws(()=>p('2025-02-30'));
});
test('as-of fixture never falls back and enforces availability boundary',async()=>{
  const x=await fixture('2025-04-04',p('2025-04-04'));
  assert.equal(x.records[2].value,100300);
  await assert.rejects(fixture('2025-04-03',p('2025-04-03')),/no fallback/);
  const raw={realtime_start:'2025-04-03',realtime_end:'2025-04-03',observations:[{date:'2025-03-01',value:'100300',realtime_start:'2025-04-04',realtime_end:'9999-12-31'}]};
  assert.throws(()=>normalize(raw,p('2025-04-03')),/violates request/);
});
test('missing value is explicit; no observation period remains visible',()=>{
  const request=p('2025-04-04');
  const raw={realtime_start:request.realtime_start,realtime_end:request.realtime_end,observations:[{date:'2025-03-01',value:'.',realtime_start:'2025-04-04',realtime_end:'9999-12-31'}]};
  assert.equal(normalize(raw,request)[0].value,null);
  assert.deepEqual(months('2025-01-01','2025-03-01'),['2025-01-01','2025-02-01','2025-03-01']);
  assert.equal(compare([],[],request.observation_start,request.observation_end)[2].status,'unavailable both');
});
test('multiple revisions and predeclared decision rule',async()=>{
  const a=(await fixture('2025-04-04',p('2025-04-04'))).records;
  const mid=(await fixture('2025-05-02',p('2025-05-02'))).records;
  const b=(await fixture('2026-02-11',p('2026-02-11'))).records;
  assert.equal(compare(a,mid,'2025-03-01','2025-03-01')[0].revision,-20);
  assert.equal(compare(mid,b,'2025-03-01','2025-03-01')[0].revision,-250);
  assert.deepEqual(replay(a),{growth:200,alert:false});
  assert.deepEqual(replay(b),{growth:80,alert:true});
  assert.deepEqual(replay([]),{growth:null,alert:null});
});
test('live client pins dates, paginates, reuses cache, and rejects tampering',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'vintage-lab-'));
  const oldKey=process.env.FRED_API_KEY, oldFetch=globalThis.fetch;
  process.env.FRED_API_KEY='local-test-key';
  let calls=0;
  const rows=[
    {date:'2025-01-01',value:'100',realtime_start:'2025-04-04',realtime_end:'2025-04-04'},
    {date:'2025-02-01',value:'101',realtime_start:'2025-04-04',realtime_end:'2025-04-04'},
    {date:'2025-03-01',value:'102',realtime_start:'2025-04-04',realtime_end:'2025-04-04'}
  ];
  try {
    globalThis.fetch=async url=>{
      calls++;
      const u=new URL(url), offset=Number(u.searchParams.get('offset'));
      assert.equal(u.searchParams.get('realtime_start'),'2025-04-04');
      assert.equal(u.searchParams.get('realtime_end'),'2025-04-04');
      const raw={realtime_start:'2025-04-04',realtime_end:'2025-04-04',count:3,limit:2,offset,observations:rows.slice(offset,offset+2)};
      return {ok:true,arrayBuffer:async()=>Buffer.from(JSON.stringify(raw))};
    };
    const first=await live(p('2025-04-04'),dir);
    assert.equal(first.records.length,3);
    assert.equal(calls,2);
    globalThis.fetch=()=>{throw new Error('network must not be used for cached run');};
    delete process.env.FRED_API_KEY;
    assert.equal((await live(p('2025-04-04'),dir)).records.length,3);
    const file=first.pages[0].file;
    const raw=await readFile(file,'utf8');
    await writeFile(file,raw.replace('"100"','"999"'));
    await assert.rejects(live(p('2025-04-04'),dir),/checksum mismatch/);
  } finally {
    globalThis.fetch=oldFetch;
    if(oldKey===undefined) delete process.env.FRED_API_KEY; else process.env.FRED_API_KEY=oldKey;
    await rm(dir,{recursive:true,force:true});
  }
});
