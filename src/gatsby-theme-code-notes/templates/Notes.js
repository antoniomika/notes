import { graphql } from "gatsby"
import { NotesPage } from "gatsby-theme-code-notes/src/components/NotesPage"

export default NotesPage

export const pageQuery = graphql`
  fragment AllPages2 on Mdx {
    id
    frontmatter {
      title
      tags
      emoji
      date
    }
    fields {
      dateModified(formatString: "Do MMM YYYY")
    }
    parent {
      ... on File {
        name
      }
    }
  }

  query {
    allMdx(sort: { fields: frontmatter___date, order: DESC }) {
      edges {
        node {
          ...AllPages2
        }
      }
    }
  }
`
