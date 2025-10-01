import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Field = { id: string; name: string; area_ha: number };
type Expense = { id: string; field_id: string; crop_name: string | null; amount: number };
type Sale = { id: string; field_id: string; crop_name: string | null; quantity_t: number | null; unit_price_value: number | null };

function safe(n: number | null | undefined) { return typeof n === 'number' && !Number.isNaN(n) ? n : 0; }

export default function MarginPage() {
const [fields, setFields] = useState<Field[]>([]);
const [expenses, setExpenses] = useState<Expense[]>([]);
const [sales, setSales] = useState<Sale[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
(async () => {
setLoading(true);
const [{ data: f }, { data: e }, { data: s }] = await Promise.all([
supabase.from('fields').select('id,name,area_ha'),
supabase.from('expenses').select('id,field_id,crop_name,amount'),
supabase.from('sales').select('id,field_id,crop_name,quantity_t,unit_price_value'),
]);
setFields(f || []);
setExpenses(e || []);
setSales(s || []);
setLoading(false);
})();
}, []);

// —— KPI generale
const totalHa = useMemo(() => fields.reduce((sum, f) => sum + safe(f.area_ha), 0), [fields]);
const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + safe(e.amount), 0), [expenses]);
const totalRevenue = useMemo(
() => sales.reduce((sum, s) => sum + safe(s.quantity_t) * safe(s.unit_price_value), 0),
[sales]
);

const costPerHa = totalHa > 0 ? totalExpenses / totalHa : 0;
const revenuePerHa = totalHa > 0 ? totalRevenue / totalHa : 0;
const marginPerHa = revenuePerHa - costPerHa;

// —— Pe cultură (agregat după crop_name; null => „necunoscut”)
type Row = { crop: string; expenses: number; revenue: number; area_ha: number; costPerHa: number; revenuePerHa: number; marginPerHa: number };
const byCrop: Row[] = useMemo(() => {
// area_ha pe cultură: dacă nu ai alocat area/field pe cultură, împărțim aria parcelei între culturile din vânzări/cheltuieli pe același field.
// MVP simplu: folosim TOTAL ha la nivel de fermă (aceeași bază) — și arătăm cifra per cultură relativă la total ha.
const map: Record<string, { expenses: number; revenue: number }> = {};
expenses.forEach(e => {
const k = (e.crop_name || 'necunoscut').toLowerCase();
map[k] = map[k] || { expenses: 0, revenue: 0 };
map[k].expenses += safe(e.amount);
});
sales.forEach(s => {
const k = (s.crop_name || 'necunoscut').toLowerCase();
map[k] = map[k] || { expenses: 0, revenue: 0 };
map[k].revenue += safe(s.quantity_t) * safe(s.unit_price_value);
});

const rows: Row[] = Object.entries(map).map(([crop, v]) => {
const area = totalHa || 1; // bază comună
const costPh = v.expenses / area;
const revPh = v.revenue / area;
return { crop, expenses: v.expenses, revenue: v.revenue, area_ha: area, costPerHa: costPh, revenuePerHa: revPh, marginPerHa: revPh - costPh };
});

// sort desc după marjă/ha
rows.sort((a, b) => b.marginPerHa - a.marginPerHa);
return rows;
}, [expenses, sales, totalHa]);

if (loading) return <div style={{maxWidth:800,margin:'40px auto'}}>Se încarcă…</div>;

return (
<div style={{maxWidth:1000, margin:'40px auto', display:'grid', gap:16}}>
<h1>Marjă/ha</h1>

<div style={{display:'flex', gap:24, flexWrap:'wrap'}}>
<Kpi label="Suprafață totală (ha)" value={totalHa} />
<Kpi label="Cost total" value={totalExpenses} money />
<Kpi label="Venit total" value={totalRevenue} money />
<Kpi label="Cost / ha" value={costPerHa} money />
<Kpi label="Venit / ha" value={revenuePerHa} money />
<Kpi label="Marjă / ha" value={marginPerHa} money strong />
</div>

<h3>Pe cultură (agregat simplu)</h3>
<table style={{width:'100%', borderCollapse:'collapse'}}>
<thead>
<tr>
<Th>Culture</Th><Th align="right">Cheltuieli</Th><Th align="right">Venit</Th>
<Th align="right">Cost/ha</Th><Th align="right">Venit/ha</Th><Th align="right">Marjă/ha</Th>
</tr>
</thead>
<tbody>
{byCrop.map((r, i) => (
<tr key={i}>
<Td>{r.crop}</Td>
<Td align="right">{fmt(r.expenses, true)}</Td>
<Td align="right">{fmt(r.revenue, true)}</Td>
<Td align="right">{fmt(r.costPerHa, true)}</Td>
<Td align="right">{fmt(r.revenuePerHa, true)}</Td>
<Td align="right" style={{fontWeight:600}}>{fmt(r.marginPerHa, true)}</Td>
</tr>
))}
</tbody>
</table>

<p style={{opacity:.7}}>
*MVP note*: Pentru precizie la nivel de cultură, ar fi ideal să aloci suprafață/ha per cultură pe fiecare parcelă (ex. `crops.yield_est_t_ha` sau `crops.area_override_ha`). Momentan, calculul pe cultură folosește suprafața totală a fermei ca bază comună.
</p>
</div>
);
}

function Kpi({ label, value, money=false, strong=false }: {label:string; value:number; money?:boolean; strong?:boolean}) {
const v = fmt(value, money);
return (
<div style={{padding:12, border:'1px solid #ddd', borderRadius:8, minWidth:180}}>
<div style={{fontSize:12, opacity:.7}}>{label}</div>
<div style={{fontSize:20, fontWeight: strong ? 700 : 500}}>{v}</div>
</div>
);
}

function fmt(n: number, money=false) {
const v = (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
return money ? `${v}` : v;
}

function Th({ children, align='left' }: any) {
return <th style={{textAlign:align, borderBottom:'1px solid #ddd', padding:'8px 6px'}}>{children}</th>;
}
function Td({ children, align='left', style }: any) {
return <td style={{textAlign:align, padding:'8px 6px', borderBottom:'1px solid #f0f0f0', ...style}}>{children}</td>;
}
