const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Support both plain text and bcrypt hashed passwords in .env
    let isMatch = false;
    if (adminPassword.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, adminPassword);
    } else {
      isMatch = password === adminPassword;
    }

    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ email: adminEmail, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    res.json({
      success: true,
      token,
      admin: { email: adminEmail, role: 'admin' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = (req, res) => {
  res.json({ success: true, admin: req.admin });
};
