'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function ActionForm({command,fields={},children,className='',reset=false}:{command:string;fields?:Record<string,string>;children:React.ReactNode;className?:string;reset?:boolean}) {
 const [pending,setPending]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');const router=useRouter();
 return <form className={className} onSubmit={async event=>{event.preventDefault();if(pending)return;const form=event.currentTarget;setPending(true);setError('');setMessage('');try{const response=await fetch('/api/command',{method:'POST',body:new FormData(form)});const result=await response.json();if(!response.ok){setError(result.error||'Unable to complete request.');return;}setMessage(result.message);if(reset)form.reset();if(result.redirect)router.push(result.redirect);router.refresh();}catch{setError('Connection failed. Check your connection and try again.');}finally{setPending(false);}}}>
 <input type="hidden" name="command" value={command}/>{Object.entries(fields).map(([name,value])=><input key={name} type="hidden" name={name} value={value}/>)}
 <fieldset disabled={pending}>{children}</fieldset>{pending&&<p role="status" className="meta">Saving…</p>}{error&&<p role="alert" className="error">{error}</p>}{message&&<p role="status" className="meta">{message}</p>}
 </form>;
}
