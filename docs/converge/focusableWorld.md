# focusableWorld

Converged to `engine/functions/focusableWorld.js` (was five variants).

The five variants matched a world by progressively more of its record: name only (Calidor),
name and synced title (Elysian), the record's own fields (Kadaym, IULR), or name plus planet aliases
(UACS). They are all the same call once `matchesRecord` is converged:

```js
matchesRecord({ name: b.name, ...DATA.worlds[b.name] }, name);
```

Why this does not change anything: world records in Calidor, Elysian and UACS carry none of `id`,
`name`, `nickname` or `aliases`, so spreading them adds nothing; Kadaym's (aliases) and IULR's (`id`,
`name` equal to the key, aliases) are exactly what their variants already matched. Title and alias
matching come from the `planetName` and `planetAliases` hooks inside `matchesRecord`.

No flags. No questions.
