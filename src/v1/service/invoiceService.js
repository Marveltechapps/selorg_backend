// const PDFDocument = require("pdfkit");

// exports.generateInvoicePDF = (invoice, res) => {
//   const doc = new PDFDocument();

//   // Pipe the PDF into a response
//   doc.pipe(res);

//   // Add metadata
//   doc.info.Title = "Invoice";
//   doc.info.Author = "Your Company";

//   // Header
//   doc.fontSize(20).text("Tax Invoice", { align: "center" });
//   doc.moveDown();

//   // Invoice Details
//   doc.fontSize(12).text(`Sold By: ${invoice.soldBy.name}`);
//   doc.text(`Order No: ${invoice.orderNo}`);
//   doc.text(`Order Date: ${new Date(invoice.orderDate).toLocaleDateString()}`);
//   doc.text(`Invoice No: ${invoice.invoiceNo}`);
//   doc.text(
//     `Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`
//   );
//   doc.moveDown();

//   // Addresses
//   doc.fontSize(14).text("Billing Address");
//   doc.fontSize(12).text(`${invoice.billingAddress.name}`);
//   doc.text(`${invoice.billingAddress.address}`);
//   doc.text(`Contact: ${invoice.billingAddress.contact}`);
//   doc.moveDown();

//   doc.fontSize(14).text("Shipping Address");
//   doc.fontSize(12).text(`${invoice.shippingAddress.name}`);
//   doc.text(`${invoice.shippingAddress.address}`);
//   doc.text(`Contact: ${invoice.shippingAddress.contact}`);
//   doc.moveDown();

//   // Items Table
//   doc.fontSize(14).text("Item Details");
//   doc
//     .fontSize(12)
//     .text("----------------------------------------------------------------");
//   doc.text(
//     "Item Code | HSN | Qty | Unit Price | Discount | Taxable Value | CGST | SGST/UGST | IGST | Total"
//   );
//   doc.text("----------------------------------------------------------------");
//   invoice.items.forEach((item) => {
//     doc.text(
//       `${item.itemCode} | ${item.hsn} | ${item.qty} | ${item.unitPrice} | ${item.discount} | ${item.taxableValue} | ${item.cgstAmt} | ${item.sgstAmt} | ${item.igstAmt} | ${item.total}`
//     );
//   });
//   doc.text("----------------------------------------------------------------");
//   doc.moveDown();

//   // Totals
//   doc.fontSize(14).text("Totals");
//   doc.fontSize(12).text(`Total Amount: ${invoice.totalAmount}`);
//   doc.text(`Taxable Value: ${invoice.taxableValue}`);
//   doc.text(`Total Tax: ${invoice.totalTax}`);
//   doc.text(`Store Credit: ${invoice.storeCredit}`);
//   doc.text(`GV Value: ${invoice.gvValue}`);
//   doc.text(`Grand Total: ${invoice.grandTotal}`);
//   doc.moveDown();

//   // Footer
//   doc.text(`Amount in Words: ${invoice.amountInWords}`);
//   doc.text("Thank you for shopping with us.");

//   // Finalize PDF file
//   doc.end();
// };



const PDFDocument = require("pdfkit");

