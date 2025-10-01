import { useState } from 'react';

async function getLatLon(place:string){
// fallback rapid: câteva localități – extinde după nevoi
const map: Record<string,{lat:number;lon:number}> = {
'arad': { lat:46.1667, lon:21.3167 },
'timisoara': { lat:45.7489, lon:21.2087 },
'sibiu': { lat:45.8, lon:24.15 },
};
const key = place.toLowerCase();
return map[key] ?? map['arad'];
}

export default function Alerts(){
const [place, setPlace] = useState('Arad');
const [msgs, setMsgs] = useState<string[]>([]);

async function check(){
const { lat, lon } = await getLatLon(place);
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,temperature_2m,windspeed_10m&forecast_days=3`;
const res = await fetch(url); const data = await res.json();
const precip = data.hourly.precipitation as number[];
const temp = data.hourly.temperature_2m as number[];
const wind = data.hourly.windspeed_10m as number[];

const total24 = precip.slice(0,24).reduce((s,n)=>s+n,0);
const calmHours = wind.filter(w=>w<12).length;
const hotDays = temp.filter(t=>t>32).length/24;

const out:string[] = [];
if (total24 >= 3) out.push('🌧 Plouă ≥3mm/24h → evită erbicidul pre-ploaie; pregătește post-ploaie.');
if (calmHours >= 6) out.push('🌬 Fereastră vânt <12 km/h (≥6h) → bun pentru tratamente.');
if (hotDays >= 2) out.push('🔥 Caniculă (≥2 zile) → risc stres termic; evită aplicări azotate.');
if (out.length===0) out.push('✅ Nicio alertă critică în următoarele 72h.');

setMsgs(out);
}

return (
<div style={{maxWidth:700, margin:'40px auto'}}>
<h1>Alerte meteo → acțiuni</h1>
<div style={{display:'flex', gap:8, marginBottom:12}}>
<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Localitate (ex: Arad)" />
<button onClick={check}>Verifică</button>
</div>
<ul>{msgs.map((m,i)=><li key={i}>{m}</li>)}</ul>
</div>
);
}
