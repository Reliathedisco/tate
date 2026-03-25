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

  let serviceKeys: string[] = []

  const args = process.argv.slice(2)
  const forceChoose = args.includes("--choose")
  const checkAll = args.includes("--all")

  if (checkAll) {
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

  printChecking()

  const results = await checkServices(serviceKeys)
  printResults(results)
}

run().catch(err => {
  console.error("  something went wrong:", err.message)
  process.exit(1)
})
