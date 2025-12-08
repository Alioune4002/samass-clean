import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { items } = await req.json();

  const params = new URLSearchParams();
  items.forEach((item: { id: number; name: string; price: number; quantity: number }) => {
    params.append('line_items[]', JSON.stringify({
      price_data: { currency: 'eur', product_data: { name: item.name }, unit_amount: item.price },
      quantity: item.quantity,
    }));
  });
  params.append('payment_method_types[]', 'card');
  params.append('mode', 'payment');
  params.append('success_url', `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${req.headers.get('origin')}/shop`);

  const session = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `secret_key`, 
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  }).then(res => res.json());

  return NextResponse.json({ url: session.url });
} 