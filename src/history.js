import { date, replay } from './core.js';

const DAY=86400000;
const days=(a,b)=>(Date.parse(b)-Date.parse(a))/DAY;
export const THRESHOLDS=[50,100,150,200,250];

export function analyzeHistory(snapshots, first, last, thresholds=THRESHOLDS) {
  date(first);date(last);
  if(first>=last) throw new Error('History end must follow start');
  const dates=snapshots.map(s=>date(s.date));
  if(dates[0]!==first||dates.at(-1)!==last||dates.some((d,i)=>i&&d<=dates[i-1])) throw new Error('History snapshots must be unique, sorted, and include both endpoints');
  const rows=snapshots.map(s=>{
    const values=new Map(s.records.map(r=>[r.observation_period,r.value]));
    return {date:s.date,february:values.get('2025-02-01')??null,march:values.get('2025-03-01')??null,growth:replay(s.records).growth};
  });
  const reference=rows.at(-1);
  if(reference.growth===null) throw new Error('Reference vintage lacks February or March');
  const metrics={};
  for(const field of ['february','march','growth']) {
    const known=rows.filter(r=>r[field]!==null);
    let lastChange=null,changes=0;
    for(let i=1;i<known.length;i++) if(known[i][field]!==known[i-1][field]) {lastChange=known[i].date;changes++;}
    metrics[field]={initial:known[0]?.[field]??null,reference:reference[field],change_count:changes,last_observed_change:lastChange,observed_unchanged_since:lastChange??known[0]?.date??null,days_from_first_to_last_change:lastChange?days(first,lastChange):null,right_censored_at:last};
  }
  const sensitivity=thresholds.map(threshold=>{
    if(!Number.isFinite(threshold)) throw new Error('Invalid threshold');
    const referenceAlert=reference.growth<threshold;
    const earlier=rows.slice(0,-1).filter(r=>r.growth!==null);
    const disagree=earlier.filter(r=>(r.growth<threshold)!==referenceAlert);
    const adjacent=[];
    for(let i=1;i<rows.length;i++) if(rows[i-1].growth!==null&&rows[i].growth!==null&&(rows[i-1].growth<threshold)!==(rows[i].growth<threshold)) adjacent.push([rows[i-1].date,rows[i].date]);
    return {threshold,reference_alert:referenceAlert,disagreements:disagree.length,eligible:earlier.length,rate:earlier.length?disagree.length/earlier.length:null,disagreement_dates:disagree.map(r=>r.date),adjacent_flips:adjacent};
  });
  return {rows,metrics,sensitivity,first,last,source_vintages:snapshots.length,reference_date:last};
}
