#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { compare, date, fixture, live, params, replay, hash, SOURCE, UNITS } from './core.js';

function args(argv) {
  const out={};
  for(let i=0;i<argv.length;i++) {
    if(!argv[i].startsWith('--')) throw new Error(`Unexpected argument ${argv[i]}`);
    const name=argv[i].slice(2);
    if(name==='offline'||name==='live') out[name]=true;
    else out[name]=argv[++i];
  }
  for(const x of ['series','start','end','first','second']) if(!out[x]) throw new Error(`Missing --${x}`);
  if(out.offline===out.live) throw new Error('Choose exactly one of --offline or --live');
  date(out.first);date(out.second);
  if(out.first>=out.second) throw new Error('--first must precede --second');
  out.out??='outputs';
  return out;
}
function fmt(v,d=0) {return v===null||v===undefined?'missing':Number(v).toFixed(d);}
function table(rows) {
  const head='| Observation period | First information date value | Second information date value | Revision | Revision % | First row realtime start | Second row realtime start | Status |\n|---|---:|---:|---:|---:|---|---|---|';
  return [head,...rows.map(r=>`| ${r.period} | ${fmt(r.first)} | ${fmt(r.second)} | ${fmt(r.revision)} | ${fmt(r.revision_pct,4)} | ${r.first_published??'unknown'} | ${r.second_published??'unknown'} | ${r.status} |`)].join('\n');
}
function chart(rows) {
  const good=rows.filter(r=>r.first!==null&&r.second!==null);
  if(!good.length) return '<p>No paired values to plot.</p>';
  const values=good.flatMap(r=>[r.first,r.second]), min=Math.min(...values), max=Math.max(...values), span=max-min||1;
  const w=680,h=280,pad=50, x=i=>pad+i*(w-2*pad)/Math.max(1,good.length-1),y=v=>h-pad-(v-min)*(h-2*pad)/span;
  const poly=key=>good.map((r,i)=>`${x(i)},${y(r[key])}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="PAYEMS levels for first and second information dates"><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#666"/><polyline points="${poly('first')}" fill="none" stroke="#1769aa" stroke-width="3"/><polyline points="${poly('second')}" fill="none" stroke="#b34912" stroke-width="3"/>${good.map((r,i)=>`<text x="${x(i)}" y="${h-24}" text-anchor="middle" font-size="11">${r.period.slice(0,7)}</text>`).join('')}<text x="${pad}" y="20" font-size="13">Thousands of persons · blue: first · orange: second</text></svg>`;
}
async function revision() {
  try {const {stdout}=await import('node:child_process').then(({execFileSync})=>({stdout:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}));return stdout.trim();}
  catch {return 'unavailable (no Git repository or Git executable)';}
}
async function main() {
  const a=args(process.argv.slice(2));
  const p1=params(a.series,a.start,a.end,a.first),p2=params(a.series,a.start,a.end,a.second);
  const first=a.offline?await fixture(a.first,p1):await live(p1);
  const second=a.offline?await fixture(a.second,p2):await live(p2);
  const rows=compare(first.records,second.records,a.start,a.end);
  const decisions=[150,50,100,200,250].map(threshold=>({threshold,first:replay(first.records,threshold),second:replay(second.records,threshold)}));
  let fixtureHistory='';
  if(a.offline && a.start<='2025-02-01' && a.end>='2025-03-01') {
    const dates=['2025-04-04','2025-05-02','2026-02-11'];
    const snapshots=await Promise.all(dates.map(d=>fixture(d,params(a.series,a.start,a.end,d))));
    const lines=[150,100,200].map(t=>{
      const states=snapshots.map(s=>replay(s.records,t));
      const disagreements=states.slice(1).filter((s,i)=>s.alert!==states[i].alert).length;
      return `| ${t} | ${states.map(s=>`${fmt(s.growth)} / ${s.alert?'flag':'no flag'}`).join(' | ')} | ${disagreements}/2 |`;
    }).join('\n');
    fixtureHistory=`\n\n## Synthetic fixture history\n\nThis section uses three invented dates and is not a historical PAYEMS finding. It compares adjacent vintage decisions, so the denominator is two transitions. At the 150-thousand rule, April to May does not change the decision; May to February does.\n\n| Threshold | 2025-04-04 | 2025-05-02 | 2026-02-11 | Adjacent disagreement rate |\n|---:|---|---|---|---:|\n${lines}\n`;
  }
  const top=[...rows].filter(r=>r.revision!==null).sort((a,b)=>Math.abs(b.revision)-Math.abs(a.revision)).slice(0,5);
  const mode=a.offline?'synthetic fixture — not observed PAYEMS data':'live ALFRED API v1';
  const heading=`# PAYEMS vintage comparison\n\n**Mode:** ${mode}. **Observation window:** ${a.start} to ${a.end}. **Information dates:** ${a.first} and ${a.second}. **Units:** ${UNITS}.\n\n`;
  const replayLines=decisions.map(d=>`| ${d.threshold} | ${fmt(d.first.growth)} | ${d.first.alert===null?'unavailable':d.first.alert?'flag':'no flag'} | ${fmt(d.second.growth)} | ${d.second.alert===null?'unavailable':d.second.alert?'flag':'no flag'} |`).join('\n');
  const expected=a.first==='2025-04-04'&&a.second==='2026-02-11' ? `\n\n## BLS cross-check\n\nThe [original BLS release](https://www.bls.gov/news.release/archives/empsit_04042025.htm) reports February and March levels of 159170 and 159398 thousand (growth 228). The [benchmark article](https://www.bls.gov/web/empsit/cesbmart.htm) reports revised levels of 158310 and 158377 thousand (growth 67). ${a.offline?'Synthetic fixture values cannot verify these BLS figures.':`ALFRED level pairs and derived growth ${first.records.find(r=>r.observation_period==='2025-02-01')?.value===159170&&first.records.find(r=>r.observation_period==='2025-03-01')?.value===159398&&second.records.find(r=>r.observation_period==='2025-02-01')?.value===158310&&second.records.find(r=>r.observation_period==='2025-03-01')?.value===158377?'match both BLS publications. The 150-thousand decision flip is verified for these two information dates.':'DO NOT MATCH both BLS publications. Investigate source timing and definitions before claiming a historical decision flip.'}`}\n` : '';
  const report=heading+`## Values and revisions\n\n${table(rows)}\n\nRevision is second minus first; percent uses the absolute first level as denominator. Row realtime starts are returned validity metadata and do not by themselves establish the first publication date.\n\n## Largest level revisions\n\n${table(top)}\n\n## Decision replay\n\nPredeclared illustrative rule: flag March 2025 job growth below 150 thousand, calculated as March minus February within each information date. Sensitivity thresholds of 50, 100, 200, and 250 thousand are shown. This demonstrates revision sensitivity and is not an economic policy recommendation.\n\n| Threshold (thousands) | ${a.first} growth | ${a.first} decision | ${a.second} growth | ${a.second} decision |\n|---:|---:|---|---:|---|\n${replayLines}\n\nDecision disagreement rate over the selected date comparison at the 150-thousand threshold: ${decisions[0].first.alert===null||decisions[0].second.alert===null?'unavailable':Number(decisions[0].first.alert!==decisions[0].second.alert).toFixed(0)+'/1'}. This is not a population estimate.${fixtureHistory}${expected}\n\n## Plot\n\nSee [plot.html](plot.html).\n\n## Provenance\n\nSource: U.S. Bureau of Labor Statistics via [FRED/ALFRED](${SOURCE}). Raw response hashes and request parameters are in [manifest.json](manifest.json). A retrieved date is separate from both observation and information dates. Cached responses are pinned and validated before reuse. The normalized [observations.csv](observations.csv) contains both snapshots.\n\nThis product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. [FRED API terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) apply to users of this application.\n`;
  const csv=['information_date,series_id,observation_period,value,realtime_start,realtime_end,units,source',...[...first.records.map(r=>[a.first,r]),...second.records.map(r=>[a.second,r])].map(([d,r])=>[d,r.series_id,r.observation_period,r.value??'',r.realtime_start,r.realtime_end,r.units,r.source].map(v=>`"${String(v).replaceAll('"','""')}"`).join(','))].join('\n')+'\n';
  const createdAt=new Date().toISOString();
  const manifest={mode,created_at:createdAt,code_revision:await revision(),series_id:a.series,units:UNITS,source:SOURCE,observation_start:a.start,observation_end:a.end,information_dates:[a.first,a.second],requests:[p1,p2],responses:[first.pages??[{sha256:first.sha256,retrieved_at:null,fixture:'tests/fixtures/snapshots.json'}],second.pages??[{sha256:second.sha256,retrieved_at:null,fixture:'tests/fixtures/snapshots.json'}]],rule:{previous:'2025-02-01',current:'2025-03-01',threshold_thousands:150},report_sha256:hash(report),observations_sha256:hash(csv)};
  await mkdir(a.out,{recursive:true});
  await writeFile(join(a.out,'report.md'),report);
  await writeFile(join(a.out,'observations.csv'),csv);
  await writeFile(join(a.out,'plot.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>PAYEMS vintage plot</title><body><h1>PAYEMS: ${a.first} versus ${a.second}</h1><p>${mode}. Observation periods ${a.start} to ${a.end}.</p>${chart(rows)}<p>Source: <a href="${SOURCE}">BLS via FRED/ALFRED</a>. This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis. <a href="https://fred.stlouisfed.org/docs/api/terms_of_use.html">Terms</a>.</p></body></html>`);
  await writeFile(join(a.out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(table(rows));
  console.log(`\nWrote ${join(a.out,'report.md')}, plot.html, observations.csv, manifest.json`);
}
main().catch(e=>{console.error(`Error: ${e.message}`);process.exitCode=1;});
