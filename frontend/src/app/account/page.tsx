'use client';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {useEffect, useState, type FormEvent} from 'react';

export default function Account() {
  const [client,setClient]=useState<SupabaseClient|null>(null);
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [userEmail,setUserEmail]=useState<string|null>(null);
  const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  useEffect(()=>{
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if(!url || !key){setMessage('Account services are not configured yet.');return;}
    const supabase=createClient(url,key); setClient(supabase);
    const {data}=supabase.auth.onAuthStateChange((_event,session)=>setUserEmail(session?.user.email ?? null));
    return ()=>data.subscription.unsubscribe();
  },[]);
  async function act(action: 'login'|'signup'|'google'|'logout') {
    if(!client)return;
    setBusy(true);setMessage('');
    try {
      const redirectTo=window.location.origin+'/account';
      const result=action==='google' ? await client.auth.signInWithOAuth({provider:'google',options:{redirectTo}})
        : action==='logout' ? await client.auth.signOut()
        : action==='signup' ? await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}})
        : await client.auth.signInWithPassword({email,password});
      if(result.error)throw result.error;
      setMessage(action==='signup'?'Check your email for confirmation. Creating an account does not grant administrative access.':action==='logout'?'Signed out.':'');
      setPassword('');
    }catch(error){setMessage(error instanceof Error?error.message:'Account request failed. Please retry.');}
    finally{setBusy(false);}
  }
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();void act('login');}
  return <><h1>Participant account</h1>{userEmail?<section><p>Signed in as {userEmail}</p><p>Administration and Alumni Connect require separately verified membership. Those modules are not available in this foundation build.</p><button disabled={busy} onClick={()=>void act('logout')}>Sign out</button></section>:<><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={!client||busy}>Sign in</button><button type="button" disabled={!client||busy||!email||password.length<8} onClick={()=>void act('signup')}>Create account</button></form><section><button disabled={!client||busy} onClick={()=>void act('google')}>Continue with Google</button></section></>}<p role="status" aria-live="polite">{message}</p></>;
}
