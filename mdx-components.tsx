import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import type { MDXComponents } from "mdx/types";
const themeComponents = getThemeComponents();
const ThemeTable = themeComponents.table;
function ScrollableTable(props: React.ComponentProps<"table">) {
  return <ThemeTable tabIndex={0} {...props} />;
}
export function useMDXComponents(components: MDXComponents = {}) {
  return { ...themeComponents, table: ScrollableTable, ...components };
}
