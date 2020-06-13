import React, { FunctionComponent, Fragment } from "react"
import { NoteListItem } from "gatsby-theme-code-notes/src/components/NoteListItem"

interface NoteListProps {
  notes: any[]
}

export const NoteList: FunctionComponent<NoteListProps> = ({ notes }) => {
  return (
    <Fragment>
      {notes
        .sort((one, two) =>
          one.node.frontmatter.title.localeCompare(two.node.frontmatter.date)
        )
        .map(({ node }) => {
          const { title, tags, emoji, date } = node.frontmatter
          const { name } = node.parent
          const { dateModified } = node.fields
          return (
            <NoteListItem
              title={title}
              emoji={emoji}
              tags={tags}
              name={name}
              dateModified={dateModified}
              date={date}
              key={name}
            />
          )
        })}
    </Fragment>
  )
}
