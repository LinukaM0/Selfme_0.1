import React from "react";
import jsPDF from "jspdf";

function DownloadAssignedTasksReport({ tasks }) {
  const downloadReport = () => {
    const doc = new jsPDF();
    let y = 20;

    // Header with colored background and rounded corners
    doc.setFillColor(23, 106, 58); // Dark green
    doc.roundedRect(10, y - 12, 190, 18, 5, 5, "F");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("SelfMe Solar", 105, y, { align: "center" });
    y += 10;

    // Title
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("Assigned Tasks Report", 105, y, { align: "center" });
    y += 10;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 220);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, y, { align: "center" });
    y += 8;

    // Card-like summary section
    doc.setFillColor(247, 250, 253); // Light background
    doc.roundedRect(10, y, 190, 18, 4, 4, "F");
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.text(`Total: ${tasks.length}`, 16, y + 7);
    doc.text(`Pending: ${tasks.filter(t => t.status !== "Done").length}`, 70, y + 7);
    doc.text(`Done: ${tasks.filter(t => t.status === "Done").length}`, 130, y + 7);
    y += 22;

    // Table Headers with theme color and tight columns
    doc.setFillColor(23, 106, 58);
    doc.roundedRect(10, y - 6, 190, 9, 3, 3, "F");
    doc.setFontSize(8.5);
    doc.setFont(undefined, "bold");
    doc.setTextColor(255, 255, 255);

    // X positions for each column (adjusted for fit)
    const x = [12, 28, 44, 68, 98, 114, 128, 146, 164, 185];
    doc.text("Order", x[0], y);
    doc.text("CustID", x[1], y);
    doc.text("Customer", x[2], y);
    doc.text("Product", x[3], y);
    doc.text("Amt", x[4], y);
    doc.text("Stat", x[5], y);
    doc.text("Emp", x[6], y);
    doc.text("Assign", x[7], y);
    doc.text("Deadl.", x[8], y);
    y += 6;
    doc.setFont(undefined, "normal");

    // Table Rows
    tasks.forEach((task, idx) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
        doc.setFillColor(23, 106, 58);
        doc.roundedRect(10, y - 6, 190, 9, 3, 3, "F");
        doc.setFontSize(8.5);
        doc.setFont(undefined, "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Order", x[0], y);
        doc.text("CustID", x[1], y);
        doc.text("Customer", x[2], y);
        doc.text("Product", x[3], y);
        doc.text("Amt", x[4], y);
        doc.text("Stat", x[5], y);
        doc.text("Emp", x[6], y);
        doc.text("Assign", x[7], y);
        doc.text("Deadl.", x[8], y);
        y += 6;
        doc.setFont(undefined, "normal");
      }

      if (idx % 2 === 1) {
        doc.setFillColor(247, 250, 253);
        doc.rect(10, y - 4, 190, 7, "F");
      }

      const statusColor = task.status === "Done" ? [39, 174, 96] : [230, 126, 34];

      doc.setFontSize(8);
      doc.setTextColor(44, 62, 80);
      doc.text(String(task.custom_id || "-").substring(0, 8), x[0], y);
      doc.text(String(task.customerId || "-").substring(0, 8), x[1], y);
      doc.text(String(task.customerName || "-"), x[2], y);
      doc.text(String(task.product || "-").substring(0, 14), x[3], y);
      doc.text(`Rs.${task.total_amount?.toLocaleString() || "-"}`, x[4], y);

      doc.setTextColor(...statusColor);
      doc.setFont(undefined, "bold");
      doc.text(String(task.status || "-").substring(0, 6), x[5], y);
      doc.setFont(undefined, "normal");
      doc.setTextColor(44, 62, 80);

      doc.text(
        task.assigned_employee?.Employee_name
          ? String(task.assigned_employee.Employee_name).substring(0, 8)
          : "-",
        x[6],
        y
      );
      doc.text(
        task.assigned_date
          ? new Date(task.assigned_date).toLocaleDateString()
          : "-",
        x[7],
        y
      );
      doc.text(
        task.deadline
          ? new Date(task.deadline).toLocaleDateString()
          : "-",
        x[8],
        y
      );

      doc.setDrawColor(230, 230, 230);
      doc.line(10, y + 2.5, 200, y + 2.5);

      y += 7;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | SelfMe Solar Pvt Ltd | © ${new Date().getFullYear()}`,
        105,
        290,
        { align: "center" }
      );
    }

    doc.save("AssignedTasksReport.pdf");
  };

  return (
    <button className="cta-button primary" onClick={downloadReport}>
      Download Report
    </button>
  );
}

export default DownloadAssignedTasksReport;
