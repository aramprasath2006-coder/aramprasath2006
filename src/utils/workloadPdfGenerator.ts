import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkloadProgressReport } from '../types/rbac';

export function generateWorkloadReportPdf(report: WorkloadProgressReport): void {
  // Create jsPDF instance in A4 portrait orientation
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Colors
  const navy = [10, 25, 47] as const;
  const primaryBlue = [30, 58, 138] as const;
  const slateDark = [30, 41, 59] as const;
  const slateGray = [100, 116, 139] as const;
  const amber = [217, 119, 6] as const;

  // 1. Institution Header Banner
  doc.setFillColor(10, 25, 47);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Institution Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('KARPAGA VINAYAGA DEEMED TO BE UNIVERSITY', pageWidth / 2, 9, { align: 'center' });

  // College Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(
    'Karpaga Vinayaga College of Engineering and Technology (KVCET) • KVELL',
    pageWidth / 2,
    15,
    { align: 'center' }
  );

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'GST Road, Chinna Kolambakkam, Madhuranthagam Taluk, Chengalpattu - 603308, Tamil Nadu',
    pageWidth / 2,
    21,
    { align: 'center' }
  );

  // Decorative Accent Line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(0, 28, pageWidth, 28);

  // 2. Report Sub-header & Title
  let currentY = 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text('DEPARTMENT WORKLOAD PROGRESS & SYLLABUS AUDIT REPORT', margin, currentY);

  // Status Badge on Right
  const badgeText = report.progressStatus ? report.progressStatus.toUpperCase() : 'PENDING';
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  if (report.progressStatus === 'Completed') {
    doc.setFillColor(220, 252, 231);
    doc.setTextColor(22, 101, 52);
  } else if (report.progressStatus === 'In Progress') {
    doc.setFillColor(219, 234, 254);
    doc.setTextColor(30, 64, 175);
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setTextColor(180, 83, 9);
  }
  const badgeWidth = 28;
  doc.roundedRect(pageWidth - margin - badgeWidth, currentY - 5, badgeWidth, 6, 1.5, 1.5, 'F');
  doc.text(badgeText, pageWidth - margin - badgeWidth / 2, currentY - 1, { align: 'center' });

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateGray);
  doc.text(
    `Official record of teaching workload allocation, contact hours, and syllabus coverage verification.`,
    margin,
    currentY
  );

  // 3. Metadata Summary Table Box
  currentY += 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 26, 2, 2, 'FD');

  const col1X = margin + 4;
  const col2X = margin + 98;
  let metaY = currentY + 6;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slateDark);
  doc.text('Department:', col1X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.departmentName} (${report.departmentCode})`, col1X + 22, metaY);

  doc.setFont('helvetica', 'bold');
  doc.text('Head of Dept (HOD):', col2X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(report.hodName || 'Not Assigned', col2X + 32, metaY);

  // Row 2
  metaY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Academic Year:', col1X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.academicYear || '2026–2027'} (${report.semester || 'Even'} Semester)`, col1X + 24, metaY);

  doc.setFont('helvetica', 'bold');
  doc.text('Submission Date:', col2X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(report.submissionDate || new Date().toISOString().slice(0, 10), col2X + 28, metaY);

  // Row 3
  metaY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Faculty Included:', col1X, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.facultyCount} Teaching Staff Members`, col1X + 26, metaY);

  doc.setFont('helvetica', 'bold');
  doc.text('Overall Progress:', col2X, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text(`${report.workloadProgress}% Delivery Completed`, col2X + 26, metaY);

  // 4. Detailed Faculty Workload Table using autoTable
  currentY += 32;

  const tableData = (report.individualWorkloadDetails || []).map((detail, idx) => {
    return [
      (idx + 1).toString(),
      detail.facultyName,
      detail.designation || 'Faculty Member',
      detail.assignedCourses || 'Core Curriculum',
      `${detail.theoryHours ?? 0} hrs`,
      `${detail.labHours ?? 0} hrs`,
      `${detail.totalHours ?? 0} hrs`,
      `${detail.progressPercentage ?? 0}%`,
      `${detail.complianceStatus || 'Optimal'}\n${detail.progressNotes ? `(${detail.progressNotes})` : ''}`,
    ];
  });

  // Calculate totals
  const totalTheory = (report.individualWorkloadDetails || []).reduce(
    (sum, d) => sum + (Number(d.theoryHours) || 0),
    0
  );
  const totalLab = (report.individualWorkloadDetails || []).reduce(
    (sum, d) => sum + (Number(d.labHours) || 0),
    0
  );
  const grandTotal = totalTheory + totalLab;
  const avgProgress =
    report.individualWorkloadDetails && report.individualWorkloadDetails.length > 0
      ? Math.round(
          report.individualWorkloadDetails.reduce(
            (sum, d) => sum + (Number(d.progressPercentage) || 0),
            0
          ) / report.individualWorkloadDetails.length
        )
      : report.workloadProgress;

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'S.No',
        'Faculty Name',
        'Designation',
        'Assigned Course(s)',
        'Theory (L+T)',
        'Lab (P)',
        'Total Contact',
        'Progress',
        'Status & Notes',
      ],
    ],
    body: tableData,
    foot: [
      [
        '',
        'Department Contact Load Total',
        `${report.facultyCount} Faculty`,
        'Department Summary',
        `${totalTheory} hrs`,
        `${totalLab} hrs`,
        `${grandTotal} hrs/wk`,
        `${avgProgress}% Avg`,
        grandTotal > 0 ? 'AICTE Compliant' : 'Pending',
      ],
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [10, 25, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 32 },
      2: { cellWidth: 26 },
      3: { cellWidth: 38 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      8: { cellWidth: 16, fontSize: 6.5 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer on every page
      const pageNumber = data.pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);

      const footerText = `Karpaga Vinayaga Deemed to be University • Generated on ${new Date().toLocaleString()} • Report ID: ${report.id}`;
      doc.text(footerText, margin, pageHeight - 8);

      const pageText = `Page ${pageNumber}`;
      doc.text(pageText, pageWidth - margin, pageHeight - 8, { align: 'right' });
    },
  });

  // 5. Signatures and Endorsement Block
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 60;
  let signY = finalY + 16;

  // Check if sign block fits on current page; if not, add page
  if (signY + 28 > pageHeight) {
    doc.addPage();
    signY = 30;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);

  // Line 1: HOD
  const colSig1 = margin + 8;
  const colSig2 = pageWidth / 2 - 25;
  const colSig3 = pageWidth - margin - 50;
  const sigLineWidth = 45;

  doc.line(colSig1, signY, colSig1 + sigLineWidth, signY);
  doc.line(colSig2, signY, colSig2 + sigLineWidth, signY);
  doc.line(colSig3, signY, colSig3 + sigLineWidth, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...navy);
  doc.text('Department Coordinator', colSig1 + sigLineWidth / 2, signY + 4, { align: 'center' });
  doc.text('Head of Department (HOD)', colSig2 + sigLineWidth / 2, signY + 4, { align: 'center' });
  doc.text('Dean / Principal Approval', colSig3 + sigLineWidth / 2, signY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slateGray);
  doc.text(report.submittedBy || 'Academic Office', colSig1 + sigLineWidth / 2, signY + 8, { align: 'center' });
  doc.text(report.hodName || 'Head of Department', colSig2 + sigLineWidth / 2, signY + 8, { align: 'center' });
  doc.text('Academic Council Seal', colSig3 + sigLineWidth / 2, signY + 8, { align: 'center' });

  // 6. Trigger Download
  const cleanCode = (report.departmentCode || 'DEPT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanDate = (report.submissionDate || new Date().toISOString().slice(0, 10)).replace(
    /[^a-zA-Z0-9_-]/g,
    '_'
  );
  const filename = `KVCET_${cleanCode}_Workload_Progress_Report_${cleanDate}.pdf`;

  doc.save(filename);
}
