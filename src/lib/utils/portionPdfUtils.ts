import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TAMIL_FONT_B64 } from './tamilFont';

/**
 * Manually reshapes Tamil Unicode for visual rendering in jsPDF
 * which lacks a complex script shaping engine.
 * Moves vowel signs (kombu) to the left of consonants.
 */
const TAMIL_FONT_FAMILY = 'TamilPDF';
const PT_TO_MM = 0.352778; // Conversion factor: 1pt = 0.352778mm

// Side effect: Inject the font into the browser for the Canvas Bridge to use
if (typeof document !== 'undefined') {
  // Check if already injected
  if (!document.getElementById('tamil-pdf-font')) {
    const style = document.createElement('style');
    style.id = 'tamil-pdf-font';
    style.innerHTML = `
      @font-face {
        font-family: '${TAMIL_FONT_FAMILY}';
        src: url('data:application/font-ttf;base64,${TAMIL_FONT_B64}');
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Renders text to a Data URL using the browser's native shaping engine.
 * This is the only way to get perfect Tamil in jsPDF.
 */
const renderTextToImage = (text: string, fontSize: number, color: string = '#000000'): { data: string; width: number; height: number } | null => {
  if (typeof document === 'undefined' || !text) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Use a higher scale for high-definition PDF results
  const scale = 6; 
  const scaledFontSize = fontSize * scale;

  // Set font (browser handles complex script shaping automatically)
  ctx.font = `${scaledFontSize}px "${TAMIL_FONT_FAMILY}", "Noto Sans Tamil", sans-serif`;
  
  const metrics = ctx.measureText(text);
  // Add margin for precision
  const width = Math.ceil(metrics.width) + (2 * scale);
  // Large height to safely capture tall Tamil diacritics
  const height = Math.ceil(scaledFontSize * 2);

  canvas.width = width;
  canvas.height = height;

  // Reset context and draw
  ctx.font = `${scaledFontSize}px "${TAMIL_FONT_FAMILY}", "Noto Sans Tamil", sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  
  // Center vertically
  ctx.fillText(text, 1 * scale, height / 2);

  // Resulting dimensions in "points"
  return {
    data: canvas.toDataURL('image/png'),
    width: width / scale,
    height: height / scale
  };
};

/**
 * Measures and splits text into lines using the Canvas engine.
 * Bypasses jsPDF's measurement issues with custom fonts.
 */
const splitTextUsingCanvas = (text: string, fontSize: number, maxWidthMm: number): string[] => {
  if (typeof document === 'undefined' || !text) return [text];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [text];
  
  // Use same HD scale as rendering for precision
  const scale = 6;
  ctx.font = `${fontSize * scale}px "${TAMIL_FONT_FAMILY}", "Noto Sans Tamil", sans-serif`;
  
  const maxWidthCanvas = (maxWidthMm / PT_TO_MM) * scale;
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    
    // If word itself is too long for the column (rare for bible names), we have to split it
    if (metrics.width > maxWidthCanvas && !currentLine) {
        lines.push(word); // Forcing it here, could be refined to split middle-word
        continue;
    }

    if (metrics.width > maxWidthCanvas) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines.length > 0 ? lines : [text];
};

const toTamilOnly = (text: string): string => {
  if (!text) return text;
  // This regex matches everything up to the first slash (if present) and the slash itself
  return text.replace(/^[^/]+\//, '').trim();
};

/**
 * Helper to handle the common logic of drawing Tamil text in a cell
 */
const handleTamilCellDrawing = (data: any, doc: any) => {
  if (data.cell.section === 'body' || data.cell.section === 'head') {
    const lines = (data.cell as any)._tamilLines;
    
    if (lines && lines.length > 0) {
      const fontSize = data.cell.styles.fontSize;
      const color = data.cell.section === 'head' ? '#ffffff' : '#000000';
      
      const paddingLeft = data.cell.padding('left');
      
      // Line height multiplier
      const lineHeightPt = fontSize * 1.35;
      const totalTextHeightMm = (lines.length * lineHeightPt) * PT_TO_MM;
      
      // Start Y: Center the block of lines vertically
      let currentY = data.cell.y + (data.cell.height / 2) - (totalTextHeightMm / 2);

      lines.forEach((line: string) => {
        const img = renderTextToImage(line.trim(), fontSize, color);
        if (img) {
          const pdfWidth = img.width * PT_TO_MM;
          const pdfHeight = img.height * PT_TO_MM;
          
          // Draw the line (middle alignment in renderTextToImage means we use currentY + half line height)
          doc.addImage(img.data, 'PNG', data.cell.x + paddingLeft, currentY, pdfWidth, pdfHeight);
          currentY += lineHeightPt * PT_TO_MM;
        }
      });
    }
  }
};

const createReadingDocument = (readings: any[], category: 'kids_teens' | 'adult') => {
  const doc = new jsPDF();
  
  // Add Tamil + Latin Font Support
  doc.addFileToVFS('Tamil.ttf', TAMIL_FONT_B64);
  doc.addFont('Tamil.ttf', 'Tamil', 'normal');
  doc.setFont('Tamil', 'normal');
  
  const title = category === 'kids_teens' ? '70-Day Contest: Kids & Teens Portions' : '70-Day Contest: Adult Portions';
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185); // Spiritual Blue-ish
  
  // Render main title via Canvas for perfect shaping
  const titleImg = renderTextToImage(title, 18, '#2980b9');
  if (titleImg) {
    doc.addImage(titleImg.data, 'PNG', 14, 15, titleImg.width * PT_TO_MM, titleImg.height * PT_TO_MM);
  } else {
    doc.text(title, 14, 20);
  }
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('Tamil', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 28);
  doc.text(`Total Days: ${readings.length}`, 15, 33);

  // Table Config
  const columns = category === 'kids_teens' 
    ? [
        { header: 'Day', dataKey: 'day' },
        { header: 'Psalms', dataKey: 'psalms' },
        { header: 'Proverbs', dataKey: 'proverbs' },
        { header: 'New Testament', dataKey: 'new_testament' }
      ]
    : [
        { header: 'Day', dataKey: 'day' },
        { header: 'Old Testament', dataKey: 'old_testament' },
        { header: 'Psalms', dataKey: 'psalms' },
        { header: 'Proverbs', dataKey: 'proverbs' },
        { header: 'New Testament', dataKey: 'new_testament' }
      ];

  const body = readings.sort((a, b) => a.day - b.day).map(r => {
    if (category === 'kids_teens') {
      return [r.day, r.psalms, r.proverbs, r.new_testament];
    } else {
      return [r.day, r.old_testament, r.psalms, r.proverbs, r.new_testament];
    }
  });

  autoTable(doc, {
    startY: 40,
    head: [columns.map(col => col.header)],
    body: body,
    theme: 'striped',
    styles: { 
      fontSize: 8.5, 
      cellPadding: 2, 
      font: 'Tamil', 
      fontStyle: 'normal', 
      overflow: 'linebreak' 
    },
    headStyles: { 
      fillColor: [41, 128, 185], 
      textColor: 255, 
      fontSize: 9, 
      fontStyle: 'normal' 
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // Day
      1: { cellWidth: category === 'adult' ? 44 : 58 }, 
      2: { cellWidth: category === 'adult' ? 40 : 54 }, 
      3: { cellWidth: category === 'adult' ? 40 : 54 }, 
      4: { cellWidth: 40 }  // NT
    },
    tableWidth: 180, // Explicitly fit A4 area (210 - 30 margin)
    margin: { left: 15, right: 15, top: 20 },
    didParseCell: (data) => {
      let text = data.cell.text.join(' ');
      if (data.cell.section === 'body' && data.row.raw && typeof data.column.index !== 'undefined') {
        const rawValue = data.row.raw[data.column.index];
        if (rawValue !== undefined && rawValue !== null) {
          text = toTamilOnly(String(rawValue));
        }
      }
      
      if (/[\u0B80-\u0BFF]/.test(text)) {
        const usableWidthMm = data.cell.width - data.cell.padding('left') - data.cell.padding('right');
        
        // CRITICAL FIX: Use Canvas-based splitting to prevent vertical text bug
        const lines = splitTextUsingCanvas(text, data.cell.styles.fontSize, usableWidthMm);
        (data.cell as any)._tamilLines = lines;
        
        // DYNAMIC ROW EXPANSION
        const lineHeightPt = data.cell.styles.fontSize * 1.5;
        const minHeightNeeded = (lines.length * lineHeightPt + 1) * PT_TO_MM;
        
        if (data.row.height < minHeightNeeded) {
          data.row.height = minHeightNeeded;
        }
        
        data.cell.text = [""]; // Stop default rendering
      }
    },
    didDrawCell: (data) => {
      handleTamilCellDrawing(data, doc);
    }
  });
  
  return doc;
};

export const generateReadingPDF = (readings: any[], category: 'kids_teens' | 'adult') => {
  const doc = createReadingDocument(readings, category);
  doc.save(`70days_${category}_portions.pdf`);
};

export const getReadingPdfBlobUrl = (readings: any[], category: 'kids_teens' | 'adult') => {
  const doc = createReadingDocument(readings, category);
  const blob = doc.output('bloburl') as any;
  return blob.toString();
};

const createAttendanceDocument = (readings: any[], category: 'kids_teens' | 'adult') => {
  const doc = new jsPDF({ orientation: 'portrait' });
  
  // Add Tamil + Latin Font Support
  doc.addFileToVFS('Tamil.ttf', TAMIL_FONT_B64);
  doc.addFont('Tamil.ttf', 'Tamil', 'normal');
  doc.setFont('Tamil', 'normal');

  // Header - Same as Portion Doc for consistency
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185);
  
  const headerImg = renderTextToImage("Athumanesar India", 18, '#2980b9');
  if (headerImg) {
    doc.addImage(headerImg.data, 'PNG', 105 - ((headerImg.width * PT_TO_MM) / 2), 10, headerImg.width * PT_TO_MM, headerImg.height * PT_TO_MM);
  }

  doc.setFontSize(11);
  doc.setTextColor(51);
  const title = `70 days Bible reading contest (${category === 'kids_teens' ? 'Kids & Teens' : 'Adult'}) - Attendance Sheet`;
  
  const subtitleImg = renderTextToImage(title, 11, '#333333');
  if (subtitleImg) {
    doc.addImage(subtitleImg.data, 'PNG', 105 - ((subtitleImg.width * PT_TO_MM) / 2), 20, subtitleImg.width * PT_TO_MM, subtitleImg.height * PT_TO_MM);
  }

  // Input Fields - Side by Side as requested
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text("Name: ____________________________", 14, 33);
  doc.text("ChurchName: ____________________________", 105, 33);

  const sortedReadings = [...readings].sort((a, b) => a.day - b.day);

  // Column Config matching Portion Doc + Done Column
  const columns = category === 'kids_teens' 
    ? [
        { header: 'Done', dataKey: 'done' },
        { header: 'Day', dataKey: 'day' },
        { header: 'Psalms', dataKey: 'psalms' },
        { header: 'Proverbs', dataKey: 'proverbs' },
        { header: 'New Testament', dataKey: 'new_testament' }
      ]
    : [
        { header: 'Done', dataKey: 'done' },
        { header: 'Day', dataKey: 'day' },
        { header: 'Old Testament', dataKey: 'old_testament' },
        { header: 'Psalms', dataKey: 'psalms' },
        { header: 'Proverbs', dataKey: 'proverbs' },
        { header: 'New Testament', dataKey: 'new_testament' }
      ];

  const body = sortedReadings.map(r => {
    if (category === 'kids_teens') {
      return ['[   ]', r.day, r.psalms, r.proverbs, r.new_testament];
    } else {
      return ['[   ]', r.day, r.old_testament, r.psalms, r.proverbs, r.new_testament];
    }
  });

  autoTable(doc, {
    startY: 38,
    head: [columns.map(col => col.header)],
    body: body,
    theme: 'striped',
    styles: { 
      fontSize: 7, 
      cellPadding: 1, 
      font: 'Tamil', 
      fontStyle: 'normal', 
      overflow: 'linebreak'
    },
    headStyles: { 
      fillColor: [41, 128, 185], 
      textColor: 255, 
      fontSize: 7.5, 
      fontStyle: 'normal',
      halign: 'center' 
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // Done
      1: { cellWidth: 10, halign: 'center' }, // Day
      2: { cellWidth: 36 }, // OT
      3: { cellWidth: 46 }, // Psalms
      4: { cellWidth: 36 }, // Prov
      5: { cellWidth: 36 }  // NT
    },
    tableWidth: 180, // Explicitly fit A4 area (210 - 30 margin)
    margin: { left: 15, right: 15, top: 15, bottom: 10 },
    didParseCell: (data) => {
      let text = data.cell.text.join(' ');
      if (data.cell.section === 'body' && data.row.raw && typeof data.column.index !== 'undefined') {
        const rawValue = data.row.raw[data.column.index];
        if (rawValue !== undefined && rawValue !== null) {
          text = toTamilOnly(String(rawValue));
        }
      }
      
      if (/[\u0B80-\u0BFF]/.test(text)) {
        const usableWidthMm = data.cell.width - data.cell.padding('left') - data.cell.padding('right');
        
        // CRITICAL FIX: Use Canvas-based splitting to prevent vertical text bug
        const lines = splitTextUsingCanvas(text, data.cell.styles.fontSize, usableWidthMm);
        (data.cell as any)._tamilLines = lines;
        
        // Expand row height for multiple lines
        const lineHeightPt = data.cell.styles.fontSize * 1.5;
        const minHeightNeeded = (lines.length * lineHeightPt + 1) * PT_TO_MM;
        
        if (data.row.height < minHeightNeeded) {
          data.row.height = minHeightNeeded;
        }
        
        data.cell.text = [""];
      }
    },
    didDrawCell: (data) => {
      handleTamilCellDrawing(data, doc);
    },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.text(`Page ${data.pageNumber}`, 105, doc.internal.pageSize.height - 7, { align: 'center' });
    }
  });

  return doc;
};

export const generateAttendancePDF = (readings: any[], category: 'kids_teens' | 'adult') => {
  const doc = createAttendanceDocument(readings, category);
  doc.save(`Attendance_${category}_portions.pdf`);
};

export const getAttendancePdfBlobUrl = (readings: any[], category: 'kids_teens' | 'adult') => {
  const doc = createAttendanceDocument(readings, category);
  const blob = doc.output('bloburl') as any;
  return blob.toString();
};
