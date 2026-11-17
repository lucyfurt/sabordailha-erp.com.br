import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slug = (s: string) =>
  "est-" +
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Item = { nome: string; categoria: string; unidade: string };

// Estoque base do restaurante — unidades padronizadas: kg, g, ml, L, un.
// Regra: use kg para produtos vendidos/comprados por peso (>500g).
// Use g apenas para temperos/especiarias comprados em embalagens pequenas.
// Use ml/L para líquidos (ml para coisas compradas em ml, L para garrafas/bidões).
const itens: Item[] = [
  // Cereais e Grãos
  { nome: "Arroz", categoria: "Cereais e Grãos", unidade: "kg" },
  { nome: "Farinha", categoria: "Cereais e Grãos", unidade: "kg" },
  { nome: "Trigo", categoria: "Cereais e Grãos", unidade: "kg" },
  // Massas
  { nome: "Macarrão", categoria: "Massas", unidade: "kg" },
  // Leguminosas
  { nome: "Feijão", categoria: "Leguminosas", unidade: "kg" },
  // Temperos e Especiarias (embalagens pequenas → g)
  { nome: "Tempero seco", categoria: "Temperos e Especiarias", unidade: "g" },
  { nome: "Coloral", categoria: "Temperos e Especiarias", unidade: "g" },
  { nome: "Sal", categoria: "Temperos e Especiarias", unidade: "kg" },
  { nome: "Vinagre", categoria: "Temperos e Especiarias", unidade: "L" },
  { nome: "Chimichurri", categoria: "Temperos e Especiarias", unidade: "g" },
  { nome: "Açafrão", categoria: "Temperos e Especiarias", unidade: "g" },
  { nome: "Louro", categoria: "Temperos e Especiarias", unidade: "g" },
  { nome: "Orégano", categoria: "Temperos e Especiarias", unidade: "g" },
  // Óleos e Gorduras
  { nome: "Óleo", categoria: "Óleos e Gorduras", unidade: "L" },
  { nome: "Manteiga", categoria: "Óleos e Gorduras", unidade: "kg" },
  // Hortaliças e Legumes
  { nome: "Alho", categoria: "Hortaliças e Legumes", unidade: "kg" },
  { nome: "Cheiro verde", categoria: "Hortaliças e Legumes", unidade: "un" },
  { nome: "Tomate", categoria: "Hortaliças e Legumes", unidade: "kg" },
  { nome: "Cebola", categoria: "Hortaliças e Legumes", unidade: "kg" },
  { nome: "Alface", categoria: "Hortaliças e Legumes", unidade: "un" },
  { nome: "Repolho", categoria: "Hortaliças e Legumes", unidade: "kg" },
  { nome: "Pimentinha", categoria: "Hortaliças e Legumes", unidade: "kg" },
  { nome: "Abóbora", categoria: "Hortaliças e Legumes", unidade: "kg" },
  { nome: "Maxixe", categoria: "Hortaliças e Legumes", unidade: "kg" },
  { nome: "Quiabo", categoria: "Hortaliças e Legumes", unidade: "kg" },
  { nome: "Vinagreira", categoria: "Hortaliças e Legumes", unidade: "kg" },
  // Enlatados e Conservas (extrato/creme em g porque você usa por grama)
  { nome: "Extrato de tomate", categoria: "Enlatados e Conservas", unidade: "kg" },
  { nome: "Milho verde", categoria: "Enlatados e Conservas", unidade: "kg" },
  { nome: "Leite de coco", categoria: "Enlatados e Conservas", unidade: "L" },
  // Laticínios e Ovos
  { nome: "Creme de leite", categoria: "Laticínios e Ovos", unidade: "L" },
  { nome: "Ovos", categoria: "Laticínios e Ovos", unidade: "un" },
  { nome: "Queijo", categoria: "Laticínios e Ovos", unidade: "kg" },
  { nome: "Queijo ralado", categoria: "Laticínios e Ovos", unidade: "kg" },
  // Frios e Embutidos
  { nome: "Presunto", categoria: "Frios e Embutidos", unidade: "kg" },
  { nome: "Toscana", categoria: "Frios e Embutidos", unidade: "kg" },
  { nome: "Calabresa", categoria: "Frios e Embutidos", unidade: "kg" },
  // Carnes
  { nome: "Carne moída", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne miolo da acem", categoria: "Carnes", unidade: "kg" },
  { nome: "Carne paleta", categoria: "Carnes", unidade: "kg" },
  { nome: "Fígado", categoria: "Carnes", unidade: "kg" },
  { nome: "Pernil suíno", categoria: "Carnes", unidade: "kg" },
  // Aves
  { nome: "Filé de frango", categoria: "Aves", unidade: "kg" },
  { nome: "Coxa e sobrecoxa", categoria: "Aves", unidade: "kg" },
  // Pescados
  { nome: "Camarão", categoria: "Pescados", unidade: "kg" },
  { nome: "Peixe pescadinha", categoria: "Pescados", unidade: "kg" },
];

async function main() {
  console.log("🌱 Cadastrando materiais do estoque...");
  let criados = 0;
  let atualizados = 0;

  for (const item of itens) {
    // Se já existir pelo nome, só atualiza categoria/unidade (evita duplicar).
    const existente = await prisma.material.findFirst({ where: { nome: item.nome } });
    if (existente) {
      await prisma.material.update({
        where: { id: existente.id },
        data: { categoria: item.categoria, unidade: item.unidade, ativo: true },
      });
      atualizados++;
    } else {
      await prisma.material.create({
        data: {
          id: slug(item.nome),
          nome: item.nome,
          categoria: item.categoria,
          unidade: item.unidade,
          quantidadeAtual: 0,
          quantidadeMin: 0,
        },
      });
      criados++;
    }
  }

  console.log(`✅ ${criados} materiais criados, ${atualizados} atualizados.`);
  console.log("ℹ️ Os saldos começam em zero — registre uma entrada (compra) pra abastecer cada item.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
