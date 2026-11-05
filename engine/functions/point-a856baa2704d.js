function point(e){const p=$('galaxy').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('galaxy').getScreenCTM().inverse())}
