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
    // Check if order exists and is in 'created' status (or 'claimed' if that's the stage before customer awards)
    // Adjust the allowed statuses based on your specific business logic for when quotes can be submitted
    const order = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, status FROM orders WHERE id = ? AND status IN ('created', 'claimed')`, // Allow quoting for both created and claimed orders
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
      console.log("Order not found or not in a status allowing quotes (e.g., 'created', 'claimed'):", orderId);
      return {
        status: 404, // Not Found or Conflict
        body: { success: false, error: 'ORDER_NOT_FOUND_OR_NOT_QUOTABLE' }
      };
    }

    // Optional: Check if this carrier has already quoted for this order
    // This depends on whether multiple quotes per carrier per order are allowed
    const existingQuote = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM quotes WHERE order_id = ? AND carrier_id = ?`,
        [orderId, carrierTenantId],
        (err, row) => {
          if (err) {
            console.error('Database error checking existing quote:', err.message);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (existingQuote) {
      console.log("Carrier (tenantId:", carrierTenantId, ") has already quoted for order:", orderId);
      return {
        status: 409, // Conflict
        body: { success: false, error: 'CARRIER_HAS_ALREADY_QUOTED_FOR_THIS_ORDER' }
      };
    }

    // Insert the quote into the quotes table
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO quotes (order_id, carrier_id, amount, estimated_delivery_time, remarks, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`, // Default status for quote is 'pending'
        [orderId, carrierTenantId, price, deliveryTime, remarks || null], // Use null for empty remarks
        function (err) {
          if (err) {
            console.error('Database error inserting quote:', err.message);
            reject(err);
          } else {
            console.log("Successfully inserted quote for order ID:", orderId, "by carrier ID:", carrierTenantId);
            resolve();
          }
        }
      );
    });

    // Do NOT update the main orders table status here

    return {
      status: 201, // Created - Successfully created a quote record
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
            carrierId: carrierTenantId
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