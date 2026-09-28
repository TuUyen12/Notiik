import { marked } from 'marked';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình Worker cho PDF.js thông qua CDN để tránh lỗi Build của Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// 1. Nhập file Text / Markdown
export const importMarkdown = async (file) => {
  const text = await file.text();
  const html = marked.parse(text);
  return html;
};

// 2. Nhập file MS Word (.docx)
export const importWord = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value; // Dữ liệu HTML
};

// 3. Nhập file PDF (Biến mỗi trang thành 1 bức ảnh Base64)
export const importPdfAsImages = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let htmlResult = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 để ảnh nét hơn
    
    // Tạo thẻ Canvas ảo để vẽ trang PDF
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render PDF vào Canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    // Biến Canvas thành ảnh Base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    // Tạo thẻ HTML chứa ảnh
    htmlResult += `<div style="text-align: center; margin-bottom: 20px;">
      <img src="${base64Image}" alt="Trang ${pageNum}" style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px; cursor: pointer;" class="pdf-page-image" />
    </div><p><br/></p>`; // Thêm 1 khoảng trống bên dưới ảnh để dễ gõ chữ
  }
  
  return htmlResult;
};
