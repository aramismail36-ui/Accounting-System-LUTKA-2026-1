import { z } from 'zod';
import { 
  insertSchoolSettingsSchema, 
  insertStudentSchema, 
  insertIncomeSchema, 
  insertExpenseSchema, 
  insertPaymentSchema, 
  insertStaffSchema,
  insertSalaryPaymentSchema,
  insertFoodPaymentSchema,
  insertShareholderSchema,
  insertFiscalYearSchema,
  schoolSettings,
  students,
  income,
  expenses,
  payments,
  staff,
  salaryPayments,
  foodPayments,
  shareholders,
  fiscalYears
} from './schema';

// Export everything from schema so frontend can import from @shared/routes if it wants to
export * from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  schoolSettings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof schoolSettings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertSchoolSettingsSchema,
      responses: {
        200: z.custom<typeof schoolSettings.$inferSelect>(),
        201: z.custom<typeof schoolSettings.$inferSelect>(),
      },
    },
  },
  students: {
    list: {
      method: 'GET' as const,
      path: '/api/students',
      responses: {
        200: z.array(z.custom<typeof students.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/students/:id',
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/students',
      input: insertStudentSchema,
      responses: {
        201: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/students/:id',
      input: insertStudentSchema.partial(),
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/students/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    promoteGrades: {
      method: 'POST' as const,
      path: '/api/students/promote-grades',
      responses: {
        200: z.object({ promotedCount: z.number() }),
        400: errorSchemas.validation,
      },
    },
  },
  income: {
    list: {
      method: 'GET' as const,
      path: '/api/income',
      responses: {
        200: z.array(z.custom<typeof income.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/income',
      input: insertIncomeSchema,
      responses: {
        201: z.custom<typeof income.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/income/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/expenses',
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/expenses',
      input: insertExpenseSchema,
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/expenses/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  payments: {
    list: {
      method: 'GET' as const,
      path: '/api/payments',
      responses: {
        200: z.array(z.custom<typeof payments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/payments',
      input: insertPaymentSchema,
      responses: {
        201: z.custom<typeof payments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  staff: {
    list: {
      method: 'GET' as const,
      path: '/api/staff',
      responses: {
        200: z.array(z.custom<typeof staff.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/staff',
      input: insertStaffSchema,
      responses: {
        201: z.custom<typeof staff.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/staff/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  salaryPayments: {
    list: {
      method: 'GET' as const,
      path: '/api/salary-payments',
      responses: {
        200: z.array(z.custom<typeof salaryPayments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/salary-payments',
      input: insertSalaryPaymentSchema,
      responses: {
        201: z.custom<typeof salaryPayments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/salary-payments/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  foodPayments: {
    list: {
      method: 'GET' as const,
      path: '/api/food-payments',
      responses: {
        200: z.array(z.custom<typeof foodPayments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/food-payments',
      input: insertFoodPaymentSchema,
      responses: {
        201: z.custom<typeof foodPayments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/food-payments/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  reports: {
    monthly: {
      method: 'GET' as const,
      path: '/api/reports/monthly',
      responses: {
        200: z.object({
          totalIncome: z.number(),
          totalExpenses: z.number(),
          netProfit: z.number(),
          month: z.string(),
        }),
      },
    },
  },
  shareholders: {
    list: {
      method: 'GET' as const,
      path: '/api/shareholders',
      responses: {
        200: z.array(z.custom<typeof shareholders.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/shareholders',
      input: insertShareholderSchema,
      responses: {
        201: z.custom<typeof shareholders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/shareholders/:id',
      input: insertShareholderSchema.partial(),
      responses: {
        200: z.custom<typeof shareholders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/shareholders/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.object({
          id: z.string(),
          email: z.string().nullable(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          role: z.string(),
          createdAt: z.string().nullable(),
        })),
      },
    },
    updateRole: {
      method: 'PUT' as const,
      path: '/api/users/:id/role',
      input: z.object({
        role: z.enum(['admin', 'shareholder']),
      }),
      responses: {
        200: z.object({
          id: z.string(),
          email: z.string().nullable(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          role: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  fiscalYears: {
    list: {
      method: 'GET' as const,
      path: '/api/fiscal-years',
      responses: {
        200: z.array(z.custom<typeof fiscalYears.$inferSelect>()),
      },
    },
    current: {
      method: 'GET' as const,
      path: '/api/fiscal-years/current',
      responses: {
        200: z.custom<typeof fiscalYears.$inferSelect>().nullable(),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/fiscal-years',
      input: insertFiscalYearSchema,
      responses: {
        201: z.custom<typeof fiscalYears.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    setCurrent: {
      method: 'PUT' as const,
      path: '/api/fiscal-years/:id/set-current',
      responses: {
        200: z.custom<typeof fiscalYears.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    closeYear: {
      method: 'POST' as const,
      path: '/api/fiscal-years/:id/close',
      responses: {
        200: z.object({ 
          success: z.boolean(),
          message: z.string(),
          promotedStudents: z.number(),
          newYear: z.string(),
        }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    reopen: {
      method: 'POST' as const,
      path: '/api/fiscal-years/:id/reopen',
      responses: {
        200: z.custom<typeof fiscalYears.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/fiscal-years/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
