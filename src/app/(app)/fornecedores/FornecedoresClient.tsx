"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Phone, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Fornecedor = {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  contato?: string;
  ativo: boolean;
  _count: { materiais: number };
};

export function FornecedoresClient() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState({
    nome: "", cnpj: "", telefone: "", email: "", endereco: "", contato: "",
  });

  const fetchFornecedores = async () => {
    setLoading(true);
    const res = await fetch("/api/fornecedores");
    const data = await res.json();
    setFornecedores(data);
    setLoading(false);
  };

  useEffect(() => { fetchFornecedores(); }, []);

  function abrirForm(forn?: Fornecedor) {
    if (forn) {
      setEditando(forn);
      setForm({
        nome: forn.nome,
        cnpj: forn.cnpj || "",
        telefone: forn.telefone || "",
        email: forn.email || "",
        endereco: forn.endereco || "",
        contato: forn.contato || "",
      });
    } else {
      setEditando(null);
      setForm({ nome: "", cnpj: "", telefone: "", email: "", endereco: "", contato: "" });
    }
    setOpenForm(true);
  }

  async function salvar() {
    if (!form.nome) return alert("Nome é obrigatório");

    const url = editando ? `/api/fornecedores/${editando.id}` : "/api/fornecedores";
    const method = editando ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        cnpj: form.cnpj || undefined,
        email: form.email || undefined,
      }),
    });

    if (res.ok) {
      setOpenForm(false);
      fetchFornecedores();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao salvar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => abrirForm()}>
          <Plus className="h-4 w-4 mr-1" /> Novo Fornecedor
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-10 text-gray-400">Carregando...</p>
      ) : fornecedores.length === 0 ? (
        <p className="text-center py-10 text-gray-400">Nenhum fornecedor cadastrado</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedores.map((forn) => (
            <Card key={forn.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Building2 className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{forn.nome}</h3>
                      {forn.cnpj && <p className="text-xs text-gray-400">{forn.cnpj}</p>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => abrirForm(forn)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  {forn.contato && (
                    <p className="text-xs">Contato: {forn.contato}</p>
                  )}
                  {forn.telefone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs">{forn.telefone}</span>
                    </div>
                  )}
                  {forn.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs truncate">{forn.email}</span>
                    </div>
                  )}
                  {forn.endereco && (
                    <p className="text-xs text-gray-400 truncate">{forn.endereco}</p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-400">
                    {forn._count.materiais} material(is) vinculado(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CNPJ</Label>
                <Input
                  placeholder="00.000.000/0001-00"
                  value={form.cnpj}
                  onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Contato (pessoa)</Label>
              <Input value={form.contato} onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={salvar}>{editando ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
