import { ImageResponse } from 'next/og';
export const alt='Were Di · Glazen Huis voor ALS';
export const size={width:1200,height:630};export const contentType='image/png';
export default function Image(){return new ImageResponse(<div style={{background:'#f2f2f2',width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:90,borderLeft:'28px solid #ea3797'}}><div style={{fontSize:32}}>WERE DI · GLAZEN HUIS</div><div style={{display:'flex',flexDirection:'column',fontSize:88,fontWeight:700,marginTop:28}}>Samen maken we<br/>het verschil.</div><div style={{fontSize:30,marginTop:30}}>24 uur voor ALS · Valkenswaard</div></div>,size);}
