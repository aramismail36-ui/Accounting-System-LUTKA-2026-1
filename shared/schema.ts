import { pgTable, text, serial, integer, boolean, timestamp, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import auth models
export * from "./models/auth";

// School Settings (Page 1)
export const schoolSettings = pgTable("school_settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull(),
  email: text("email").notNull(),
  password: text("password"), // Just storing it as requested, though Replit Auth handles actual login
  logoUrl: text("logo_url"), // School logo URL
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSchoolSettingsSchema = createInsertSchema(schoolSettings);
export type InsertSchoolSettings = z.infer<typeof insertSchoolSettingsSchema>;
export type SchoolSettings = typeof schoolSettings.$inferSelect;

// Students (Page 2)
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  mobile: text("mobile").notNull(),
  grade: text("grade").default("").notNull(), // پۆل - Class/Grade
  tuitionFee: decimal("tuition_fee", { precision: 12, scale: 0 }).notNull(), // IQD - no decimals
  paidAmount: decimal("paid_amount", { precision: 12, scale: 0 }).default("0").notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 0 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students);
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Income (Page 3)
export const income = pgTable("income", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(), // e.g., Uniforms
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").defaultNow().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIncomeSchema = createInsertSchema(income);
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type Income = typeof income.$inferSelect;

// Expenses (Page 4)
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // e.g., Water, Electricity
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").defaultNow().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses);
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Installments/Payments (Page 5)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(), // Foreign key to students handled in app logic or DB
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments);
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Staff (Page 6)
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  mobile: text("mobile").notNull(),
  role: text("role").notNull(), // Teacher, Supervisor, Cleaner, etc.
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staff);
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

// Salary Payments (Staff Salary Disbursement)
export const salaryPayments = pgTable("salary_payments", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 0 }).notNull(),
  month: text("month").notNull(), // e.g., "2026-01" for January 2026
  date: date("date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalaryPaymentSchema = createInsertSchema(salaryPayments);
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;
export type SalaryPayment = typeof salaryPayments.$inferSelect;

// Food Payments (پارەی خواردن)
export const foodPayments = pgTable("food_payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: text("month").notNull(), // e.g., "2026-01" for January 2026
  date: date("date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFoodPaymentSchema = createInsertSchema(foodPayments).omit({ id: true, createdAt: true });
export type InsertFoodPayment = z.infer<typeof insertFoodPaymentSchema>;
export type FoodPayment = typeof foodPayments.$inferSelect;

// Shareholders (خاوەن پشکەکان)
export const shareholders = pgTable("shareholders", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  mobile: text("mobile").notNull(),
  sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }).notNull(), // Percentage (e.g., 25.50 = 25.5%)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShareholderSchema = createInsertSchema(shareholders).omit({ id: true, createdAt: true });
export type InsertShareholder = z.infer<typeof insertShareholderSchema>;
export type Shareholder = typeof shareholders.$inferSelect;

// Financial Report Types (Page 7)
export type FinancialReport = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  month: string;
};
