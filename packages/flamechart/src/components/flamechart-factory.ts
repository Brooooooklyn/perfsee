import {
  buildFlamechart,
  buildFlamechartWithProcessor,
  buildNonStackFlamechart,
  Flamechart,
  RootFilter,
} from '../lib/flamechart'
import { NonStackTreeNode } from '../lib/non-stack-profile'
import { Frame, Profile } from '../lib/profile'
import { TracehouseGroupedFrame } from '../lib/tracehouse-profile'
import { memoizeByReference, memoizeByShallowEquality } from '../lib/utils'

export const createGetColorBucketForFrame = memoizeByReference((frameToColorBucket: Map<number | string, number>) => {
  return (frame: Frame): number => {
    return frameToColorBucket.get(frame.key) ?? 0
  }
})

export const getFrameToColorBucket = memoizeByReference((profile: Profile): Map<string | number, number> => {
  const frames: Frame[] = []
  profile.forEachFrame((f) => frames.push(f))
  function key(f: Frame) {
    return (f.file ?? '') + f.name
  }
  function compare(a: Frame, b: Frame) {
    return key(a) > key(b) ? 1 : -1
  }
  frames.sort(compare)
  const frameToColorBucket = new Map<string | number, number>()
  for (let i = 0; i < frames.length; i++) {
    frameToColorBucket.set(frames[i].key, Math.floor((255 * i) / frames.length))
  }

  return frameToColorBucket
})

export const getLeftHeavyFlamechart = memoizeByReference((rootFilter?: RootFilter) =>
  memoizeByShallowEquality((profile: Profile): Flamechart => {
    return buildFlamechart(
      {
        minValue: 0,
        maxValue: profile.getTotalNonIdleWeight(),
        forEachCall: profile.forEachCallGrouped.bind(profile),
        formatValue: profile.formatValue.bind(profile),
        getColorBucketForFrame: createGetColorBucketForFrame(getFrameToColorBucket(profile)),
      },
      rootFilter,
    )
  }),
)

export const getChronoViewFlamechart = memoizeByReference((rootFilter?: RootFilter) =>
  memoizeByShallowEquality((profile: Profile): Flamechart => {
    return buildFlamechart(
      {
        minValue: profile.getMinValue(),
        maxValue: profile.getMaxValue(),
        forEachCall: profile.forEachCall.bind(profile),
        formatValue: profile.formatValue.bind(profile),
        getColorBucketForFrame: createGetColorBucketForFrame(getFrameToColorBucket(profile)),
      },
      rootFilter,
    )
  }),
)

export const getNetworkFlamechart = memoizeByShallowEquality(
  (profile: Profile, rootFilter?: RootFilter): Flamechart => {
    return buildNonStackFlamechart(
      {
        minValue: profile.getMinValue(),
        maxValue: profile.getMaxValue(),
        forEachCall: profile.forEachCall.bind(profile),
        formatValue: profile.formatValue.bind(profile),
        getColorBucketForFrame: (_) => 1,
      },
      rootFilter,
    )
  },
)

export const getGroupedTracehouseFlamechart = memoizeByShallowEquality(
  (profile: Profile, rootFilter?: RootFilter): Flamechart => {
    return buildFlamechartWithProcessor(
      {
        minValue: profile.getMinValue(),
        maxValue: profile.getMaxValue(),
        forEachCall: profile.forEachCall.bind(profile),
        formatValue: profile.formatValue.bind(profile),
        getColorBucketForFrame: (n) => {
          if (n instanceof TracehouseGroupedFrame) {
            return n.level
          }
          return 0
        },
      },
      (node) => {
        if (node instanceof NonStackTreeNode && node.frame instanceof TracehouseGroupedFrame) {
          return {
            start: node.startTime,
            end: node.endTime,
            level: node.frame.level,
          }
        }
        throw new Error('Unexpected node type')
      },
      rootFilter,
    )
  },
)

export const FlamechartFactoryMap = {
  /**
   * Default flamechart
   */
  default: (t: Profile, rootFilter?: RootFilter) => getChronoViewFlamechart(rootFilter)(t),
  /**
   * left-heavy grouped view, more easy to find functions cost longer time.
   */
  'left-heavy': (t: Profile, rootFilter?: RootFilter) => getLeftHeavyFlamechart(rootFilter)(t),
  /**
   * used for network flow chart
   */
  network: getNetworkFlamechart,
  'tracehouse-grouped': getGroupedTracehouseFlamechart,
}

export type FlamechartFactory = (t: Profile, rootFilter?: RootFilter) => Flamechart
