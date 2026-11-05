function zoom(f,x=W/2,y=H/2){let ns=clamp(scale*f,fitScale,fitScale*12);panX=x-(x-panX)*ns/scale;panY=y-(y-panY)*ns/scale;scale=ns;updateMap()}
