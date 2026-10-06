import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const SOURCE = 'https://fred.stlouisfed.org/series/PAYEMS';
export const UNITS = 'thousands of persons, seasonally adjusted';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function date(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(value + 'T00:00:00Z').toISOString().slice(0,10) !== value) throw new Error(`Invalid ISO date: ${value}`);
  return value;
}
export function params(series, start, end, asOf, offset=0) {
  if (series !== 'PAYEMS') throw new Error('Version one supports PAYEMS only');
  date(start); date(end); date(asOf);
  if (start > end) throw new Error('Observation start exceeds end');
  return {series_id:series, observation_start:start, observation_end:end, realtime_start:asOf, realtime_end:asOf, file_type:'json', output_type:'1', units:'lin', limit:'100000', offset:String(offset)};
}
export function normalize(raw, request) {
  if (raw.realtime_start !== request.realtime_start || raw.realtime_end !== request.realtime_end) throw new Error('Response vintage differs from requested date');
  if (!Array.isArray(raw.observations)) throw new Error('Missing observations array');
  return raw.observations.map(row => {
    const period=date(row.date), from=date(row.realtime_start), to=date(row.realtime_end);
    if (period < request.observation_start || period > request.observation_end || !(from <= request.realtime_start && request.realtime_start <= to)) throw new Error(`Observation violates request: ${period}`);
    const value = row.value === '.' ? null : Number(row.value);
    if (value !== null && !Number.isFinite(value)) throw new Error(`Invalid value: ${period}`);
    return {series_id:request.series_id, observation_period:period, value, realtime_start:from, realtime_end:to, units:UNITS, source:SOURCE};
  });
}
export function months(start,end) {
  const result=[];
  let [y,m]=start.slice(0,7).split('-').map(Number);
  while (`${y}-${String(m).padStart(2,'0')}-01` <= end) {
    const p=`${y}-${String(m).padStart(2,'0')}-01`;
    if (p>=start) result.push(p);
    if (++m===13) {m=1;y++;}
  }
  return result;
}
export function compare(a,b,start,end) {
  const left=new Map(a.map(x=>[x.observation_period,x])), right=new Map(b.map(x=>[x.observation_period,x]));
  return months(start,end).map(period=>{
    const x=left.get(period), y=right.get(period), first=x?.value ?? null, second=y?.value ?? null;
    const delta=first===null || second===null ? null : second-first;
    return {period,first,second,revision:delta,revision_pct:delta===null || first===0 ? null : 100*delta/Math.abs(first),first_published:x?.realtime_start ?? null,second_published:y?.realtime_start ?? null,status:!x&&!y?'unavailable both':!x?'unavailable first':!y?'unavailable second':first===null||second===null?'missing value':'ok'};
  });
}
export function replay(records, threshold=150, previous='2025-02-01', current='2025-03-01') {
  const index=new Map(records.map(x=>[x.observation_period,x.value]));
  const a=index.get(previous), b=index.get(current);
  if (a===undefined || b===undefined || a===null || b===null) return {growth:null,alert:null};
  const growth=b-a;
  return {growth,alert:growth<threshold};
}
export async function fixture(asOf, request) {
  const all=JSON.parse(await readFile(new URL('../tests/fixtures/snapshots.json',import.meta.url),'utf8'));
  if (!all[asOf]) throw new Error(`Fixture has no vintage for ${asOf}; no fallback`);
  const raw={...all[asOf],observations:all[asOf].observations.filter(o=>o.date>=request.observation_start&&o.date<=request.observation_end)};
  raw.count=raw.observations.length;
  const bytes=Buffer.from(JSON.stringify(raw));
  return {records:normalize(raw,request),sha256:hash(bytes),raw,cache_file:null, retrieved_at:null};
}
const BASE='https://api.stlouisfed.org/fred/series/observations';
const VINTAGES='https://api.stlouisfed.org/fred/series/vintagedates';
export async function live(request, cacheDir='data/cache') {
  const key=process.env.FRED_API_KEY;
  const rows=[], pages=[];
  for (let offset=0;;) {
    const p={...request,offset:String(offset)};
    const safeKey=hash(JSON.stringify(p));
    const file=join(cacheDir,`${safeKey}.json`);
    let bytes, retrievedAt, cached=true;
    try { bytes=await readFile(file); }
    catch (e) {
      if (e.code!=='ENOENT') throw e;
      if (!key) throw new Error('FRED_API_KEY is required to fetch an uncached --live request');
      cached=false;
      const url=new URL(BASE);
      for (const [k,v] of Object.entries(p)) url.searchParams.set(k,v);
      url.searchParams.set('api_key',key);
      let response;
      for (let attempt=0;attempt<3;attempt++) {
        response=await fetch(url,{headers:{'user-agent':'public-data-vintage-lab/0.1'}}).catch(()=>null);
        if (response?.ok) break;
        if (attempt===2 || (response && ![429,500,502,503,504].includes(response.status))) throw new Error(`FRED request failed: HTTP ${response?.status ?? 'network error'} (URL redacted)`);
        await new Promise(resolve=>setTimeout(resolve,500*2**attempt));
      }
      bytes=Buffer.from(await response.arrayBuffer());
      retrievedAt=new Date().toISOString();
      await mkdir(cacheDir,{recursive:true});
      await writeFile(file,bytes,{flag:'wx'});
      await writeFile(file+'.meta.json',JSON.stringify({retrieved_at:retrievedAt,sha256:hash(bytes),parameters:p},null,2));
    }
    const raw=JSON.parse(bytes.toString('utf8'));
    const meta=cached?JSON.parse(await readFile(file+'.meta.json','utf8')):null;
    if (meta && meta.sha256!==hash(bytes)) throw new Error(`Cache checksum mismatch: ${file}`);
    rows.push(...normalize(raw,p));
    pages.push({file,sha256:hash(bytes),retrieved_at:retrievedAt??meta.retrieved_at,parameters:p});
    const count=Number(raw.count), limit=Number(raw.limit), next=offset+Number(raw.observations.length);
    if (!Number.isInteger(count)||!Number.isInteger(limit)||limit<=0||next>count) throw new Error('Invalid pagination metadata');
    if (next===count) break;
    if (next<=offset) throw new Error('Pagination made no progress');
    offset=next;
  }
  return {records:rows,pages};
}

