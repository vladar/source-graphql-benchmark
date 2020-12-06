import React from "react"
import { graphql, Link } from "gatsby"
import Img from "gatsby-image"
import Layout from "../components/layout_1"

const Article = ({ data }) => {
  const article = data.bench.article
  return (
    <Layout>
      <Link to="/">Go back to index page</Link>
      <div>
        <h2>{article.title}</h2>
        {article.image ? (
          <Img fluid={article.image.fluid} />
        ) : (
          <div>Image can't be displayed</div>
        )}
        <div dangerouslySetInnerHTML={{ __html: article.body }} />
      </div>
    </Layout>
  )
}

export default Article

export const query = graphql`
  query($id: String!) {
    bench {
      article(id: $id) {
        title
        body
        sys {
          id
        }
      }
    }
  }
`
