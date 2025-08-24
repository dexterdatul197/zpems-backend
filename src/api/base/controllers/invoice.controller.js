const { getChatgptCompletion } = require('../services/openai');
const parsePDF = require('../utils/parsePDF');

exports.parseInvoice = async (req, res) => {
  const base64Data = req.body.pdfData;
  if (!base64Data) {
    return res.status(400).send('No PDF data provided.');
  }

  try {
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    const parsedData = await parsePDF(pdfBuffer);

    const userMessage = `
------------------------------------------------------------------------------------------------------------------------------------------------

Here is invoice data:
    ${parsedData}
------------------------------------------------------------------------------------------------------------------------------------------------

please convert the above invoice data to the following json format, "--" is when the data is not available:

{
    "amount_due": {
      "value": 5291.99,
      "currency": "USD"
    },
    "amount_paid_since_last_invoice": "--",
    "carrier": "Ground",
    "currency": {
      "symbol": "$",
      "code": "USD"
    },
    "currency_exchange_rate": "--",
    "customer_tax_id": "--",
    "delivery_date": "--",
    "due_date": "--",
    "freight_amount": "--",
    "invoice_date": {
      "short_format": "3/14/24",
      "long_format": "2024-3-14"
    },
    "invoice_id": 136253,
    "line_item": {
      "amount": 5034,
      "description": "Printing 12 page brochure Qty 3000, (3) sheets, Indigo Cover 80lb. Silk, 17\"x11\", 4/4, 1 score, 1 fold to 8.5\"x11\", saddle-stitch self-cover, trim to size, shrink wrap in 25's, bulk pack for warehouse inventory, tracking to Maddie, PDF proof",
      "product_code": "--",
      "purchase_order": "--",
      "quantity": 1,
      "unit": "--",
      "unit_price": {
        "value": 5034.00,
        "currency": "USD"
      },
      "net_amount": {
        "value": 5034.00,
        "currency": "USD"
      },
      "payment_terms": "Net 30 days",
      "purchase_order": 2024
    },
    "receiver_address": "400 Alexander Park Suite 302 Princeton, NJ 08540",
    "receiver_email": "--",
    "receiver_name": "Maddie Lindquist",
    "receiver_phone": "--",
    "receiver_tax_id": "--",
    "receiver_website": "--",
    "remit_to_address": "--",
    "remit_to_name": "--",
    "ship_from_address": "--",
    "ship_from_name": "--",
    "ship_to_address": "400 Alexander Park Suite 302 Princeton, NJ 08540",
    "ship_to_name": "Maddie Lindquist",
    "supplier_address": "5915 N. NW Hwy., Chicago, IL 60631",
    "supplier_email": "accounting@sunrisehitek.com",
    "supplier_iban": "--",
    "supplier_name": "Graphic Village dba Sunrise Hitek",
    "supplier_payment_ref": "--",
    "supplier_phone": "--",
    "supplier_registration": "--",
    "supplier_tax_id": "46-1560163",
    "supplier_website": "https://sunrisehitek.com/page/pay.",
    "total_amount": {
      "value": 5291.99,
      "currency": "USD"
    },
    "total_tax_amount": {
      "value": 257.99,
      "currency": "USD"
    },
    "vat": {
      "amount": "--",
      "category_code": "--",
      "tax_amount": "--",
      "tax_rate": "--"
    }
  }
    `;
    const invoiceData = await getChatgptCompletion({
      systemMessage: 'You are a helpful assistant.',
      userMessage,
    });

    // res.json({ result: parsedData, expenseData });

    res.json({ data: JSON.parse(invoiceData) });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
