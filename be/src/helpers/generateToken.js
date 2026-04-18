import jwt from 'jsonwebtoken';

// Access Token cho việc xác thực người dùng.
export const generateAuthToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.role
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Token cho việc reset mật khẩu.
export const generatePasswordResetToken = (userId) => {
  const payload = {
    userId: userId,
    purpose: 'reset-password' // Thêm mục đích để phân biệt
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Sau function generateAuthToken, thêm:
export const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    tokenType: 'refresh'
  };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};