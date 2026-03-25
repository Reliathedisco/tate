import { SERVICES, Service } from "./services.js"

export type StatusLevel = "good" | "degraded" | "outage" | "unknown"

export interface ServiceResult {
  name: string
  status: StatusLevel
  description: string
  statusPage: string
}

const INDICATOR_MAP: Record<string, StatusLevel> = {
  none: "good",
  minor: "degraded",
  major: "outage",
  critical: "outage",
  maintenance: "degraded"
}

const DESCRIPTION_MAP: Record<StatusLevel, string> = {
  good: "all good",
  degraded: "some degradation",
  outage: "ngl it's a no",
  unknown: "can't reach"
}

async function checkService(key: string, service: Service): Promise<ServiceResult> {
  try {
    const res = await fetch(service.url, {
      signal: AbortSignal.timeout(5000)
    })

    if (!res.ok) {
      return {
        name: service.name,
        status: "unknown",
        description: DESCRIPTION_MAP.unknown,
        statusPage: service.statusPage
      }
    }

    const data = await res.json() as { status: { indicator: string; description: string } }
    const indicator = data?.status?.indicator ?? "none"
    const status = INDICATOR_MAP[indicator] ?? "unknown"

    return {
      name: service.name,
      status,
      description: DESCRIPTION_MAP[status],
      statusPage: service.statusPage
    }
  } catch {
    return {
      name: service.name,
      status: "unknown",
      description: DESCRIPTION_MAP.unknown,
      statusPage: service.statusPage
    }
  }
}

export async function checkServices(serviceKeys: string[]): Promise<ServiceResult[]> {
  const checks = serviceKeys
    .filter(key => SERVICES[key])
    .map(key => checkService(key, SERVICES[key]))

  return Promise.all(checks)
}
