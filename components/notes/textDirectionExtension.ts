import { Extension } from "@tiptap/react";

/**
 * Adds a `dir="auto"` attribute to every block node so the browser's
 * native bidi algorithm picks the direction of each paragraph from its
 * first strong character. Combined with `unicode-bidi: plaintext` in
 * CSS, this makes Hebrew paragraphs flow RTL, English flow LTR, and a
 * newline after a Hebrew paragraph starts RTL even before the user
 * types anything.
 */
export const TextDirection = Extension.create({
  name: "textDirection",

  addGlobalAttributes() {
    return [
      {
        types: [
          "paragraph",
          "heading",
          "blockquote",
          "listItem",
          "taskItem",
          "codeBlock",
        ],
        attributes: {
          dir: {
            default: "auto",
            parseHTML: (el) => el.getAttribute("dir") || "auto",
            renderHTML: (attrs) => ({ dir: attrs.dir || "auto" }),
          },
        },
      },
    ];
  },
});
