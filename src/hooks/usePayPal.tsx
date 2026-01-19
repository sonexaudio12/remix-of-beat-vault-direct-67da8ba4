import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types/beat';

interface PayPalOrderResponse {
  orderId: string;
  paypalOrderId: string;
  approvalUrl: string;
}

interface CaptureResponse {
  success: boolean;
  order: any;
  transactionId: string;
}

export function usePayPal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (
    items: CartItem[],
    customerEmail: string,
    customerName?: string
  ): Promise<PayPalOrderResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const orderItems = items.map((item) => ({
        beatId: item.beat.id,
        beatTitle: item.beat.title,
        licenseTierId: item.license.id,
        licenseName: item.license.name,
        price: item.license.price,
      }));

      const { data, error: invokeError } = await supabase.functions.invoke(
        'create-paypal-order',
        {
          body: {
            items: orderItems,
            customerEmail,
            customerName,
          },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as PayPalOrderResponse;
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const captureOrder = async (
    paypalOrderId: string,
    orderId: string
  ): Promise<CaptureResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'capture-paypal-order',
        {
          body: {
            paypalOrderId,
            orderId,
          },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as CaptureResponse;
    } catch (err: any) {
      setError(err.message || 'Failed to capture payment');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createOrder,
    captureOrder,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
