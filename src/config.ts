import * as fs from "fs"
import * as path from "path"
import * as os from "os"

export interface TateConfig {
  mode: "auto" | "manual"
  services: string[]
}

const CONFIG_PATH = path.join(os.homedir(), ".tate.json")

export function isFirstRun(): boolean {
  return !fs.existsSync(CONFIG_PATH)
}

export function getConfig(): TateConfig | null {
  if (!fs.existsSync(CONFIG_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
  } catch {
    return null
  }
}

export function saveConfig(config: TateConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}
