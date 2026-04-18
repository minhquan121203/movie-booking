import CounterTransaction from "../models/counter-transaction.model.js";
import Booking from "../models/booking.model.js";

class CashService {
  /**
   * Process cash payment
   */
  async processCashPayment(paymentData) {
    const { bookingId, cashReceived, staffId } = paymentData;

    try {
      // Get booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error("Không tìm thấy booking");
      }

      const totalAmount = booking.totalAmount;

      // Validate cash received
      if (cashReceived < totalAmount) {
        throw new Error(`Số tiền nhận không đủ. Cần: ${totalAmount}đ, Nhận: ${cashReceived}đ`);
      }

      const changeGiven = cashReceived - totalAmount;

      // Update booking payment details
      booking.paymentDetails = {
        paymentMethod: "Tại quầy",
        status: "Thành công",
        amount: totalAmount,
        paymentDate: new Date(),
        transactionId: `CASH_${Date.now()}`,
        paymentInfo: JSON.stringify({
          cashReceived,
          changeGiven,
          processedBy: staffId,
        }),
      };

      booking.status = "Hoàn tất";
      await booking.save();

      return {
        success: true,
        booking,
        payment: {
          totalAmount,
          cashReceived,
          changeGiven,
          paymentMethod: "cash",
        },
      };
    } catch (error) {
      console.error("Process cash payment error:", error);
      throw error;
    }
  }

  /**
   * Calculate change
   */
  calculateChange(totalAmount, cashReceived) {
    if (cashReceived < totalAmount) {
      return {
        valid: false,
        shortage: totalAmount - cashReceived,
        message: `Thiếu ${totalAmount - cashReceived}đ`,
      };
    }

    return {
      valid: true,
      change: cashReceived - totalAmount,
      message: "Đủ tiền",
    };
  }

  /**
   * Get cash denominations for change
   */
  getCashDenominations(amount) {
    const denominations = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000];
    const result = [];
    let remaining = amount;

    for (const denom of denominations) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        result.push({
          denomination: denom,
          count,
          total: count * denom,
        });
        remaining = remaining % denom;
      }
    }

    return {
      denominations: result,
      remaining, // Số lẻ không thể trả
    };
  }

  /**
   * Validate cash transaction
   */
  async validateCashTransaction(transactionId) {
    try {
      const transaction = await CounterTransaction.findOne({
        transactionId,
        paymentMethod: "cash",
      });

      if (!transaction) {
        return {
          valid: false,
          message: "Không tìm thấy giao dịch",
        };
      }

      return {
        valid: true,
        transaction,
        message: "Giao dịch hợp lệ",
      };
    } catch (error) {
      console.error("Validate cash transaction error:", error);
      throw error;
    }
  }

  /**
   * Get cash summary for staff
   */
  async getCashSummary(staffId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const transactions = await CounterTransaction.find({
        staff: staffId,
        paymentMethod: "cash",
        status: "completed",
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      const summary = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
        totalCashReceived: transactions.reduce((sum, t) => sum + (t.cashReceived || 0), 0),
        totalChangeGiven: transactions.reduce((sum, t) => sum + (t.changeGiven || 0), 0),
        transactions: transactions.map((t) => ({
          transactionId: t.transactionId,
          time: t.createdAt,
          amount: t.totalAmount,
          cashReceived: t.cashReceived,
          changeGiven: t.changeGiven,
        })),
      };

      return summary;
    } catch (error) {
      console.error("Get cash summary error:", error);
      throw error;
    }
  }

  /**
   * Get cash drawer balance
   */
  async getCashDrawerBalance(theaterId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const transactions = await CounterTransaction.find({
        theater: theaterId,
        paymentMethod: "cash",
        status: "completed",
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      const balance = {
        openingBalance: 0, // Should be set from previous day
        totalCashIn: transactions.reduce((sum, t) => sum + t.totalAmount, 0),
        totalCashOut: transactions.reduce((sum, t) => sum + (t.changeGiven || 0), 0),
        expectedBalance: 0,
        transactionCount: transactions.length,
      };

      balance.expectedBalance = balance.openingBalance + balance.totalCashIn - balance.totalCashOut;

      return balance;
    } catch (error) {
      console.error("Get cash drawer balance error:", error);
      throw error;
    }
  }
}

const cashService = new CashService();

export default cashService;
