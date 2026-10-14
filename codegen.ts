import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: './src/graphql/schema.gql',
  documents: ['src/**/*.{ts,tsx}', '!src/graphql/__generated__/**'],
  generates: {
    './src/graphql/__generated__/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
