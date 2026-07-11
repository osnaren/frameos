export function ProseBlocks({ blocks }: { blocks: string[] }) {
  return (
    <div className="space-y-5 text-base leading-8 text-(--muted)">
      {blocks.map((block) => (
        <p key={block} className="m-0">
          {block}
        </p>
      ))}
    </div>
  )
}
