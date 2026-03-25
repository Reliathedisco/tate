import * as fs from "fs"
import * as path from "path"
import { SERVICES } from "./services.js"

export function detectServices(): string[] {
  const pkgPath = path.join(process.cwd(), "package.json")

  if (!fs.existsSync(pkgPath)) {
    return []
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    }

    const installedPackages = Object.keys(allDeps)
    const detected: string[] = []

    for (const [serviceKey, service] of Object.entries(SERVICES)) {
      const found = service.packageNames.some(pkg => installedPackages.includes(pkg))
      if (found) detected.push(serviceKey)
    }

    return detected
  } catch {
    return []
  }
}
