-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GERENTE', 'ATENDENTE', 'COZINHA');

-- CreateEnum
CREATE TYPE "EstoqueTipo" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'PERDA');

-- CreateEnum
CREATE TYPE "PedidoStatus" AS ENUM ('ABERTO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO', 'PAGO');

-- CreateEnum
CREATE TYPE "FormaPagto" AS ENUM ('DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VOUCHER', 'MISTO');

-- CreateEnum
CREATE TYPE "FormaEntrega" AS ENUM ('RETIRADA', 'DELIVERY');

-- CreateEnum
CREATE TYPE "CaixaTipo" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "CaixaCategoria" AS ENUM ('VENDA', 'COMPRA_MATERIAL', 'SALARIO', 'ALUGUEL', 'AGUA', 'LUZ', 'GAS', 'MANUTENCAO', 'MARKETING', 'OUTROS_ENTRADA', 'OUTROS_SAIDA');

-- CreateEnum
CREATE TYPE "MetaTipo" AS ENUM ('FATURAMENTO_DIARIO', 'FATURAMENTO_SEMANAL', 'FATURAMENTO_MENSAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ATENDENTE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "imagem" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "custoEstimado" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "contato" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "unidade" TEXT NOT NULL,
    "quantidadeAtual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "quantidadeMin" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "custoUnitario" DECIMAL(10,2),
    "fornecedorId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_movimentos" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "tipo" "EstoqueTipo" NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "motivo" TEXT,
    "custoTotal" DECIMAL(10,2),
    "pedidoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estoque_movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receita_itens" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "receita_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "status" "PedidoStatus" NOT NULL DEFAULT 'ABERTO',
    "mesa" TEXT,
    "nomeCliente" TEXT,
    "observacao" TEXT,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "formaPagto" "FormaPagto",
    "formaEntrega" "FormaEntrega" NOT NULL DEFAULT 'RETIRADA',
    "enderecoEntrega" TEXT,
    "atendidoPor" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fechadoEm" TIMESTAMP(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnit" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixa_movimentos" (
    "id" TEXT NOT NULL,
    "tipo" "CaixaTipo" NOT NULL,
    "categoria" "CaixaCategoria" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "formaPagto" "FormaPagto",
    "fornecedorId" TEXT,
    "pedidoId" TEXT,
    "referencia" TEXT,
    "userId" TEXT NOT NULL,
    "observacao" TEXT,
    "dataMovimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "caixa_movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas" (
    "id" TEXT NOT NULL,
    "tipo" "MetaTipo" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "periodo" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "receita_itens_produtoId_materialId_key" ON "receita_itens"("produtoId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "metas_tipo_periodo_key" ON "metas"("tipo", "periodo");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita_itens" ADD CONSTRAINT "receita_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita_itens" ADD CONSTRAINT "receita_itens_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_movimentos" ADD CONSTRAINT "caixa_movimentos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_movimentos" ADD CONSTRAINT "caixa_movimentos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

