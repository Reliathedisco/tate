import chalk from "chalk"
import { ServiceResult, StatusLevel } from "./checker.js"

const ICONS: Record<StatusLevel, string> = {
  good: chalk.green("✓"),
  degraded: chalk.yellow("⚠"),
  outage: chalk.red("✗"),
  unknown: chalk.gray("?")
}

const COLORS: Record<StatusLevel, (s: string) => string> = {
  good: chalk.green,
  degraded: chalk.yellow,
  outage: chalk.red,
  unknown: chalk.gray
}

export function printIntro(): void {
  console.log()
  console.log(chalk.bold("  👋 hi i'm tate"))
  console.log()
}

export function printFirstRunPrompt(): void {
  console.log(chalk.dim("  first time here — how do you want me to find your stack?"))
  console.log()
  console.log(`  ${chalk.bold("[1]")} detect automatically from package.json`)
  console.log(`  ${chalk.bold("[2]")} i'll choose`)
  console.log()
}

export function printChecking(): void {
  console.log(chalk.dim("  checking your stack..."))
  console.log()
}

export function printResults(results: ServiceResult[]): void {
  const maxNameLength = Math.max(...results.map(r => r.name.length))

  for (const result of results) {
    const icon = ICONS[result.status]
    const name = result.name.padEnd(maxNameLength)
    const description = COLORS[result.status](result.description)
    console.log(`  ${icon}  ${chalk.bold(name)}  ${description}`)
  }

  console.log()

  const issues = results.filter(r => r.status === "degraded")
  const outages = results.filter(r => r.status === "outage")
  const unknown = results.filter(r => r.status === "unknown")

  const total = results.length
  const problemCount = issues.length + outages.length + unknown.length

  if (problemCount === 0) {
    console.log(chalk.dim(`  checked ${total} service${total !== 1 ? "s" : ""} · `) + chalk.green("everything's good"))
  } else {
    const parts = [`checked ${total} service${total !== 1 ? "s" : ""}`]
    if (issues.length) parts.push(chalk.yellow(`${issues.length} degraded`))
    if (outages.length) parts.push(chalk.red(`${outages.length} down`))
    if (unknown.length) parts.push(chalk.gray(`${unknown.length} unreachable`))
    console.log(chalk.dim("  ") + parts.join(chalk.dim(" · ")))
  }

  const problems = results.filter(r => r.status !== "good")
  if (problems.length > 0) {
    console.log()
    for (const p of problems) {
      console.log(chalk.dim(`  → ${p.statusPage}`))
    }
  }

  console.log()
}

export function printNoServices(): void {
  console.log(chalk.dim("  no services detected — run from your project directory"))
  console.log(chalk.dim("  or choose manually with: ") + chalk.bold("npx tate --choose"))
  console.log()
}

export function printManualList(allServices: string[]): void {
  console.log(chalk.dim("  which services are you using? (space to select, enter to confirm)"))
  console.log()
  allServices.forEach((s, i) => {
    console.log(`  ${chalk.bold(`[${i + 1}]`)} ${s}`)
  })
  console.log()
}
