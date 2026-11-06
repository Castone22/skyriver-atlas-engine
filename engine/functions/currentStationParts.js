function currentStationParts(){const st=worldRecord(resolveSystem(selected),selectedWorld);return st?.schematic==='foundry'?foundryParts:st?.schematic==='triad'?triadParts:toraParts}
