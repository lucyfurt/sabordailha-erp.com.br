# 🌊 Sabor da Ilha — Sistema de Gestão (ERP)

Sistema web completo para gestão do restaurante Sabor da Ilha, desenvolvido com **Next.js 14**, **React**, **TypeScript**, **Prisma** e **PostgreSQL (Neon)**.

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| **Dashboard** | Visão geral do dia: faturamento, pedidos, alertas de estoque, top produtos |
| **Pedidos** | Abertura, acompanhamento e pagamento de pedidos com fluxo completo |
| **Fluxo de Caixa** | Lançamento manual de entradas/saídas, filtros por período, resumo financeiro |
| **Estoque** | Controle de materiais com alertas de mínimo, movimentações, integração com caixa |
| **Produtos** | Cardápio com categorias, preço, custo estimado, margem de lucro |
| **Fornecedores** | Cadastro completo de fornecedores |
| **Relatórios** | Gráficos de faturamento diário/semanal/mensal, top produtos, formas de pagamento, despesas |
| **Usuários** | Gerenciamento de equipe com controle de perfis (Admin, Gerente, Atendente, Cozinha) |
| **Autenticação** | Login seguro com JWT/NextAuth |

## 🚀 Como instalar

### Pré-requisitos
- Node.js 18+ e npm
- Conta no [Neon](https://neon.tech) (banco PostgreSQL serverless — gratuito)
- Conta na [Vercel](https://vercel.com) (hospedagem — gratuita)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar banco de dados

1. Crie um banco no [Neon](https://neon.tech) (gratuito)
2. Copie a connection string
3. Crie o arquivo `.env`:

```bash
cp .env.example .env
```

Edite `.env`:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Gere o secret:
```bash
openssl rand -base64 32
```

### 3. Criar as tabelas e carregar dados iniciais

```bash
npm run db:push      # Cria as tabelas no banco
npm run db:seed      # Insere dados de exemplo (produtos, materiais, usuário admin)
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

**Login padrão:**
- Email: `admin@saborilha.com`
- Senha: `admin123`

---

## ☁️ Deploy na Vercel (gratuito)

### Opção 1: Via GitHub (recomendado)

1. Suba o projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) → New Project → importe o repo
3. Configure as variáveis de ambiente:
   - `DATABASE_URL` → connection string do Neon
   - `NEXTAUTH_SECRET` → seu secret gerado
   - `NEXTAUTH_URL` → `https://seu-app.vercel.app`
4. Clique em Deploy!

### Opção 2: Via CLI

```bash
npm install -g vercel
vercel --prod
```

---

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── (app)/                 # Layout autenticado
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── pedidos/           # Gerenciamento de pedidos
│   │   ├── caixa/             # Fluxo de caixa
│   │   ├── estoque/           # Controle de estoque
│   │   ├── produtos/          # Cardápio
│   │   ├── fornecedores/      # Fornecedores
│   │   ├── relatorios/        # Relatórios e gráficos
│   │   └── usuarios/          # Gerenciamento de usuários
│   ├── api/                   # API Routes (Next.js)
│   └── auth/                  # Página de login
├── components/
│   ├── layout/                # Sidebar, Header
│   └── ui/                    # Componentes base (Button, Card, etc.)
├── lib/
│   ├── prisma.ts              # Cliente Prisma
│   ├── auth.ts                # Configuração NextAuth
│   └── utils.ts               # Funções utilitárias
└── types/                     # Tipos TypeScript
prisma/
├── schema.prisma              # Modelo do banco de dados
└── seed.ts                    # Dados iniciais
```

## 🛠️ Tecnologias

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + componentes UI customizados
- **Prisma** ORM
- **PostgreSQL** via Neon (serverless)
- **NextAuth.js** para autenticação
- **Recharts** para gráficos
- **Radix UI** para componentes acessíveis
- **date-fns** para manipulação de datas
- **Zod** para validação
