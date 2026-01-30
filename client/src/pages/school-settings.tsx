import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSchoolSettingsSchema, type InsertSchoolSettings } from "@shared/routes";
import { useSchoolSettings, useUpdateSchoolSettings } from "@/hooks/use-school-settings";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, School, Loader2, Upload, ImageIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function SchoolSettingsPage() {
  const { data: settings, isLoading } = useSchoolSettings();
  const { mutate: updateSettings, isPending } = useUpdateSchoolSettings();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InsertSchoolSettings>({
    resolver: zodResolver(insertSchoolSettingsSchema),
    defaultValues: {
      schoolName: "",
      email: "",
      password: "",
      logoUrl: "",
      address: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        ...settings,
        address: settings.address || "",
        phone: settings.phone || "",
        logoUrl: settings.logoUrl || "",
      });
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    }
  }, [settings, form]);

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'هەڵە لە بارکردنی وێنە');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLogoPreview(data.logoUrl);
      form.setValue('logoUrl', data.logoUrl);
      toast({
        title: "سەرکەوتوو بوو",
        description: "لۆگۆ بارکرا",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "هەڵە",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    form.setValue('logoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
                <div className="space-y-4">
                  <FormLabel>لۆگۆی قوتابخانە</FormLabel>
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      {logoPreview ? (
                        <div className="relative group">
                          <img
                            src={logoPreview}
                            alt="لۆگۆی قوتابخانە"
                            className="w-32 h-32 object-contain border rounded-xl bg-white p-2"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleRemoveLogo}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                          <ImageIcon className="h-12 w-12 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        id="logo-upload"
                        data-testid="input-logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadLogoMutation.isPending}
                        className="gap-2"
                        data-testid="button-upload-logo"
                      >
                        {uploadLogoMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        هەڵبژاردنی وێنە
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG، JPG، GIF یان WebP - زۆرترین قەبارە: 5MB
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ئەم لۆگۆیە لە وەسڵ و ڕاپۆرتەکاندا دەردەکەوێت
                      </p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ناوی قوتابخانە</FormLabel>
                      <FormControl>
                        <Input placeholder="ناوەندی لوتکەی ناحکومی" {...field} className="h-12" data-testid="input-school-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ناونیشانی قوتابخانە</FormLabel>
                      <FormControl>
                        <Input placeholder="سلێمانی - گەڕەکی..." {...field} value={field.value || ""} className="h-12" data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ژمارەی مۆبایل</FormLabel>
                        <FormControl>
                          <Input placeholder="0770 123 4567" {...field} value={field.value || ""} className="h-12" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ئیمەیڵ</FormLabel>
                        <FormControl>
                          <Input placeholder="info@lutka.edu.iq" {...field} className="h-12" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
