import { NextRequest, NextResponse } from 'next/server'

// Alias map: normalise common exercise names to better search terms for GIPHY
const SEARCH_ALIASES: Record<string, string> = {
  'barbell hip thrust':     'hip thrust woman workout',
  'goblet squat':           'goblet squat woman workout',
  'romanian deadlift':      'romanian deadlift woman gym',
  'leg press':              'leg press machine woman gym',
  'cable kickback':         'cable glute kickback woman',
  'plank':                  'plank exercise woman',
  'dead bug':               'dead bug exercise woman',
  'lat pulldown':           'lat pulldown woman gym',
  'dumbbell shoulder press':'dumbbell shoulder press woman',
  'seated cable row':       'seated cable row woman gym',
  'incline db chest press': 'incline dumbbell press woman',
  'lateral raises':         'lateral raise woman gym',
  'cable bicep curl':       'cable bicep curl woman',
  'tricep pushdown':        'tricep pushdown woman gym',
}

function buildQuery(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, alias] of Object.entries(SEARCH_ALIASES)) {
    if (lower.includes(key)) return alias
  }
  return `${name} woman workout gym`
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') ?? ''
  const key = process.env.GIPHY_API_KEY

  if (!key) {
    return NextResponse.json({ gif: null, error: 'GIPHY_API_KEY not set' })
  }

  const query = buildQuery(name)
  const url = `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=5&rating=g&lang=en`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    const json = await res.json() as { data: { images: { fixed_height: { url: string } } }[] }
    const gif = json.data?.[0]?.images?.fixed_height?.url ?? null
    return NextResponse.json({ gif })
  } catch {
    return NextResponse.json({ gif: null })
  }
}
