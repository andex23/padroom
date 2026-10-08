import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export function configured() { return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
export async function database() {
  if (!configured()) throw new Error('Supabase is not configured. Follow README.md to connect the database.');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll(items){try{items.forEach(({name,value,options})=>jar.set(name,value,options));}catch{/* Server components cannot set cookies; proxy refreshes them. */}}}});
}
export async function viewer() { if(!configured()) return null; const db=await database(); const {data:{user}}=await db.auth.getUser(); return user; }
export async function authenticated() { const user=await viewer(); if(!user) redirect('/sign-in'); return {user,db:await database()}; }
export async function administrator() { const {user,db}=await authenticated(); const {data,error}=await db.rpc('is_admin'); if(error||!data) redirect('/account?error=Administrator%20access%20required'); return {user,db}; }
