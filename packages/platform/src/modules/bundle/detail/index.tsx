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

import { Spinner, SpinnerSize } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { parse, stringify } from 'query-string'
import { memo, useEffect, useMemo, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'

import { BundleReport } from '@perfsee/bundle-report'
import { useToggleState } from '@perfsee/components'
import { BundleJobStatus } from '@perfsee/schema'
import { pathFactory } from '@perfsee/shared/routes'

import { ArtifactSelect, ArtifactSelectEventPayload, Breadcrumb } from '../../components'
import { ProjectModule, useBreadcrumb, useGenerateProjectRoute } from '../../shared'

import { BundleModule } from './module'
import { SuspiciousBundle } from './suspicious-job'

export const BundleReportContainer = memo<RouteComponentProps<{ name: string; bundleId: string }>>(
  ({ match, location, history }) => {
    const { bundleId: routeBundleId } = match.params
    const bundleId = parseInt(routeBundleId)

    const queries: { entry?: string } = parse(location.search)

    const [state, dispatcher] = useModule(BundleModule)
    const project = useModuleState(ProjectModule, {
      selector: (s) => s.project,
      dependencies: [],
    })
    const generateProjectRoute = useGenerateProjectRoute()
    const contentPath = generateProjectRoute(pathFactory.project.bundle.jobBundleContent, { bundleId })

    const [artifactSelectVisible, showArtifactSelect, hideArtifactSelect] = useToggleState(false)

    const handleSelectArtifact = useCallback(
      (payload: ArtifactSelectEventPayload) => {
        dispatcher.updateBaseline(payload.artifact.id)
        hideArtifactSelect()
      },
      [dispatcher, hideArtifactSelect],
    )

    useEffect(() => {
      dispatcher.getBundle(bundleId)

      return dispatcher.reset
    }, [dispatcher, bundleId])

    const onSelectEntryPoint = useCallback(
      (entryPoint: string) => {
        history.push(`${location.pathname}?${stringify({ ...queries, entry: entryPoint })}`)
      },
      [history, location.pathname, queries],
    )

    const breadcrumbItems = useBreadcrumb({ bundleId })

    const artifactDiff = useMemo(() => {
      const { current, baseline } = state

      if (!project || !current) {
        return null
      }

      return {
        ...current,
        project,
        score: current.score!,
        baseline: baseline
          ? {
              ...baseline,
              jobId: baseline.id,
              score: baseline.score!,
              project,
            }
          : undefined,
      }
    }, [state, project])

    if (state.loading) {
      return <Spinner size={SpinnerSize.large} label="Loading job result" />
    }

    return (
      <>
        <Breadcrumb items={breadcrumbItems} />
        {state.current?.status !== BundleJobStatus.Passed ? (
          <SuspiciousBundle bundle={state.current} />
        ) : (
          state.diff &&
          artifactDiff && (
            <>
              <BundleReport
                artifact={artifactDiff}
                diff={state.diff}
                defaultEntryPoint={queries.entry}
                onEntryPointChange={onSelectEntryPoint}
                onBaselineSelectorOpen={showArtifactSelect}
                contentLink={contentPath}
              />

              {artifactSelectVisible && (
                <ArtifactSelect
                  currentArtifactId={state.current.id}
                  onSelect={handleSelectArtifact}
                  onDismiss={hideArtifactSelect}
                />
              )}
            </>
          )
        )}
      </>
    )
  },
)
