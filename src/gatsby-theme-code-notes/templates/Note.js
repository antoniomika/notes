import { graphql } from "gatsby"
import { NotePage } from "gatsby-theme-code-notes/src/components/NotePage"

export default NotePage

export const pageQuery = graphql`
  query NoteById2($id: String!) {
    mdx(id: { eq: $id }) {
      body
      frontmatter {
        title
        tags
        emoji
        link
        date
      }
      fields {
        dateModified(formatString: "Do MMM YYYY")
      }
      fields {
        slug
      }
      tableOfContents(maxDepth: 3)
      parent {
        ... on File {
          name
          fileName: base
        }
      }
    }
  }
`
