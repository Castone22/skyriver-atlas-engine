import { Atlas } from '../src/atlas.mjs';
import definition from '../bundles/uacs/atlas.json' with { type: 'json' };

// Edit this data through the DSL, or edit its JSON catalogue directly.
export default Atlas.fromJSON(definition).build({ strict: false });
