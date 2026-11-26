// Horário de funcionamento — ajuste aqui quando necessário.
// Aceita pedidos de segunda a sábado, das 10h às 15h (horário de Brasília).

const ABERTURA = 9; // hora de abertura
const FECHAMENTO = 15; // hora de fechamento (exclusive)
const DIAS_FUNCIONAMENTO = [1, 2, 3, 4, 5, 6]; // 0=dom, 1=seg, ..., 6=sáb

export function getHorarioFuncionamento(): { aberto: boolean; mensagem: string } {
  // Converte para horário de Brasília (UTC-3)
  const agora = new Date();
  const brasilia = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const hora = brasilia.getHours();
  const dia = brasilia.getDay();

  if (!DIAS_FUNCIONAMENTO.includes(dia)) {
    return { aberto: false, mensagem: "Estamos fechados aos domingos. Voltamos na segunda-feira! 🌊" };
  }

  if (hora < ABERTURA) {
    return { aberto: false, mensagem: `Ainda não abrimos. Aceitamos pedidos a partir das ${ABERTURA}h. 🕙` };
  }

  if (hora >= FECHAMENTO) {
    return { aberto: false, mensagem: `As ${FECHAMENTO}h encerramos os pedidos do dia. Até amanhã! 👋` };
  }

  return { aberto: true, mensagem: `Aceitando pedidos até as ${FECHAMENTO}h hoje. 🟢` };
}
