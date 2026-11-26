export function criarFetchComPrazo(fetchOriginal: typeof fetch, prazoMs = 20000): typeof fetch {
  return async (input, init) => {
    const sinalOriginal = init?.signal ?? (input instanceof Request ? input.signal : undefined)
    const url = input instanceof Request ? input.url : String(input)
    const prazo = AbortSignal.timeout(url.includes('/storage/v1/') ? Math.max(prazoMs, 120000) : prazoMs)
    const signal = sinalOriginal ? AbortSignal.any([sinalOriginal, prazo]) : prazo
    return fetchOriginal(input, { ...init, signal })
  }
}

// Preserve object identity for unchanged rows, including realtime echoes of our own saves.
export function aplicarRegistro(
  registros: Record<string, Record<string, unknown>>,
  id: string,
  dados: Record<string, unknown>,
) {
  if (JSON.stringify(registros[id]) === JSON.stringify(dados)) return
  registros[id] = dados
}

export function criarListaEstavel<T>() {
  const objetos = new WeakMap<object, T>()
  return (registros: Record<string, Record<string, unknown>>): T[] =>
    Object.entries(registros).map(([id, dados]) => {
      let item = objetos.get(dados)
      if (!item) {
        item = { ...dados, id } as T
        objetos.set(dados, item)
      }
      return item
    })
}
