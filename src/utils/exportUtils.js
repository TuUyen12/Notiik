import TurndownService from 'turndown';
import html2pdf from 'html2pdf.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- Hàm tạo Blob định dạng MS Word từ HTML ---
const generateWordBlob = (title, htmlContent) => {
  const preHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; }
        h1, h2, h3 { color: #1F2937; }
        img { max-width: 100%; height: auto; }
        ul, ol { margin-left: 20px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${htmlContent || '<p>Chưa có nội dung...</p>'}
    </body>
    </html>
  `;
  return new Blob(['\ufeff', preHtml], { type: 'application/msword' });
};

// --- HÀM XUẤT 1 GHI CHÚ ---
export const exportSingleNote = async (note, format) => {
  const title = note.title || 'Ghi-chu-khong-ten';
  const cleanTitle = title.replace(/[^\w\s\u00C0-\u1EF9]/gi, '-');

  if (format === 'md') {
    const turndownService = new TurndownService({ headingStyle: 'atx' });
    const markdown = `# ${note.title}\n\n` + turndownService.turndown(note.content || '');
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${cleanTitle}.md`);
  } 
  else if (format === 'doc') {
    const blob = generateWordBlob(note.title, note.content);
    saveAs(blob, `${cleanTitle}.doc`);
  } 
  else if (format === 'pdf') {
    const element = document.createElement('div');
    element.innerHTML = `<h1>${note.title}</h1>${note.content || '<p>Chưa có nội dung...</p>'}`;
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    
    html2pdf().set({
      margin: 1,
      filename: `${cleanTitle}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(element).save();
  }
};

// --- HÀM XUẤT TOÀN BỘ DỰ ÁN (ZIP) ---
export const exportProjectToZip = async (project, format) => {
  const zip = new JSZip();
  const folderName = project.name.replace(/[^\w\s\u00C0-\u1EF9]/gi, '-');
  const projectFolder = zip.folder(folderName);
  
  if (!project.notes || project.notes.length === 0) {
    alert("Dự án này chưa có ghi chú nào để tải về!");
    return;
  }

  // Khởi tạo Turndown nếu cần
  let turndownService;
  if (format === 'md') {
    turndownService = new TurndownService({ headingStyle: 'atx' });
  }

  for (let i = 0; i < project.notes.length; i++) {
    const note = project.notes[i];
    const safeTitle = (note.title || `Ghi-chu-${i+1}`).replace(/[^\w\s\u00C0-\u1EF9]/gi, '-');

    if (format === 'md') {
      const markdown = `# ${note.title}\n\n` + turndownService.turndown(note.content || '');
      projectFolder.file(`${safeTitle}.md`, markdown);
    } 
    else if (format === 'doc') {
      const blob = generateWordBlob(note.title, note.content);
      projectFolder.file(`${safeTitle}.doc`, blob);
    } 
    else if (format === 'pdf') {
      // Dùng html2pdf.js để xuất file ảo (Blob) sau đó nhét vào ZIP
      const element = document.createElement('div');
      element.innerHTML = `<h1>${note.title}</h1>${note.content || '<p>Chưa có nội dung...</p>'}`;
      element.style.padding = '20px';
      element.style.fontFamily = 'Arial, sans-serif';

      const pdfBlob = await html2pdf().set({
        margin: 1,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }).from(element).output('blob');
      
      projectFolder.file(`${safeTitle}.pdf`, pdfBlob);
    }
  }

  // Tải file ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${folderName}.zip`);
};
