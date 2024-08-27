import * as yaml from 'js-yaml'
import * as fs from 'node:fs/promises'

const GITHUB_URL = 'https://github.com/multi-swe-bench/experiments/tree/main/evaluation'

const index = yaml.load(await fs.readFile('index.yaml', 'utf8')) as Record<string, {
  name: string
  data?: Record<string, {
    name: string
  }>
}>

interface RawResult {
  no_generation: string[]
  generated: string[]
  with_logs: string[]
  install_fail: string[]
  reset_failed: string[]
  no_apply: string[]
  applied: string[]
  test_errored: string[]
  test_timerout: string[]
  resolved: string[]
}

interface Result {
  oss: boolean
  verified: boolean
  name: string
  resolved: number
  date: string
  logs?: string
  trajs?: string
  site: string
  path: string
  hasLogs: boolean
  hasTrajs: boolean
  hasReadme: boolean
}

interface Item {
  repository: string
  time: string
}

interface Dataset {
  name: string
  results: Result[]
  data: Record<string, Item>
}

interface Language {
  name: string
  data?: Dataset[]
}

const leaderboard: Language[] = []

for (const [k1, v1] of Object.entries(index)) {
  const item: Language = {
    name: v1.name,
    data: v1.data && [],
  }
  leaderboard.push(item)
  if (!v1.data) continue
  for (const [k2, v2] of Object.entries(v1.data)) {
    const dirents = await fs.readdir(`evaluation/${k1}/${k2}`, { withFileTypes: true })
    const data = JSON.parse(await fs.readFile(`evaluation/${k1}/${k2}/index.json`, 'utf8'))
    const _results = await Promise.allSettled(dirents
      .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
      .map<Promise<Result>>(async (dirent) => {
        const path = `${k1}/${k2}/${dirent.name}`
        const results = JSON.parse(await fs.readFile(`evaluation/${path}/results/results.json`, 'utf8')) as RawResult
        const metadata = yaml.load(await fs.readFile(`evaluation/${path}/metadata.yaml`, 'utf8')) as Pick<Result, 'oss' | 'verified' | 'name' | 'site'>
        const date = dirent.name.split('_', 1)[0]
        const urlLogs = `${GITHUB_URL}/${path}/logs`
        const urlTrajs = `${GITHUB_URL}/${path}/trajs`
        const hasLogs = await fs.access(`evaluation/${path}/logs`).then(() => true, () => false)
        const hasTrajs = await fs.access(`evaluation/${path}/trajs`).then(() => true, () => false)
        const hasReadme = await fs.access(`evaluation/${path}/README.md`).then(() => true, () => false)
        return {
          name: metadata.name,
          site: metadata.site,
          oss: metadata.oss,
          verified: metadata.verified,
          resolved: results.resolved.length,
          date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`,
          logs: hasLogs ? urlLogs : undefined,
          trajs: hasTrajs ? urlTrajs : undefined,
          path,
          hasLogs,
          hasTrajs,
          hasReadme,
        }
      }))
    const results = _results
      .filter((v) => {
        if (v.status === 'rejected') {
          console.error(v.reason)
        }
        return v.status === 'fulfilled'
      })
      .map((v) => v.value)
    results.sort((a, b) => b.resolved - a.resolved)
    item.data!.push({
      name: v2.name,
      results,
      data,
    })
  }
}

await fs.mkdir('dist', { recursive: true })
await fs.writeFile('dist/leaderboard.json', JSON.stringify(leaderboard, null, 2))
