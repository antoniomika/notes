/** @jsx jsx */
import { FunctionComponent } from "react"
import { TagList } from "gatsby-theme-code-notes/src/components/TagList"
import { Link as GatsbyLink } from "gatsby"
import { jsx, Heading, Flex, Box, Link } from "theme-ui"
import { DateModified } from "gatsby-theme-code-notes/src/components/DateModified"

interface NoteListItemProps {
  name: string
  title: string
  emoji?: string
  dateModified: string
  date: Date
  tags: string[]
  onClick?: () => void
}

export const NoteListItem: FunctionComponent<NoteListItemProps> = ({
  name,
  title,
  dateModified,
  date,
  tags,
  emoji,
  onClick,
}) => {
  const noteEmoji = emoji ? emoji : "🗒"
  return (
    <Box as="article">
      <Link
        as={GatsbyLink}
        to={`/${name}`}
        variant="noteListItem"
        onClick={onClick}
      >
        <Flex
          sx={{
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          <Heading as="h3" variant="noteListItem" sx={{ mr: "3" }}>
            <Box as="span" sx={{ position: "absolute", left: 1 }}>
              {noteEmoji}
            </Box>
            {title}
          </Heading>
          <Flex sx={{ alignItems: "center", textAlign: "right" }}>
            {tags && <TagList tags={tags} asLinks={false} />}
            {true && (
              <Box ml={2}>
                <DateModified>{date}</DateModified>
              </Box>
            )}
          </Flex>
        </Flex>
      </Link>
    </Box>
  )
}
