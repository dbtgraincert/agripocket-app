import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
const [email, setEmail] = useState('');
const [sent, setSent] = useState(false);

async function handleLogin(e: React.FormEvent) {
e.preventDefault();
const { error } = await supabase.auth.signInWithOtp({
email,
options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
});
if (error) alert(error.message); else setSent(true);
}

return (
<div style={{maxWidth:420,margin:'48px auto',display:'grid',gap:12}}>
<h1>AgriPocket – Login</h1>
{sent ? (
<p>Verifică emailul și dă click pe linkul magic.</p>
) : (
<form onSubmit={handleLogin} style={{display:'grid',gap:8}}>
<input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
<button type="submit">Trimite link</button>
</form>
)}
</div>
);
}
