// @types/pdf-parse only covers the package root ("pdf-parse"). We import the
// inner lib file directly to avoid its index.js's debug-mode check, which
// misfires under bundlers — see src/lib/parse-document.ts for why.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}
