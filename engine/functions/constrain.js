function constrain(){let sw=2048*scale,sh=1078*scale;panX=sw<W?(W-sw)/2:clamp(panX,W-sw-32,32);panY=sh<H?(H-sh)/2:clamp(panY,H-sh-32,32)}
