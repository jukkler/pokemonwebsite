ALTER TABLE "GameVersion"
ADD COLUMN "pokeapiVersionSlug" TEXT,
ADD COLUMN "pokeapiVersionGroupSlug" TEXT;

UPDATE "GameVersion" AS game_version
SET
    "pokeapiVersionSlug" = mapping.version_slug,
    "pokeapiVersionGroupSlug" = mapping.version_group_slug
FROM (VALUES
    ('red', 'red', 'red-blue'),
    ('blue', 'blue', 'red-blue'),
    ('yellow', 'yellow', 'yellow'),
    ('gold', 'gold', 'gold-silver'),
    ('silver', 'silver', 'gold-silver'),
    ('crystal', 'crystal', 'crystal'),
    ('ruby', 'ruby', 'ruby-sapphire'),
    ('sapphire', 'sapphire', 'ruby-sapphire'),
    ('emerald', 'emerald', 'emerald'),
    ('firered', 'firered', 'firered-leafgreen'),
    ('leafgreen', 'leafgreen', 'firered-leafgreen'),
    ('diamond', 'diamond', 'diamond-pearl'),
    ('pearl', 'pearl', 'diamond-pearl'),
    ('platinum', 'platinum', 'platinum'),
    ('heartgold', 'heartgold', 'heartgold-soulsilver'),
    ('soulsilver', 'soulsilver', 'heartgold-soulsilver'),
    ('black', 'black', 'black-white'),
    ('white', 'white', 'black-white'),
    ('black2', 'black-2', 'black-2-white-2'),
    ('white2', 'white-2', 'black-2-white-2'),
    ('x', 'x', 'x-y'),
    ('y', 'y', 'x-y'),
    ('omegaruby', 'omega-ruby', 'omega-ruby-alpha-sapphire'),
    ('alphasapphire', 'alpha-sapphire', 'omega-ruby-alpha-sapphire'),
    ('sun', 'sun', 'sun-moon'),
    ('moon', 'moon', 'sun-moon'),
    ('ultrasun', 'ultra-sun', 'ultra-sun-ultra-moon'),
    ('ultramoon', 'ultra-moon', 'ultra-sun-ultra-moon'),
    ('letsgopikachu', 'lets-go-pikachu', 'lets-go-pikachu-lets-go-eevee'),
    ('letsgoeevee', 'lets-go-eevee', 'lets-go-pikachu-lets-go-eevee'),
    ('sword', 'sword', 'sword-shield'),
    ('shield', 'shield', 'sword-shield'),
    ('brilliantdiamond', 'brilliant-diamond', 'brilliant-diamond-and-shining-pearl'),
    ('shiningpearl', 'shining-pearl', 'brilliant-diamond-and-shining-pearl'),
    ('legendsarceus', 'legends-arceus', 'legends-arceus'),
    ('scarlet', 'scarlet', 'scarlet-violet'),
    ('violet', 'violet', 'scarlet-violet')
) AS mapping(key, version_slug, version_group_slug)
WHERE game_version.key = mapping.key;

CREATE TABLE "PokemonEditionDetailCache" (
    "id" SERIAL NOT NULL,
    "pokedexId" INTEGER NOT NULL,
    "versionGroupSlug" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PokemonEditionDetailCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PokemonEditionDetailCache_pokedexId_versionGroupSlug_key"
ON "PokemonEditionDetailCache"("pokedexId", "versionGroupSlug");

CREATE INDEX "PokemonEditionDetailCache_expiresAt_idx"
ON "PokemonEditionDetailCache"("expiresAt");
