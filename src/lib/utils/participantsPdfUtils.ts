import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { handleTamilCellDrawing, splitTextUsingCanvas, renderTextToImage } from './portionPdfUtils';

export const generateParticipantsListPDF = async (participants: any[]) => {
  const doc = new jsPDF();

  // 1. Sort Participants: Main Branch ('1') first, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.church_branch === '1' && b.church_branch !== '1') return -1;
    if (a.church_branch !== '1' && b.church_branch === '1') return 1;
    return 0;
  });

  // 2. Header Content
  const pageWidth = doc.internal.pageSize.width;
  
  // Title (Centered) - Render as Image to ensure bold matches Tamil style if needed, 
  // but standard bold text is usually fine for English headers. 
  // Let's use image rendering for uniformity if the title could contain Tamil.
  // "Athumanesar India" is English, so standard text is fine, but let's make it consistent.
  
  // Title
  const headerImg = renderTextToImage("Athumanesar India", 22, '#000000');
  if (headerImg) {
      // Convert px to mm (approx 0.264, but portionPdfUtils uses 0.352778)
      const PT_TO_MM = 0.352778; 
      // renderTextToImage returns dimensions already scaled? No, it returns width/height in "points"ish scale.
      // portionPdfUtils logic: 
      // doc.addImage(img.data, 'PNG', 105 - ((headerImg.width * PT_TO_MM) / 2), 10, headerImg.width * PT_TO_MM, headerImg.height * PT_TO_MM);
      doc.addImage(headerImg.data, 'PNG', pageWidth/2 - ((headerImg.width * PT_TO_MM)/2), 15, headerImg.width * PT_TO_MM, headerImg.height * PT_TO_MM);
  } else {
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Athumanesar India", pageWidth / 2, 20, { align: 'center' });
  }

  // Sub-headers
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateTimeStr = `${dateStr} ${timeStr}`;
  const filenameStr = `Athumanesar_Participants_List_${dateStr}_${timeStr.replace(':', '-')}.pdf`;

  const leftText = "70 days Bible Reading Participants List";
  const centerText = `Total Participants: ${sortedParticipants.length}`;
  
  doc.text(leftText, 14, 30);
  doc.text(centerText, pageWidth / 2, 30, { align: "center" });
  doc.text(dateTimeStr, pageWidth - 14, 30, { align: "right" });

  // 3. Prepare Table Data
  const tableRows = sortedParticipants.map((p, index) => {
    let branchDisplay = "Unknown";
    if (p.church_branch === '1') {
      branchDisplay = "Athumanesar Thanjavur Main";
    } else {
      branchDisplay = `Branch - ${p.church_branch_name || ""}`;
    }

    return [
      index + 1,
      p.full_name || "N/A",
      p.phone_number || "N/A",
      p.participation_mode || "N/A",
      branchDisplay
    ];
  });

  // 4. Generate Table
  autoTable(doc, {
    startY: 35,
    head: [['S.No', 'Full Name', 'WhatsApp Number', 'Mode', 'Branch Name']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 9, // Reduced from 10 to fit more text/prevent clipping
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 25 },
      4: { cellWidth: 55 } // Fixed width to ensure wrapping calculation matches reality (180mm total usable)
    },
    didParseCell: (data) => {
        const text = data.cell.text.join(' ');
        
        // Calculate usable width
        let usableWidth = data.column.width;
        // If for some reason dynamic, fallback to strict width
        if (typeof usableWidth !== 'number' || usableWidth <= 0) {
             // 55mm defined above for col 4, others defined too.
             // Fallback values
             if (data.column.index === 4) usableWidth = 55;
             else if (data.column.index === 1) usableWidth = 50;
             else usableWidth = 30;
        }
        
        // Subtract padding (left+right = 6mm) + safety margin (2mm)
        // Force wrap slightly deeper to prevent right-edge clipping
        const padding = data.cell.padding('left') + data.cell.padding('right');
        const usableWidthMm = usableWidth - padding - 2;

        // Always use custom rendering
        const lines = splitTextUsingCanvas(text, data.cell.styles.fontSize, usableWidthMm);
        (data.cell as any)._tamilLines = lines;

        // Expand row height
        const PT_TO_MM = 0.352778;
        const lineHeightPt = data.cell.styles.fontSize * 1.5;
        // Add extra buffer for cellPadding (3mm * 2 = 6mm)
        const minHeightNeeded = (lines.length * lineHeightPt * PT_TO_MM) + 6; 
        
        if (data.row.height < minHeightNeeded) {
          data.row.height = minHeightNeeded;
        }
        
        data.cell.text = [""]; // Hide default text
    },
    didDrawCell: (data) => {
        handleTamilCellDrawing(data, doc); 
    }
  });

  // 5. Save
  doc.save(filenameStr);
};
