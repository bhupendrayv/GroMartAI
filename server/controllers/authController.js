const User = require('../models/User');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const ShoppingList = require('../models/ShoppingList');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, email, password, groupName } = req.body;
    if (!username || !email || !password || !groupName) return res.status(400).json({ error: 'All fields required' });

    const normalizedEmail = email.toLowerCase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ error: 'User with this email already exists' });

    // 1. Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email: normalizedEmail, password: hashedPassword });

    // 2. Handle Group (Create if not exists)
    let group = await Group.findOne({ group_name: groupName });
    const isNewGroup = !group;
    if (isNewGroup) {
      group = await Group.create({ group_name: groupName, created_by: user._id });
    }

    // 3. Create Group Membership
    await GroupMember.create({ 
      group_id: group._id, 
      user_id: user._id, 
      role: isNewGroup ? 'Admin' : 'Member' 
    });

    // 4. Create a default Shopping List if it's a new group
    if (isNewGroup) {
      await ShoppingList.create({ 
        list_name: 'Main List', 
        group_id: group._id, 
        created_by: user._id 
      });
    }

    const token = jwt.sign({ id: user._id, groupId: group._id }, process.env.JWT_SECRET || 'grocerio_secret_key');
    return res.json({ user, token, groupName: group.group_name });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get the user's primary group (just pick the first one for now as per simple spec)
    const membership = await GroupMember.findOne({ user_id: user._id }).populate('group_id');
    if (!membership) return res.status(404).json({ error: 'No group found for this user' });

    const token = jwt.sign({ id: user._id, groupId: membership.group_id._id }, process.env.JWT_SECRET || 'grocerio_secret_key');
    return res.json({ user, token, groupName: membership.group_id.group_name });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
