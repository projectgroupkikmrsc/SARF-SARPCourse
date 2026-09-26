// Vercel Serverless Function: api/derma.js
// Menjana bil dinamik dengan ToyyibPay API dan redirect ke kalkulator selepas bayaran

export default async function handler(req, res) {
  try {
    const userSecretKey = process.env.TOYYIBPAY_SECRET_KEY;
    const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE || '4ra16482';

    if (!userSecretKey) {
      console.warn('TOYYIBPAY_SECRET_KEY tidak dijumpai di environment variables.');
      return res.redirect(302, 'https://toyyibpay.com/Duit-Kopi-Apps-SAR-Planner');
    }

    // Dapatkan domain penuh secara dinamik
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'sarplanner.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const returnUrl = `${proto}://${host}/kalkulator`;
    const callbackUrl = `${proto}://${host}/api/callback`;

    // Data parameter untuk dihantar ke ToyyibPay createBill
    const formData = new URLSearchParams();
    formData.append('userSecretKey', userSecretKey.trim());
    formData.append('categoryCode', categoryCode.trim());
    formData.append('billName', 'Belanja Kopi SAR Planner');
    formData.append('billDescription', 'Sumbangan Belanja Kopi SAR Planner');
    formData.append('billPriceSetting', '0'); // 0: Open Amount (pembayar tentukan amaun)
    formData.append('billPayorInfo', '0');    // 0: Pilihan pembayar
    formData.append('billAmount', '0');       // 0 untuk Open Amount
    formData.append('billReturnUrl', returnUrl);
    formData.append('billCallbackUrl', callbackUrl);
    formData.append('billExternalReferenceNo', `SAR-${Date.now()}`);
    formData.append('billTo', 'Penyokong SAR Planner');
    formData.append('billEmail', 'support@sarplanner.app');
    formData.append('billPhone', '0123456789');
    formData.append('billPaymentChannel', '0'); // 0: FPX Sahaja

    const response = await fetch('https://toyyibpay.com/index.php/api/createBill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('ToyyibPay API non-JSON response:', text);
      return res.redirect(302, 'https://toyyibpay.com/Duit-Kopi-Apps-SAR-Planner');
    }

    if (Array.isArray(result) && result[0] && result[0].BillCode) {
      const billCode = result[0].BillCode;
      return res.redirect(302, `https://toyyibpay.com/${billCode}`);
    } else {
      console.error('ToyyibPay API Error:', result);
      return res.redirect(302, 'https://toyyibpay.com/Duit-Kopi-Apps-SAR-Planner');
    }
  } catch (error) {
    console.error('Ralat pelaksanaan createBill:', error);
    return res.redirect(302, 'https://toyyibpay.com/Duit-Kopi-Apps-SAR-Planner');
  }
}

