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

declare module '*.svg' {
  export const ReactComponent: import('react').ComponentClass<import('react').SVGProps<SVGSVGElement>>
  export default ReactComponent
}

declare module '*.txt' {
  const content: string
  export default content
}

declare module '*.mdx' {
  export const ReactComponent: import('react').ComponentType
  export default ReactComponent
}

declare module '*.png' {
  const url: string
  export default url
}

declare interface Dict<T = any> {
  [index: string | number]: T
}

declare const __IS_SERVER__: boolean
declare const SERVER: string
declare const APP_VERSION: string
