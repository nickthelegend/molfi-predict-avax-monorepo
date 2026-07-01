import { supabase } from "@/integrations/supabase/db";
import { SignedOrder } from "@/types/eip712";

/**
 * Submit a signed order to the backend
 */
export async function submitOrder(signedOrder: SignedOrder) {
  try {
    const { data, error } = await supabase.functions.invoke('submit-order', {
      body: {
        order: {
          maker: signedOrder.maker,
          marketId: signedOrder.marketId,
          outcome: signedOrder.outcome,
          price: signedOrder.price,
          size: signedOrder.size,
          nonce: signedOrder.nonce,
          expiry: signedOrder.expiry,
        },
        signature: signedOrder.signature,
      },
    });

    if (error) {
      console.error('Error submitting order:', error);
      throw new Error(error.message || 'Failed to submit order');
    }

    return data;
  } catch (error: any) {
    console.error('Error in submitOrder:', error);
    throw error;
  }
}

/**
 * Fetch orders for a specific market
 */
export async function fetchMarketOrders(marketId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in fetchMarketOrders:', error);
    throw error;
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, makerAddress: string) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('maker_address', makerAddress.toLowerCase());

    if (error) {
      console.error('Error cancelling order:', error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in cancelOrder:', error);
    throw error;
  }
}

/**
 * Fetch user's orders
 */
export async function fetchUserOrders(makerAddress: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('maker_address', makerAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in fetchUserOrders:', error);
    throw error;
  }
}
