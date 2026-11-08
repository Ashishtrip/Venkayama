/**
 * GST Tax Invoice Generator for Venkayam India
 * Generates an official, GST-compliant Tax Invoice formatted for print & PDF download
 * Compliant with Section 31 of CGST Act, 2017 & Indian Apparel HSN standards (HSN 6109)
 */

export type InvoiceOrderData = {
  id: string;
  customer: string;
  phone: string;
  city: string;
  address: string;
  items: { name: string; size: string; qty: number; price: number }[];
  amount: number;
  pay: "UPI" | "Card" | string;
  createdAt: number;
  track?: string;
  promo?: string;
};

// Vendor / Registered Seller Details
export const SELLER_DETAILS = {
  companyName: "VENKAYAM INDIA CLOTHING CORP.",
  brandName: "Venkayam India",
  tagline: "Tamil Avant-Garde Streetwear Archive",
  addressLine1: "Nearby Khan Dairy, Block 21, Mayur Vihar Phase I",
  addressLine2: "Kalyan Puri, New Delhi 110091, India",
  plusCode: "J886+9PX",
  state: "Delhi",
  stateCode: "07",
  gstin: "07AAACV9876Q1Z5", // Standard Delhi GSTIN format
  pan: "AAACV9876Q",
  cin: "U18101DL2023PTC123456",
  email: "care@venkayam.in",
  supportPhone: "+91 98765 43210",
  website: "www.venkayam.in",
};

/**
 * Determines HSN code based on product type
 * HSN 6109: T-shirts, singlets and other vests, knitted or crocheted of cotton
 * HSN 6505: Hats, caps and headwear, knitted or crocheted
 * HSN 4202: Canvas bags, totes and utility carriers
 */
export function getHSNCode(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("cap") || lower.includes("snapback") || lower.includes("5-panel") || lower.includes("headwear")) {
    return "6505";
  }
  if (lower.includes("tote") || lower.includes("bag") || lower.includes("carrier")) {
    return "4202";
  }
  // Standard cotton apparel (Tees, Hoodies, Sweatshirts)
  return "6109";
}

/**
 * Converts numbers into Indian Currency words (Rupees and Paise)
 */
export function numberToWordsINR(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

  const inWords = (n: number): string => {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  };

  const integerPart = Math.floor(num);
  if (integerPart === 0) return "Zero Rupees Only";

  let result = "";
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  if (crore > 0) result += inWords(crore) + "Crore ";
  if (lakh > 0) result += inWords(lakh) + "Lakh ";
  if (thousand > 0) result += inWords(thousand) + "Thousand ";
  if (remainder > 0) result += inWords(remainder);

  return result.trim() + " Rupees Only";
}

/**
 * Builds the complete GST invoice HTML document styled for A4 printing and PDF export
 */
