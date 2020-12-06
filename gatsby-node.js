let currentPageRuns = 0
let currentEdit = 0
// let editedArticle = `article9115`
let editedArticle = `article512`

exports.createResolvers = ({ createResolvers }) => {
  createResolvers({
    Bench_ArticleCollection: {
      items: {
        resolve: (root, args, context, info) => {
          if (context.path) {
            // The key part: creating data dependency
            //   in the real-world we'll do it automatically in gatsby-source-graphql plugin or even in the core.
            context.nodeModel.createPageDependency({ path: context.path, connection: `Bench_Article` })
            // console.log(`New page connection dependency: `, context.path, `Bench_Article`)
          }
          return info.originalResolver(root, args, context, info)
        }
      }
    },
    Bench_Article: {
      sys: {
        resolve(root, args, context, info) {
          if (context.path) {
            // The key part: creating data dependency
            //   in the real-world we'll do it automatically in gatsby-source-graphql plugin or even in the core.
            context.nodeModel.createPageDependency({ path: context.path, nodeId: `Bench_Article:${root.sys.id}` })
          }
          return info.originalResolver(root, args, context, info)
        }
      },
      title: {
        resolve(root, args, context, info) {
          // Emulate remote editing
          const title = info.originalResolver(root, args, context, info)
          if (root.sys.id !== editedArticle) {
            return title
          }
          return currentEdit <= 0 ? title : `[Edited #${currentEdit}] ${title}`
        }
      },
    }
  })
}

exports.sourceNodes = async ({ store, cache, actions }) => {
  currentEdit = await cache.get(`current-edit`) || 0

  // The key Hack: invalidate queries for this "virtual" node
  //   This node doesn't exist in our store, but data dependency for this type/id was created (see resolvers above).
  //   So this call simply invalidates all queries that registered this data dependency
  if (currentEdit > 0) {
    console.log(`Edited node: ${editedArticle}`)
    store.dispatch({
      type: `DELETE_NODE`,
      payload: {
        id: `Bench_Article:${editedArticle}`,
        internal: {
          type: `Bench_Article`
        }
      }
    })
  }

  await cache.set(`current-edit`, currentEdit + 1)
}

// createPages is the bottleneck with this model as it runs against the remote data-source
//   Possible solution: use sourceNodes to create local nodes for page metadata + leverage delta sourcing
exports.createPagesStatefully = async ({ actions, graphql, emitter, reporter }) => {
  const { createPage } = actions

  if (currentPageRuns++ > 0) {
    return
  }

  let skip = 0
  let limit = 1000
  let articles

  do {
    console.log(`Creating pages. Skip: ${skip}, limit: ${limit}`)
    const result = await graphql(`
      {
        bench {
          articleCollection(limit: ${limit}, skip: ${skip}) {
            items {
              sys { id }
            }
          }
        }
      }
    `)

    if (result.errors) {
      reporter.panicOnBuild(result.errors)
    }
    articles = result.data.bench.articleCollection.items || []

    articles.forEach(article => {
      createPage({
        path: article.sys.id,
        component: require.resolve(`./src/templates/article.js`),
        context: {
          id: article.sys.id,
        },
      })
    })
    skip += limit
  } while (articles.length === limit)
}

function hack_ignoreSourceGraphqlNodes() {
  // This is needed to ignore a single node that `gatsby-source-graphql` creates
  // Without this hack all remote results are always invalidated (the default behavior of gatsby-source-graphql)
  // For "real" implementation we'll need to update `gatsby-source-graphql` accordingly
  const { combineReducers } = require(`redux`)
  const { store } = require(`gatsby/dist/redux`)
  const { __esModule, ...reducers } = require(`gatsby/dist/redux/reducers`)
  const origReducer = combineReducers(reducers)

  store.replaceReducer((state, action) => {
    if (action && action.type === `CREATE_NODE` && action.payload.internal.type === `GraphQLSource`) {
      return state
    }
    return origReducer(state, action)
  })
}

hack_ignoreSourceGraphqlNodes()