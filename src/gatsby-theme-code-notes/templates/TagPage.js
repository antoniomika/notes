import { graphql } from "gatsby"
import { NotesPage } from "gatsby-theme-code-notes/src/components/NotesPage"

export default NotesPage

export const pageQuery = graphql`
  query($tag: String!) {
    allMdx(
      sort: { fields: frontmatter___date, order: DESC }
      filter: { frontmatter: { tags: { eq: $tag } } }
    ) {
      edges {
        node {
          id
          ...AllPages2
        }
      }
    }
  }
`
