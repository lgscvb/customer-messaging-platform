import { Model, DataTypes, Optional } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../config/database';

/**
 * 用戶角色枚舉
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  VIEWER = 'viewer',
}

/**
 * 用戶狀態枚舉
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

/**
 * 用戶屬性接口
 */
export interface UserAttributes {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  lastLoginAt: Date | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建用戶時的可選屬性
 */
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'status' | 'lastLoginAt' | 'metadata' | 'createdAt' | 'updatedAt'> {}

/**
 * 創建用戶 DTO
 */
export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 更新用戶 DTO
 */
export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 用戶登入 DTO
 */
export interface LoginUserDTO {
  username: string;
  password: string;
}

/**
 * 用戶模型類
 */
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: UserRole;
  public status!: UserStatus;
  public isActive!: boolean;
  public lastLoginAt!: Date | null;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;

  /**
   * 驗證密碼
   * @param password 密碼
   */
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  /**
   * 獲取完整姓名
   */
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * 獲取用戶資料（不包含敏感信息）
   */
  public toJSON(): any {
    const values: any = { ...this.get() };
    values.password = undefined;
    return values;
  }
}

// 初始化用戶模型
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.AGENT,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      allowNull: false,
      defaultValue: UserStatus.ACTIVE,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        name: 'users_username_idx',
        unique: true,
        fields: ['username'],
      },
      {
        name: 'users_email_idx',
        unique: true,
        fields: ['email'],
      },
      {
        name: 'users_role_idx',
        fields: ['role'],
      },
      {
        name: 'users_status_idx',
        fields: ['status'],
      },
      {
        name: 'users_is_active_idx',
        fields: ['isActive'],
      },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

/**
 * 用戶模型擴展
 */
export const UserExtension = {
  /**
   * 根據 ID 查找用戶
   * @param id 用戶 ID
   */
  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  },

  /**
   * 根據用戶名查找用戶
   * @param username 用戶名
   */
  async findByUsername(username: string): Promise<User | null> {
    return User.findOne({
      where: {
        username,
      },
    });
  },

  /**
   * 根據郵箱查找用戶
   * @param email 郵箱
   */
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({
      where: {
        email,
      },
    });
  },

  /**
   * 更新用戶
   * @param id 用戶 ID
   * @param data 更新數據
   */
  async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    const user = await User.findByPk(id);
    
    if (!user) {
      return null;
    }
    
    await user.update(data);
    return user;
  },

  /**
   * 更新用戶最後登入時間
   * @param id 用戶 ID
   */
  async updateLastLogin(id: string): Promise<User | null> {
    const user = await User.findByPk(id);
    
    if (!user) {
      return null;
    }
    
    await user.update({
      lastLoginAt: new Date(),
    });
    
    return user;
  },

  /**
   * 驗證用戶密碼
   * @param id 用戶 ID
   * @param password 密碼
   */
  async verifyPassword(id: string, password: string): Promise<boolean> {
    const user = await User.findByPk(id);
    
    if (!user) {
      return false;
    }
    
    return user.validatePassword(password);
  }
};

export default User;