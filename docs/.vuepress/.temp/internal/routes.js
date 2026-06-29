export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"D:/code/ai-doc/docs/.vuepress/.temp/pages/index.html.js"), meta: {"title":"ai-doc"} }],
  ["/rag/chunk.html", { loader: () => import(/* webpackChunkName: "rag_chunk.html" */"D:/code/ai-doc/docs/.vuepress/.temp/pages/rag/chunk.html.js"), meta: {"title":"RAG Chunk 知识"} }],
  ["/rag/", { loader: () => import(/* webpackChunkName: "rag_index.html" */"D:/code/ai-doc/docs/.vuepress/.temp/pages/rag/index.html.js"), meta: {"title":"RAG 知识整理"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"D:/code/ai-doc/docs/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);
