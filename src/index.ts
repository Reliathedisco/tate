#!/usr/bin/env node

import * as readline from "readline"
import { checkServices } from "./checker.js"
import { detectServices } from "./detect.js"
import { isFirstRun, getConfig, saveConfig } from "./config.js"
import {
  printIntro,
  printFirstRunPrompt,
  printChecking,
  printResults,
  printNoServices
} from "./display.js"
import { SERVICES } from "./services.js"
import { startWatch } from "./watch.js"
import {
  getLicenseKey,
  saveLicenseKey,
  printUpgradePrompt,
  printActivated,
  printInvalidLicense
} from "./license.js"

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function handleFirstRun(): Promise<string[]> {
  printFirstRunPrompt()

  const answer = await prompt("  → ")
  console.log()

  if (answer === "2") {
    // manual selection
    const serviceKeys = Object.keys(SERVICES)
    serviceKeys.forEach((key, i) => {
      console.log(`  [${i + 1}] ${SERVICES[key].name}`)
    })
    console.log()

    const selection = await prompt("  enter numbers separated by commas (e.g. 1,3,5): ")
    console.log()

    const chosen = selection
      .split(",")
      .map(s => parseInt(s.trim()) - 1)
      .filter(i => i >= 0 && i < serviceKeys.length)
      .map(i => serviceKeys[i])

    saveConfig({ mode: "manual", services: chosen })
    return chosen
  } else {
    // auto detect
    const detected = detectServices()
    saveConfig({ mode: "auto", services: detected })
    return detected
  }
}

async function run(): Promise<void> {
  printIntro()

  const args = process.argv.slice(2)
  const forceChoose = args.includes("--choose")
  const checkAll = args.includes("--all")
  const watchMode = args.includes("--watch")
  const activateIdx = args.indexOf("--activate")

  if (activateIdx !== -1) {
    const key = args[activateIdx + 1]
    if (!key) {
      printInvalidLicense()
      process.exit(1)
    }
    saveLicenseKey(key)
    printActivated()
    return
  }

  let serviceKeys: string[] = []

  if (checkAll || watchMode) {
    serviceKeys = Object.keys(SERVICES)
  } else if (forceChoose || isFirstRun()) {
    serviceKeys = await handleFirstRun()
  } else {
    const config = getConfig()
    if (config?.mode === "auto") {
      serviceKeys = detectServices()
    } else {
      serviceKeys = config?.services ?? []
    }
  }

  if (serviceKeys.length === 0) {
    printNoServices()
    process.exit(0)
  }

  if (watchMode) {
    const license = getLicenseKey()
    if (!license) {
      printUpgradePrompt()
      process.exit(0)
    }
    await startWatch(serviceKeys)
    return
  }

  printChecking()

  const results = await checkServices(serviceKeys)
  printResults(results)
}

run().catch(err => {
  console.error("  something went wrong:", err.message)
  process.exit(1)
})
