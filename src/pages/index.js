import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/layout_1"

const Index = ({ data }) => {
  const articles = data.bench.articleCollection.items ?? []
  return (
    <Layout>
      {data.site.siteMetadata.siteTitle}
      <ul>
        {articles.map(article => (
          <li key={article.slug}>
            <Link to={article.slug}>{article.title}</Link>
          </li>
        ))}
      </ul>
    </Layout>
  )
}

export default Index

export const query = graphql`
  {
    site {
      siteMetadata {
        siteTitle
      }
    }
    bench {
      articleCollection(limit: 100) {
        items {
          title
          slug
          sys {
            id
          }
        }
      }
    }
  }
`
