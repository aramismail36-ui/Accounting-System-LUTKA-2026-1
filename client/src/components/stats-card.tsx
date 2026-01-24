import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, className }: StatsCardProps) {
  return (
    <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4 space-x-reverse">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-4">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
