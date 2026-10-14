import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {readSession,writeSession} from './session.js';
import {zh} from './locales/zh.js';
export function translate(value,language='en'){
 if(language!=='zh'||typeof value!=='string')return value;
 if(Object.hasOwn(zh,value))return zh[value];
 const trimmed=value.trim();
 if(Object.hasOwn(zh,trimmed))return value.replace(trimmed,()=>zh[trimmed]);
 const scoped=trimmed.match(/^(.*) \((conditional GT-water support|full domain|GT water)\)$/);
 if(scoped&&Object.hasOwn(zh,scoped[1]))return zh[scoped[1]]+({'conditional GT-water support':'（条件性 GT 水体有效区域）','full domain':'（全域）','GT water':'（GT 水体）'}[scoped[2]]);
 return value;
}
const LanguageContext=createContext({language:'en',setLanguage:()=>{},tr:v=>v});
export function LanguageProvider({children}){
 const [language,setLanguage]=useState(()=>readSession('language')?.value==='zh'?'zh':'en');
 useEffect(()=>{writeSession('language',{value:language});document.documentElement.lang=language==='zh'?'zh-CN':'en'},[language]);
 const value=useMemo(()=>({language,setLanguage:next=>setLanguage(next==='zh'?'zh':'en'),tr:v=>translate(v,language)}),[language]);
 return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useI18n=()=>useContext(LanguageContext);
