"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, ROLE_LABELS } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
};

export function UsuariosClient() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "ATENDENTE",
  });

  const fetchUsuarios = async () => {
    setLoading(true);
    const res = await fetch("/api/usuarios");
    if (res.ok) {
      const data = await res.json();
      setUsuarios(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, []);

  function abrirForm(user?: User) {
    if (user) {
      setEditando(user);
      setForm({ name: user.name, email: user.email, password: "", role: user.role });
    } else {
      setEditando(null);
      setForm({ name: "", email: "", password: "", role: "ATENDENTE" });
    }
    setOpenForm(true);
  }

  async function salvar() {
    if (!form.name || (!editando && !form.email)) return alert("Preencha os campos obrigatórios");

    const payload: any = { name: form.name, role: form.role };
    if (!editando) {
      payload.email = form.email;
      payload.password = form.password;
    }

    const url = editando ? `/api/usuarios/${editando.id}` : "/api/usuarios";
    const method = editando ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOpenForm(false);
      fetchUsuarios();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao salvar");
    }
  }

  async function toggleAtivo(user: User) {
    await fetch(`/api/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    fetchUsuarios();
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    GERENTE: "bg-purple-100 text-purple-800",
    ATENDENTE: "bg-blue-100 text-blue-800",
    COZINHA: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => abrirForm()}>
          <Plus className="h-4 w-4 mr-1" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-10 text-gray-400">Carregando...</p>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-sm block truncate">{user.name}</span>
                          <span className="text-xs text-gray-400 sm:hidden block truncate">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "success" : "secondary"}>
                        {user.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 hidden md:table-cell">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => abrirForm(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-8 w-8 ${user.active ? "text-red-400 hover:text-red-600" : "text-green-500 hover:text-green-700"}`}
                          onClick={() => toggleAtivo(user)}
                        >
                          {user.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            {!editando && (
              <>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Senha *</Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div>
              <Label>Perfil *</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={salvar}>{editando ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
