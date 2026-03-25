import { checkServices, ServiceResult, StatusLevel } from "./checker.js"
import { SERVICES } from "./services.js"
import chalk from "chalk"
import { exec } from "child_process"

const POLL_INTERVAL_MS = 3 * 60 * 1000 // 3 minutes

const STATUS_RANK: Record<StatusLevel, number> = {
  good: 0,
  degraded: 1,
  outage: 2,
  unknown: 3
}

function notify(title: string, message: string): void {
  const escaped = message.replace(/"/g, '\\"')
  exec(
    `osascript -e 'display notification "${escaped}" with title "${title}" sound name "Funk"'`
  )
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).toLowerCase()
}

function printWatchHeader(): void {
  console.log(chalk.dim("  watch mode active — polling every 3 minutes"))
  console.log(chalk.dim("  press ctrl+c to stop"))
  console.log()
}

function printPoll(results: ServiceResult[]): void {
  const time = chalk.dim(`  [${timestamp()}]`)
  const goods = results.filter(r => r.status === "good").length
  const total = results.length

  if (goods === total) {
    console.log(`${time}  ${chalk.green("✓")} all ${total} services good`)
  } else {
    const problems = results.filter(r => r.status !== "good")
    const parts = problems.map(r => {
      if (r.status === "outage") return chalk.red(`${r.name} DOWN`)
      if (r.status === "degraded") return chalk.yellow(`${r.name} degraded`)
      return chalk.gray(`${r.name} unreachable`)
    })
    console.log(`${time}  ${chalk.red("!")} ${parts.join(chalk.dim(" · "))}`)
  }
}

function detectChanges(
  prev: ServiceResult[],
  curr: ServiceResult[]
): { worsened: ServiceResult[]; recovered: ServiceResult[] } {
  const prevMap = new Map(prev.map(r => [r.name, r]))
  const worsened: ServiceResult[] = []
  const recovered: ServiceResult[] = []

  for (const result of curr) {
    const previous = prevMap.get(result.name)
    if (!previous) continue

    const prevRank = STATUS_RANK[previous.status]
    const currRank = STATUS_RANK[result.status]

    if (currRank > prevRank && previous.status === "good") {
      worsened.push(result)
    } else if (currRank < prevRank && result.status === "good") {
      recovered.push(result)
    }
  }

  return { worsened, recovered }
}

export async function startWatch(serviceKeys: string[]): Promise<void> {
  printWatchHeader()

  console.log(chalk.dim(`  initial check...`))
  let previous = await checkServices(serviceKeys)
  printPoll(previous)

  const interval = setInterval(async () => {
    try {
      const current = await checkServices(serviceKeys)
      const { worsened, recovered } = detectChanges(previous, current)

      for (const s of worsened) {
        const label = s.status === "outage" ? "is DOWN" : "is degraded"
        notify(`tate: ${s.name} ${label}`, `${s.description} → ${s.statusPage}`)
        console.log(
          chalk.dim(`  [${timestamp()}]`) +
          `  ${chalk.red("⚡")} ` +
          chalk.bold(s.name) +
          ` ${chalk.red(label)} ` +
          chalk.dim(`→ ${s.statusPage}`)
        )
      }

      for (const s of recovered) {
        notify(`tate: ${s.name} is back`, "all good again")
        console.log(
          chalk.dim(`  [${timestamp()}]`) +
          `  ${chalk.green("↑")} ` +
          chalk.bold(s.name) +
          chalk.green(" is back")
        )
      }

      if (worsened.length === 0 && recovered.length === 0) {
        printPoll(current)
      }

      previous = current
    } catch {
      console.log(chalk.dim(`  [${timestamp()}]`) + chalk.red("  poll failed, retrying next cycle"))
    }
  }, POLL_INTERVAL_MS)

  process.on("SIGINT", () => {
    clearInterval(interval)
    console.log()
    console.log(chalk.dim("  watch stopped — see you next time"))
    console.log()
    process.exit(0)
  })
}
