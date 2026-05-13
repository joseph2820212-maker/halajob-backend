import ejs from "ejs";
import puppeteer from "puppeteer";

export const renderCvHtml = ({ template, data }) => {
  return ejs.render(template.html, {
    ...data,
    css: template.css || "",
  });
};

export const generatePdfFromHtml = async (html) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};