import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import chalk from "chalk"

const LICENSE_PATH = path.join(os.homedir(), ".tate-license")
const SUBSCRIBE_URL = "https://tate-gamma.vercel.app/#subscribe"

interface LicenseData {
  key: string
  activated: string
}

export function getLicenseKey(): string | null {
  if (!fs.existsSync(LICENSE_PATH)) return null
  try {
    const data: LicenseData = JSON.parse(fs.readFileSync(LICENSE_PATH, "utf-8"))
    return data.key ?? null
  } catch {
    return null
  }
}

export function saveLicenseKey(key: string): void {
  const data: LicenseData = { key, activated: new Date().toISOString() }
  fs.writeFileSync(LICENSE_PATH, JSON.stringify(data, null, 2))
}

export function printUpgradePrompt(): void {
  console.log()
  console.log(chalk.bold("  ✦ watch mode is a tate pro feature — $3/month"))
  console.log()
  console.log(chalk.dim("  tate watches your stack in the background and notifies"))
  console.log(chalk.dim("  you the moment something goes down. no more guessing."))
  console.log()
  console.log(`  ${chalk.bold("subscribe →")} ${chalk.cyan(SUBSCRIBE_URL)}`)
  console.log()
  console.log(chalk.dim("  after subscribing, activate with:"))
  console.log(`  ${chalk.bold("npx tate --activate <your-license-key>")}`)
  console.log()
}

export function printActivated(): void {
  console.log()
  console.log(chalk.green("  ✓ license activated — watch mode unlocked"))
  console.log(chalk.dim("  run: ") + chalk.bold("npx tate --watch"))
  console.log()
}

export function printInvalidLicense(): void {
  console.log()
  console.log(chalk.red("  ✗ invalid or expired license key"))
  console.log(chalk.dim("  subscribe at: ") + chalk.cyan(SUBSCRIBE_URL))
  console.log()
}
