import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

function header(doc: jsPDF, title: string) {
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("SynthCare HMS", 14, 13);
  doc.setFontSize(10);
  doc.text(format(new Date(), "PPP p"), doc.internal.pageSize.getWidth() - 14, 13, { align: "right" });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(title, 14, 32);
}

export function generatePatientReport(patients: any[]) {
  const doc = new jsPDF();
  header(doc, "Patient Registry");
  autoTable(doc, {
    startY: 38,
    head: [["Code", "Name", "Phone", "Gender", "Blood", "DOB"]],
    body: patients.map(p => [p.patient_code, p.name, p.phone, p.gender ?? "—", p.blood_group ?? "—", p.dob ?? "—"]),
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save(`patients-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateOpdReport(visits: any[]) {
  const doc = new jsPDF();
  header(doc, "OPD Daily Report");
  autoTable(doc, {
    startY: 38,
    head: [["Token", "Patient", "Doctor", "Status", "Complaint"]],
    body: visits.map(v => [
      v.token_number ?? "—",
      v.patients?.name ?? "—",
      v.doctors?.name ?? "—",
      v.status,
      (v.chief_complaint ?? "").slice(0, 40),
    ]),
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save(`opd-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateAppointmentsReport(items: any[]) {
  const doc = new jsPDF();
  header(doc, "Appointments Report");
  autoTable(doc, {
    startY: 38,
    head: [["Date/Time", "Patient", "Doctor", "Status"]],
    body: items.map(a => [
      format(new Date(a.scheduled_at), "PPp"),
      a.patients?.name ?? "—",
      a.doctors?.name ?? "—",
      a.status,
    ]),
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save(`appointments-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateInventoryReport(drugs: any[]) {
  const doc = new jsPDF();
  header(doc, "Pharmacy Inventory");
  autoTable(doc, {
    startY: 38,
    head: [["Name", "Category", "Stock", "Reorder", "Price", "Expiry"]],
    body: drugs.map(d => [d.name, d.category ?? "—", d.stock_qty, d.reorder_level, `₹${d.price ?? 0}`, d.expiry_date ?? "—"]),
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save(`inventory-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateBedReport(beds: any[]) {
  const doc = new jsPDF();
  header(doc, "Bed Occupancy Report");
  autoTable(doc, {
    startY: 38,
    head: [["Ward", "Floor", "Bed #", "Status"]],
    body: beds.map(b => [b.ward, b.floor ?? "—", b.bed_number, b.status]),
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save(`beds-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateLabReport(orders: any[]) {
  const doc = new jsPDF();
  header(doc, "Laboratory Orders");
  autoTable(doc, {
    startY: 38,
    head: [["Test", "Patient", "Status", "Result", "Created"]],
    body: orders.map(o => [
      o.test_name,
      o.visits?.patients?.name ?? "—",
      o.status,
      (o.result ?? "—").slice(0, 40),
      o.created_at?.slice(0, 10) ?? "—",
    ]),
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save(`lab-orders-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateRadiologyReport(orders: any[]) {
  const doc = new jsPDF();
  header(doc, "Radiology Orders");
  autoTable(doc, {
    startY: 38,
    head: [["Service", "Patient", "Status", "Notes", "Created"]],
    body: orders.map(o => [
      o.service_name,
      o.visits?.patients?.name ?? "—",
      o.status,
      (o.radiologist_notes ?? "—").slice(0, 40),
      o.created_at?.slice(0, 10) ?? "—",
    ]),
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save(`radiology-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function generateInvoicePdf(invoice: any, items: any[], hospital: any) {
  const doc = new jsPDF();
  header(doc, `Invoice #${invoice.id.slice(0, 8).toUpperCase()}`);
  doc.setFontSize(10);
  let y = 42;
  if (hospital) {
    doc.text(hospital.name ?? "Hospital", 14, y); y += 5;
    if (hospital.address) { doc.text(String(hospital.address), 14, y); y += 5; }
    if (hospital.phone) { doc.text(`Phone: ${hospital.phone}`, 14, y); y += 5; }
  }
  doc.text(`Patient: ${invoice.visits?.patients?.name ?? "—"}`, 14, y); y += 5;
  doc.text(`Status: ${invoice.status}`, 14, y); y += 5;
  autoTable(doc, {
    startY: y + 4,
    head: [["Description", "Category", "Qty", "Rate", "Amount"]],
    body: items.map(i => [i.description, i.category ?? "—", i.quantity, `₹${i.rate}`, `₹${i.amount}`]),
    foot: [["", "", "", "Total", `₹${invoice.total_amount ?? 0}`], ["", "", "", "Paid", `₹${invoice.paid_amount ?? 0}`]],
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: { fillColor: [240, 240, 245], textColor: 20, fontStyle: "bold" },
  });
  doc.save(`invoice-${invoice.id.slice(0, 8)}.pdf`);
}