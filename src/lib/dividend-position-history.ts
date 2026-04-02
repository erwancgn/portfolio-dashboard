export interface DividendPositionTransaction {
  positionId: string | null
  ticker: string
  type: string
  quantity: number
  executedAt: string
}

/**
 * Reconstitue la quantité détenue à une date donnée à partir de la position courante
 * et de l'historique buy/sell exécuté après cette date.
 */
export function getQuantityHeldOnDate(
  currentQuantity: number,
  snapshotDate: string,
  transactions: DividendPositionTransaction[],
): number {
  const snapshotTs = new Date(snapshotDate).getTime()

  if (Number.isNaN(snapshotTs)) {
    return currentQuantity
  }

  const quantityAfterSnapshot = transactions.reduce((sum, transaction) => {
    const executedTs = new Date(transaction.executedAt).getTime()
    if (Number.isNaN(executedTs) || executedTs <= snapshotTs) {
      return sum
    }

    if (transaction.type === 'buy') {
      return sum + transaction.quantity
    }

    if (transaction.type === 'sell') {
      return sum - transaction.quantity
    }

    return sum
  }, 0)

  return Math.max(currentQuantity - quantityAfterSnapshot, 0)
}
