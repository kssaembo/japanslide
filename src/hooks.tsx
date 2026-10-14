import {createContext,useContext,useEffect,useState} from 'react';
import type {Deck} from './types';
import type {Session} from '@supabase/supabase-js';
import {defaultDeck,published} from './backend';
import {db,isAdmin} from './cloud';
type AuthState={session:Session|{user:{id:string}}|null;admin:boolean;ready:boolean};
export const AuthContext=createContext<AuthState>({session:null,admin:!db,ready:!db});
export function useAuthState():AuthState{const[state,set]=useState<AuthState>({session:null,admin:!db,ready:!db});useEffect(()=>{if(!db)return;let live=true,sequence=0;const update=async(session:Session|null)=>{const seq=++sequence;let admin=false;try{admin=!!session&&await isAdmin();}catch{}if(live&&seq===sequence)set({session,admin,ready:true});};void db.auth.getSession().then(({data})=>update(data.session));const{data}=db.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>void update(session),0);});return()=>{live=false;data.subscription.unsubscribe();};},[]);return state;}
export const useAuth=()=>useContext(AuthContext);
export function useOnline(){const[online,set]=useState(navigator.onLine);useEffect(()=>{const f=()=>set(navigator.onLine);window.addEventListener('online',f);window.addEventListener('offline',f);return()=>{window.removeEventListener('online',f);window.removeEventListener('offline',f)}},[]);return online;}
export function useDeck(slug='day1'){const[deck,setDeck]=useState<Deck>(defaultDeck),[status,setStatus]=useState(''),[loading,setLoading]=useState(true);const refresh=async()=>{setLoading(true);try{setDeck(await published(slug));setStatus('')}catch(e){setStatus((e as Error).message)}finally{setLoading(false)}};useEffect(()=>{void refresh();const onFocus=()=>void refresh();window.addEventListener('online',onFocus);window.addEventListener('focus',onFocus);return()=>{window.removeEventListener('online',onFocus);window.removeEventListener('focus',onFocus);};},[slug]);return {deck,setDeck,status,loading,refresh};}
