const ShoppingList = require('../models/ShoppingList');

// Reuse SSE notifying logic (simplified for now by reusing clients array logic)
// In a real app, I'd use a more robust event emitter or redis
const notifyGroup = (groupId, data) => {
  // Access items from global.clients or similar if shared
};

exports.getLists = async (req, res) => {
  try {
    const lists = await ShoppingList.find({ group_id: req.user.groupId });
    return res.json(lists);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createList = async (req, res) => {
  try {
    const { listName, budget } = req.body;
    const list = await ShoppingList.create({ 
      list_name: listName, 
      group_id: req.user.groupId, 
      created_by: req.user.id,
      budget: budget || 0
    });
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { budget } = req.body;
    const list = await ShoppingList.findOneAndUpdate(
      { _id: id, group_id: req.user.groupId },
      { $set: { budget: Number(budget) || 0 } },
      { returnDocument: 'after' }
    );
    if (!list) return res.status(404).json({ error: 'List not found' });
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

