import { PrismaClient, Role, CaixaTipo, CaixaCategoria, EstoqueTipo } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Usuário admin
  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@saborilha.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@saborilha.com",
      password: adminPass,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Usuário admin criado:", admin.email);

  // Categorias
  const categorias = await Promise.all([
    prisma.categoria.upsert({ where: { nome: "Pratos Principais" }, update: {}, create: { nome: "Pratos Principais", icone: "🍽️" } }),
    prisma.categoria.upsert({ where: { nome: "Frutos do Mar" }, update: {}, create: { nome: "Frutos do Mar", icone: "🦐" } }),
    prisma.categoria.upsert({ where: { nome: "Bebidas" }, update: {}, create: { nome: "Bebidas", icone: "🥤" } }),
    prisma.categoria.upsert({ where: { nome: "Sobremesas" }, update: {}, create: { nome: "Sobremesas", icone: "🍨" } }),
    prisma.categoria.upsert({ where: { nome: "Entradas" }, update: {}, create: { nome: "Entradas", icone: "🥗" } }),
  ]);
  console.log("✅ Categorias criadas");

  // Produtos
  await Promise.all([
    prisma.produto.upsert({
      where: { id: "prod-moqueca" },
      update: {},
      create: { id: "prod-moqueca", nome: "Moqueca de Camarão", preco: 65.00, categoriaId: categorias[1].id, descricao: "Moqueca cremosa com camarões frescos" },
    }),
    prisma.produto.upsert({
      where: { id: "prod-peixe" },
      update: {},
      create: { id: "prod-peixe", nome: "Peixe Grelhado", preco: 55.00, categoriaId: categorias[0].id, descricao: "Peixe do dia grelhado com legumes" },
    }),
    prisma.produto.upsert({
      where: { id: "prod-carangueijo" },
      update: {},
      create: { id: "prod-carangueijo", nome: "Caldeirada de Caranguejo", preco: 75.00, categoriaId: categorias[1].id },
    }),
    prisma.produto.upsert({
      where: { id: "prod-refrigerante" },
      update: {},
      create: { id: "prod-refrigerante", nome: "Refrigerante 350ml", preco: 6.00, categoriaId: categorias[2].id },
    }),
    prisma.produto.upsert({
      where: { id: "prod-suco" },
      update: {},
      create: { id: "prod-suco", nome: "Suco Natural 500ml", preco: 12.00, categoriaId: categorias[2].id },
    }),
    prisma.produto.upsert({
      where: { id: "prod-sobremesa" },
      update: {},
      create: { id: "prod-sobremesa", nome: "Pudim de Coco", preco: 18.00, categoriaId: categorias[3].id },
    }),
  ]);
  console.log("✅ Produtos criados");

  // Fornecedores
  const fornFrutos = await prisma.fornecedor.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      nome: "Pesca Fresca Ltda",
      cnpj: "12.345.678/0001-90",
      telefone: "(91) 99123-4567",
      email: "contato@pescafresca.com",
      contato: "João Pescador",
    },
  });

  const fornBebidas = await prisma.fornecedor.upsert({
    where: { cnpj: "98.765.432/0001-10" },
    update: {},
    create: {
      nome: "Distribuidora Bebidas PA",
      cnpj: "98.765.432/0001-10",
      telefone: "(91) 98765-4321",
      contato: "Maria Silva",
    },
  });
  console.log("✅ Fornecedores criados");

  // Materiais
  await Promise.all([
    prisma.material.upsert({
      where: { id: "mat-camarao" },
      update: {},
      create: { id: "mat-camarao", nome: "Camarão", unidade: "kg", quantidadeAtual: 15, quantidadeMin: 5, custoUnitario: 45.00, fornecedorId: fornFrutos.id },
    }),
    prisma.material.upsert({
      where: { id: "mat-peixe" },
      update: {},
      create: { id: "mat-peixe", nome: "Peixe Fresco", unidade: "kg", quantidadeAtual: 20, quantidadeMin: 8, custoUnitario: 28.00, fornecedorId: fornFrutos.id },
    }),
    prisma.material.upsert({
      where: { id: "mat-caranguejo" },
      update: {},
      create: { id: "mat-caranguejo", nome: "Caranguejo", unidade: "dz", quantidadeAtual: 8, quantidadeMin: 3, custoUnitario: 35.00, fornecedorId: fornFrutos.id },
    }),
    prisma.material.upsert({
      where: { id: "mat-oleo" },
      update: {},
      create: { id: "mat-oleo", nome: "Óleo de Dendê", unidade: "L", quantidadeAtual: 5, quantidadeMin: 2, custoUnitario: 22.00 },
    }),
    prisma.material.upsert({
      where: { id: "mat-refri" },
      update: {},
      create: { id: "mat-refri", nome: "Refrigerante 350ml", unidade: "un", quantidadeAtual: 120, quantidadeMin: 24, custoUnitario: 3.50, fornecedorId: fornBebidas.id },
    }),
    prisma.material.upsert({
      where: { id: "mat-arroz" },
      update: {},
      create: { id: "mat-arroz", nome: "Arroz", unidade: "kg", quantidadeAtual: 30, quantidadeMin: 10, custoUnitario: 4.50 },
    }),
  ]);
  console.log("✅ Materiais criados");

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("📧 Login: admin@saborilha.com");
  console.log("🔑 Senha: admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
