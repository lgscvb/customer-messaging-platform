import User, { UserRole } from '../../models/User';
import authService, { RegisterData } from '../../services/auth-service';

/**
 * 創建測試用戶
 * @returns 創建的測試用戶
 */
export async function createTestUser(): Promise<User> {
  const testUser: RegisterData = {
    username: `test-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ADMIN
  };

  const result = await authService.register(testUser);
  return await User.findByPk(result.user.id) as User;
}

/**
 * 獲取認證令牌
 * @param username 用戶名
 * @param password 用戶密碼
 * @returns JWT 令牌
 */
export async function getAuthToken(username: string, password: string): Promise<string> {
  const result = await authService.login({ username, password });
  return result.token;
}