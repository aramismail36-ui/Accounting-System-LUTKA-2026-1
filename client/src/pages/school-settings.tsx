import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSchoolSettingsSchema, type InsertSchoolSettings } from "@shared/routes";
import { useSchoolSettings, useUpdateSchoolSettings } from "@/hooks/use-school-settings";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, School, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function SchoolSettingsPage() {
  const { data: settings, isLoading } = useSchoolSettings();
  const { mutate: updateSettings, isPending } = useUpdateSchoolSettings();
  const { toast } = useToast();

  const form = useForm<InsertSchoolSettings>({
    resolver: zodResolver(insertSchoolSettingsSchema),
    defaultValues: {
      schoolName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  function onSubmit(data: InsertSchoolSettings) {
    updateSettings(data, {
      onSuccess: () => {
        toast({
          title: "سەرکەوتوو بوو",
          description: "زانیاریەکانی قوتابخانە نوێکرانەوە",
        });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ڕێکخستنەکانی قوتابخانە"
        description="زانیاریە گشتیەکانی قوتابخانە لێرە دیاری بکە"
      />

      <div className="grid gap-6 max-w-2xl mx-auto lg:mx-0">
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <School className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>زانیاری سەرەتایی</CardTitle>
                <CardDescription>
                  ئەم زانیاریانە لە وەسڵ و ڕاپۆرتەکاندا بەکاردێن
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ناوی قوتابخانە</FormLabel>
                      <FormControl>
                        <Input placeholder="ناوەندی لوتکەی ناحکومی" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ئیمەیڵ</FormLabel>
                        <FormControl>
                          <Input placeholder="info@lutka.edu.iq" {...field} className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وشەی نهێنی (بۆ ئەرشیف)</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            value={field.value || ""}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isPending}
                    size="lg"
                    className="w-full md:w-auto gap-2 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    زخیرەکردن
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