export function generateInvoiceHTML(order: InvoiceOrderData): string {
  const invoiceNo = `INV-${order.id.replace(/^VNK-/, "")}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isDelhi =
    order.city.toLowerCase().includes("delhi") ||
    order.address.toLowerCase().includes("delhi") ||
    order.address.includes("1100");

  const placeOfSupply = isDelhi ? "Delhi (07)" : `${order.city || "Rest of India"} (Inter-State)`;

  // Calculate line item taxes
  let totalTaxable = 0;
  let totalTax = 0;

  const itemsWithTaxes = order.items.map((item, index) => {
    const hsn = getHSNCode(item.name);
    // GST rate: 12% for apparel > Rs 1000, 5% for <= 1000, 18% for bags
    let taxRate = 12;
    if (hsn === "4202") taxRate = 18;
    else if (item.price <= 1000) taxRate = 5;

    const lineTotal = item.price * item.qty;
    // Inclusive tax breakdown formula
    const taxableValue = Math.round((lineTotal / (1 + taxRate / 100)) * 100) / 100;
    const taxAmount = Math.round((lineTotal - taxableValue) * 100) / 100;

    totalTaxable += taxableValue;
    totalTax += taxAmount;

    return {
      index: index + 1,
      name: item.name,
      size: item.size,
      qty: item.qty,
      hsn,
      price: item.price,
      lineTotal,
      taxableValue,
      taxRate,
      taxAmount,
      cgstRate: isDelhi ? taxRate / 2 : 0,
      cgstAmount: isDelhi ? taxAmount / 2 : 0,
      sgstRate: isDelhi ? taxRate / 2 : 0,
      sgstAmount: isDelhi ? taxAmount / 2 : 0,
      igstRate: isDelhi ? 0 : taxRate,
      igstAmount: isDelhi ? 0 : taxAmount,
    };
  });

  totalTaxable = Math.round(totalTaxable * 100) / 100;
  totalTax = Math.round(totalTax * 100) / 100;
  const grandTotal = order.amount;
  const amountWords = numberToWordsINR(grandTotal);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax-Invoice-Venkayam-${order.id}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Chivo:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f4f4f4;
      font-family: 'Chivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #000;
      line-height: 1.4;
      font-size: 11px;
    }

    /* Print Screen Toolbar */
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #000;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .toolbar-btn {
      background: #fff;
      color: #000;
      border: 1px solid #fff;
      padding: 6px 14px;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: all 0.2s;
    }
    .toolbar-btn:hover { background: #e0e0e0; }
    .toolbar-close {
      background: transparent;
      color: #fff;
      border: 1px solid #555;
      padding: 6px 14px;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      cursor: pointer;
    }
    .toolbar-close:hover { border-color: #fff; }

    /* A4 Document Container */
    .invoice-wrapper {
      max-width: 820px;
      margin: 20px auto;
      background: #fff;
      border: 2px solid #000;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }

    .header-table {
      width: 100%;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .logo-text {
      font-family: 'Anton', sans-serif;
      font-size: 28px;
      line-height: 0.9;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .sub-brand {
      font-family: 'Space Mono', monospace;
      font-size: 8px;
      letter-spacing: 0.25em;
      color: #555;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .inv-meta {
      font-family: 'Space Mono', monospace;
      font-size: 9.5px;
      color: #333;
    }

    /* Grid for Buyer / Seller Info */
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      border-bottom: 1px solid #000;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .party-card {
      font-size: 10.5px;
    }
    .party-title {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3px;
      margin-bottom: 6px;
      color: #666;
    }
    .party-name {
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .party-detail {
      color: #333;
      margin-bottom: 2px;
    }
    .party-gst {
      font-family: 'Space Mono', monospace;
      font-size: 9.5px;
      font-weight: 700;
      margin-top: 4px;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10px;
    }
    .items-table th {
      background: #000;
      color: #fff;
      font-family: 'Space Mono', monospace;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 6px 8px;
      text-align: left;
    }
    .items-table td {
      border-bottom: 1px solid #ddd;
      padding: 7px 8px;
      vertical-align: top;
    }
    .items-table tr:last-child td {
      border-bottom: 2px solid #000;
    }
    .items-table .text-right { text-align: right; }
    .items-table .text-center { text-align: center; }
    .items-table .font-mono { font-family: 'Space Mono', monospace; }
    .item-title {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10.5px;
    }
    .item-spec {
      font-family: 'Space Mono', monospace;
      font-size: 8.5px;
      color: #666;
    }

    /* Summary & Totals */
    .summary-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }
    .words-block {
      border: 1px dashed #999;
      padding: 10px;
      background: #fafafa;
    }
    .words-label {
      font-family: 'Space Mono', monospace;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 3px;
    }
    .words-text {
      font-size: 11px;
      font-weight: 700;
      font-style: italic;
    }
    .hsn-summary {
      margin-top: 10px;
      font-size: 8.5px;
      font-family: 'Space Mono', monospace;
      color: #555;
    }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .totals-table td {
      padding: 4px 6px;
    }
    .totals-table .total-row {
      font-weight: 800;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      font-size: 13px;
    }
    .totals-table .total-amount {
      font-family: 'Space Mono', monospace;
      font-size: 15px;
      font-weight: 700;
    }

    /* Declaration & Signature Block */
    .footer-section {
      margin-top: 25px;
      border-top: 1px solid #000;
      padding-top: 15px;
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 20px;
    }
    .declaration-text {
      font-size: 8.5px;
      color: #555;
      line-height: 1.4;
    }
    .signature-block {
      text-align: right;
      font-family: 'Space Mono', monospace;
      font-size: 8.5px;
    }
    .sign-box {
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
    }
    .sign-stamp {
      border: 1px solid #000;
      padding: 3px 8px;
      font-size: 8px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: #fafafa;
    }

    /* Print Specific Media Rules */
    @media print {
      body {
        background: #fff;
        margin: 0;
        padding: 0;
      }
      .toolbar { display: none !important; }
      .invoice-wrapper {
        border: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
        box-shadow: none;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 10mm 12mm 10mm;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar -->
  <div class="toolbar">
    <div>
      <span>TAX INVOICE // <b>${invoiceNo}</b></span>
      <span style="margin-left: 15px; color: #888;">Order Ref: ${order.id}</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="toolbar-btn" onclick="window.print()">🖨️ Download / Save as PDF</button>
      <button class="toolbar-close" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="invoice-wrapper">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="logo-text">Venkayam</div>
          <div class="sub-brand">India // Tamil Avant-Garde Streetwear Archive</div>
          <div style="font-size: 9px; margin-top: 4px; color: #444;">
            ${SELLER_DETAILS.companyName}<br>
            ${SELLER_DETAILS.addressLine1}, ${SELLER_DETAILS.addressLine2}<br>
            GSTIN: <b>${SELLER_DETAILS.gstin}</b> | State: ${SELLER_DETAILS.state} (${SELLER_DETAILS.stateCode})
          </div>
        </td>
        <td class="invoice-title-block" style="vertical-align: top;">
          <div class="invoice-badge">Tax Invoice</div>
          <div class="inv-meta">
            <div><b>Invoice No:</b> ${invoiceNo}</div>
            <div><b>Invoice Date:</b> ${invoiceDate}</div>
            <div><b>Order ID:</b> ${order.id}</div>
            <div><b>Tracking Ref:</b> ${order.track || "N/A"}</div>
            <div><b>Payment Mode:</b> ${order.pay} (Prepaid)</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Buyer & Seller Parties Grid -->
    <div class="parties-grid">
      <div class="party-card">
        <div class="party-title">Sold By (Seller)</div>
        <div class="party-name">${SELLER_DETAILS.brandName}</div>
        <div class="party-detail">${SELLER_DETAILS.companyName}</div>
        <div class="party-detail">${SELLER_DETAILS.addressLine1}</div>
        <div class="party-detail">${SELLER_DETAILS.addressLine2}</div>
        <div class="party-detail">Support: ${SELLER_DETAILS.email}</div>
        <div class="party-gst">GSTIN: ${SELLER_DETAILS.gstin}</div>
        <div class="party-gst">PAN: ${SELLER_DETAILS.pan}</div>
      </div>
      <div class="party-card">
        <div class="party-title">Billing &amp; Delivery Destination (Buyer)</div>
        <div class="party-name">${order.customer || "Valued Customer"}</div>
        <div class="party-detail">${order.address || "Delivery Address on File"}</div>
        <div class="party-detail">${order.city || "India"}</div>
        <div class="party-detail">Contact: +91 ${order.phone}</div>
        <div class="party-gst" style="margin-top: 6px;">Place of Supply: <b>${placeOfSupply}</b></div>
        <div class="party-detail" style="font-size: 9px; color: #666;">Reverse Charge Applicable: <b>NO</b></div>
      </div>
    </div>

    <!-- Items Table with HSN 6109 breakdown -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 25px;" class="text-center">#</th>
          <th>Description of Goods</th>
          <th class="text-center" style="width: 60px;">HSN</th>
          <th class="text-center" style="width: 35px;">Qty</th>
          <th class="text-right" style="width: 65px;">Rate (₹)</th>
          <th class="text-right" style="width: 75px;">Taxable (₹)</th>
          ${
            isDelhi
              ? `<th class="text-right" style="width: 65px;">CGST</th><th class="text-right" style="width: 65px;">SGST</th>`
              : `<th class="text-right" style="width: 75px;">IGST</th>`
          }
          <th class="text-right" style="width: 80px;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsWithTaxes
          .map(
            (it) => `
          <tr>
            <td class="text-center font-mono">${it.index}</td>
            <td>
              <div class="item-title">${it.name}</div>
              <div class="item-spec">Size: ${it.size} • 100% Sri Lankan Combed Cotton</div>
            </td>
            <td class="text-center font-mono">${it.hsn}</td>
            <td class="text-center font-mono">${it.qty}</td>
            <td class="text-right font-mono">${it.price.toLocaleString("en-IN")}</td>
            <td class="text-right font-mono">${it.taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            ${
              isDelhi
                ? `<td class="text-right font-mono">${it.cgstRate}%<br><span style="color:#666;">₹${it.cgstAmount.toFixed(2)}</span></td>
                   <td class="text-right font-mono">${it.sgstRate}%<br><span style="color:#666;">₹${it.sgstAmount.toFixed(2)}</span></td>`
                : `<td class="text-right font-mono">${it.igstRate}%<br><span style="color:#666;">₹${it.igstAmount.toFixed(2)}</span></td>`
            }
            <td class="text-right font-mono" style="font-weight: 700;">₹${it.lineTotal.toLocaleString("en-IN")}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>

    <!-- Totals and Summary -->
    <div class="summary-grid">
      <div>
        <div class="words-block">
          <div class="words-label">Invoice Value in Words</div>
          <div class="words-text">${amountWords}</div>
        </div>
        <div class="hsn-summary">
          <b>Tax Breakdown Note:</b><br>
          Applicable HSN: <b>6109</b> (Cotton T-shirts &amp; Apparel), <b>6505</b> (Headwear &amp; Caps), <b>4202</b> (Merch Totes).<br>
          Prices are inclusive of Goods and Services Tax (GST) as per statutory notified schedules.
        </div>
      </div>

      <div>
        <table class="totals-table">
          <tr>
            <td style="color: #666;">Subtotal (Taxable Value):</td>
            <td class="text-right font-mono">₹${totalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
          ${
            isDelhi
              ? `
            <tr>
              <td style="color: #666;">CGST Total:</td>
              <td class="text-right font-mono">₹${(totalTax / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="color: #666;">SGST Total:</td>
              <td class="text-right font-mono">₹${(totalTax / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          `
              : `
            <tr>
              <td style="color: #666;">IGST Total:</td>
              <td class="text-right font-mono">₹${totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          `
          }
          <tr>
            <td style="color: #666;">Shipping &amp; Logistics:</td>
            <td class="text-right font-mono" style="color: #15803d; font-weight: 700;">FREE</td>
          </tr>
          ${
            order.promo
              ? `<tr>
                  <td style="color: #15803d;">Promo Coupon (${order.promo}):</td>
                  <td class="text-right font-mono" style="color: #15803d;">APPLIED</td>
                </tr>`
              : ""
          }
          <tr class="total-row">
            <td>Grand Total (INR):</td>
            <td class="text-right total-amount">₹${grandTotal.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Declaration & Signatures -->
    <div class="footer-section">
      <div class="declaration-text">
        <b>Statutory Terms &amp; Declarations:</b><br>
        1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.<br>
        2. All disputes are subject to the exclusive jurisdiction of the Courts of New Delhi, India.<br>
        3. 7-day easy return and exchange policy applies for unworn merchandise with original tags intact.<br>
        4. This is a computer-generated tax invoice issued under Section 31 of CGST Act, 2017 and does not require a physical signature.
      </div>
      <div class="signature-block">
        <div>For <b>${SELLER_DETAILS.companyName}</b></div>
        <div class="sign-box">
          <div class="sign-stamp">AUTHENTICATED • VENKAYAM CORP</div>
        </div>
        <div style="font-weight: 700;">Authorized Signatory</div>
      </div>
    </div>
  </div>

  <script>
    // Automatically trigger system print dialog with pre-filled document title
    window.addEventListener('load', function() {
      // Short delay ensures fonts and layout are fully ready before print dialog
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;
}

/**
 * Triggers a one-click PDF download/print dialog for a given order
 */
export function downloadGSTInvoice(order: InvoiceOrderData) {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  // Open in a new tab/window which auto-triggers window.print() (Save as PDF)
  const printWindow = window.open(blobUrl, "_blank");

  if (!printWindow || printWindow.closed || typeof printWindow.closed === "undefined") {
    // If popup was blocked by browser, fallback to hidden iframe printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Iframe print error:", e);
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 3000);
      }
    };

    iframe.src = blobUrl;
  } else {
    // Clean up blob URL after print window opens
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  }
}
