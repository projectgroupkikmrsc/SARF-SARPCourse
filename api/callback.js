// Vercel Serverless Function: api/callback.js
// Mengendalikan callback/webhook daripada ToyyibPay

export default async function handler(req, res) {
  try {
    const payload = req.method === 'POST' ? req.body : req.query;
    const { refno, status, billcode, order_id, amount, reason } = payload || {};

    console.log('ToyyibPay Callback Received:', { refno, status, billcode, order_id, amount, reason });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && status === '1') {
      try {
        await fetch(`${supabaseUrl}/rest/v1/donations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            bill_code: billcode,
            reference_no: refno,
            order_id: order_id,
            amount: parseFloat(amount) || 0,
            status: status === '1' ? 'success' : 'failed',
            created_at: new Date().toISOString()
          })
        });
      } catch (dbErr) {
        console.error('Supabase update error:', dbErr);
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(200).send('OK');
  }
}
