import {createReadStream, existsSync, readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-08-01'})
const apply = process.argv.includes('--apply')
const webRoot = resolve(fileURLToPath(new URL('../../web', import.meta.url)))

type SluggedDocument = {_id: string; slug?: {current?: string}}
type WorldSeed = {
  slug: string
  name: string
  line: string
  description: string
  sortOrder: number
  status: 'active' | 'hidden'
  mood: {wash: string; deep: string; accent: string}
  heroId: string
}
type PhotoSeed = {
  slug: string
  world: string
  title: string
  alt: string
  caption?: string
  sortOrder: number
  tags: string[]
}
type Manifest = {photos: Record<string, {widths: number[]}>}

const manifest = JSON.parse(
  readFileSync(resolve(webRoot, 'src', 'content', 'photo-manifest.json'), 'utf8'),
) as Manifest

const worlds: WorldSeed[] = [
  {
    slug: 'wander',
    name: 'Wander',
    line: 'Places passed through, horizons kept.',
    description: 'Open horizons, movement, and places passed through slowly enough to keep.',
    sortOrder: 10,
    status: 'active',
    mood: {wash: '#e3edf1', deep: '#16303c', accent: '#3e7284'},
    heroId: 'the-sea',
  },
  {
    slug: 'sacred-geometry',
    name: 'Sacred Geometry',
    line: 'Stone, sky, ritual, and repetition.',
    description: 'Architecture, ritual, repetition, and the geometry that holds them together.',
    sortOrder: 20,
    status: 'active',
    mood: {wash: '#e4ebf4', deep: '#0e2334', accent: '#2c5c9c'},
    heroId: 'tower-and-sky',
  },
  {
    slug: 'small-wonders',
    name: 'Small Wonders',
    line: 'The closer you look, the larger it gets.',
    description: 'Small subjects that become entire landscapes when the frame moves closer.',
    sortOrder: 30,
    status: 'active',
    mood: {wash: '#ecf1e2', deep: '#1d2f16', accent: '#4d7a38'},
    heroId: 'leaf-after-rain',
  },
  {
    slug: 'living-things',
    name: 'Living Things',
    line: 'Company that chooses its own distance.',
    description: 'Living company, photographed at the distance each subject allowed.',
    sortOrder: 40,
    status: 'active',
    mood: {wash: '#e7eee7', deep: '#122019', accent: '#2f5d43'},
    heroId: 'parakeet',
  },
  {
    slug: 'at-the-table',
    name: 'Table Notes',
    line: 'Meals worth interrupting.',
    description: 'Meals, ingredients, and the traces of gathering around a table.',
    sortOrder: 50,
    status: 'active',
    mood: {wash: '#f4ead9', deep: '#33210f', accent: '#b05c2a'},
    heroId: 'banana-leaf-meal',
  },
  {
    slug: 'people',
    name: 'People',
    line: 'Kept close, shown with permission.',
    description: 'Portraits kept private until every person in the frame has said yes.',
    sortOrder: 60,
    status: 'hidden',
    mood: {wash: '#f0e6e2', deep: '#2c1a16', accent: '#a05548'},
    heroId: 'heart-frame',
  },
]

const publishedPhotos: PhotoSeed[] = [
  {
    slug: 'the-sea',
    world: 'wander',
    title: 'Where the Sea Keeps Going',
    alt: 'Waves breaking under a pale sky, the horizon stretching unbroken across the frame.',
    caption: 'The horizon does most of the work. You just have to stand still.',
    sortOrder: 96,
    tags: ['sea', 'horizon', 'hero'],
  },
  {
    slug: 'the-waterfall',
    world: 'wander',
    title: 'The Waterfall',
    alt: 'A white waterfall dropping down a forested rock face under a clear sky.',
    caption: 'Heard long before it was seen.',
    sortOrder: 94,
    tags: ['hills', 'water'],
  },
  {
    slug: 'passing-overhead',
    world: 'wander',
    title: 'Passing Overhead',
    alt: 'An airliner crossing an empty blue sky, seen from below.',
    caption: 'Everyone aboard is going somewhere. From here, it is a slow line across the blue.',
    sortOrder: 92,
    tags: ['sky', 'aircraft'],
  },
  {
    slug: 'tower-and-sky',
    world: 'sacred-geometry',
    title: 'Tower Against a Restless Sky',
    alt: 'A carved temple gopuram rising over rooftops beneath a dramatic streaked sky.',
    caption: 'The sky kept moving. The tower did not.',
    sortOrder: 86,
    tags: ['temple', 'sky', 'hero'],
  },
  {
    slug: 'white-tower',
    world: 'sacred-geometry',
    title: 'The White Tower',
    alt: 'A whitewashed temple tower stacked tier upon tier against a saturated blue sky.',
    caption: 'Every tier holds a hundred figures, and every figure holds still.',
    sortOrder: 84,
    tags: ['temple', 'architecture'],
  },
  {
    slug: 'the-chariot',
    world: 'sacred-geometry',
    title: 'The Chariot Moves',
    alt: 'A tall decorated festival chariot surrounded by a dense crowd on a temple street.',
    caption: 'For one afternoon, the street belongs to something taller than the buildings.',
    sortOrder: 82,
    tags: ['festival', 'crowd'],
  },
  {
    slug: 'leaf-after-rain',
    world: 'small-wonders',
    title: 'Leaf, After Rain',
    alt: 'A small heart-shaped leaf on a green stem, covered in round water droplets.',
    caption: 'The rain had just stopped. The leaf kept what it could.',
    sortOrder: 76,
    tags: ['rain', 'macro', 'hero'],
  },
  {
    slug: 'rain-on-the-street',
    world: 'small-wonders',
    title: 'Rain, Falling Hard',
    alt: 'Rainwater splashing off a dark street, buildings dissolving into grey behind it.',
    caption: 'The whole street turned to sound.',
    sortOrder: 74,
    tags: ['rain', 'street'],
  },
  {
    slug: 'yellow-flowers',
    world: 'small-wonders',
    title: 'Yellow Flowers',
    alt: 'Slender yellow flowers rising through green grass toward soft light.',
    caption: 'They were not planted. They arrived.',
    sortOrder: 72,
    tags: ['flowers'],
  },
  {
    slug: 'cosmos',
    world: 'small-wonders',
    title: 'Cosmos in the Lane',
    alt: 'A single orange cosmos flower in sharp focus against a shaded garden path.',
    caption: 'One bright thing is enough.',
    sortOrder: 70,
    tags: ['flowers'],
  },
  {
    slug: 'tomatoes-on-the-vine',
    world: 'small-wonders',
    title: 'Tomatoes, Evening Light',
    alt: 'Two ripe tomatoes hanging from a dry vine against a warm sunlit wall.',
    caption: 'The wall was doing its best impression of a studio.',
    sortOrder: 68,
    tags: ['produce', 'light'],
  },
  {
    slug: 'parakeet',
    world: 'living-things',
    title: 'Parakeet in the Dark Canopy',
    alt: 'A green rose-ringed parakeet perched in dense, dark foliage, lit by broken light.',
    caption: 'It let me watch for exactly as long as it wanted to.',
    sortOrder: 62,
    tags: ['bird', 'foliage', 'hero'],
  },
  {
    slug: 'the-cat',
    world: 'living-things',
    title: 'A Cat, Content',
    alt: 'A tabby cat with eyes closed, leaning into a hand scratching its head.',
    caption: 'Trust, measured in half-closed eyes.',
    sortOrder: 60,
    tags: ['cat'],
  },
  {
    slug: 'grazing',
    world: 'living-things',
    title: 'Grazing Below the Hills',
    alt: 'A cow grazing on rocky ground with palm trees and dry hills behind.',
    caption: 'Nobody here is in a hurry.',
    sortOrder: 58,
    tags: ['cattle', 'hills'],
  },
  {
    slug: 'banana-leaf-meal',
    world: 'at-the-table',
    title: 'On a Banana Leaf',
    alt: 'A full meal arranged on a banana leaf: rice, breads, and small servings in a circle.',
    caption: 'A whole geography, served on one leaf.',
    sortOrder: 52,
    tags: ['meal', 'hero'],
  },
  {
    slug: 'paneer-skewers',
    world: 'at-the-table',
    title: 'Skewers, Charred',
    alt: 'Grilled paneer and pepper skewers lined up on a long plate.',
    caption: 'Char is a kind of seasoning.',
    sortOrder: 50,
    tags: ['grill'],
  },
  {
    slug: 'toasted',
    world: 'at-the-table',
    title: 'Toasted, Halved',
    alt: 'Grilled sandwich halves stacked on white plates beside a bowl of curry.',
    caption: 'Cut diagonally. It matters.',
    sortOrder: 48,
    tags: ['snack'],
  },
  {
    slug: 'small-plate',
    world: 'at-the-table',
    title: 'A Small Plate',
    alt: 'A bite-sized stuffed pastry topped with a chopped savoury filling, photographed close.',
    caption: 'Two bites, maybe three.',
    sortOrder: 46,
    tags: ['snack'],
  },
]

const seededWorlds = worlds.map(({heroId: _heroId, ...world}) => world)

const singletonDocuments = {
  siteSettings: {
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandMark: 'FO',
    title: 'FrameOS — Pocket Worlds',
    description: 'Things I noticed, photographed on a phone.',
    location: 'India',
    email: '66naren@gmail.com',
    socials: [
      {
        _key: 'mail',
        _type: 'socialLink',
        label: 'Mail',
        href: 'mailto:66naren@gmail.com',
      },
    ],
    seo: {
      _type: 'seo',
      title: 'FrameOS — Pocket Worlds',
      description:
        'A personal archive of things noticed and photographed on a phone: travel, temples, small wonders, living things, and food.',
      imagePublicId: 'the-sea',
    },
  },
  contactPage: {
    _id: 'contactPage',
    _type: 'contactPage',
    headline: 'Found something familiar? Send a signal.',
    body: [
      'If one of these frames reminded you of a place, a meal, or an afternoon — that is the best possible outcome. Write and say so.',
      'Questions about the photographs are welcome too.',
    ],
    email: '66naren@gmail.com',
    socials: [
      {
        _key: 'mail',
        _type: 'socialLink',
        label: 'Mail',
        href: 'mailto:66naren@gmail.com',
      },
    ],
    seo: {
      _type: 'seo',
      title: 'Signal — FrameOS',
      description: 'Get in touch about the FrameOS archive.',
    },
  },
} as const

function photoFile(slug: string) {
  const width = manifest.photos[slug]?.widths.at(-1)

  if (!width) {
    throw new Error(`No publishable image variant exists for “${slug}”.`)
  }

  return resolve(webRoot, 'public', 'photos', slug, `w${width}.webp`)
}

async function existingBySlug(type: 'world' | 'photo', slug: string) {
  return client.fetch<SluggedDocument | null>(
    '*[_type == $type && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id, slug}',
    {type, slug},
  )
}

async function ensureWorlds() {
  const ids = new Map<string, string>()

  for (const world of seededWorlds) {
    const existing = await existingBySlug('world', world.slug)

    if (existing) {
      ids.set(world.slug, existing._id)
      continue
    }

    const created = await client.create({
      _type: 'world',
      ...world,
      slug: {_type: 'slug', current: world.slug},
      mood: {_type: 'object', ...world.mood},
    })
    ids.set(world.slug, created._id)
    console.log(`Created world: ${world.name}`)
  }

  return ids
}

async function ensureImageAsset(slug: string, title: string) {
  const filename = `frameos-${slug}.webp`
  const existing = await client.fetch<{_id: string} | null>(
    '*[_type == "sanity.imageAsset" && originalFilename == $filename][0]{_id}',
    {filename},
  )

  if (existing) return existing._id

  const path = photoFile(slug)
  if (!existsSync(path)) throw new Error(`Missing source image: ${path}`)

  const asset = await client.assets.upload('image', createReadStream(path), {filename, title})
  console.log(`Uploaded image: ${filename}`)
  return asset._id
}

async function ensurePhotos(worldIds: Map<string, string>) {
  const ids = new Map<string, string>()

  for (const photo of publishedPhotos) {
    const existing = await existingBySlug('photo', photo.slug)

    if (existing) {
      ids.set(photo.slug, existing._id)
      continue
    }

    const worldId = worldIds.get(photo.world)
    if (!worldId) throw new Error(`No world document exists for “${photo.slug}”.`)

    const assetId = await ensureImageAsset(photo.slug, photo.title)
    const created = await client.create({
      _type: 'photo',
      image: {
        _type: 'image',
        asset: {_type: 'reference', _ref: assetId},
      },
      slug: {_type: 'slug', current: photo.slug},
      title: photo.title,
      alt: photo.alt,
      caption: photo.caption,
      archived: false,
      worldRef: {_type: 'reference', _ref: worldId},
      tags: photo.tags,
      sortOrder: photo.sortOrder,
    })
    ids.set(photo.slug, created._id)
    console.log(`Created photo: ${photo.title}`)
  }

  return ids
}

async function connectWorldHeroes(worldIds: Map<string, string>, photoIds: Map<string, string>) {
  for (const world of worlds) {
    const worldId = worldIds.get(world.slug)
    const heroId = photoIds.get(world.heroId)
    if (!worldId || !heroId) continue

    await client
      .patch(worldId)
      .setIfMissing({heroPhoto: {_type: 'reference', _ref: heroId}})
      .commit()
  }
}

async function ensureSingletons(photoIds: Map<string, string>) {
  const homeFeatured = worlds
    .filter((world) => world.status === 'active')
    .map((world) => photoIds.get(world.heroId))
    .filter((id): id is string => Boolean(id))
    .map((id, index) => ({_key: `featured-${index + 1}`, _type: 'reference', _ref: id}))

  const aboutHighlights = ['cosmos', 'white-tower', 'the-cat', 'rain-on-the-street']
    .map((slug) => photoIds.get(slug))
    .filter((id): id is string => Boolean(id))
    .map((id, index) => ({_key: `highlight-${index + 1}`, _type: 'reference', _ref: id}))

  await client.createIfNotExists(singletonDocuments.siteSettings)
  await client.createIfNotExists(singletonDocuments.contactPage)
  await client.createIfNotExists({
    _id: 'homePage',
    _type: 'homePage',
    eyebrow: 'Pocket Worlds',
    headline: 'Things I noticed, photographed on a phone.',
    intro:
      'No studio. No heavy gear. Just a phone, a moment, and the instinct to notice. Each photograph here is a small world — step into one.',
    featuredPhotos: homeFeatured,
    cta: {_type: 'cta', label: 'Explore the worlds', href: '/'},
    seo: {
      _type: 'seo',
      title: 'FrameOS — Pocket Worlds',
      description:
        'A world noticed through a pocket-sized frame: travel, temples, small wonders, living things, and food, photographed entirely on a phone.',
      imagePublicId: 'the-sea',
    },
  })
  await client.createIfNotExists({
    _id: 'aboutPage',
    _type: 'aboutPage',
    headline: 'I keep the camera I always have with me.',
    body: [
      'Everything in this archive was photographed on a phone. Not as a constraint to apologise for, but as the whole point: the phone is the camera that is present when something worth noticing happens.',
      'Most of these frames were not planned. A leaf held rain a little longer than expected. A tower stood still under a moving sky. A cat decided, briefly, to trust. The photographs exist because the noticing came first.',
      'The archive is grouped into small worlds — travel, temples, close things, living things, food — because that is roughly how the noticing happens too.',
    ],
    photoHighlights: aboutHighlights,
    seo: {
      _type: 'seo',
      title: 'Field Notes — FrameOS',
      description:
        'Who is behind FrameOS, why the archive is mobile-only, and what tends to get noticed.',
      imagePublicId: 'the-sea',
    },
  })
}

async function main() {
  for (const photo of publishedPhotos) photoFile(photo.slug)

  const current = await client.fetch<{
    worlds: number
    photos: number
    singletons: number
  }>(
    '{"worlds":count(*[_type=="world"]),"photos":count(*[_type=="photo"]),"singletons":count(*[_type in ["siteSettings","homePage","aboutPage","contactPage"]])}',
  )

  console.log(
    `Production seed plan: ${seededWorlds.length} worlds, ${publishedPhotos.length} photos, 4 singletons.`,
  )
  console.log(
    `Current dataset: ${current.worlds} worlds, ${current.photos} photos, ${current.singletons} singletons.`,
  )

  if (!apply) {
    console.log('Dry run only. Run “pnpm seed:production:apply” to create missing content.')
    return
  }

  const worldIds = await ensureWorlds()
  const photoIds = await ensurePhotos(worldIds)
  await connectWorldHeroes(worldIds, photoIds)
  await ensureSingletons(photoIds)
  console.log('Production content seed complete.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
