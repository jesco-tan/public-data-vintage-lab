#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { date, fixture, hash, live, params, vintageDates, SOURCE, UNITS } from './core.js';
import { analyzeHistory } from './history.js';

function args(argv) {
  const a={};
  for(let i=0;i<argv.length;i++) {
    const k=argv[i];
    if(!k.startsWith('--')) throw new Error(`Unexpected argument: ${k}`);
    if(k==='--offline'||k==='--live') a[k.slice(2)]=true;
    else a[k.slice(2)]=argv[++i];
  }
  for(const k of ['series','first','second']) if(!a[k]) throw new Error(`Missing --${k}`);
  if(a.offline===a.live) throw new Error('Choose exactly one of --offline or --live');
  date(a.first);date(a.second);
  if(a.first>=a.second) throw new Error('--first must precede --second');
  if(a.series!=='PAYEMS') throw new Error('Version one supports PAYEMS only');
  a.out??=a.offline?'outputs/history-sample':'outputs/history-live';
  return a;
}
const fmt=x=>x===null?'missing':String(x);
const decision=(growth,t)=>growth===null?'unavailable':growth<t?'flag':'no flag';
async function codeRevision() {
  try {
    const {execFileSync}=await import('node:child_process');
    return execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  } catch {return 'unavailable (no Git repository or Git executable)';}
}
async function main() {
  const a=args(process.argv.slice(2));
  const listed=a.offline?{dates:['2025-04-04','2025-05-02','2026-02-11'].filter(d=>d>=a.first&&d<=a.second),pages:[]} : await vintageDates(a.series,a.first,a.second);
  const dates=[...new Set([a.first,...listed.dates,a.second])].sort();
  const snapshots=[];
  for(const d of dates) {
    const request=params(a.series,'2025-01-01','2025-03-01',d);
    const result=a.offline?await fixture(d,request):await live(request);
    snapshots.push({date:d,records:result.records,request,responses:result.pages??[{sha256:result.sha256,fixture:'tests/fixtures/snapshots.json'}]});
  }
  const analysis=analyzeHistory(snapshots,a.first,a.second);
  const rows=analysis.rows.map(r=>`| ${r.date} | ${fmt(r.february)} | ${fmt(r.march)} | ${fmt(r.growth)} | ${decision(r.growth,150)} |`).join('\n');
  const summary=analysis.sensitivity.map(s=>`| ${s.threshold} | ${s.disagreements}/${s.eligible} | ${s.rate===null?'unavailable':(100*s.rate).toFixed(1)+'%'} | ${s.disagreement_dates.join(', ')||'none'} | ${s.adjacent_flips.map(pair=>pair.join(' → ')).join('; ')||'none'} |`).join('\n');
  const stability=Object.entries(analysis.metrics).map(([field,m])=>`| ${field} | ${fmt(m.initial)} | ${fmt(m.reference)} | ${m.change_count} | ${m.last_observed_change??'none observed'} | ${m.observed_unchanged_since??'unavailable'} | ${m.days_from_first_to_last_change??'unavailable'} |`).join('\n');
  const mode=a.offline?'synthetic self-authored fixture':'live ALFRED API v1';
  const report=`# PAYEMS March 2025 vintage history\n\n**Mode:** ${mode}. **Observed information window:** ${a.first} to ${a.second}. **Units:** ${UNITS}. **Sample:** selected fixture dates when offline; otherwise all PAYEMS series-change dates returned by the FRED vintage-date endpoint within the window, plus both endpoints. ${a.offline?'All values below are invented for testing and are not PAYEMS findings.':'Raw API responses are pinned in the local cache and checksummed in the manifest.'}\n\n## Replay by information date\n\n| Information date | February level | March level | March growth | Below 150 thousand |\n|---|---:|---:|---:|---|\n${rows}\n\nFebruary and March levels are always taken from the same date's exact as-of query. A vintage date can reflect a change elsewhere in PAYEMS, so adjacent rows may be identical here.\n\n## Decision disagreement with ${a.second}\n\nThe reference is the decision on ${a.second}. The denominator includes every earlier listed date with both February and March levels; the reference date is excluded. Rates weight dates equally and are descriptive of this sampled window, not a probability or a general economic performance measure. The **150-thousand threshold was predeclared**; the others are sensitivity checks.\n\n| Threshold | Disagreements / eligible earlier dates | Rate | Dates disagreeing with reference | Adjacent decision flips |\n|---:|---:|---:|---|---|\n${summary}\n\n## Observed stabilization within the window\n\n| Quantity | First observed | ${a.second} | Value changes observed | Last observed change date | Unchanged since | Days from ${a.first} to last change |\n|---|---:|---:|---:|---|---|---:|\n${stability}\n\n“Unchanged since” is conditional on the sampled vintage dates through ${a.second}. It is **right censored** there: later revisions can occur, so it is not a claim of permanent stabilization. A date from the vintage-date endpoint identifies a series release/revision, not necessarily a change to these observations.\n\n## Provenance\n\nSource: U.S. Bureau of Labor Statistics via [FRED/ALFRED PAYEMS](${SOURCE}). The [vintage-date endpoint](https://fred.stlouisfed.org/docs/api/fred/series_vintagedates.html) lists dates on which series values changed. [manifest.json](manifest.json) records every parameter set, response checksum, and retrieval time; [history.csv](history.csv) provides the normalized replay table. This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. [Terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) apply.\n`;
  const csv=['information_date,february_level_thousands,march_level_thousands,march_growth_thousands,below_150_thousand',...analysis.rows.map(r=>[r.date,r.february??'',r.march??'',r.growth??'',r.growth===null?'':r.growth<150].join(','))].join('\n')+'\n';
  const manifest={mode,created_at:new Date().toISOString(),code_revision:await codeRevision(),series_id:a.series,source:SOURCE,units:UNITS,observation_start:'2025-01-01',observation_end:'2025-03-01',information_start:a.first,information_end:a.second,vintage_dates_endpoint_responses:listed.pages,snapshots:snapshots.map(s=>({information_date:s.date,parameters:s.request,responses:s.responses})),rule:{previous:'2025-02-01',current:'2025-03-01',threshold_thousands:150},report_sha256:hash(report),history_sha256:hash(csv)};
  await mkdir(a.out,{recursive:true});
  await writeFile(join(a.out,'report.md'),report);
  await writeFile(join(a.out,'history.csv'),csv);
  await writeFile(join(a.out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Analyzed ${dates.length} information dates. Wrote ${join(a.out,'report.md')}, history.csv, manifest.json`);
}
main().catch(e=>{console.error(`Error: ${e.message}`);process.exitCode=1;});
