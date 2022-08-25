/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  LighthouseScoreType,
  TimelineSchema,
  MetricScoreSchema,
  TimingType,
  HeaderType,
  CookieType,
} from '@perfsee/shared'
import { Task } from '@perfsee/tracehouse'

const getParams = (audit?: LH.Audit.Result) => {
  if (!audit) {
    return {}
  }
  const { id, score, title, numericValue: value } = audit
  return { id, score, title, value }
}

export function slimTraceData(tasks: Task[], endTime: number, level = 1): Task[] {
  if (level === 1) {
    tasks = tasks.filter((task) => task.duration > 5 && task.endTime < endTime)
  }
  tasks.forEach((task) => {
    task.parent = undefined

    // we don't need event with level down greater then 2
    if (level === 3) {
      task.children = []
    } else {
      slimTraceData(task.children, endTime, level + 1)
    }
  })

  return tasks
}

// for snapshot report overview
export function getLighthouseMetricScores(
  mode: LH.Result.GatherMode,
  audits: Record<string, LH.Audit.Result>,
  timings?: LH.Artifacts.NavigationTraceTimes,
  timelines?: TimelineSchema[],
) {
  return Object.values(LighthouseScoreType)
    .map((type) => {
      switch (type) {
        case LighthouseScoreType.JSParse:
          if (mode !== 'navigation') return {}
          const items = audits['mainthread-work-breakdown']?.details?.['items'] as any[]
          const item = items?.find((v) => v.group === type)

          return {
            id: LighthouseScoreType.JSParse,
            title: 'JS Parse & Compile',
            value: item?.duration,
            formatter: 'duration',
          }
        case LighthouseScoreType.TTFB:
          return {
            ...getParams(audits[type]),
            formatter: 'duration',
            title: 'Time to First Byte',
          }
        case LighthouseScoreType.LOAD:
          return {
            id: LighthouseScoreType.LOAD,
            value: timings?.[TimingType.LOAD],
            formatter: 'duration',
            title: 'On Load',
          }
        case LighthouseScoreType.VC:
          if (mode !== 'navigation') return {}
          return {
            id: LighthouseScoreType.VC,
            value: timelines?.[timelines.length - 1]?.timing,
            formatter: 'duration',
            title: 'Visually Complete',
          }
        case LighthouseScoreType.CLS:
          const value = audits[type]?.numericValue
          return {
            ...getParams(audits[type]),
            value: typeof value === 'number' ? Number(value.toFixed(3)) : undefined,
            formatter: 'unitless',
          }
        case LighthouseScoreType.ResponseTime:
          const ttfb = audits[LighthouseScoreType.TTFB]?.numericValue
          return {
            id: LighthouseScoreType.ResponseTime,
            value: ttfb ? (timings?.[TimingType.DCL] ?? 0) + ttfb : undefined,
            formatter: 'duration',
            title: 'Response Time',
          }
        default:
          return {
            ...getParams(audits[type]),
            formatter: 'duration',
          }
      }
    })
    .filter((s) => typeof s.value !== 'undefined') as MetricScoreSchema[]
}

export function isSameHost(url1: string, url2: string) {
  try {
    return new URL(url1).host === new URL(url2).host
  } catch {
    return false
  }
}

export function isSameUrl(s1: string, s2: string, options: { query: boolean } = { query: false }) {
  try {
    const url1 = new URL(s1)
    const url2 = new URL(s2)
    const pathname1 = url1.pathname.replace(/\/$/, '')
    const pathname2 = url2.pathname.replace(/\/$/, '')
    return url1.host === url2.host && pathname1 === pathname2 && (!options.query || url1.search === url2.search)
  } catch {
    return false
  }
}

export type HostHeaders = Record<string, Record<string, string>>

export function transformHeadersToHostHeaders(headers: HeaderType[]): HostHeaders {
  const headersWithHost: Record<string, Record<string, string>> = {}

  headers.forEach((header) => {
    const host = header.host.replace(/\/$/, '')
    headersWithHost[host] = { ...headersWithHost[host], [header.key.toLowerCase()]: String(header.value) }
  })

  return headersWithHost
}

export function appendCookieHeaders(cookies: CookieType[], hostHeaders: HostHeaders) {
  cookies.forEach((c) => {
    const cookieString = `${c.name}=${c.value}`

    const host = c.domain.replace(/\/$/, '')
    const headers = hostHeaders[host]
    if (headers) {
      if (headers.cookie) {
        headers.cookie += `;${cookieString}`
      } else {
        headers.cookie = cookieString
      }
    } else {
      hostHeaders[host] = { cookie: cookieString }
    }
  })
}
