import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">سیستەمی لوتکە</CardTitle>
            <CardDescription className="text-lg mt-2">
              ژمێریاری قوتابخانەی ناحکومی
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              size="lg" 
              className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800"
              onClick={() => window.location.href = "/api/login"}
            >
              چوونە ژوورەوە بە Replit
            </Button>
            <p className="text-center text-sm text-slate-500 mt-4">
              تەنها بۆ ستافی ڕێگەپێدراو
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
