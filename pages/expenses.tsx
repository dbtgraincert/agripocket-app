import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Field = { id: string; name: string; area_ha: number };
type Expense = { id: string; field_id: string; category: string; amount: number; op_date: string };
const CATS = ['fuel','seeds','fertilizer','labor','services','other'];

export default function Expenses() {
const [fields, setFields] = useState<Field[]>([]);
const [expenses, setExpenses] = useState<Expense[]>([]);
// form
const [fieldId, setFieldId] = useState('');
const [category, setCategory] = useState('fuel');
const [amount, setAmount] = useState('');

useEffect(() => { load(); }, []);
async function load() {
const { data: f } = await supabase.from('fields').select('id,name,area_ha').order('inserted_at', { ascending:false });
setFields(f || []);
const { data: e } = await supabase.from('expenses').select('*').order('op_date', { ascending:false });
setExpenses(e || []);
}

async function addExpense(e: React.FormEvent) {
e.preventDefault();
if (!fieldId) return alert('Alege o parcelă');
const value = parseFloat(amount || '0');
if (Number.isNaN(value) || value <= 0) return alert('Sumă invalidă');

const { error } = await supabase.from('expenses').insert({
field_id: fieldId, category, amount: value
});
if (error) return alert(error.message);
setAmount(''); setCategory('fuel'); setFieldId(''); load();
}

// KPI: cost total, cost/ha, marjă/ha (doar cheltuieli, fără vânzări încă)
const kpis = useMemo(() => {
const totalExpenses = expenses.reduce((s,e) => s + (e.amount||0), 0);
const totalHa = fields.reduce((s,f) => s + (f.area_ha||0), 0);
const costPerHa = totalHa > 0 ? totalExpenses / totalHa : 0;
return { totalExpenses, totalHa, costPerHa };
}, [expenses, fields]);

return (
<div style={{maxWidth:900, margin:'40px auto'}}>
<h1>Cheltuieli</h1>

<form onSubmit={addExpense} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:16}}>
<select value={fieldId} onChange={e=>setFieldId(e.target.value)}>
<option value="">— Alege parcelă —</option>
{fields.map(f => <option key={f.id} value={f.id}>{f.name} ({f.area_ha} ha)</option>)}
</select>
<select value={category} onChange={e=>setCategory(e.target.value)}>
{CATS.map(c => <option key={c} value={c}>{c}</option>)}
</select>
<input placeholder="Sumă" value={amount} onChange={e=>setAmount(e.target.value)} />
<button type="submit">Adaugă</button>
</form>

<div style={{display:'flex', gap:24, marginBottom:16}}>
<div>👉 <b>Cost total:</b> {kpis.totalExpenses.toFixed(2)}</div>
<div>👉 <b>Total ha:</b> {kpis.totalHa.toFixed(2)}</div>
<div>👉 <b>Cost/ha:</b> {kpis.costPerHa.toFixed(2)}</div>
</div>

<table style={{width:'100%', borderCollapse:'collapse'}}>
<thead><tr><th align="left">Parcela</th><th align="left">Categorie</th><th align="right">Sumă</th><th align="left">Data</th></tr></thead>
<tbody>
{expenses.map(e => {
const f = fields.find(x => x.id === e.field_id);
return (
<tr key={e.id}>
<td>{f?.name ?? '—'}</td>
<td>{e.category}</td>
<td align="right">{e.amount?.toFixed(2)}</td>
<td>{new Date(e.op_date).toLocaleDateString()}</td>
</tr>
);
})}
</tbody>
</table>
</div>
);
}
