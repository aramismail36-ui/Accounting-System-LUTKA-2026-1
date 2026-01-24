import { db } from "./db";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { 
  schoolSettings, students, income, expenses, payments, staff, salaryPayments, foodPayments,
  type InsertSchoolSettings, type SchoolSettings,
  type InsertStudent, type Student,
  type InsertIncome, type Income,
  type InsertExpense, type Expense,
  type InsertPayment, type Payment,
  type InsertStaff, type Staff,
  type InsertSalaryPayment, type SalaryPayment,
  type InsertFoodPayment, type FoodPayment
} from "@shared/schema";

export interface IStorage {
  // School Settings
  getSchoolSettings(): Promise<SchoolSettings | undefined>;
  updateSchoolSettings(settings: InsertSchoolSettings): Promise<SchoolSettings>;

  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  // Income
  getIncomes(): Promise<Income[]>;
  createIncome(income: InsertIncome): Promise<Income>;
  deleteIncome(id: number): Promise<void>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Payments
  getPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Staff
  getStaffList(): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  deleteStaff(id: number): Promise<void>;

  // Salary Payments
  getSalaryPayments(): Promise<SalaryPayment[]>;
  getSalaryPaymentByStaffAndMonth(staffId: number, month: string): Promise<SalaryPayment | undefined>;
  createSalaryPayment(payment: InsertSalaryPayment): Promise<SalaryPayment>;
  deleteSalaryPayment(id: number): Promise<void>;

  // Food Payments
  getFoodPayments(): Promise<FoodPayment[]>;
  getFoodPaymentByStudentAndMonth(studentId: number, month: string): Promise<FoodPayment | undefined>;
  createFoodPayment(payment: InsertFoodPayment): Promise<FoodPayment>;
  deleteFoodPayment(id: number): Promise<void>;

  // Reports
  getMonthlyReport(month: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // School Settings
  async getSchoolSettings(): Promise<SchoolSettings | undefined> {
    const [settings] = await db.select().from(schoolSettings).limit(1);
    return settings;
  }

  async updateSchoolSettings(insertSettings: InsertSchoolSettings): Promise<SchoolSettings> {
    // Check if exists, if not insert, if yes update
    const existing = await this.getSchoolSettings();
    if (existing) {
      const [updated] = await db
        .update(schoolSettings)
        .set({ ...insertSettings, updatedAt: new Date() })
        .where(eq(schoolSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(schoolSettings)
        .values(insertSettings)
        .returning();
      return created;
    }
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(students.id);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student> {
    const [student] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Income
  async getIncomes(): Promise<Income[]> {
    return await db.select().from(income).orderBy(income.date);
  }

  async createIncome(insertIncome: InsertIncome): Promise<Income> {
    const [newIncome] = await db.insert(income).values(insertIncome).returning();
    return newIncome;
  }

  async deleteIncome(id: number): Promise<void> {
    await db.delete(income).where(eq(income.id, id));
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(expenses.date);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(insertExpense).returning();
    return newExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(payments.date);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    
    // Update student's paid/remaining amount
    const student = await this.getStudent(insertPayment.studentId);
    if (student) {
      const currentPaid = Number(student.paidAmount) || 0;
      const paymentAmount = Number(insertPayment.amount) || 0;
      const totalFee = Number(student.tuitionFee) || 0;
      
      const newPaid = currentPaid + paymentAmount;
      const newRemaining = totalFee - newPaid;

      await this.updateStudent(insertPayment.studentId, {
        paidAmount: newPaid.toString(),
        remainingAmount: newRemaining.toString(),
      });
    }

    // Also add to Income table as "Tuition Payment"
    await this.createIncome({
      source: "Tuition Payment - Student ID " + insertPayment.studentId,
      amount: insertPayment.amount,
      date: insertPayment.date,
      description: "Payment from student ID " + insertPayment.studentId
    });

    return payment;
  }

  // Staff
  async getStaffList(): Promise<Staff[]> {
    return await db.select().from(staff).orderBy(staff.id);
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(insertStaff).returning();
    return newStaff;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  // Salary Payments
  async getSalaryPayments(): Promise<SalaryPayment[]> {
    return await db.select().from(salaryPayments).orderBy(salaryPayments.date);
  }

  async getSalaryPaymentByStaffAndMonth(staffId: number, month: string): Promise<SalaryPayment | undefined> {
    const [payment] = await db.select().from(salaryPayments)
      .where(and(eq(salaryPayments.staffId, staffId), eq(salaryPayments.month, month)));
    return payment;
  }

  async createSalaryPayment(insertPayment: InsertSalaryPayment): Promise<SalaryPayment> {
    const [payment] = await db.insert(salaryPayments).values(insertPayment).returning();
    
    // Also add to Expenses table as salary expense
    await this.createExpense({
      category: "مووچە",
      amount: insertPayment.amount,
      date: insertPayment.date,
      description: `مووچەی مانگی ${insertPayment.month} - کارمەند ${insertPayment.staffId}`
    });

    return payment;
  }

  async deleteSalaryPayment(id: number): Promise<void> {
    await db.delete(salaryPayments).where(eq(salaryPayments.id, id));
  }

  // Food Payments
  async getFoodPayments(): Promise<FoodPayment[]> {
    return await db.select().from(foodPayments).orderBy(foodPayments.date);
  }

  async getFoodPaymentByStudentAndMonth(studentId: number, month: string): Promise<FoodPayment | undefined> {
    const [payment] = await db.select().from(foodPayments)
      .where(and(eq(foodPayments.studentId, studentId), eq(foodPayments.month, month)));
    return payment;
  }

  async createFoodPayment(insertPayment: InsertFoodPayment): Promise<FoodPayment> {
    const [payment] = await db.insert(foodPayments).values(insertPayment).returning();
    
    // Also add to Income table as food payment
    await this.createIncome({
      source: "پارەی خواردن",
      amount: insertPayment.amount,
      date: insertPayment.date,
      description: `پارەی خواردنی مانگی ${insertPayment.month} - قوتابی ${insertPayment.studentId}`
    });

    return payment;
  }

  async deleteFoodPayment(id: number): Promise<void> {
    await db.delete(foodPayments).where(eq(foodPayments.id, id));
  }

  // Reports
  async getMonthlyReport(monthDate: Date): Promise<{ totalIncome: number; totalExpenses: number; netProfit: number }> {
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    // Sum Income
    const incomeResult = await db
      .select({ total: sql<string>`sum(${income.amount})` })
      .from(income)
      .where(and(gte(income.date, startOfMonth.toISOString()), lte(income.date, endOfMonth.toISOString())));
    
    // Sum Expenses
    const expenseResult = await db
      .select({ total: sql<string>`sum(${expenses.amount})` })
      .from(expenses)
      .where(and(gte(expenses.date, startOfMonth.toISOString()), lte(expenses.date, endOfMonth.toISOString())));

    const totalIncome = Number(incomeResult[0]?.total || 0);
    const totalExpenses = Number(expenseResult[0]?.total || 0);
    const netProfit = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netProfit };
  }
}

export const storage = new DatabaseStorage();
