import { useEffect,useState } from 'react';
export function useData(loader) {
  const [state,setState]=useState({loading:true,data:null,error:null}),[version,setVersion]=useState(0);
  useEffect(()=>{ let active=true; setState(s=>({...s,loading:true,error:null}));
    loader().then(data=>{if(active)setState({data,loading:false,error:null});}).catch(error=>{if(active)setState({data:null,loading:false,error});});
    return ()=>{active=false;};
  },[loader,version]);
  return {...state,reload:()=>setVersion(v=>v+1)};
}