// The vintage-date endpoint lists all series changes, not just changes to the
// February and March observations analyzed by this project.
export async function vintageDates(series,start,end,cacheDir='data/cache') {
  if(series!=='PAYEMS') throw new Error('Version one supports PAYEMS only');
  date(start);date(end);
  if(start>end) throw new Error('Vintage start exceeds end');
  const key=process.env.FRED_API_KEY, dates=[],pages=[];
  for(let offset=0;;) {
    const p={series_id:series,realtime_start:start,realtime_end:end,file_type:'json',limit:'10000',offset:String(offset)};
    const file=join(cacheDir,`${hash(JSON.stringify({endpoint:'vintagedates',parameters:p}))}.json`);
    let bytes,retrievedAt,cached=true;
    try {bytes=await readFile(file);}
    catch(e) {
      if(e.code!=='ENOENT') throw e;
      if(!key) throw new Error('FRED_API_KEY is required to fetch uncached vintage dates');
      cached=false;
      const url=new URL(VINTAGES);
      for(const [k,v] of Object.entries(p)) url.searchParams.set(k,v);
      url.searchParams.set('api_key',key);
      let response;
      for(let attempt=0;attempt<3;attempt++) {
        response=await fetch(url,{headers:{'user-agent':'public-data-vintage-lab/0.1'}}).catch(()=>null);
        if(response?.ok) break;
        if(attempt===2 || (response && ![429,500,502,503,504].includes(response.status))) throw new Error(`FRED vintage-date request failed: HTTP ${response?.status??'network error'} (URL redacted)`);
        await new Promise(resolve=>setTimeout(resolve,500*2**attempt));
      }
      bytes=Buffer.from(await response.arrayBuffer());
      retrievedAt=new Date().toISOString();
      await mkdir(cacheDir,{recursive:true});
      await writeFile(file,bytes,{flag:'wx'});
      await writeFile(file+'.meta.json',JSON.stringify({retrieved_at:retrievedAt,sha256:hash(bytes),endpoint:'vintagedates',parameters:p},null,2));
    }
    const raw=JSON.parse(bytes.toString('utf8'));
    const meta=cached?JSON.parse(await readFile(file+'.meta.json','utf8')):null;
    if(meta && meta.sha256!==hash(bytes)) throw new Error(`Cache checksum mismatch: ${file}`);
    if(raw.realtime_start!==start||raw.realtime_end!==end||!Array.isArray(raw.vintage_dates)) throw new Error('Vintage-date response violates request');
    for(const d of raw.vintage_dates) {date(d);if(d<start||d>end) throw new Error('Vintage date outside request');dates.push(d);}
    pages.push({file,sha256:hash(bytes),retrieved_at:retrievedAt??meta.retrieved_at,parameters:p});
    const count=Number(raw.count),limit=Number(raw.limit),next=offset+raw.vintage_dates.length;
    if(!Number.isInteger(count)||!Number.isInteger(limit)||limit<=0||next>count) throw new Error('Invalid vintage-date pagination metadata');
    if(next===count) break;
    if(next<=offset) throw new Error('Vintage-date pagination made no progress');
    offset=next;
  }
  if(new Set(dates).size!==dates.length) throw new Error('Duplicate vintage dates');
  return {dates:dates.sort(),pages};
}
