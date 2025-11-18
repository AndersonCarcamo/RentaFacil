/**
 * API Route: Create Charge with Culqi
 * Processes payment and creates charge
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCulqiConfig } from '../../../lib/config/culqi';

interface ChargeRequest {
  token_id: string;
  amount: number; // in cents
  email: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface ChargeResponse {
  id: string;
  amount: number;
  currency_code: string;
  email: string;
  creation_date: number;
  outcome: {
    type: string;
    merchant_message: string;
    user_message: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token_id, amount, email, description, metadata }: ChargeRequest = req.body;

    if (!token_id || !amount || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: token_id, amount, email' 
      });
    }

    const config = getCulqiConfig();

    // Create charge with Culqi API
    const response = await fetch(`${config.baseUrl}/v2/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency_code: 'PEN',
        email,
        source_id: token_id,
        description: description || 'Suscripción EasyRent',
        metadata: {
          ...metadata,
          order_id: `ORDER-${Date.now()}`,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Culqi API error:', errorData);
      
      return res.status(response.status).json({
        error: 'Payment failed',
        details: errorData,
      });
    }

    const charge: ChargeResponse = await response.json();

    // Check if charge was successful
    if (charge.outcome.type !== 'venta_exitosa') {
      return res.status(400).json({
        error: 'Charge unsuccessful',
        message: charge.outcome.user_message,
        merchant_message: charge.outcome.merchant_message,
      });
    }

    // TODO: Save charge to database
    // await saveChargeToDatabase(charge, metadata);

    return res.status(200).json({
      success: true,
      charge_id: charge.id,
      amount: charge.amount,
      currency: charge.currency_code,
      email: charge.email,
      outcome: charge.outcome,
    });

  } catch (error) {
    console.error('Charge error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
