import sanitizeHtml from "sanitize-html";

export const cleanCvTemplateHtml = (html = "") => {
  return sanitizeHtml(html, {
    allowedTags: false,
    allowedAttributes: false,
    disallowedTagsMode: "discard",
    allowedSchemes: ["http", "https", "data", "mailto"],
  })
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
};