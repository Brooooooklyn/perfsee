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

import { Module, EffectModule, Effect, ImmerReducer } from '@sigi/core'
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import { switchMap, map, startWith, endWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import { ProjectsQuery, projectsQuery } from '@perfsee/schema'

export type ProjectNode = ProjectsQuery['projects']['edges'][0]['node']

interface State {
  projects: ProjectNode[]
  loading: boolean
  totalCount: number
  page: number
  pageSize: number
  query: string
}

@Module('ProjectsModule')
export class ProjectsModule extends EffectModule<State> {
  defaultState = {
    loading: true,
    projects: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    query: '',
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setPage(state: Draft<State>, { page, pageSize }: { page?: number; pageSize?: number }) {
    if (page) {
      state.page = page
    }
    if (pageSize) {
      state.pageSize = pageSize
    }
  }

  @Effect()
  getProjects(payload$: Observable<{ page: number; pageSize: number; query: string; starred: boolean }>) {
    return payload$.pipe(
      switchMap(({ page, pageSize, starred, query }) =>
        this.client
          .query({
            query: projectsQuery,
            variables: { input: { skip: (page - 1) * pageSize, first: pageSize }, starred, query },
          })
          .pipe(
            createErrorCatcher('Failed to get projects list.'),
            map((data) => this.getActions().setProjects(data.projects)),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setProjects(state: Draft<State>, { pageInfo, edges }: ProjectsQuery['projects']) {
    state.totalCount = pageInfo.totalCount
    state.projects = edges.map((edge) => edge.node)
  }

  @ImmerReducer()
  createProject(state: Draft<State>, payload: ProjectNode) {
    state.totalCount = state.totalCount + 1
    state.projects = [payload, ...state.projects]
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setQuery(state: Draft<State>, query: string) {
    state.query = query
    state.page = 1
  }
}
