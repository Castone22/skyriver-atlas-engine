function routeURL(){
 const flags=__ATLAS__.flags,address=new URL(location.href);
 if(flags.widgetKeepsAddress&&widgetMode&&!systemFocused)return address;
 ['region','system','planet','object','focus',...(flags.highlightRouteParam?['highlight']:['chart']),...(flags.stationRoute==='station'?['station']:[])].forEach(key=>address.searchParams.delete(key));
 const record=resolveSystem(selected);
 if(flags.highlightRouteParam&&highlightedRegion)address.searchParams.set('highlight',highlightedRegion);
 if(!record?.unplottedSystem)address.searchParams.set('region',view);
 if(!flags.highlightRouteParam&&overviewMode&&(view!=='all'||record))address.searchParams.set('chart',flags.overviewChart);
 if(record){address.searchParams.set('system',record.slug||record.id);address.searchParams.set('object',selectedWorld||'');if(!systemFocused)address.searchParams.set('focus','region');}
 if(flags.stationRoute==='focus'&&stationOverview&&systemFocused)address.searchParams.set('focus','station');
 if(systemFocused&&planetFocus)address.searchParams.set('planet',planetFocus);
 if(flags.stationRoute==='station'&&stationOverview)address.searchParams.set('station','1');
 if(widgetMode){address.searchParams.set('view','widget');address.searchParams.delete('embed')}else if(embedMode)address.searchParams.set('embed','1');else address.searchParams.delete('embed');
 address.hash=encodeURIComponent(record?selectedWorld||record.name:DATA.regions[view]?.name||'all');return address;
}
