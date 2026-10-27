export const PALO_ALTO_TIME_ZONE='America/Los_Angeles';
const clockFormat=new Intl.DateTimeFormat('en-US',{timeZone:PALO_ALTO_TIME_ZONE,hourCycle:'h23',hour:'2-digit',minute:'2-digit',second:'2-digit'});

// NOAA's general solar-position equations. Longitude is positive east.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export function solarElevation(date,latitude=37.4419,longitude=-122.1430){
 const year=date.getUTCFullYear(),start=Date.UTC(year,0,1),days=(Date.UTC(year+1,0,1)-start)/86400000;
 const day=Math.floor((date.getTime()-start)/86400000)+1;
 const hour=date.getUTCHours()+date.getUTCMinutes()/60+date.getUTCSeconds()/3600;
 const g=2*Math.PI/days*(day-1+(hour-12)/24);
 const equation=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
 const declination=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
 const solarMinutes=((hour*60+equation+4*longitude)%1440+1440)%1440;
 const angle=(solarMinutes/4-180)*Math.PI/180,lat=latitude*Math.PI/180;
 const cosine=Math.sin(lat)*Math.sin(declination)+Math.cos(lat)*Math.cos(declination)*Math.cos(angle);
 return 90-Math.acos(Math.max(-1,Math.min(1,cosine)))*180/Math.PI;
}

export function paloAltoNow(date=new Date()){
 const elevation=solarElevation(date);
 return {time:clockFormat.format(date),elevation,mode:elevation>5?0:elevation> -6?1:2};
}
