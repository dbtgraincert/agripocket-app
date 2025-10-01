import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Field = { id: string; name: string; area_ha: number };

export default function Fields() {
const [fields, setFields] = useState<Field[]>([]);
const [name, setName] = useState('');
const [area, setArea] = useState('');

useEffect(() => { fetchFields(); }, []);

async function fetchFields() {
const { data, error } = await supabase
.from('fields')
.select('id,name,area_ha')
.order('inserted_at', { ascending: false });
if (error) alert(error.message); else setFields(data || []);
}

async function addField(e: React.FormEvent) {
e.preventDefault();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return alert('Trebuie să fii logat (mergi la /login).');

const { error } = await supabase.from('fields').insert({
user_id: user.id,
name,
area_ha: parseFloat(area || '0')
});
if (error) return alert(error.message);
setName(''); setArea('');
fetchFields();
}

return (
<div style={{maxWidth:680,margin:'40px auto'}}>
<h1>Parcelele mele</h1>
<form onSubmit={addField} style={{display:'flex',gap:8,marginBottom:16}}>
<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nume parcelă" />
<input value={area} onChange={e=>setArea(e.target.value)} placeholder="Suprafață (ha)" />
<button type="submit">Adaugă</button>
</form>
<ul>
{fields.map(f => <li key={f.id}>{f.name} — {f.area_ha} ha</li>)}
</ul>
</div>
);
}
