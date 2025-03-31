import { Customer, CustomerAttributes } from '../../models/Customer';
import { CustomerStatus } from '../../types/platform';

/**
 * 創建測試客戶
 * @returns 創建的測試客戶
 */
export async function createTestCustomer(): Promise<Customer> {
  const testCustomer = {
    name: `Test Customer ${Date.now()}`,
    email: `test-customer-${Date.now()}@example.com`,
    phone: `+886${Math.floor(900000000 + Math.random() * 100000000)}`,
    status: CustomerStatus.ACTIVE,
    metadata: {
      source: 'test',
      testData: true,
      address: '台北市信義區信義路五段7號'
    }
  };

  return await Customer.create(testCustomer);
}

/**
 * 創建多個測試客戶
 * @param count 客戶數量
 * @returns 創建的測試客戶數組
 */
export async function createTestCustomers(count: number): Promise<Customer[]> {
  const customers: Customer[] = [];
  
  for (let i = 0; i < count; i++) {
    const customer = await createTestCustomer();
    customers.push(customer);
  }
  
  return customers;
}