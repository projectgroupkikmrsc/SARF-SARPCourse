// Vercel Serverless Function: api/derma.js
// Menjana bil dinamik dengan ToyyibPay API dan redirect ke kalkulator selepas bayaran

export default async function handler(req, res) {
  const isDebug = req.query && req.query.debug === '1';

  try {
    const userSecretKey = (process.env.TOYYIBPAY_SECRET_KEY || process.env.TOYYIB_SECRET_KEY || '').trim();
    const categoryCode = (process.env.TOYYIBPAY_CATEGORY_CODE || process.env.TOYYIB_CATEGORY_CODE || '4ra16482').trim();

    if (!userSecretKey) {
      if (isDebug) {
        return res.status(200).json({
          status: 'error',
          message: 'TOYYIBPAY_SECRET_KEY tidak dijumpai dalam Vercel Environment Variables.',
          availableEnvKeys: Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('SECRET'))
        });
      }
      return res.redirect(302, 'https://toyyibpay.com/Duit-Kopi-Apps-SAR-Planner');
    }

    // Tentukan URL domain
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'sarplanner.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const returnUrl = `${proto}://${host}/kalkulator`;
    const callbackUrl = `${proto}://${host}/api/callback`;

    // Sediakan Form Data mengikut spesifikasi ToyyibPay API
    const formData = new URLSearchParams();
    formData.append('userSecretKey', userSecretKey);
    formData.append('categoryCode', categoryCode);
    formData.append('billName', 'Belanja Kopi SAR Planner');
    formData.append('billDescription', 'Sumbangan Belanja Kopi SAR Planner');
    formData.append('billPriceSetting', '0'); // 0: Open Amount
    formData.append('billPayorInfo', '0');
    formData.append('billAmount', '0');
    formData.append('billReturnUrl', returnUrl);
    formData.append('billCallbackUrl', callbackUrl);
    formData.append('billExternalReferenceNo', `SAR-${Date.now()}`);
    formData.append('billTo', 'Penyokong SAR Planner');
    formData.append('billEmail', 'support@sarplanner.app');
    formData.append('billPhone', '0123456789');
    formData.append('billPaymentChannel', '0');
    formData.append('billDisplayMerchant', '1');
    formData.append('billContentEmail', 'Terima kasih atas sokongan anda untuk SAR Planner.');

    const response = await fetch('https://toyyibpay.com/index.php/api/createBill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const rawText = await response.text();
    let result = null;
    try {
      result = JSON.parse(rawText);
    } catch (e) {
      result = rawText;
    }

    if (isDebug) {
      return res.status(200).json({
        status: 'debug',
        toyyibHttpCode: response.status,
        toyyibResponse: result,
        categoryCodeSent: categoryCode,
        secretKeyConfigured: !!userSecretKey,
        returnUrlSent: returnUrl
      });
    }

    if (Array.isArray(result) && result[0] && result[0].BillCode) {
      const billCode = result[0].BillCode;
      return res.redirect(302, `https://toyyibpay.com/${billCode}`);
    } else {
      console.error('ToyyibPay CreateBill Error:', result);
      return res.redirect(302, 'https://toyyibpay.com/Duit-Kopi-Apps-SAR-Planner');
    }
  } catch (error) {
    if (isDebug) {
      return res.status(500).json({
        status: 'exception',
        error: error.message,
        stack: error.stack
      });
    }
    console.error('Ralat pelaksanaan createBill:', error);
    return res.redirect(302, 'https://toyyibpay.com/Duit-Kopi-Apps-SAR-Planner');
  }
}
