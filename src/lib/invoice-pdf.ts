import { jsPDF } from "jspdf";

export type InvoicePdfData = {
  invoiceNumber: string;
  issuedAt: string; // ISO
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  booking: {
    id: string;
    category: string;
    service?: string | null;
    area: string;
    preferredDate: string;
    preferredSlot: string;
  };
  provider?: {
    name: string;
    phone?: string | null;
  } | null;
  payments: Array<{
    method: string;
    gateway: string;
    amount: number;
    createdAt: string;
    ref?: string | null;
  }>;
};

const BRAND = "Shebabd";
const ADDRESS_LINES = [
  "Shebabd Services Ltd.",
  "Dhaka, Bangladesh",
  "support@shebabd.com",
];

function fmtMoney(n: number, currency: string) {
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(BRAND, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  ADDRESS_LINES.forEach((line, i) => {
    doc.text(line, margin, y + 16 + i * 12);
  });

  // Invoice meta (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INVOICE", pageWidth - margin, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.invoiceNumber, pageWidth - margin, y + 16, { align: "right" });
  doc.text(
    `Issued: ${new Date(data.issuedAt).toLocaleDateString()}`,
    pageWidth - margin,
    y + 30,
    { align: "right" },
  );
  doc.text(`Status: ${data.status.toUpperCase()}`, pageWidth - margin, y + 44, {
    align: "right",
  });

  y += 80;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Bill to
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BILL TO", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let by = y + 14;
  doc.text(data.customer.name, margin, by);
  if (data.customer.phone) doc.text(data.customer.phone, margin, (by += 12));
  if (data.customer.email) doc.text(data.customer.email, margin, (by += 12));
  if (data.customer.address) doc.text(data.customer.address, margin, (by += 12));

  // Service details (right)
  doc.setFont("helvetica", "bold");
  doc.text("SERVICE", pageWidth / 2 + 20, y);
  doc.setFont("helvetica", "normal");
  let sy = y + 14;
  doc.text(
    `${data.booking.category}${data.booking.service ? " · " + data.booking.service : ""}`,
    pageWidth / 2 + 20,
    sy,
  );
  doc.text(`Area: ${data.booking.area}`, pageWidth / 2 + 20, (sy += 12));
  doc.text(
    `Date: ${new Date(data.booking.preferredDate).toLocaleDateString()} (${data.booking.preferredSlot})`,
    pageWidth / 2 + 20,
    (sy += 12),
  );
  if (data.provider) {
    doc.text(`Provider: ${data.provider.name}`, pageWidth / 2 + 20, (sy += 12));
  }

  y = Math.max(by, sy) + 30;

  // Line items table header
  doc.setFillColor(245, 245, 247);
  doc.rect(margin, y, pageWidth - margin * 2, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DESCRIPTION", margin + 10, y + 16);
  doc.text("AMOUNT", pageWidth - margin - 10, y + 16, { align: "right" });
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.text(
    `${data.booking.category}${data.booking.service ? " — " + data.booking.service : ""}`,
    margin + 10,
    y + 18,
  );
  doc.text(fmtMoney(data.subtotal, data.currency), pageWidth - margin - 10, y + 18, {
    align: "right",
  });
  y += 32;

  doc.setDrawColor(230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Totals
  const totalsX = pageWidth - margin - 160;
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", totalsX, y);
  doc.text(fmtMoney(data.subtotal, data.currency), pageWidth - margin, y, { align: "right" });
  y += 16;
  doc.text("Tax", totalsX, y);
  doc.text(fmtMoney(data.tax, data.currency), pageWidth - margin, y, { align: "right" });
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", totalsX, y);
  doc.text(fmtMoney(data.total, data.currency), pageWidth - margin, y, { align: "right" });
  y += 32;

  // Payments
  if (data.payments.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PAYMENTS RECEIVED", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    data.payments.forEach((p) => {
      const label = `${new Date(p.createdAt).toLocaleDateString()} — ${p.method}${
        p.gateway && p.gateway !== "manual" ? " (" + p.gateway + ")" : ""
      }${p.ref ? " · " + p.ref : ""}`;
      doc.text(label, margin, y);
      doc.text(fmtMoney(p.amount, data.currency), pageWidth - margin, y, { align: "right" });
      y += 14;
    });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - margin;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Booking reference: ${data.booking.id}`,
    margin,
    footerY - 14,
  );
  doc.text(
    `Thank you for choosing ${BRAND}.`,
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  return doc;
}

export function downloadInvoicePdf(data: InvoicePdfData) {
  const doc = generateInvoicePdf(data);
  doc.save(`${data.invoiceNumber}.pdf`);
}
