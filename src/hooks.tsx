import {createContext,useContext,useEffect,useState} from 'react';
import type {Deck} from './types';
import {defaultDeck,published} from './backend';
type LocalState={session:{user:{id:string}}|null;admin:boolean;ready:boolean};
export const AuthContext=createContext<LocalState>({session:null,admin:true,ready:true});
export const useAuthState=():LocalState=>({session:null,admin:true,ready:true});
export const useAuth=()=>useContext(AuthContext);
export function useOnline(){const[online,set]=useState(navigator.onLine);useEffect(()=>{const f=()=>set(navigator.onLine);window.addEventListener('online',f);window.addEventListener('offline',f);return()=>{window.removeEventListener('online',f);window.removeEventListener('offline',f)}},[]);return online;}
export function useDeck(slug='day1'){const[deck,setDeck]=useState<Deck>(defaultDeck),[status,setStatus]=useState(''),[loading,setLoading]=useState(true);const refresh=async()=>{setLoading(true);try{setDeck(await published(slug));setStatus('')}catch(e){setStatus((e as Error).message)}finally{setLoading(false)}};useEffect(()=>{void refresh()},[slug]);return {deck,setDeck,status,loading,refresh};}
