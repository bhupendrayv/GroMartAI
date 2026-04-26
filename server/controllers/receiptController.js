const Receipt = require('../models/Receipt');
const Item = require('../models/Item');

exports.getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ createdBy: req.user.id })
                                  .sort({ createdAt: -1 });
    return res.json(receipts);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.saveReceipt = async (req, res) => {
  try {
    const { billNumber, list_id, listName, items, subtotal, tax, total, itemIds, paymentMethod } = req.body;
    console.log(`📥 Received bill save request for: ${billNumber}`);
    
    // Check if receipt already exists
    const existing = await Receipt.findOne({ billNumber });
    if (existing) {
      console.log(`ℹ️ Bill already exists: ${billNumber}`);
      return res.status(200).json(existing);
    }

    const receipt = new Receipt({
      billNumber,
      list_id,
      listName,
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      createdBy: req.user.id
    });

    await receipt.save();

    // Mark items as billed so they won't appear in the next bill
    if (itemIds && itemIds.length > 0) {
      await Item.updateMany(
        { _id: { $in: itemIds } },
        { $set: { billed: true } }
      );
      console.log(`🏷️ Marked ${itemIds.length} items as billed`);
    }

    console.log(`✅ Bill saved successfully: ${billNumber}`);
    return res.status(201).json(receipt);
  } catch (error) {
    console.error(`❌ Bill save error (${req.body.billNumber}):`, error.message);
    return res.status(500).json({ error: error.message });
  }
};

exports.getReceiptByCode = async (req, res) => {
  try {
    const { billNumber } = req.params;
    const receipt = await Receipt.findOne({ billNumber });
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found. Please check the Bill Code.' });
    }

    return res.json(receipt);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
