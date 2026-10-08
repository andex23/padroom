import { database } from './supabase';
import { Listing } from './domain';
export async function photoUrl(path:string){const db=await database();const {data,error}=await db.storage.from('listing-photos').createSignedUrl(path,60);if(error)return null;return data.signedUrl;}
export async function photos(listing:Listing){return Promise.all((listing.listing_images??[]).sort((a,b)=>a.position-b.position).map(async i=>({...i,url:await photoUrl(i.storage_path)})));}
export const listingSelect='*,listing_images(id,storage_path,position)';
export function fail(error:{message:string}|null){if(error)throw new Error('The database request failed. Check the connection and retry.');}
