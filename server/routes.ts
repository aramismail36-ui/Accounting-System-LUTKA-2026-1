import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // School Settings
  app.get(api.schoolSettings.get.path, async (req, res) => {
    const settings = await storage.getSchoolSettings();
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    res.json(settings);
  });

  app.post(api.schoolSettings.update.path, async (req, res) => {
    try {
      const input = api.schoolSettings.update.input.parse(req.body);
      const settings = await storage.updateSchoolSettings(input);
      res.status(200).json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Students
  app.get(api.students.list.path, async (req, res) => {
    const students = await storage.getStudents();
    res.json(students);
  });

  app.get(api.students.get.path, async (req, res) => {
    const student = await storage.getStudent(Number(req.params.id));
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  });

  app.post(api.students.create.path, async (req, res) => {
    try {
      const bodySchema = api.students.create.input.extend({
        tuitionFee: z.coerce.number(),
        paidAmount: z.coerce.number().optional(),
        remainingAmount: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      
      // Calculate remaining if not provided
      if (input.paidAmount === undefined) input.paidAmount = 0;
      if (input.remainingAmount === undefined) input.remainingAmount = input.tuitionFee - input.paidAmount;

      // Convert back to string for decimal storage if needed, but schema expects number/string union usually or check your schema.
      // My schema uses createInsertSchema which handles types, but decimal in zod-drizzle comes as string or number depending on config.
      // Let's assume input matches schema. If schema is decimal, it might expect string or number.
      // Safe to cast to string for decimal columns in generic zod schema
      
      const student = await storage.createStudent({
        ...input,
        tuitionFee: String(input.tuitionFee),
        paidAmount: String(input.paidAmount),
        remainingAmount: String(input.remainingAmount)
      });
      res.status(201).json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.students.update.path, async (req, res) => {
    try {
        const bodySchema = api.students.update.input.extend({
            tuitionFee: z.coerce.number().optional(),
            paidAmount: z.coerce.number().optional(),
            remainingAmount: z.coerce.number().optional(),
        });
      const input = bodySchema.parse(req.body);
      const stringInput: any = { ...input };
      if (input.tuitionFee !== undefined) stringInput.tuitionFee = String(input.tuitionFee);
      if (input.paidAmount !== undefined) stringInput.paidAmount = String(input.paidAmount);
      if (input.remainingAmount !== undefined) stringInput.remainingAmount = String(input.remainingAmount);

      const student = await storage.updateStudent(Number(req.params.id), stringInput);
      res.json(student);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(404).json({ message: "Student not found" });
    }
  });

  app.delete(api.students.delete.path, async (req, res) => {
    await storage.deleteStudent(Number(req.params.id));
    res.status(204).send();
  });

  // Income
  app.get(api.income.list.path, async (req, res) => {
    const incomes = await storage.getIncomes();
    res.json(incomes);
  });

  app.post(api.income.create.path, async (req, res) => {
    try {
      const bodySchema = api.income.create.input.extend({
        amount: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const income = await storage.createIncome({ ...input, amount: String(input.amount) });
      res.status(201).json(income);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.income.delete.path, async (req, res) => {
    await storage.deleteIncome(Number(req.params.id));
    res.status(204).send();
  });

  // Expenses
  app.get(api.expenses.list.path, async (req, res) => {
    const expenses = await storage.getExpenses();
    res.json(expenses);
  });

  app.post(api.expenses.create.path, async (req, res) => {
    try {
      const bodySchema = api.expenses.create.input.extend({
        amount: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const expense = await storage.createExpense({ ...input, amount: String(input.amount) });
      res.status(201).json(expense);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
          }
      throw err;
    }
  });

  app.delete(api.expenses.delete.path, async (req, res) => {
    await storage.deleteExpense(Number(req.params.id));
    res.status(204).send();
  });

  // Payments
  app.get(api.payments.list.path, async (req, res) => {
    const payments = await storage.getPayments();
    res.json(payments);
  });

  app.post(api.payments.create.path, async (req, res) => {
    try {
      const bodySchema = api.payments.create.input.extend({
        studentId: z.coerce.number(),
        amount: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const payment = await storage.createPayment({ ...input, amount: String(input.amount) });
      res.status(201).json(payment);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
          }
      throw err;
    }
  });

  // Staff
  app.get(api.staff.list.path, async (req, res) => {
    const staff = await storage.getStaffList();
    res.json(staff);
  });

  app.post(api.staff.create.path, async (req, res) => {
    try {
      const bodySchema = api.staff.create.input.extend({
        salary: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const newStaff = await storage.createStaff({ ...input, salary: String(input.salary) });
      res.status(201).json(newStaff);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
          }
      throw err;
    }
  });

  app.delete(api.staff.delete.path, async (req, res) => {
    await storage.deleteStaff(Number(req.params.id));
    res.status(204).send();
  });

  // Salary Payments
  app.get(api.salaryPayments.list.path, async (req, res) => {
    const salaryPayments = await storage.getSalaryPayments();
    res.json(salaryPayments);
  });

  app.post(api.salaryPayments.create.path, async (req, res) => {
    try {
      const bodySchema = api.salaryPayments.create.input.extend({
        staffId: z.coerce.number(),
        amount: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      
      // Check for duplicate salary payment (same staff + same month)
      const existingPayment = await storage.getSalaryPaymentByStaffAndMonth(input.staffId, input.month);
      if (existingPayment) {
        return res.status(400).json({ 
          message: "ئەم کارمەندە پێشتر مووچەی ئەم مانگەی وەرگرتووە" 
        });
      }
      
      const payment = await storage.createSalaryPayment({ ...input, amount: String(input.amount) });
      res.status(201).json(payment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.salaryPayments.delete.path, async (req, res) => {
    await storage.deleteSalaryPayment(Number(req.params.id));
    res.status(204).send();
  });

  // Reports
  app.get(api.reports.monthly.path, async (req, res) => {
    const now = new Date();
    const report = await storage.getMonthlyReport(now);
    res.json({
      ...report,
      month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }) // Or localized
    });
  });

  // SEED DATA
  const existingStudents = await storage.getStudents();
  if (existingStudents.length === 0) {
    console.log("Seeding database...");
    
    // Create School Settings
    await storage.updateSchoolSettings({
      schoolName: "قوتابخانەی لوتکەی ناحکومی",
      email: "info@lutka.edu.iq",
      password: "admin"
    });

    // Create Students
    const student1 = await storage.createStudent({
      fullName: "محەمەد ئەحمەد کەریم",
      mobile: "07701234567",
      grade: "پۆلی شەشەم",
      tuitionFee: "1500000",
      paidAmount: "500000",
      remainingAmount: "1000000"
    });
    
    await storage.createStudent({
      fullName: "سارە عەلی حەسەن",
      mobile: "07501234567",
      grade: "پۆلی حەوتەم",
      tuitionFee: "1500000",
      paidAmount: "1500000",
      remainingAmount: "0"
    });

    // Create Staff
    await storage.createStaff({
      fullName: "کاروان عوسمان",
      mobile: "07709876543",
      role: "مامۆستا",
      salary: "800000"
    });

    await storage.createStaff({
        fullName: "نیان جەمال",
        mobile: "07509876543",
        role: "سەرپەرشتیار",
        salary: "1000000"
    });

    // Create Income
    await storage.createIncome({
      source: "فرۆشتنی جلوبەرگ",
      amount: "250000",
      date: new Date().toISOString().split('T')[0],
      description: "فرۆشتنی 10 پارچە جلوبەرگ"
    });

    // Create Expenses
    await storage.createExpense({
      category: "کارەبا",
      amount: "150000",
      date: new Date().toISOString().split('T')[0],
      description: "پسوڵەی کارەبای مانگی 1"
    });

    // Create Payment
    await storage.createPayment({
      studentId: student1.id,
      amount: "250000",
      date: new Date().toISOString().split('T')[0]
    });

    console.log("Database seeded successfully!");
  }

  return httpServer;
}
