import { CodeTabs } from "D:/code/ai-doc/node_modules/.pnpm/@vuepress+plugin-markdown-t_030484fac57b74820a535fac724eadff/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "D:/code/ai-doc/node_modules/.pnpm/@vuepress+plugin-markdown-t_030484fac57b74820a535fac724eadff/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "D:/code/ai-doc/node_modules/.pnpm/@vuepress+plugin-markdown-t_030484fac57b74820a535fac724eadff/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
