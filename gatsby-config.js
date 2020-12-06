require("dotenv").config({
  path: `.env`,
})

if (!process.env.BENCHMARK_GRAPHQL_URL || !process.env.BENCHMARK_GRAPHQL_AUTH_TOKEN) {
  throw new Error(
    "BENCHMARK_GRAPHQL_URL and BENCHMARK_GRAPHQL_AUTH_TOKEN must be set"
  )
}

module.exports = {
  siteMetadata: {
    siteTitle: "Gatsby GraphQL Benchmark",
  },
  flags: {
    QUERY_ON_DEMAND: true,
  },
  plugins: [
    {
      resolve: "gatsby-source-graphql",
      options: {
        typeName: "Bench",
        fieldName: "bench",
        url: process.env.BENCHMARK_GRAPHQL_URL,
        headers: {
          Authorization: `Bearer ${process.env.BENCHMARK_GRAPHQL_AUTH_TOKEN}`,
        },
        batch: true,
      }
    },
  ],
}
