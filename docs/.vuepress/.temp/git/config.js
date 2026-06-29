import { GitContributors } from "D:/code/ai-doc/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-_0ed42ac02fccb9556205840d8b8242a4/node_modules/@vuepress/plugin-git/lib/client/components/GitContributors.js";
import { GitChangelog } from "D:/code/ai-doc/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-_0ed42ac02fccb9556205840d8b8242a4/node_modules/@vuepress/plugin-git/lib/client/components/GitChangelog.js";

export default {
  enhance: ({ app }) => {
    app.component("GitContributors", GitContributors);
    app.component("GitChangelog", GitChangelog);
  },
};
