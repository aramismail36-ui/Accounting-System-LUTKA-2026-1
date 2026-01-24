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
  tuitionFee: decimal("tuition_fee", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).default("0").notNull(),
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

// Financial Report Types (Page 7)
export type FinancialReport = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  month: string;
};
