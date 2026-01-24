import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserCheck, Loader2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
};

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PUT", `/api/users/${id}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "نوێکرایەوە", description: "ڕۆڵی بەکارهێنەر گۆڕدرا" });
    },
    onError: (err: Error) => {
      toast({ title: "هەڵە", description: err.message, variant: "destructive" });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ id: userId, role: newRole });
  };

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "سڕینەوە سەرنەکەوت");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "سڕایەوە", description: "بەکارهێنەر سڕایەوە" });
    },
    onError: (err: Error) => {
      toast({ title: "هەڵە", description: err.message, variant: "destructive" });
    },
  });

  const handleDeleteUser = (userId: string) => {
    if (confirm("ئایا دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-blue-600">
          <Shield className="h-3 w-3 ml-1" />
          بەڕێوەبەر
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <UserCheck className="h-3 w-3 ml-1" />
        خاوەن پشک
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="بەڕێوەبردنی بەکارهێنەران"
        description="دیاریکردنی ڕۆڵی بەکارهێنەران: بەڕێوەبەر یان خاوەن پشک"
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>تێبینی:</strong> خاوەن پشکەکان تەنها دەتوانن زانیاریەکانی دارایی و دابەشکردنی قازانج ببینن و چاپ بکەن. ئەوان ناتوانن هیچ زانیاریەک زیاد، کەم یان گۆڕ بکەن.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right w-12">ژ</TableHead>
            <TableHead className="text-right">ناو</TableHead>
            <TableHead className="text-right">ئیمەیل</TableHead>
            <TableHead className="text-right">ڕۆڵی ئێستا</TableHead>
            <TableHead className="text-right">ڕێکەوت و کات</TableHead>
            <TableHead className="text-right">گۆڕینی ڕۆڵ</TableHead>
            <TableHead className="text-right w-[80px]">سڕینەوە</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user, index) => (
            <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                {user.firstName || ''} {user.lastName || ''}
                {!user.firstName && !user.lastName && <span className="text-muted-foreground">بێناو</span>}
              </TableCell>
              <TableCell>{user.email || '-'}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell className="text-slate-500 text-xs font-mono">
                {new Date(user.createdAt).toLocaleString('ku-Arab', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={updateRoleMutation.isPending}
                >
                  <SelectTrigger className="w-40" data-testid={`select-role-${user.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">بەڕێوەبەر</SelectItem>
                    <SelectItem value="shareholder">خاوەن پشک</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-red-600"
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={deleteUserMutation.isPending}
                  data-testid={`button-delete-user-${user.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!users || users.length === 0) && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                هیچ بەکارهێنەرێک نییە
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
