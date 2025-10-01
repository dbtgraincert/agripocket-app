import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Field = { id:string; name:string };
type Crop = { id:string; field_id:string; crop_name:string; season_year:number };

const BAD: Record<string,string[]> = {
'porumb': ['porumb'],
'floarea-soarelui': ['floarea-soarelui'],
};
const PREFER: Record<string,string[]> = {
'leguminoase': ['grâu'],
'rapiță': ['grâu'],
}

export default function Rotation(){
const [fields, setFields] = useState<Field[]>([]);
const [crops, setCrops] = useState<Crop[]>([]);
const [fieldId, setFieldId] = useState('');
const [name, setName] = useState('porumb');
const [year, setYear] = useState<number>(new Date().getFullYear());

useEffect(()=>{ (async()=>{
const { data: f } = await supabase.from('fields').select('id,name');
setFields(f || []);
const { data: c } = await supabase.from('crops').select('*').order('season_year',{ascending:false});
setCrops(c || []);
})(); }, []);

function checkConflict(field_id:string, nextCrop:string, nextYear:number){
const last = crops.find(c => c.field_id===field_id && c.season_year===nextYear-1);
if (!last) return { status:'ok', note:'(fără date anul trecut)' };
if (BAD[last.crop_name]?.includes(nextCrop)) return { status:'avoid', note:`evită ${nextCrop} după ${last.crop_name}` };
if (PREFER[last.crop_name]?.includes(nextCrop)) return { status:'prefer', note:`succesiune bună: ${last.crop_name} → ${nextCrop}` };
return { status:'ok', note:'ok' };
}

async function addCrop(e:React.FormEvent){
e.preventDefault();
if (!fieldId) return alert('Alege o parcelă');
const r = checkConflict(fieldId, name, year);
if (r.status==='avoid') if (!confirm(`Avertisment: ${r.note}. Continui?`)) return;
const { error } = await supabase.from('crops').insert({ field_id: fieldId, crop_name: name, season_year: year });
if (error) return alert(error.message);
setCrops([{ id:crypto.randomUUID(), field_id:fieldId, crop_name:name, season_year:year }, ...crops]);
}

return (
<div style={{maxWidth:800, margin:'40px auto'}}>
<h1>Plan rotație (simplu)</h1>
<form onSubmit={addCrop} style={{display:'flex', gap:8, marginBottom:16}}>
<select value={fieldId} onChange={e=>setFieldId(e.target.value)}>
<option value="">— Parcelă —</option>
{fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
</select>
<input value={name} onChange={e=>setName(e.target.value)} placeholder="Cultură (ex: porumb)" />
<input type="number" value={year} onChange={e=>setYear(parseInt(e.target.value||'0'))} />
<button type="submit">Propune</button>
</form>

{fieldId && (
<p>
Verificare: {
(()=>{ const r=checkConflict(fieldId,name,year);
return <b style={{color:r.status==='avoid'?'crimson':r.status==='prefer'?'green':''}}>{r.status}</b>;
})()
}
</p>
)}

<h3>Istoric culturi</h3>
<ul>
{crops.map(c => {
const f = fields.find(x=>x.id===c.field_id);
return <li key={c.id}>{c.season_year} — {f?.name}: {c.crop_name}</li>
})}
</ul>
</div>
);
}
