// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    // package.json 内直接写版本号，不使用 catalog:，避免安装时依赖 workspace catalog
    pnpm: { catalogs: false },
  },
)