exports.generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument({ margin: 30 });

  // Pipe the PDF into a response
  doc.pipe(res);

  // Add metadata
  doc.info.Title = "Invoice";
  doc.info.Author = "SELORG";

  // Header
  doc
    .fillColor("#0000FF")
    .fontSize(20)
    .text("Tax Invoice", { align: "center" });
  doc.moveDown();

  // Invoice Details
  doc
    .fillColor("#000000")
    .fontSize(12)
    .text(`Order No: ${invoice.orderNo}`, { continued: true })
    .text(`Order Date: ${new Date(invoice.orderDate).toLocaleDateString()}`, {
      align: "right"
    })
    .text(`Extern Order No: ${invoice.externOrderNo}`, { continued: true })
    .text(
      `Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`,
      { align: "right" }
    )
    .text(`Invoice No: ${invoice.invoiceNo}`, { continued: true })
    .text(`Ship Date: ${invoice.shipDate}`, { align: "right" })
    .text(`Payment Mode: ${invoice.paymentMode}`, { continued: true })
    .text(`Type of Supply: ${invoice.typeOfSupply}`, { align: "right" })
    .text(`Place of Supply: ${invoice.placeOfSupply}`, { continued: true })
    .text(`Order Currency: ${invoice.orderCurrency}`, { align: "right" });
  doc.moveDown();

  // Sold By Address
  doc.fillColor("#000000").fontSize(12).text("Sold By", { underline: true });
  doc.text(`${invoice.soldBy.address}`);
  doc
    .text(`GSTIN: ${invoice.soldBy.gstin}`, { continued: true })
    .text(`PAN: ${invoice.soldBy.pan}`, { align: "right" });
  doc.moveDown();

  // Billing Address
  doc.fontSize(12).text("Billing Address", { underline: true });
  doc.text(`${invoice.billingAddress.name}`);
  doc.text(`${invoice.billingAddress.address}`);
  doc.text(`Contact: ${invoice.billingAddress.contact}`);
  doc.moveDown();

  // Shipping Address
  doc.fontSize(12).text("Shipping Address", { underline: true });
  doc.text(`${invoice.shippingAddress.name}`);
  doc.text(`${invoice.shippingAddress.address}`);
  doc.text(`Contact: ${invoice.shippingAddress.contact}`);
  doc.moveDown();

  // Items Table Header
  doc
    .fillColor("#0000FF")
    .fontSize(12)
    .text("Item Details", { underline: true });
  doc
    .fillColor("#000000")
    .fontSize(10)
    .text(
      "-----------------------------------------------------------------------------------------------------------------------------------------------------------------",
      { align: "center" }
    );
  doc.text(
    "S. No | Item Code | HSN | Qty | Unit Price | Discount | Taxable Value | CGST | SGST/UGST | IGST | Total",
    { align: "center" }
  );
  doc.text(
    "-----------------------------------------------------------------------------------------------------------------------------------------------------------------",
    { align: "center" }
  );

  // Items Table Content
  invoice.items.forEach((item, index) => {
    doc.text(
      `${index + 1} | ${item.itemCode} | ${item.hsn} | ${item.qty} | ${
        item.unitPrice
      } | ${item.discount} | ${item.taxableValue} | ${item.cgstAmt} | ${
        item.sgstAmt
      } | ${item.igstAmt} | ${item.total}`,
      { align: "center" }
    );
  });
  doc.text(
    "-----------------------------------------------------------------------------------------------------------------------------------------------------------------",
    { align: "center" }
  );
  doc.moveDown();

  // Totals
  doc
    .fillColor("#0000FF")
    .fontSize(12)
    .text("GST Summary", { underline: true });
  doc
    .fillColor("#000000")
    .fontSize(10)
    .text(`Taxable Value: ${invoice.taxableValue}`);
  doc.text(`CGST: ${invoice.cgstAmt}`);
  doc.text(`SGST/UGST: ${invoice.sgstAmt}`);
  doc.text(`IGST: ${invoice.igstAmt}`);
  doc.text(`Total Tax: ${invoice.totalTax}`);
  doc.text(`Store Credit: ${invoice.storeCredit}`);
  doc.text(`GV Value: ${invoice.gvValue}`);
  doc.text(`Grand Total: ${invoice.grandTotal}`);
  doc.moveDown();

  // Footer
  doc.fillColor("#000000").text(`Amount in Words: ${invoice.amountInWords}`);
  doc.moveDown();
  doc.text("Thank you for shopping with us.");
  doc.moveDown();
  doc
    .fillColor("#FF0000")
    .text("Tax is not payable under reverse charge basis", { align: "center" });
  doc.moveDown();
  doc.fontSize(16).text("eRETAIL", { align: "center", fillColor: "#FF0000" });

  // Finalize PDF file
  doc.end();
};


