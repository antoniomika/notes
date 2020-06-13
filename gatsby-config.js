module.exports = {
  siteMetadata: {
    title: "Antonio's Notes",
    description: `A personal blog and note taking site`,
    author: "Antonio Mika",
  },
  plugins: [
    {
      resolve: "gatsby-theme-code-notes",
      options: {
        contentPath: "notes",
        gitRepoContentPath:
          "https://github.com/antoniomika/notes/tree/master/notes/",
        basePath: "/",
        showThemeInfo: false,
        showDescriptionInSidebar: true,
        logo: "https://antoniomika.me/icon.jpg",
      },
    },
  ],
}
