import { Atlas } from '../src/atlas.mjs';

// Framework demonstration only; these locations are not additions to Skyriver canon.
export default Atlas.stellar({
  id: 'dsl-demo',
  renderer: 'elysian',
  title: 'Atlas DSL · Working example',
  article: 'Atlas Framework Demonstration'
})
  .extent(-100, -100, 1400, 1100)
  .presentation({
    version: 'Atlas DSL v1',
    notesHTML: '<p>A noncanonical demonstration of the JavaScript atlas DSL.</p>'
  })
  .feature('index', { collapsed: true })
  .feature('labels', {
    overview: { active: [100, 130], other: [130, 170] },
    regional: { active: [64, 80], other: [80, 125] }
  })
  .asset(
    'flag',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA1MCI+PHBhdGggZmlsbD0iIzBkMTcyNiIgZD0iTTAgMGg4MHY1MEgweiIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iMjUiIHI9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3OGNmZGYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg=='
  )
  .region(
    'demo-reach',
    {
      name: 'Demonstration Reach',
      color: '#78cfdf',
      bounds: [0, 0, 1000, 900],
      description: 'An example region defined entirely by data.',
      outline: [
        [0, 0],
        [600, 0],
        [1000, 220],
        [880, 850],
        [300, 900],
        [0, 600]
      ],
      labelAnchor: [450, 450]
    },
    (region) =>
      region
        .system(
          'demo-star',
          {
            name: 'Demo Star',
            x: 390,
            y: 420,
            primaries: ['Demo Star'],
            affiliation: 'Atlas Framework Demonstration'
          },
          (system) =>
            system.planet(
              'Demo Star III',
              {
                orbitalPosition: 3,
                tag: 'Example world',
                description: 'Stable catalogue key; its article title may change.',
                tint: '#8bbbd2',
                renderOpacity: 1
              },
              (planet) =>
                planet
                  .moon('Demo Moon', { visibility: 'system', inhabited: true })
                  .station('Demo Orbital', {
                    category: 'Habitation',
                    major: true,
                    visibility: 'system'
                  })
            )
        )
        .system('demo-pulsar', {
          name: 'Demo Pulsar',
          x: 730,
          y: 620,
          kind: 'hazard',
          centralBodyType: 'pulsar',
          worlds: []
        })
  )
  .build();
