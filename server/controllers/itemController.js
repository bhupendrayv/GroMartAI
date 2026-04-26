const Item = require('../models/Item');
const ShoppingList = require('../models/ShoppingList');

// Simple SSE management
let clients = [];

exports.eventsHandler = (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no' // Prevent proxy buffering
  };
  res.writeHead(200, headers);
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    userId: req.user.id,
    groupId: req.user.groupId,
    res
  };

  clients.push(newClient);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients = clients.filter(c => c.id !== clientId);
  });
};

const notifyGroup = (groupId, senderUserId = null) => {
  clients.forEach(c => {
    if (c.groupId === groupId) {
      c.res.write(`data: ${JSON.stringify({ type: 'UPDATE', senderId: senderUserId })}\n\n`);
    }
  });
};

exports.getItems = async (req, res) => {
  try {
    const { listId } = req.query; // Filter by listId
    if (!listId) return res.status(400).json({ error: 'listId is required' });
    
    // Verify the list belongs to the user's group
    const list = await ShoppingList.findOne({ _id: listId, group_id: req.user.groupId });
    if (!list) return res.status(403).json({ error: 'Access denied to this list' });
    
    const items = await Item.find({ list_id: listId, billed: false })
      .populate('added_by', 'username')
      .sort({ createdAt: -1 });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { name, quantity, category, list_id, price } = req.body;
    const item = await Item.create({ 
      name, quantity, category, list_id, price: price || 0, added_by: req.user.id 
    });
    notifyGroup(req.user.groupId, req.user.id);
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.addItemBulk = async (req, res) => {
  try {
    const { items, list_id } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Items array is required' });
    
    const itemsToCreate = items.map(item => ({
      ...item,
      list_id,
      added_by: req.user.id
    }));

    const createdItems = await Item.insertMany(itemsToCreate);
    notifyGroup(req.user.groupId, req.user.id);
    return res.json(createdItems);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    notifyGroup(req.user.groupId, req.user.id);
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    await Item.findByIdAndDelete(req.params.id);
    notifyGroup(req.user.groupId, req.user.id);
    return res.json({ message: 'Item deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
