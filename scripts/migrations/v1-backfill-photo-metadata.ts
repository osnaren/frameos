import { v2 as cloudinary } from 'cloudinary'

type CloudinaryAsset = {
  public_id: string
  context?: {
    custom?: Partial<Record<string, string>>
  }
  metadata?: Partial<Record<string, string>>
  tags?: string[]
}

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

async function main() {
  const writeMode = process.argv.includes('--write')

  cloudinary.config({
    cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requireEnv('CLOUDINARY_API_KEY'),
    api_secret: requireEnv('CLOUDINARY_API_SECRET'),
    secure: true,
  })

  const folder = process.env.CLOUDINARY_FOLDER?.trim()
  const expression = folder
    ? `resource_type:image AND (folder="${folder}" OR asset_folder="${folder}")`
    : 'resource_type:image'

  const response = await cloudinary.search
    .expression(expression)
    .max_results(100)
    .with_field(['context', 'metadata', 'tags'])
    .execute()

  const assets = (response.resources ?? []) as CloudinaryAsset[]

  const report = assets.map((asset) => {
    const metadata = asset.metadata ?? {}
    const context = asset.context?.custom ?? {}

    return {
      publicId: asset.public_id,
      status: metadata.status ?? context.status ?? 'draft',
      title: metadata.title ?? context.title ?? '',
      alt: metadata.alt ?? context.alt ?? '',
      sortOrder: metadata.sortOrder ?? context.sortOrder ?? '0',
    }
  })

  console.log(
    JSON.stringify(
      {
        migration: 'v1-photo-metadata',
        generatedAt: new Date().toISOString(),
        writeMode,
        assets: report,
      },
      null,
      2
    )
  )

  if (!writeMode) {
    console.log(
      'Dry run only. Re-run with --write after Cloudinary structured metadata fields exist.'
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
