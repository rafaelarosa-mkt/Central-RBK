export function validarDataPagamento(data: string, hoje: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(data) && Number.isFinite(Date.parse(data)) && new Date(data).toISOString().slice(0, 10) === data && data <= hoje
}
