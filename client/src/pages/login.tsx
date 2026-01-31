import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, LogIn } from "lucide-react";
import type { SchoolSettings } from "@shared/schema";

export default function LoginPage() {
  const { data: settings } = useQuery<SchoolSettings>({
    queryKey: ['/api/settings'],
  });

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Background with gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        {/* School Logo - Large at top */}
        <div className="mb-8 text-center">
          {settings?.logoUrl ? (
            <div className="mx-auto mb-6">
              <img 
                src={settings.logoUrl} 
                alt="لۆگۆی قوتابخانە" 
                className="h-32 w-32 object-contain rounded-full bg-white p-2 shadow-2xl ring-4 ring-white/30"
              />
            </div>
          ) : (
            <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-white/30">
              <GraduationCap className="h-16 w-16 text-blue-600" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {settings?.schoolName || "سیستەمی لوتکە"}
          </h1>
          <p className="text-xl text-blue-100">
            سیستەمی ژمێریاری قوتابخانە
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">چوونەژوورەوە</h2>
              <p className="text-slate-500">بۆ بەکارهێنانی سیستەم، تکایە چوونەژوورەوە بکە</p>
            </div>

            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 gap-3"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                <LogIn className="h-5 w-5" />
                چوونەژوورەوە
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-400">تەنها بۆ ستافی ڕێگەپێدراو</span>
                </div>
              </div>

              <div className="text-center text-sm text-slate-500">
                <p>ئەم سیستەمە تایبەتە بۆ بەڕێوەبردنی</p>
                <p className="font-medium text-slate-700 mt-1">ژمێریاری قوتابخانە و قوتابیان</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Copyright Footer */}
      <footer className="relative z-10 py-4 text-center">
        <p className="text-sm text-blue-200">
          مافى ئەم بەرهەمە پارێزراوە بۆ Aram Kurdistani
        </p>
      </footer>
    </div>
  );
}
