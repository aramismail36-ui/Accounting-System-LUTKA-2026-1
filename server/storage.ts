import { db } from "./db";
import { eq, sql, and, gte, lte, desc, ne } from "drizzle-orm";
import { 
  schoolSettings, students, income, expenses, payments, staff, salaryPayments, foodPayments, shareholders, users, fiscalYears,
  type InsertSchoolSettings, type SchoolSettings,
  type InsertStudent, type Student,
  type InsertIncome, type Income,
  type InsertExpense, type Expense,
  type InsertPayment, type Payment,
  type InsertStaff, type Staff,
  type InsertSalaryPayment, type SalaryPayment,
  type InsertFoodPayment, type FoodPayment,
  type InsertShareholder, type Shareholder,
  type InsertFiscalYear, type FiscalYear,
  type User
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
  promoteAllGrades(): Promise<number>;

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

  // Shareholders
  getShareholders(): Promise<Shareholder[]>;
  getShareholder(id: number): Promise<Shareholder | undefined>;
  createShareholder(shareholder: InsertShareholder): Promise<Shareholder>;
  updateShareholder(id: number, shareholder: Partial<InsertShareholder>): Promise<Shareholder>;
  deleteShareholder(id: number): Promise<void>;

  // Users
  getUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Reports
  getMonthlyReport(month: Date): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  }>;

  // Fiscal Years
  getFiscalYears(): Promise<FiscalYear[]>;
  getCurrentFiscalYear(): Promise<FiscalYear | undefined>;
  createFiscalYear(fiscalYear: InsertFiscalYear): Promise<FiscalYear>;
  setCurrentFiscalYear(id: number): Promise<FiscalYear>;
  closeFiscalYear(id: number): Promise<{ promotedStudents: number; newYear: string }>;
  reopenFiscalYear(id: number): Promise<FiscalYear>;
  deleteFiscalYear(id: number): Promise<void>;
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
    return await db.select().from(students).orderBy(students.grade, students.fullName);
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

  async promoteAllGrades(): Promise<number> {
    // Convert Arabic-Indic/Kurdish numerals to ASCII
    const normalizeDigits = (str: string): string => {
      const arabicIndicMap: Record<string, string> = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
      };
      return str.replace(/[٠-٩۰-۹]/g, (char) => arabicIndicMap[char] || char);
    };

    // Convert ASCII digit back to Arabic-Indic
    const toArabicIndic = (num: number): string => {
      const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return String(num).split('').map(d => arabicNumerals[parseInt(d, 10)]).join('');
    };

    // Get all students
    const allStudents = await db.select().from(students);
    let promotedCount = 0;

    for (const student of allStudents) {
      const currentGrade = student.grade || "";
      let newGrade = currentGrade;

      // Check for Arabic-Indic numerals (١, ٢, ٣, etc.)
      const arabicIndicMatch = currentGrade.match(/[٠-٩۰-۹]+/);
      if (arabicIndicMatch) {
        const normalizedNum = normalizeDigits(arabicIndicMatch[0]);
        const currentNum = parseInt(normalizedNum, 10);
        const nextNum = currentNum + 1;
        newGrade = currentGrade.replace(/[٠-٩۰-۹]+/, toArabicIndic(nextNum));
      } else {
        // Try to extract and increment ASCII numeric grade
        const numericMatch = currentGrade.match(/(\d+)/);
        if (numericMatch) {
          const currentNum = parseInt(numericMatch[1], 10);
          const nextNum = currentNum + 1;
          newGrade = currentGrade.replace(/\d+/, String(nextNum));
        } else {
          // Handle Kurdish ordinal grades (پۆلی یەکەم, پۆلی دووەم, etc.)
          const kurdishOrdinals: Record<string, string> = {
            'یەکەم': 'دووەم',
            'دووەم': 'سێیەم',
            'سێیەم': 'چوارەم',
            'چوارەم': 'پێنجەم',
            'پێنجەم': 'شەشەم',
            'شەشەم': 'حەوتەم',
            'حەوتەم': 'هەشتەم',
            'هەشتەم': 'نۆیەم',
            'نۆیەم': 'دەیەم',
            'دەیەم': 'یازدەیەم',
            'یازدەیەم': 'دوازدەیەم',
          };

          for (const [current, next] of Object.entries(kurdishOrdinals)) {
            if (currentGrade.includes(current)) {
              newGrade = currentGrade.replace(current, next);
              break;
            }
          }
        }
      }

      if (newGrade !== currentGrade) {
        // Calculate debt from this year (remaining unpaid amount)
        const currentDebt = Number(student.remainingAmount) || 0;
        // Add any existing previous year debt to current remaining
        const existingPreviousDebt = Number(student.previousYearDebt) || 0;
        const totalDebt = currentDebt + existingPreviousDebt;
        
        await db.update(students).set({ 
          grade: newGrade,
          // Move remaining amount to previous year debt
          previousYearDebt: String(totalDebt),
          // Reset for new year
          paidAmount: "0",
          remainingAmount: student.tuitionFee, // Full tuition for new year
        }).where(eq(students.id, student.id));
        promotedCount++;
      }
    }

    return promotedCount;
  }

  // Income - only show current year (records without fiscalYear tag)
  async getIncomes(): Promise<Income[]> {
    return await db.select().from(income)
      .where(sql`${income.fiscalYear} IS NULL OR ${income.fiscalYear} = ''`)
      .orderBy(income.date);
  }

  async getIncomesByFiscalYear(fiscalYear: string): Promise<Income[]> {
    return await db.select().from(income)
      .where(eq(income.fiscalYear, fiscalYear))
      .orderBy(income.date);
  }

  async createIncome(insertIncome: InsertIncome): Promise<Income> {
    const [newIncome] = await db.insert(income).values(insertIncome).returning();
    return newIncome;
  }

  async deleteIncome(id: number): Promise<void> {
    await db.delete(income).where(eq(income.id, id));
  }

  // Expenses - only show current year (records without fiscalYear tag)
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(sql`${expenses.fiscalYear} IS NULL OR ${expenses.fiscalYear} = ''`)
      .orderBy(expenses.date);
  }

  async getExpensesByFiscalYear(fiscalYear: string): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(eq(expenses.fiscalYear, fiscalYear))
      .orderBy(expenses.date);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(insertExpense).returning();
    return newExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Payments - only show current year (records without fiscalYear tag)
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(sql`${payments.fiscalYear} IS NULL OR ${payments.fiscalYear} = ''`)
      .orderBy(payments.date);
  }

  async getPaymentsByFiscalYear(fiscalYear: string): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.fiscalYear, fiscalYear))
      .orderBy(payments.date);
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

  // Salary Payments - only show current year (records without fiscalYear tag)
  async getSalaryPayments(): Promise<SalaryPayment[]> {
    return await db.select().from(salaryPayments)
      .where(sql`${salaryPayments.fiscalYear} IS NULL OR ${salaryPayments.fiscalYear} = ''`)
      .orderBy(salaryPayments.date);
  }

  async getSalaryPaymentsByFiscalYear(fiscalYear: string): Promise<SalaryPayment[]> {
    return await db.select().from(salaryPayments)
      .where(eq(salaryPayments.fiscalYear, fiscalYear))
      .orderBy(salaryPayments.date);
  }

  async getSalaryPaymentByStaffAndMonth(staffId: number, month: string): Promise<SalaryPayment | undefined> {
    const [payment] = await db.select().from(salaryPayments)
      .where(and(
        eq(salaryPayments.staffId, staffId), 
        eq(salaryPayments.month, month),
        sql`${salaryPayments.fiscalYear} IS NULL OR ${salaryPayments.fiscalYear} = ''`
      ));
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

  // Food Payments - only show current year (records without fiscalYear tag)
  async getFoodPayments(): Promise<FoodPayment[]> {
    return await db.select().from(foodPayments)
      .where(sql`${foodPayments.fiscalYear} IS NULL OR ${foodPayments.fiscalYear} = ''`)
      .orderBy(foodPayments.date);
  }

  async getFoodPaymentsByFiscalYear(fiscalYear: string): Promise<FoodPayment[]> {
    return await db.select().from(foodPayments)
      .where(eq(foodPayments.fiscalYear, fiscalYear))
      .orderBy(foodPayments.date);
  }

  async getFoodPaymentByStudentAndMonth(studentId: number, month: string): Promise<FoodPayment | undefined> {
    const [payment] = await db.select().from(foodPayments)
      .where(and(
        eq(foodPayments.studentId, studentId), 
        eq(foodPayments.month, month),
        sql`${foodPayments.fiscalYear} IS NULL OR ${foodPayments.fiscalYear} = ''`
      ));
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

  // Shareholders
  async getShareholders(): Promise<Shareholder[]> {
    return await db.select().from(shareholders).orderBy(shareholders.fullName);
  }

  async getShareholder(id: number): Promise<Shareholder | undefined> {
    const [shareholder] = await db.select().from(shareholders).where(eq(shareholders.id, id));
    return shareholder;
  }

  async createShareholder(insertShareholder: InsertShareholder): Promise<Shareholder> {
    const [shareholder] = await db.insert(shareholders).values(insertShareholder).returning();
    return shareholder;
  }

  async updateShareholder(id: number, shareholder: Partial<InsertShareholder>): Promise<Shareholder> {
    const [updated] = await db.update(shareholders).set(shareholder).where(eq(shareholders.id, id)).returning();
    return updated;
  }

  async deleteShareholder(id: number): Promise<void> {
    await db.delete(shareholders).where(eq(shareholders.id, id));
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

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName);
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Fiscal Years
  async getFiscalYears(): Promise<FiscalYear[]> {
    return await db.select().from(fiscalYears).orderBy(desc(fiscalYears.createdAt));
  }

  async getCurrentFiscalYear(): Promise<FiscalYear | undefined> {
    const [current] = await db.select().from(fiscalYears).where(eq(fiscalYears.isCurrent, true)).limit(1);
    return current;
  }

  async createFiscalYear(fiscalYear: InsertFiscalYear): Promise<FiscalYear> {
    // If this is set as current, unset any existing current year
    if (fiscalYear.isCurrent) {
      await db.update(fiscalYears).set({ isCurrent: false }).where(eq(fiscalYears.isCurrent, true));
    }
    const [newYear] = await db.insert(fiscalYears).values(fiscalYear).returning();
    return newYear;
  }

  async setCurrentFiscalYear(id: number): Promise<FiscalYear> {
    // Check if the fiscal year exists
    const [year] = await db.select().from(fiscalYears).where(eq(fiscalYears.id, id));
    if (!year) {
      throw new Error("NOT_FOUND:ساڵی دارایی نەدۆزرایەوە");
    }
    if (year.isClosed) {
      throw new Error("VALIDATION:ناتوانرێت ساڵێکی داخراو وەک ساڵی ئێستا دابنرێت");
    }
    // Unset any existing current year
    await db.update(fiscalYears).set({ isCurrent: false }).where(eq(fiscalYears.isCurrent, true));
    // Set the new current year
    const [updated] = await db.update(fiscalYears).set({ isCurrent: true }).where(eq(fiscalYears.id, id)).returning();
    return updated;
  }

  async closeFiscalYear(id: number): Promise<{ promotedStudents: number; newYear: string }> {
    // Get the fiscal year
    const [year] = await db.select().from(fiscalYears).where(eq(fiscalYears.id, id));
    if (!year) {
      throw new Error("NOT_FOUND:Fiscal year not found");
    }

    if (year.isClosed) {
      throw new Error("VALIDATION:This fiscal year is already closed");
    }

    // Archive all financial records (income, expenses, payments, salary, food) to this fiscal year
    // This marks them as belonging to the closing year for historical record
    await db.update(income).set({ fiscalYear: year.year }).where(sql`${income.fiscalYear} IS NULL OR ${income.fiscalYear} = ''`);
    await db.update(expenses).set({ fiscalYear: year.year }).where(sql`${expenses.fiscalYear} IS NULL OR ${expenses.fiscalYear} = ''`);
    await db.update(payments).set({ fiscalYear: year.year }).where(sql`${payments.fiscalYear} IS NULL OR ${payments.fiscalYear} = ''`);
    await db.update(salaryPayments).set({ fiscalYear: year.year }).where(sql`${salaryPayments.fiscalYear} IS NULL OR ${salaryPayments.fiscalYear} = ''`);
    await db.update(foodPayments).set({ fiscalYear: year.year }).where(sql`${foodPayments.fiscalYear} IS NULL OR ${foodPayments.fiscalYear} = ''`);
    
    // Archive student records to this fiscal year
    await db.update(students).set({ fiscalYear: year.year }).where(sql`${students.fiscalYear} IS NULL OR ${students.fiscalYear} = ''`);

    // Promote all students - this handles:
    // 1. Moving remainingAmount to previousYearDebt
    // 2. Resetting paidAmount to 0
    // 3. Setting remainingAmount to full tuitionFee
    // 4. Incrementing the grade
    const promotedStudents = await this.promoteAllGrades();

    // Mark the year as closed
    await db.update(fiscalYears).set({ 
      isClosed: true, 
      isCurrent: false,
      closedAt: new Date() 
    }).where(eq(fiscalYears.id, id));

    // Calculate and auto-create the next fiscal year
    const [startYear, endYear] = year.year.split('-').map(y => parseInt(y, 10));
    const nextYearStr = `${endYear}-${endYear + 1}`;
    const nextStartDate = `${endYear}-09-01`;
    const nextEndDate = `${endYear + 1}-08-31`;

    // Check if next year already exists
    const [existingNextYear] = await db.select().from(fiscalYears).where(eq(fiscalYears.year, nextYearStr));
    if (!existingNextYear) {
      // Create new fiscal year and set as current
      await db.insert(fiscalYears).values({
        year: nextYearStr,
        startDate: nextStartDate,
        endDate: nextEndDate,
        isCurrent: true,
        isClosed: false,
      });
    } else if (!existingNextYear.isCurrent) {
      // Set existing next year as current
      await db.update(fiscalYears).set({ isCurrent: true }).where(eq(fiscalYears.id, existingNextYear.id));
    }

    return { promotedStudents, newYear: nextYearStr };
  }

  async reopenFiscalYear(id: number): Promise<FiscalYear> {
    const [year] = await db.select().from(fiscalYears).where(eq(fiscalYears.id, id));
    if (!year) {
      throw new Error("NOT_FOUND:ساڵی دارایی نەدۆزرایەوە");
    }
    if (!year.isClosed) {
      throw new Error("VALIDATION:ئەم ساڵە پێشتر داخراو نییە");
    }

    // Reopen the fiscal year
    const [reopened] = await db.update(fiscalYears)
      .set({ 
        isClosed: false,
        closedAt: null
      })
      .where(eq(fiscalYears.id, id))
      .returning();

    return reopened;
  }

  async deleteFiscalYear(id: number): Promise<void> {
    const [year] = await db.select().from(fiscalYears).where(eq(fiscalYears.id, id));
    if (!year) {
      throw new Error("NOT_FOUND:ساڵی دارایی نەدۆزرایەوە");
    }
    if (year.isClosed) {
      throw new Error("VALIDATION:ناتوانرێت ساڵێکی داخراو بسڕدرێتەوە");
    }
    await db.delete(fiscalYears).where(eq(fiscalYears.id, id));
  }
}

export const storage = new DatabaseStorage();
