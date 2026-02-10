import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedCartItem } from '@/hooks/useCart';

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

interface OrderItem {
  itemType: 'beat' | 'sound_kit';
  beatId?: string;
  beatTitle?: string;
  licenseTierId?: string;
  licenseName?: string;
  soundKitId?: string;
  soundKitTitle?: string;
  price: number;
}

export function usePayPal() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (
    items: UnifiedCartItem[],
    customerEmail: string,
    customerName?: string,
    discountCode?: string | null,
    discountAmt?: number
  ): Promise<PayPalOrderResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const orderItems: OrderItem[] = items.map((item) => {
        if (item.itemType === 'beat' && item.beat && item.license) {
          return {
            itemType: 'beat',
            beatId: item.beat.id,
            beatTitle: item.beat.title,
            licenseTierId: item.license.id,
            licenseName: item.license.name,
            price: item.license.price,
          };
        } else if (item.itemType === 'sound_kit' && item.soundKit) {
          return {
            itemType: 'sound_kit',
            soundKitId: item.soundKit.id,
            soundKitTitle: item.soundKit.title,
            price: item.soundKit.price,
          };
        }
        throw new Error('Invalid cart item');
      });

      const { data, error: invokeError } = await supabase.functions.invoke(
        'create-paypal-order',
        {
          body: {
            items: orderItems,
            customerEmail,
            customerName,
            discountCode: discountCode || null,
            discountAmount: discountAmt || 0,
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
