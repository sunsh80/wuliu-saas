// backend/api/handlers/carrier/quote/submitCarrierQuote.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => { // Use 'c' for consistency with openapi-backend context
  try {
    console.log("Handler function 'submitCarrierQuote' called.");
    console.log("Context received:", c.request.path, c.user); // Log the user context

    // --- CRITICAL FIX: Use c.context?.id instead of req.user ---
    const userId = c.context?.id; // Get user ID from c.user
    console.log("Received request to submit quote for user ID:", userId);

    if (!userId) {
      console.log("User ID not found in context (c.user). Authentication might have failed.");
      return {
        status: 401, // Unauthorized
        body: { success: false, error: 'UNAUTHORIZED' }
      };
    }

    // Extract data from the request body
    const { price, deliveryTime, remarks } = c.request.body;

    // Validate input
    if (typeof price !== 'number' || price <= 0) {
      console.log("Invalid price in request body:", price);
      return {
        status: 400, // Bad Request
        body: { success: false, error: 'INVALID_PRICE' }
      };
    }

    if (typeof deliveryTime !== 'string' || !deliveryTime.trim()) {
      console.log("Invalid deliveryTime in request body:", deliveryTime);
      return {
        status: 400, // Bad Request
        body: { success: false, error: 'INVALID_DELIVERY_TIME' }
      };
    }

    // Validate remarks if present
    if (remarks && typeof remarks !== 'string') {
      console.log("Invalid remarks in request body:", remarks);
      return {
        status: 400,
        body: { success: false, error: 'INVALID_REMARKS' }
      };
    }

    // Extract orderId from path parameters
    const orderId = c.request.params.orderId;
    if (!orderId) {
      console.log("Missing order ID in request parameters:", { orderId });
      return {
        status: 400, // Bad Request
        body: { success: false, error: 'MISSING_ORDER_ID' }
      };
    }

    const db = getDb(); // Get the database instance

    // Get tenantId from users table using userId (similar to listCarrierOrders)
    const userRecord = await new Promise((resolve, reject) => {
      db.get(
        `SELECT tenant_id FROM users WHERE id = ?`,
        [userId],
        (err, row) => {
          if (err) {
             console.error('Database error fetching tenant_id for quote submission:', err.message);
             reject(err);
          } else {
             resolve(row);
          }
        }
      );
    });
 // 直接使用上下文
if (!c.context.roles.includes('carrier')) {
  return { status: 403, body: { success: false, error: 'NOT_A_CARRIER' } };
}
const carrierTenantId = c.context.tenantId;
    // Check if order exists and is in 'pending_claim' or 'claimed' status (allowing quotes)
    const order = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, status, carrier_id FROM orders WHERE id = ? AND status IN ('pending_claim', 'claimed')`,
        [orderId],
        (err, row) => {
          if (err) {
            console.error('Database error checking order status for quote submission:', err.message);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (!order) {
      console.log("Order not found or not in a status allowing quotes (e.g., 'pending_claim', 'claimed'):", orderId);
      return {
        status: 404, // Not Found
        body: { success: false, error: 'ORDER_NOT_FOUND_OR_NOT_QUOTABLE' }
      };
    }

    // Check if this carrier is the assigned carrier (if order has a specific carrier_id)
    // If the order has a specific carrier_id, only that carrier can quote
    if (order.carrier_id && order.carrier_id != userId) {
      console.log("Order is assigned to a specific carrier. Current user cannot quote.");
      return {
        status: 403, // Forbidden
        body: { success: false, error: 'ORDER_ASSIGNED_TO_ANOTHER_CARRIER' }
      };
    }

    // Update the order with the quote information
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE orders
         SET quote_price = ?, quote_delivery_time = ?, quote_remarks = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [price, deliveryTime, remarks || null, orderId],
        function (err) {
          if (err) {
            console.error('Database error updating order with quote:', err.message);
            reject(err);
          } else {
            console.log("Successfully updated order with quote for order ID:", orderId);
            resolve();
          }
        }
      );
    });

    // Optionally update the order status to 'quoted' to indicate it has received a quote
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE orders
         SET status = 'quoted', updated_at = datetime('now')
         WHERE id = ?`,
        [orderId],
        function (err) {
          if (err) {
            console.error('Database error updating order status to quoted:', err.message);
            reject(err);
          } else {
            console.log("Successfully updated order status to quoted for order ID:", orderId);
            resolve();
          }
        }
      );
    });

    return {
      status: 201, // Created - Successfully submitted a quote
      body: {
        success: true,
        message: 'Quote submitted successfully',
        data: {
            orderId: parseInt(orderId, 10), // Ensure numeric type
            quote: {
                price: price,
                deliveryTime: deliveryTime,
                remarks: remarks || null
            },
            carrierId: userId // Return the actual user ID who quoted
        }
      }
    };

  } catch (error) {
    console.error('Error in submitCarrierQuote:', error);
    console.error('Error stack:', error.stack);

    return {
      status: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        // message: error.message
      }
    };
  }
};