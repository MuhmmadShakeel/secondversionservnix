const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 })

export const formatBudget = (item) => `Rs. ${money.format(Number(item.budgetMin))} – ${money.format(Number(item.budgetMax))}`
